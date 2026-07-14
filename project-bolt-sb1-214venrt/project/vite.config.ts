import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Exposes the server to your local network/mobile phone
    port: 3001,      // Forces the port to 3001
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'pdfjs-dist', 
      'onnxruntime-web', 
      '@microsoft/onnxruntime-web',
      'react',
      'react-dom'
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
          if (id.includes('onnxruntime-web') || id.includes('@microsoft/onnxruntime-web')) return 'ort';
        },
      },
    },
  },
});