import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@package': path.resolve(__dirname, './package.json'),
      '@root': path.resolve(__dirname, './')
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      'cookie',
      'set-cookie-parser'
    ],
    exclude: [
      '@stevederico/skateboard-ui',
      '@swc/core',
      '@tailwindcss/oxide'
    ]
  },
  build: {
    rollupOptions: {
      external: [
        /\.node$/,
        '@tailwindcss/oxide'
      ]
    }
  },
  server: {
    host: 'localhost',
    port: 5173,
    watch: {
      usePolling: false
    },
    hmr: {
      overlay: false
    }
  }
});
