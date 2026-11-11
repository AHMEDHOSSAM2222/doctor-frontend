import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      // Listen on the local network so you can test the QR code with a phone.
      host: true,
      port: 5173,
      // In development, /api calls are forwarded to the backend (no CORS setup needed).
      proxy: {
        '/api': env.DEV_API_PROXY || 'http://localhost:4000',
      },
    },
  };
});
