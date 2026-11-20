import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleGatewayRequest } from './server/gateway';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: { port: 3000, host: '0.0.0.0' },
    plugins: [
      react(),
      // Development-only equivalent of /api/generate on Vercel.
      {
        name: 'local-gateway-function',
        configureServer(server: any) {
          server.middlewares.use('/api/generate', (req: any, res: any) => {
            void handleGatewayRequest(req, res, env);
          });
        },
      },
    ],
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  };
});
