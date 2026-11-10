import { inject } from '@vercel/analytics';
import { initDossier, type Dossier } from '@trevor050/dossier/client';
import type { PostHog } from 'posthog-js';
import { applyInternalParam, shouldIgnore, trackerEndpoint } from './tracking';

export type Analytics = {
  /** Dossier handle (a no-op when tracking is off). */
  dossier: Dossier;
  /** PostHog event, queued until PostHog has loaded. Dropped when PostHog is off. */
  capture(event: string, properties?: Record<string, unknown>): void;
};

function readInternalFlag(): boolean {
  try {
    return applyInternalParam(location.search, localStorage);
  } catch {
    return false;
  }
}

/**
 * Starts Vercel Analytics, Dossier and (when a key is set) PostHog for this page.
 * Nothing is recorded in dev, on Vercel preview deployments, or in a browser
 * opted out with `?internal=1` (Dossier also honors `?dossier=off`, GPC and DNT).
 */
export function startAnalytics(options: { sections: string | false }): Analytics {
  const internal = readInternalFlag();
  const env = import.meta.env;
  const ignored = shouldIgnore({
    prod: env.PROD,
    deployEnv: __DEPLOY_ENV__,
    trackerEndpoint: env.VITE_TRACKER_ENDPOINT,
    internal,
  });

  if (env.PROD) inject();

  const dossier = initDossier({
    endpoint: trackerEndpoint(env.VITE_TRACKER_ENDPOINT) ?? undefined,
    ignore: ignored,
    sections: options.sections,
    persist: env.VITE_TRACKER_PERSIST === 'cookie' ? 'cookie' : 'localStorage',
  });

  // PostHog is optional and loaded after the page is up, so it never delays the room.
  const posthogKey = env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
  const posthogEnabled = env.PROD && Boolean(posthogKey) && (!__DEPLOY_ENV__ || __DEPLOY_ENV__ === 'production');
  let posthog: PostHog | null = null;
  const pending: Array<[string, Record<string, unknown>]> = [];

  if (posthogEnabled) {
    void import('posthog-js')
      .then(({ default: ph }) => {
        ph.init(posthogKey!, {
          // First-party proxy route (less likely to be blocked than `us.i.posthog.com`).
          // Dev is proxied via `vite.config.ts`, production is rewritten via `vercel.json`.
          api_host: '/_i',
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: true,
          loaded: (loaded) => {
            // This app is mostly a canvas; explicit events help verify installation.
            loaded.capture('$pageview');
            loaded.capture('site_loaded');
          },
        });
        if (internal) ph.opt_out_capturing();
        else ph.opt_in_capturing();
        posthog = ph;
        for (const [event, props] of pending.splice(0)) ph.capture(event, props);
      })
      .catch(() => {});
  }

  function capture(event: string, properties: Record<string, unknown> = {}) {
    if (!posthogEnabled) return;
    const props = {
      ...properties,
      is_mobile: matchMedia('(max-width: 900px)').matches,
      orientation: matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape',
      viewport_w: innerWidth,
      viewport_h: innerHeight,
    };
    try {
      if (posthog) posthog.capture(event, props);
      else if (pending.length < 100) pending.push([event, props]);
    } catch {
      // Analytics must never break the page.
    }
  }

  return { dossier, capture };
}
