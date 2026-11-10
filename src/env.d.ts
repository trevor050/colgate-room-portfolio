/// <reference types="vite/client" />

/** `VERCEL_ENV` at build time ('production', 'preview', 'development'), or '' when not built on Vercel. */
declare const __DEPLOY_ENV__: string;

interface ImportMetaEnv {
  readonly VITE_PUBLIC_POSTHOG_KEY?: string;
  readonly VITE_TRACKER_ENDPOINT?: string;
  readonly VITE_TRACKER_PERSIST?: string;
}
