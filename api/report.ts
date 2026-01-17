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

function decodeIfNeeded(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // Vercel geo headers sometimes arrive URL-encoded (e.g. "San%20Jose").
  try {
    const normalized = value.replace(/\+/g, '%20');
    return decodeURIComponent(normalized);
  } catch {
    return value;
  }
}

function getVercelGeo(req: any) {
  return {
    city: decodeIfNeeded(getHeader(req, 'x-vercel-ip-city')),
    region: decodeIfNeeded(getHeader(req, 'x-vercel-ip-country-region')),
    country: decodeIfNeeded(getHeader(req, 'x-vercel-ip-country')),
    timezone: decodeIfNeeded(getHeader(req, 'x-vercel-ip-timezone')),
    latitude: decodeIfNeeded(getHeader(req, 'x-vercel-ip-latitude')),
    longitude: decodeIfNeeded(getHeader(req, 'x-vercel-ip-longitude')),
    postalCode: decodeIfNeeded(getHeader(req, 'x-vercel-ip-postal-code')),
    asn: decodeIfNeeded(getHeader(req, 'x-vercel-ip-asn')),
    asName: decodeIfNeeded(getHeader(req, 'x-vercel-ip-as-name')),
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
  const ip = getClientIp(req);
  const vercelId = getHeader(req, 'x-vercel-id');
  const acceptLang = getHeader(req, 'accept-language');

  const locationBits = [geo.city, geo.region, geo.country].filter(Boolean);
  const location = locationBits.length ? locationBits.join(', ') : 'Unknown';

  const event = typeof payload?.event === 'string' ? payload.event : 'visit';
  const page = typeof payload?.page === 'string' ? payload.page : undefined;
  const referrer = typeof payload?.referrer === 'string' ? payload.referrer : undefined;
  const isMobile = typeof payload?.is_mobile === 'boolean' ? payload.is_mobile : undefined;
  const orientation = typeof payload?.orientation === 'string' ? payload.orientation : undefined;
  const sid = typeof payload?.sid === 'string' ? payload.sid : undefined;
  const vid = typeof payload?.vid === 'string' ? payload.vid : undefined;
  const overlays = Array.isArray(payload?.overlays) ? payload.overlays : undefined;

  const fields: { name: string; value: string; inline?: boolean }[] = [];
  if (vid) fields.push({ name: 'Visitor ID', value: vid, inline: false });
  if (sid) fields.push({ name: 'Session ID', value: sid, inline: false });
  if (ip) fields.push({ name: 'IP', value: ip, inline: true });
  fields.push({ name: 'Event', value: event, inline: true });
  fields.push({ name: 'Location', value: location, inline: true });
  if (geo.timezone) fields.push({ name: 'TZ', value: geo.timezone, inline: true });
  if (geo.postalCode) fields.push({ name: 'Postal', value: geo.postalCode, inline: true });
  if (geo.asn || geo.asName) fields.push({ name: 'Network', value: [geo.asn, geo.asName].filter(Boolean).join(' '), inline: false });
  if (vercelId) fields.push({ name: 'Vercel', value: vercelId, inline: false });
  if (page) fields.push({ name: 'Page', value: page, inline: false });
  if (typeof isMobile === 'boolean') fields.push({ name: 'Mobile', value: isMobile ? 'Yes' : 'No', inline: true });
  if (orientation) fields.push({ name: 'Orientation', value: orientation, inline: true });
  if (referrer) fields.push({ name: 'Referrer', value: referrer, inline: false });
  if (acceptLang) fields.push({ name: 'Lang', value: acceptLang.slice(0, 80), inline: false });

  // Include some session summary details if provided (no IP included).
  if (event === 'session_end') {
    const seconds = typeof payload?.active_seconds === 'number' ? payload.active_seconds : undefined;
    const interactions = typeof payload?.interactions === 'number' ? payload.interactions : undefined;
    if (typeof seconds === 'number') fields.push({ name: 'Active (s)', value: String(seconds), inline: true });
    if (typeof interactions === 'number') fields.push({ name: 'Interactions', value: String(interactions), inline: true });
    if (Array.isArray(overlays) && overlays.length) {
      const compact = overlays
        .slice(0, 6)
        .map((o: any) => {
          const key = typeof o?.key === 'string' ? o.key : 'unknown';
          const s = typeof o?.seconds === 'number' ? o.seconds : undefined;
          return s != null ? `${key} (${s}s)` : key;
        })
        .join(', ');
      fields.push({ name: 'Overlays', value: compact, inline: false });
    }
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

function botScore(req: any, payload: any): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const ua = (getHeader(req, 'user-agent') ?? '').toLowerCase();
  const acceptLang = getHeader(req, 'accept-language');

  const uaRules: Array<[RegExp, number, string]> = [
    [/vercel-screenshot/i, 6, 'vercel-screenshot'],
    [/headless/i, 5, 'headless'],
    [/\bbot\b|\bcrawl\b|\bspider\b/i, 4, 'bot/crawler'],
    [/curl|wget|python-requests|httpclient|go-http-client/i, 4, 'http-client'],
  ];

  for (const [re, pts, label] of uaRules) {
    if (re.test(ua)) {
      score += pts;
      reasons.push(label);
    }
  }

  if (!acceptLang) {
    score += 1;
    reasons.push('no accept-language');
  }

  const event = payload?.event;
  if (event === 'session_end') {
    const seconds = typeof payload?.active_seconds === 'number' ? payload.active_seconds : 0;
    const interactions = typeof payload?.interactions === 'number' ? payload.interactions : 0;
    if (seconds <= 1 && interactions === 0) {
      score += 2;
      reasons.push('0-interaction short session');
    }
  }

  return { score, reasons };
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

    const primaryWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const botWebhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL;
    if (!primaryWebhookUrl && !botWebhookUrl) {
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

    const bot = botScore(req, payload);
    const targetWebhookUrl = bot.score >= 6 && botWebhookUrl ? botWebhookUrl : primaryWebhookUrl;
    if (!targetWebhookUrl) {
      res.statusCode = 204;
      res.end();
      return;
    }

    const discordBody = formatDiscordMessage(payload, req);
    if (bot.score >= 6) {
      discordBody.embeds[0].title = 'Possible bot visit';
      discordBody.embeds[0].color = 0xe11d48;
      discordBody.embeds[0].fields.unshift({ name: 'Bot score', value: `${bot.score} (${bot.reasons.join(', ') || 'n/a'})`, inline: false });
    }

    const discordRes = await fetch(targetWebhookUrl, {
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
