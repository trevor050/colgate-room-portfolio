import { defineConfig } from 'vite'

export default defineConfig({
  // Disable caching to help with special characters in path
  server: {
    watch: {
      usePolling: true
    }
  },
  // Use relative base for builds
  base: './'
})
