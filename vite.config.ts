import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import prerender from '@prerenderer/rollup-plugin';
import JSDOMRenderer from '@prerenderer/renderer-jsdom';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8787",
        changeOrigin: true,
      },
      "/files": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo-192x192.png', 'logo-512x512.png'],
      manifest: {
        name: 'ЭлектроМастер',
        short_name: 'ЭлектроМастер',
        description: 'Профессиональный электромонтаж квартир и домов в Приднестровье',
        theme_color: '#eab308',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    mode === "production" && prerender({
      routes: [
        '/',
        '/uslugi',
        '/stoimost',
        '/elektrik-v-tiraspole',
        '/elektrik-v-benderah',
        '/elektrik-v-slobodzee',
        '/zamena-provodki',
        '/sborka-elektroshchita',
        '/avariynyy-elektrik',
        '/elektromontazh-v-kvartire',
        '/elektromontazh-v-dome'
      ],
      renderer: new JSDOMRenderer({
        renderAfterTime: 5000
      }),
      server: {
        port: 8080
      }
    })
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react', 'recharts', 'sonner'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
