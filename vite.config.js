import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ESM shim plugin for use-sync-external-store
 *
 * Redirects CJS imports from use-sync-external-store/shim to local ESM shims.
 * Required because @base-ui/utils imports from this package and Deno+Vite
 * cannot extract named exports from CJS modules.
 *
 * @returns {import('vite').Plugin} Vite plugin object
 */
const useSyncExternalStoreShimPlugin = () => {
    const shimPath = path.resolve(process.cwd(), 'src/shims/use-sync-external-store-shim.js');
    const withSelectorPath = path.resolve(process.cwd(), 'src/shims/use-sync-external-store-with-selector.js');

    return {
        name: 'use-sync-external-store-shim',
        enforce: 'pre',
        resolveId(id) {
            if (id === 'use-sync-external-store/shim' || id === 'use-sync-external-store/shim/index.js') {
                return shimPath;
            }
            if (id === 'use-sync-external-store/shim/with-selector' || id === 'use-sync-external-store/shim/with-selector.js') {
                return withSelectorPath;
            }
            return null;
        }
    };
};


const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    useSyncExternalStoreShimPlugin(),
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
      'react-router-dom',
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
