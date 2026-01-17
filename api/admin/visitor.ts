import { requireAdmin } from '../../server/admin.js';
import { ensureSchema } from '../../server/schema.js';
import { query, getPool } from '../../server/db.js';
import { makeDisplayName } from '../../server/names.js';
import { readRawBody } from '../../server/http.js';

function clampString(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  if (!getPool()) {
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'DATABASE_URL not configured' }));
    return;
  }

  await ensureSchema();

  if (req.method === 'POST') {
    const raw = await readRawBody(req, 25_000);
    let body: any = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = {};
    }

    const vid = clampString(body?.vid, 128);
    const displayName = clampString(body?.display_name, 80);
    if (!vid) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing vid' }));
      return;
    }

    await query(`UPDATE visitors SET display_name = $2 WHERE vid = $1`, [vid, displayName]);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, POST');
    res.end('Method Not Allowed');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const vid = url.searchParams.get('vid');
  if (!vid || vid.length > 128) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing vid' }));
    return;
  }

  const visitorRes = await query<any>(
    `
      SELECT
        vid,
        display_name,
        first_seen_at,
        last_seen_at,
        first_ip,
        last_ip,
        ptr,
        ipinfo
      FROM visitors
      WHERE vid = $1
      LIMIT 1
    `,
    [vid]
  );
  const visitorRow = visitorRes.rows[0];
  if (!visitorRow) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const sessionsRes = await query<any>(
    `
      SELECT
        sid,
        started_at,
        ended_at,
        ip,
        ptr,
        is_bot,
        bot_score,
        bot_reasons,
        is_mobile,
        orientation,
        page,
        referrer,
        geo,
        ipinfo,
        active_seconds,
        idle_seconds,
        session_seconds,
        interactions,
        overlays_unique
      FROM sessions
      WHERE vid = $1
      ORDER BY started_at DESC
      LIMIT 200
    `,
    [vid]
  );

  const ipinfo = visitorRow.ipinfo ?? {};
  const visitor = {
    vid: visitorRow.vid,
    display_name: visitorRow.display_name ?? makeDisplayName(visitorRow.vid),
    first_seen_at: visitorRow.first_seen_at,
    last_seen_at: visitorRow.last_seen_at,
    first_ip: visitorRow.first_ip,
    last_ip: visitorRow.last_ip,
    ptr: visitorRow.ptr ?? null,
    city: ipinfo.city ?? null,
    region: ipinfo.region ?? null,
    country: ipinfo.country ?? null,
    org: ipinfo.org ?? ipinfo.company?.name ?? null,
  };

  const sessions = sessionsRes.rows.map((s: any) => {
    const geo = s.geo ?? {};
    const ipinfoS = s.ipinfo ?? {};
    return {
      sid: s.sid,
      started_at: s.started_at,
      ended_at: s.ended_at,
      ip: s.ip,
      ptr: s.ptr ?? null,
      is_bot: s.is_bot,
      bot_score: s.bot_score,
      bot_reasons: s.bot_reasons,
      is_mobile: s.is_mobile,
      orientation: s.orientation,
      page: s.page ?? null,
      referrer: s.referrer ?? null,
      city: geo.city ?? null,
      region: geo.region ?? null,
      country: geo.country ?? null,
      latitude: geo.latitude ?? null,
      longitude: geo.longitude ?? null,
      org: ipinfoS.org ?? ipinfoS.company?.name ?? null,
      active_seconds: s.active_seconds,
      idle_seconds: s.idle_seconds,
      session_seconds: s.session_seconds,
      interactions: s.interactions,
      overlays_unique: s.overlays_unique,
    };
  });

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ visitor, sessions }));
}
