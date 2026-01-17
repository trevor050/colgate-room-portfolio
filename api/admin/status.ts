import { getPool } from '../../server/db.js';

export default async function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(
    JSON.stringify({
      db_configured: Boolean(getPool()),
      admin_token_configured: Boolean(process.env.ADMIN_TOKEN),
      ipinfo_token_configured: Boolean(process.env.IPINFO_TOKEN),
    }),
  );
}

