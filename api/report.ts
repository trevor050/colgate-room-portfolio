const MAX_BODY_BYTES = 10_000;
const ALLOWED_EVENTS = new Set(['visit', 'session_end']);

function getHeader(req: any, name: string): string | undefined {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function getClientIp(req: any): string | undefined {
  const forwardedFor = getHeader(req, 'x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim();
  return getHeader(req, 'x-real-ip');
}

function getVercelGeo(req: any) {
  return {
    city: getHeader(req, 'x-vercel-ip-city'),
    region: getHeader(req, 'x-vercel-ip-country-region'),
    country: getHeader(req, 'x-vercel-ip-country'),
  };
}

function safeHostFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
}

function getAllowedHosts(req: any): Set<string> {
  const allowed = new Set<string>();

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) allowed.add(vercelUrl);

  const custom = process.env.REPORT_ALLOWED_HOSTS;
  if (custom) {
    for (const host of custom.split(',').map((h) => h.trim()).filter(Boolean)) {
      allowed.add(host);
    }
  }

  // Allow current host header too (covers custom domains without config).
  const hostHeader = getHeader(req, 'host');
  if (hostHeader) allowed.add(hostHeader);

  // Local dev
  allowed.add('localhost:5173');
  allowed.add('localhost:4173');
  allowed.add('localhost:3000');

  return allowed;
}

async function readRawBody(req: any): Promise<string> {
  return await new Promise((resolve, reject) => {
    let size = 0;
    let data = '';
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      data += chunk.toString('utf8');
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function formatDiscordMessage(payload: any, req: any) {
  const geo = getVercelGeo(req);
  const ua = getHeader(req, 'user-agent');

  const locationBits = [geo.city, geo.region, geo.country].filter(Boolean);
  const location = locationBits.length ? locationBits.join(', ') : 'Unknown';

  const event = typeof payload?.event === 'string' ? payload.event : 'visit';
  const page = typeof payload?.page === 'string' ? payload.page : undefined;
  const referrer = typeof payload?.referrer === 'string' ? payload.referrer : undefined;
  const isMobile = typeof payload?.is_mobile === 'boolean' ? payload.is_mobile : undefined;
  const orientation = typeof payload?.orientation === 'string' ? payload.orientation : undefined;

  const fields: { name: string; value: string; inline?: boolean }[] = [];
  fields.push({ name: 'Event', value: event, inline: true });
  fields.push({ name: 'Location', value: location, inline: true });
  if (page) fields.push({ name: 'Page', value: page, inline: false });
  if (typeof isMobile === 'boolean') fields.push({ name: 'Mobile', value: isMobile ? 'Yes' : 'No', inline: true });
  if (orientation) fields.push({ name: 'Orientation', value: orientation, inline: true });
  if (referrer) fields.push({ name: 'Referrer', value: referrer, inline: false });

  // Include some session summary details if provided (no IP included).
  if (event === 'session_end') {
    const seconds = typeof payload?.active_seconds === 'number' ? payload.active_seconds : undefined;
    const interactions = typeof payload?.interactions === 'number' ? payload.interactions : undefined;
    if (typeof seconds === 'number') fields.push({ name: 'Active (s)', value: String(seconds), inline: true });
    if (typeof interactions === 'number') fields.push({ name: 'Interactions', value: String(interactions), inline: true });
  }

  return {
    content: null,
    embeds: [
      {
        title: 'Portfolio visit',
        color: 0xffd700,
        timestamp: new Date().toISOString(),
        fields,
        footer: {
          text: ua ? `UA: ${ua.slice(0, 160)}` : 'UA: unknown',
        },
      },
    ],
  };
}

// Basic in-memory rate limit (best-effort, not persistent across serverless instances).
const bucket = new Map<string, { count: number; resetAt: number }>();
function rateLimitKey(req: any, payload: any): string {
  const ip = getClientIp(req) ?? 'unknown';
  const sessionId = typeof payload?.sid === 'string' ? payload.sid.slice(0, 64) : 'no-sid';
  return `${ip}:${sessionId}`;
}

function shouldAllow(req: any, payload: any): boolean {
  const now = Date.now();
  const key = rateLimitKey(req, payload);
  const windowMs = 60_000;
  const max = 6; // per minute

  const current = bucket.get(key);
  if (!current || current.resetAt <= now) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  current.count += 1;
  bucket.set(key, current);
  return current.count <= max;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Allow', 'POST');
      res.end('Method Not Allowed');
      return;
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      // If not configured, don't break the site.
      res.statusCode = 204;
      res.end();
      return;
    }

    // Basic origin/referrer gating (not bulletproof, but reduces casual spam).
    const originHost = safeHostFromUrl(getHeader(req, 'origin'));
    const refererHost = safeHostFromUrl(getHeader(req, 'referer'));
    const allowedHosts = getAllowedHosts(req);
    const hostOk = (originHost && allowedHosts.has(originHost)) || (refererHost && allowedHosts.has(refererHost));
    if (!hostOk) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    const raw = await readRawBody(req);
    let payload: any = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      payload = {};
    }

    const event = payload?.event;
    if (typeof event !== 'string' || !ALLOWED_EVENTS.has(event)) {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    if (!shouldAllow(req, payload)) {
      res.statusCode = 429;
      res.end('Too Many Requests');
      return;
    }

    const discordBody = formatDiscordMessage(payload, req);
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(discordBody),
    });

    if (!discordRes.ok) {
      res.statusCode = 502;
      res.end('Bad Gateway');
      return;
    }

    res.statusCode = 204;
    res.end();
  } catch {
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}

