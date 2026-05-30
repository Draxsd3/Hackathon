import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'node:path';

const useHttps = process.env.VITE_DEV_HTTPS === 'true';

export default defineConfig({
  plugins: [react(), useHttps && basicSsl()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: true,        // escuta em 0.0.0.0 (acessivel pelo celular na mesma rede Wi-Fi)
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
