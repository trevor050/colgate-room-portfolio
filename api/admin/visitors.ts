import { requireAdmin } from '../../server/admin.js';
import { ensureSchema } from '../../server/schema.js';
import { query, getPool } from '../../server/db.js';

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
        vid,
        first_seen_at,
        last_seen_at,
        first_ip,
        last_ip,
        ipinfo
      FROM visitors
      ORDER BY last_seen_at DESC
      LIMIT 250
    `
  );

  const visitors = rows.map((v: any) => {
    const ipinfo = v.ipinfo ?? {};
    return {
      vid: v.vid,
      first_seen_at: v.first_seen_at,
      last_seen_at: v.last_seen_at,
      first_ip: v.first_ip,
      last_ip: v.last_ip,
      city: ipinfo.city ?? null,
      region: ipinfo.region ?? null,
      country: ipinfo.country ?? null,
      org: ipinfo.org ?? ipinfo.company?.name ?? null,
    };
  });

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ visitors }));
}
