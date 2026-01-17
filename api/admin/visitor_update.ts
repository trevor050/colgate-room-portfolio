import { requireAdmin } from '../../server/admin.js';
import { ensureSchema } from '../../server/schema.js';
import { query, getPool } from '../../server/db.js';
import { readRawBody } from '../../server/http.js';

function clampString(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }

  if (!getPool()) {
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'DATABASE_URL not configured' }));
    return;
  }

  await ensureSchema();

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
}

