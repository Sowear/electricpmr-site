import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import prerender from '@prerenderer/rollup-plugin';
import PuppeteerRenderer from '@prerenderer/renderer-puppeteer';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let prerenderRenderer;

  if (mode === "production") {
    const launchOptions: any = {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    if (process.env.VERCEL) {
      // In Vercel build environment, use the self-contained @sparticuz/chromium
      const chromium = (await import('@sparticuz/chromium')).default;
      launchOptions.executablePath = await chromium.executablePath();
      launchOptions.args = [...launchOptions.args, ...chromium.args];
      launchOptions.headless = chromium.headless;
    }

    prerenderRenderer = new PuppeteerRenderer({
      renderAfterDocumentEvent: 'x-prerender-trigger',
      headless: true,
      launchOptions,
      consoleHandler: (route, msg) => {
        if (
          msg.type() === "warn" &&
          msg.text().includes("Error while trying to use the following icon from the Manifest")
        ) {
          return;
        }

        console.log(`[Puppeteer Route: ${route}] [${msg.type()}]`, msg.text());
      },
      pageHandler: async (page, route) => {
        await page.setCacheEnabled(false);
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(globalThis, "__ELECTRICPMR_PRERENDER__", {
            value: true,
            configurable: false
          });
        });

        page.on('requestfailed', request => {
          const url = request.url();
          const isAnalyticsRequest =
            url.includes("analytics.google.com") ||
            url.includes("google-analytics.com") ||
            url.includes("googletagmanager.com");

          if (!isAnalyticsRequest) {
            console.log(`[Request Failed: ${route}] ${url} - ${request.failure()?.errorText}`);
          }
        });
        page.on('response', response => {
          if (!response.ok() && response.status() !== 304) {
            console.log(`[Response Error: ${route}] ${response.status()} ${response.url()}`);
          }
        });
      }
    });
  }

  return {
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
        injectRegister: false,
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'logo-192x192.png', 'logo-512x512.png'],
        workbox: {
          navigateFallbackDenylist: [/^\/sitemap\.xml$/, /^\/robots\.txt$/, /^\/apple-app-site-association$/, /^\/\.well-known\/apple-app-site-association$/],
          globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff,woff2}'],
          globIgnores: ['**/sitephoto/**', '**/video/**', '**/hero-video.webp'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB safety net
        },
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
          '/elektromontazh-v-dome',
          '/contact'
        ],
        renderer: prerenderRenderer,
        server: {
          port: 8080
        },
        postProcess(renderedRoute) {
          // Strip data-rh and other non-standard attributes from canonical link tags
          renderedRoute.html = renderedRoute.html.replace(
            /<link([^>]*?)rel="canonical"([^>]*?)>/gi,
            (match) => {
              const hrefMatch = match.match(/href="([^"]*)"/);
              if (hrefMatch) {
                return `<link rel="canonical" href="${hrefMatch[1]}">`;
              }
              return match;
            }
          );

          // Remove duplicate canonical tags (keep only the first clean one)
          let canonicalCount = 0;
          renderedRoute.html = renderedRoute.html.replace(
            /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi,
            (match) => {
              canonicalCount++;
              return canonicalCount === 1 ? match : '';
            }
          );

          // Strip data-rh attributes from all meta tags
          renderedRoute.html = renderedRoute.html.replace(
            /(<(?:meta|title|script|link)[^>]*?)\s+data-rh="true"/gi,
            '$1'
          );
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
  };
});
