import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages under /BridgeLab/ subfolder.
  // LOCAL DEV uses '/' via the dev server, production uses '/BridgeLab/'.
  base: process.env.NODE_ENV === 'production' ? '/BridgeLab/' : '/',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false, // disable sourcemaps in prod to reduce bundle size
  }
});
