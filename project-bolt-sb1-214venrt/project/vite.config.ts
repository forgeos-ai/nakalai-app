import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['pdfjs-dist', 'onnxruntime-web'],
  },
  worker: {
    format: 'es',
  },
  // Keep ORT out of the main chunk; worker loads it lazily
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('onnxruntime-web')) return 'ort';
        },
      },
    },
  },
});