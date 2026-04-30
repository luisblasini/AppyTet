import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    strictPort: true,  // Fail immediately if port 8080 is occupied (no silent port-hopping)
    open: true,         // Auto-open browser on dev start
    host: true,         // Allow LAN access for mobile testing
  },
})
