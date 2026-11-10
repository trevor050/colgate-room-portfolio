/**
 * Decides whether analytics should run for this page view. Pure so it can be tested;
 * `src/analytics.ts` feeds it the real environment.
 */
export type TrackingEnv = {
  /** `import.meta.env.PROD` */
  prod: boolean;
  /** `VERCEL_ENV` at build time: 'production' | 'preview' | 'development', or '' off Vercel. */
  deployEnv: string;
  /** `VITE_TRACKER_ENDPOINT`. `off`, `false` or `disabled` turns the tracker off. */
  trackerEndpoint?: string;
  /** This browser opted out with `?internal=1`. */
  internal: boolean;
};

const OFF_VALUES = new Set(['off', 'false', 'disabled']);

export function trackerEndpoint(raw: string | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value) return '/api/collect';
  return OFF_VALUES.has(value.toLowerCase()) ? null : value;
}

/** True when nothing should be recorded: dev builds, Vercel preview deployments, opted-out browsers. */
export function shouldIgnore(env: TrackingEnv): boolean {
  if (!env.prod) return true;
  if (env.deployEnv && env.deployEnv !== 'production') return true;
  if (env.internal) return true;
  return trackerEndpoint(env.trackerEndpoint) === null;
}

/**
 * `?internal=1` marks this browser as one of Trevor's own devices (persisted in
 * localStorage); `?internal=0` clears it. Returns the resulting state.
 */
export function applyInternalParam(search: string, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>): boolean {
  const value = new URLSearchParams(search).get('internal');
  if (value === '1' || value === 'true') storage.setItem('ph_internal', '1');
  else if (value === '0' || value === 'false') storage.removeItem('ph_internal');
  return storage.getItem('ph_internal') === '1';
}
