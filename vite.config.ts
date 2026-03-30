// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Backpacker Budget',
        short_name: 'Budget',
        theme_color: '#166534',
        background_color: '#ffffff',
        display: 'standalone',
      },
    }),
  ],
});
