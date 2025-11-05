import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Development server configuration
  server: {
    // Proxy configuration for API requests
    // This redirects requests starting with '/api' to the backend server
    // during development, avoiding CORS issues
    proxy: {
      '/api': {
        // Backend server URL (Spring Boot)
        target: 'http://localhost:8080',

        // Change the origin of the host header to the target URL
        // This is necessary when the backend checks the origin
        changeOrigin: true,

        // Optional: Rewrite the path (currently not used)
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})