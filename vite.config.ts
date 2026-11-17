import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
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
  plugins: [react(), vercelApiDevPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
