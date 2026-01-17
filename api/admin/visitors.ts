import { requireAdmin } from '../../server/admin.js';
import { ensureSchema } from '../../server/schema.js';
import { query, getPool } from '../../server/db.js';
import { makeDisplayName } from '../../server/names.js';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  if (!getPool()) {
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'DATABASE_URL not configured' }));
    return;
  }

  await ensureSchema();

  const { rows } = await query<any>(
    `
      SELECT
        v.vid,
        v.display_name,
        v.first_seen_at,
        v.last_seen_at,
        v.first_ip,
        v.last_ip,
        v.ptr,
        v.ipinfo,
        COUNT(s.sid) AS sessions,
        MAX(s.started_at) AS last_session_at
      FROM visitors v
      LEFT JOIN sessions s ON s.vid = v.vid
      GROUP BY v.vid
      ORDER BY v.last_seen_at DESC
      LIMIT 250
    `
  );

  const visitors = rows.map((v: any) => {
    const ipinfo = v.ipinfo ?? {};
    const displayName = v.display_name ?? makeDisplayName(v.vid);
    return {
      vid: v.vid,
      display_name: displayName,
      first_seen_at: v.first_seen_at,
      last_seen_at: v.last_seen_at,
      first_ip: v.first_ip,
      last_ip: v.last_ip,
      ptr: v.ptr ?? null,
      sessions: typeof v.sessions === 'string' ? Number(v.sessions) : v.sessions ?? 0,
      last_session_at: v.last_session_at ?? null,
      city: ipinfo.city ?? null,
      region: ipinfo.region ?? null,
      country: ipinfo.country ?? null,
      org: ipinfo.org ?? ipinfo.company?.name ?? null,
    };
  });

  // Opportunistic backfill for older rows (best-effort).
  for (const v of rows) {
    if (!v?.vid) continue;
    if (v.display_name == null) {
      const dn = makeDisplayName(v.vid);
      // Fire and forget; if it fails, it's fine.
      void query(`UPDATE visitors SET display_name = $2 WHERE vid = $1 AND display_name IS NULL`, [v.vid, dn]).catch(() => {});
    }
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ visitors }));
}
