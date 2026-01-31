import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    'process.env': {
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  },
  plugins: [
    react(),
    ...(process.env.NODE_ENV === 'production' ? [
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'injectManifest', // Using InjectManifest for custom SW logic
        srcDir: 'public',
        filename: 'sw.js',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', '**/*.svg'],
        manifest: {
          name: 'CasaGestión - Gestión Vacacional',
          short_name: 'CasaGestión',
          description: 'Aplicación de gestión integral para casas vacacionales. Control de reservas, finanzas y clientes.',
          theme_color: '#0ea5e9',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            // Android icons
            {
              src: 'icon-192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            // Additional sizes for better compatibility
            {
              src: 'icon-192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: 'icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            // iOS specific sizes (fallbacks)
            {
              src: 'icon-512.svg',
              sizes: '180x180',
              type: 'image/svg+xml',
              purpose: 'apple touch icon'
            },
            {
              src: 'icon-512.svg',
              sizes: '167x167',
              type: 'image/svg+xml',
              purpose: 'apple touch icon'
            },
            {
              src: 'icon-192.svg',
              sizes: '152x152',
              type: 'image/svg+xml',
              purpose: 'apple touch icon'
            },
            {
              src: 'icon-192.svg',
              sizes: '120x120',
              type: 'image/svg+xml',
              purpose: 'apple touch icon'
            },
            {
              src: 'icon-192.svg',
              sizes: '76x76',
              type: 'image/svg+xml',
              purpose: 'apple touch icon'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,html,ico,png,svg,woff2,css}'],
          runtimeCaching: [
            // Static assets - CacheFirst strategy
            {
              urlPattern: /\.(?:js|css|woff2|png|jpg|jpeg|svg|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-resources',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                },
                rangeRequests: true
              }
            },
            // External CDN (esm.sh) - CacheFirst strategy
            {
              urlPattern: /^https:\/\/esm\.sh\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'esm-cdn-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // API calls - NetworkFirst strategy with fallback
            {
              urlPattern: /^https?:\/\/.*\/api\/(reservations|transactions|clients|analytics|ai).*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache-reservations',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Generic API calls - NetworkFirst strategy
            {
              urlPattern: /^https?:\/\/.*\/api\/.*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache-generic',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 // 1 hour
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // HTML pages - StaleWhileRevalidate
            {
              urlPattern: /\.(?:html)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'html-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                }
              }
            }
          ]
        }
      })
    ] : [])
  ]
});