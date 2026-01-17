import { query } from './db';

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS visitors (
          vid TEXT PRIMARY KEY,
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          first_ip TEXT,
          last_ip TEXT,
          first_user_agent TEXT,
          last_user_agent TEXT,
          first_referrer TEXT,
          last_referrer TEXT,
          ipinfo JSONB,
          ipinfo_ip TEXT,
          ipinfo_fetched_at TIMESTAMPTZ,
          ipinfo_error TEXT,
          ipinfo_error_at TIMESTAMPTZ
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS sessions (
          sid TEXT PRIMARY KEY,
          vid TEXT NOT NULL REFERENCES visitors(vid) ON DELETE CASCADE,
          started_at TIMESTAMPTZ NOT NULL,
          ended_at TIMESTAMPTZ,
          ip TEXT,
          user_agent TEXT,
          accept_language TEXT,
          referrer TEXT,
          page TEXT,
          is_mobile BOOLEAN,
          orientation TEXT,
          geo JSONB,
          bot_score INTEGER,
          bot_reasons TEXT,
          is_bot BOOLEAN,
          ipinfo JSONB,
          first_interaction_seconds INTEGER,
          interactions INTEGER,
          active_seconds INTEGER,
          overlays JSONB,
          overlays_unique INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS events (
          id BIGSERIAL PRIMARY KEY,
          sid TEXT NOT NULL REFERENCES sessions(sid) ON DELETE CASCADE,
          vid TEXT NOT NULL REFERENCES visitors(vid) ON DELETE CASCADE,
          ts TIMESTAMPTZ NOT NULL,
          type TEXT NOT NULL,
          seq INTEGER,
          data JSONB
        );
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_events_sid_ts ON events(sid, ts);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_sessions_is_bot_started_at ON sessions(is_bot, started_at DESC);
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS ipinfo_cache (
          ip TEXT PRIMARY KEY,
          data JSONB,
          fetched_at TIMESTAMPTZ,
          error TEXT,
          error_at TIMESTAMPTZ
        );
      `);
    })();
  }

  return schemaReady;
}

