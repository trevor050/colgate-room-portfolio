import { ensureSchema } from '../server/schema.js';
import { query, getPool } from '../server/db.js';
import {
  allowedHosts,
  getClientIp,
  getHeader,
  readRawBody,
  safeHostFromUrl,
  sameSiteRequest,
} from '../server/http.js';
import { getVercelGeo } from '../server/geo.js';
import { computeBotScore } from '../server/bot.js';
import { fetchAndCacheIpinfo, getIpinfoCached } from '../server/ipinfo.js';
import { fetchAndCachePtr, getPtrCached } from '../server/ptr.js';

type IncomingEvent = {
  type: string;
  ts?: string;
  seq?: number;
  data?: unknown;
};

function normalizeEvents(body: any): IncomingEvent[] {
  if (Array.isArray(body?.events)) return body.events;
  if (typeof body?.event === 'string') {
    return [{ type: body.event, ts: body.ts, seq: body.seq, data: body }];
  }
  return [];
}

function clampString(value: any, max = 5000): string | null {
  if (typeof value !== 'string') return null;
  if (value.length > max) return value.slice(0, max);
  return value;
}

function parseTs(value: any): Date {
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function allowRequest(req: any): boolean {
  if (sameSiteRequest(req)) return true;

  const originHost = safeHostFromUrl(getHeader(req, 'origin'));
  const refererHost = safeHostFromUrl(getHeader(req, 'referer'));
  const allow = allowedHosts(req);

  return (originHost ? allow.has(originHost) : false) || (refererHost ? allow.has(refererHost) : false);
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Allow', 'POST');
      res.end('Method Not Allowed');
      return;
    }

    if (!allowRequest(req)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    // If DB isn't configured yet, don't break the site.
    if (!getPool()) {
      res.statusCode = 204;
      res.end();
      return;
    }

    const raw = await readRawBody(req, 200_000);
    let body: any = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = {};
    }

    if (body?.internal === true) {
      res.statusCode = 204;
      res.end();
      return;
    }

    const vid = clampString(body?.vid, 128);
    const sid = clampString(body?.sid, 128);
    if (!vid || !sid) {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    const ip = getClientIp(req);
    const userAgent = clampString(getHeader(req, 'user-agent'), 500) ?? '';
    const acceptLanguage = clampString(getHeader(req, 'accept-language'), 200) ?? '';
    const referrer = clampString(body?.referrer, 1000) ?? '';
    const page = clampString(body?.page, 500) ?? '';
    const isMobile = typeof body?.is_mobile === 'boolean' ? body.is_mobile : null;
    const orientation = clampString(body?.orientation, 40);

    const events = normalizeEvents(body)
      .slice(0, 300)
      .map((e) => ({
        type: clampString(e?.type, 64) ?? 'unknown',
        ts: parseTs(e?.ts),
        seq: typeof e?.seq === 'number' ? e.seq : null,
        data: e?.data ?? null,
      }));

    const summary =
      typeof body?.summary === 'object' && body.summary && !Array.isArray(body.summary) ? body.summary : null;

    const activeSeconds = typeof summary?.active_seconds === 'number' ? summary.active_seconds : null;
    const interactions = typeof summary?.interactions === 'number' ? summary.interactions : null;

    const bot = computeBotScore({
      userAgent,
      acceptLanguage,
      activeSeconds,
      interactions,
    });

    await ensureSchema();

    await query(
      `
        INSERT INTO visitors (vid, first_ip, last_ip, first_user_agent, last_user_agent, first_referrer, last_referrer)
        VALUES ($1, $2, $2, $3, $3, $4, $4)
        ON CONFLICT (vid) DO UPDATE SET
          last_seen_at = NOW(),
          last_ip = COALESCE(EXCLUDED.last_ip, visitors.last_ip),
          last_user_agent = COALESCE(EXCLUDED.last_user_agent, visitors.last_user_agent),
          last_referrer = COALESCE(EXCLUDED.last_referrer, visitors.last_referrer)
      `,
      [vid, ip ?? null, userAgent, referrer]
    );

    const startedAt =
      events.length > 0 ? events[0].ts : parseTs(body?.started_at ?? body?.ts ?? new Date().toISOString());

    const geo = getVercelGeo(req);

    await query(
      `
        INSERT INTO sessions (
          sid, vid, started_at, ip, user_agent, accept_language, referrer, page, is_mobile, orientation,
          geo, bot_score, bot_reasons, is_bot
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14)
        ON CONFLICT (sid) DO UPDATE SET
          updated_at = NOW(),
          ip = COALESCE(EXCLUDED.ip, sessions.ip),
          user_agent = COALESCE(EXCLUDED.user_agent, sessions.user_agent),
          accept_language = COALESCE(EXCLUDED.accept_language, sessions.accept_language),
          referrer = COALESCE(EXCLUDED.referrer, sessions.referrer),
          page = COALESCE(EXCLUDED.page, sessions.page),
          is_mobile = COALESCE(EXCLUDED.is_mobile, sessions.is_mobile),
          orientation = COALESCE(EXCLUDED.orientation, sessions.orientation),
          geo = COALESCE(EXCLUDED.geo, sessions.geo),
          bot_score = GREATEST(COALESCE(sessions.bot_score, 0), EXCLUDED.bot_score),
          bot_reasons = COALESCE(NULLIF(EXCLUDED.bot_reasons, ''), sessions.bot_reasons),
          is_bot = COALESCE(sessions.is_bot, EXCLUDED.is_bot)
      `,
      [
        sid,
        vid,
        startedAt.toISOString(),
        ip ?? null,
        userAgent,
        acceptLanguage,
        referrer || null,
        page || null,
        isMobile,
        orientation,
        JSON.stringify(geo),
        bot.score,
        bot.reasons.join(', '),
        bot.isBot,
      ]
    );

    if (events.length) {
      const values: any[] = [];
      const placeholders: string[] = [];
      let idx = 1;
      for (const e of events) {
        placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}::jsonb)`);
        values.push(sid, vid, e.ts.toISOString(), e.type, e.seq, JSON.stringify(e.data));
      }

      await query(
        `INSERT INTO events (sid, vid, ts, type, seq, data) VALUES ${placeholders.join(', ')}`,
        values
      );
    }

    if (summary) {
      await query(
        `
          UPDATE sessions SET
            ended_at = NOW(),
            updated_at = NOW(),
            first_interaction_seconds = $2,
            interactions = $3,
            active_seconds = $4,
            overlays = $5::jsonb,
            overlays_unique = $6
          WHERE sid = $1
        `,
        [
          sid,
          typeof summary.first_interaction_seconds === 'number' ? summary.first_interaction_seconds : null,
          typeof summary.interactions === 'number' ? summary.interactions : null,
          typeof summary.active_seconds === 'number' ? summary.active_seconds : null,
          summary.overlays ? JSON.stringify(summary.overlays) : null,
          typeof summary.overlays_unique === 'number' ? summary.overlays_unique : null,
        ]
      );
    }

    // IP enrichment (cached) — skip bots and skip if IP is missing.
    if (!bot.isBot && ip) {
      const cached = await getIpinfoCached(ip);
      let ipinfo = cached.data;
      let ipinfoError = cached.error;

      if (!ipinfo && !ipinfoError) {
        const fetched = await fetchAndCacheIpinfo(ip);
        ipinfo = fetched.data;
        ipinfoError = fetched.error;
      }

      if (ipinfo) {
        await query(`UPDATE sessions SET ipinfo = $2::jsonb WHERE sid = $1`, [sid, JSON.stringify(ipinfo)]);
        await query(
          `
            UPDATE visitors SET
              ipinfo = COALESCE(visitors.ipinfo, $2::jsonb),
              ipinfo_ip = COALESCE(visitors.ipinfo_ip, $1),
              ipinfo_fetched_at = COALESCE(visitors.ipinfo_fetched_at, NOW()),
              ipinfo_error = NULL,
              ipinfo_error_at = NULL
            WHERE vid = $3
          `,
          [ip, JSON.stringify(ipinfo), vid]
        );
      } else if (ipinfoError) {
        await query(
          `
            UPDATE visitors SET
              ipinfo_error = $1,
              ipinfo_error_at = NOW()
            WHERE vid = $2 AND ipinfo IS NULL
          `,
          [ipinfoError, vid]
        );
      }
    }

    // PTR (reverse DNS) — cached; skip bots.
    if (!bot.isBot && ip) {
      const cached = await getPtrCached(ip);
      let ptr = cached.ptr;
      let ptrError = cached.error;

      if (!ptr && !ptrError) {
        const fetched = await fetchAndCachePtr(ip);
        ptr = fetched.ptr;
        ptrError = fetched.error;
      }

      if (ptr) {
        await query(`UPDATE sessions SET ptr = $2 WHERE sid = $1`, [sid, ptr]);
        await query(
          `
            UPDATE visitors SET
              ptr = COALESCE(visitors.ptr, $2),
              ptr_ip = COALESCE(visitors.ptr_ip, $1),
              ptr_fetched_at = COALESCE(visitors.ptr_fetched_at, NOW()),
              ptr_error = NULL,
              ptr_error_at = NULL
            WHERE vid = $3
          `,
          [ip, ptr, vid]
        );
      } else if (ptrError) {
        await query(
          `
            UPDATE visitors SET
              ptr_error = $1,
              ptr_error_at = NOW()
            WHERE vid = $2 AND ptr IS NULL
          `,
          [ptrError, vid]
        );
      }
    }

    res.statusCode = 204;
    res.end();
  } catch (err: any) {
    // Never throw noisy errors to the client; the site should keep working.
    res.statusCode = 204;
    res.end();
  }
}
