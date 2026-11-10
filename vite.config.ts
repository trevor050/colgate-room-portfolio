/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import { defineConfig, type Plugin, type ProxyOptions } from 'vite';
import { content } from './src/content.ts';
import { renderResumeSections } from './src/resume.ts';

/** Public URL used for canonical links and the Open Graph image. Override with SITE_URL. */
const SITE_URL = (process.env.SITE_URL ?? 'https://trevorrosato.vercel.app').replace(/\/+$/, '');
const SITE_DESCRIPTION =
  "An interactive pixel-art room that doubles as Trevor's resume: awards, academics, senior-year schedule and projects.";

/**
 * Fills the HTML placeholders at build time. The plain resume's text is rendered
 * into resume.html here, so it exists without JavaScript or WebGL.
 */
function siteHtml(): Plugin {
  return {
    name: 'site-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replaceAll('%SITE_URL%', SITE_URL)
          .replaceAll('%SITE_DESCRIPTION%', SITE_DESCRIPTION)
          .replace('<!--resume-sections-->', renderResumeSections(content));
      },
    },
  };
}

const proxy: Record<string, ProxyOptions> = {
  // First-party PostHog proxy (production uses the rewrite in vercel.json).
  '/_i': {
    target: 'https://us.i.posthog.com',
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/_i/, ''),
  },
};
// Point /api at a local Dossier (`npm run dossier:demo`) to test tracking end to end.
if (process.env.DOSSIER_URL) {
  proxy['/api'] = { target: process.env.DOSSIER_URL, changeOrigin: true };
}

export default defineConfig({
  plugins: [siteHtml()],
  define: {
    // Lets the client skip analytics on Vercel preview deployments.
    __DEPLOY_ENV__: JSON.stringify(process.env.VERCEL_ENV ?? ''),
  },
  server: { proxy },
  preview: { proxy },
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        resume: resolve(import.meta.dirname, 'resume.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
