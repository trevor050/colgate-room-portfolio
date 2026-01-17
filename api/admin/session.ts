import { requireAdmin } from '../../server/admin.js';
import { ensureSchema } from '../../server/schema.js';
import { query, getPool } from '../../server/db.js';
import { safeHostFromUrl } from '../../server/http.js';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  if (!getPool()) {
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'DATABASE_URL not configured' }));
    return;
  }

  await ensureSchema();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const sid = url.searchParams.get('sid');
  if (!sid || sid.length > 128) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing sid' }));
    return;
  }

  const sessionRes = await query<any>(
    `SELECT * FROM sessions WHERE sid = $1 LIMIT 1`,
    [sid]
  );
  const sessionRow = sessionRes.rows[0];
  if (!sessionRow) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const eventsRes = await query<any>(
    `SELECT ts, type, seq, data FROM events WHERE sid = $1 ORDER BY ts ASC LIMIT 2000`,
    [sid]
  );

  const geo = sessionRow.geo ?? {};
  const ipinfo = sessionRow.ipinfo ?? {};

  const session = {
    sid: sessionRow.sid,
    vid: sessionRow.vid,
    started_at: sessionRow.started_at,
    ended_at: sessionRow.ended_at,
    ip: sessionRow.ip,
    ptr: sessionRow.ptr ?? null,
    location: [geo.city, geo.region, geo.country].filter(Boolean).join(', ') || null,
    org: ipinfo.org ?? ipinfo.company?.name ?? null,
    net: [geo.asn, geo.asName].filter(Boolean).join(' ') || null,
    bot_score: sessionRow.bot_score,
    bot_reasons: sessionRow.bot_reasons,
    is_bot: sessionRow.is_bot,
    is_mobile: sessionRow.is_mobile,
    orientation: sessionRow.orientation,
    referrer_host: safeHostFromUrl(sessionRow.referrer ?? undefined) ?? null,
    page: sessionRow.page,
    active_seconds: sessionRow.active_seconds,
    idle_seconds: sessionRow.idle_seconds,
    session_seconds: sessionRow.session_seconds,
    interactions: sessionRow.interactions,
    first_interaction_seconds: sessionRow.first_interaction_seconds,
    overlays: sessionRow.overlays,
  };

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ session, events: eventsRes.rows }));
}
