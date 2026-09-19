import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/extract-text', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            const module = await server.ssrLoadModule('./api/extract-text.ts');
            const handler = module.default;

            const mockRes = {
              setHeader(name: string, value: string) {
                res.setHeader(name, value);
              },
              status(code: number) {
                res.statusCode = code;
                return {
                  json(payload: unknown) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(payload));
                  }
                };
              }
            };

            await handler({ method: 'POST', body: parsedBody }, mockRes);
          } catch (err: any) {
            console.error('API middleware error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Failed to process OCR request.' }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), apiDevMiddleware()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts')) return 'charts-vendor';
            if (id.includes('node_modules')) return 'vendor';
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
