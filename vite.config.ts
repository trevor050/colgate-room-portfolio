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
    },
    watch: {
      usePolling: true
    }
  },
  // Use relative base for builds
  base: './'
})
