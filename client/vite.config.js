import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server forwards /api requests to Express, so cookies work without CORS setup.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
