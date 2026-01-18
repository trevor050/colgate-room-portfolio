import { defineConfig } from 'vite'

export default defineConfig({
  // Disable caching to help with special characters in path
  server: {
    proxy: {
      '/_i': {
        target: 'https://us.i.posthog.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/_i/, ''),
      },
      '/api': {
        target: 'https://dossier-colgate-room-portfolio.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
    watch: {
      usePolling: true
    }
  },
  // Use relative base for builds
  base: './'
})
