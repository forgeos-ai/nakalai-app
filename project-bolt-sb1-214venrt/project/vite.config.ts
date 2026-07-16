import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const envDir = fileURLToPath(new URL('../../', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, envDir, '');
  const injectedMode =
    process.env.VITE_PAYMENT_MODE ||
    env.VITE_PAYMENT_MODE ||
    (mode.toUpperCase() === 'MOCK'
      ? 'MOCK'
      : command === 'build'
        ? 'LIVE'
        : '');

  if (!['MOCK', 'TEST', 'LIVE'].includes(injectedMode.toUpperCase())) {
    throw new Error(
      'Runtime mode missing. Use npm run local:mock or npm run local:test.',
    );
  }

  return {
    envDir,
    define: {
      'import.meta.env.VITE_PAYMENT_MODE': JSON.stringify(
        injectedMode.toUpperCase(),
      ),
    },
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3001,
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: [
        'pdfjs-dist',
        'onnxruntime-web',
        '@microsoft/onnxruntime-web',
        'react',
        'react-dom',
      ],
    },
    worker: {
      format: 'es',
    },
    // Keep ORT out of the main chunk; worker loads it lazily
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('onnxruntime-web') ||
              id.includes('@microsoft/onnxruntime-web')
            ) {
              return 'ort';
            }
          },
        },
      },
    },
  };
});