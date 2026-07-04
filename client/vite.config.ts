import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the client runs on :5173 and proxies socket.io traffic to the
// backend on :3001 so the browser can use a same-origin socket connection.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
