import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { ensureEnvLoaded } from './api/_lib/env';

// Load .env.local and .env into process.env for local API dev middleware
ensureEnvLoaded();

function vercelApiDevPlugin(): Plugin {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const route = parsedUrl.pathname.replace(/^\/api\//, '').split('/')[0];
          try {
            const mod = await server.ssrLoadModule(`./api/${route}.ts`);
            if (mod && typeof mod.default === 'function') {
              await mod.default(req, res);
              return;
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Internal Server Error';
            console.error(`Dev API [${route}] error:`, err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: message }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    vercelApiDevPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Vinyl Coop',
        short_name: 'VinylCoop',
        description: 'Asistente de recomendación y práctica para mezclas de vinilos físicos',
        start_url: '/',
        display: 'standalone',
        background_color: '#090a0f',
        theme_color: '#090a0f',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // NetworkFirst: intenta red, cachea como fallback (ideal para app con datos de Supabase)
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 }, // 24h
            },
          },
        ],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
