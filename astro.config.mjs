import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import path from 'path';
import { fileURLToPath } from 'url';
import { SITE_URL, isPrivateRoutePath } from './src/lib/site.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitemapLastmod = new Date().toISOString();

const sitemapRouteMeta = {
  '/': { changefreq: 'weekly', priority: 1.0 },
  '/avariynyy-elektrik': { changefreq: 'weekly', priority: 0.9 },
  '/contact': { changefreq: 'monthly', priority: 0.8 },
  '/elektrik-v-benderah': { changefreq: 'monthly', priority: 0.7 },
  '/elektrik-v-slobodzee': { changefreq: 'monthly', priority: 0.7 },
  '/elektrik-v-tiraspole': { changefreq: 'monthly', priority: 0.7 },
  '/elektromontazh-v-dome': { changefreq: 'monthly', priority: 0.8 },
  '/elektromontazh-v-kvartire': { changefreq: 'monthly', priority: 0.8 },
  '/sborka-elektroshchita': { changefreq: 'monthly', priority: 0.8 },
  '/stoimost': { changefreq: 'weekly', priority: 0.8 },
  '/uslugi': { changefreq: 'weekly', priority: 0.8 },
  '/zamena-provodki': { changefreq: 'monthly', priority: 0.8 },
};

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      filter: (page) => !isPrivateRoutePath(new URL(page).pathname),
      serialize: (item) => {
        const pathname = new URL(item.url).pathname.replace(/\/$/, '') || '/';
        const meta = sitemapRouteMeta[pathname] ?? { changefreq: 'monthly', priority: 0.5 };

        return {
          ...item,
          lastmod: sitemapLastmod,
          changefreq: meta.changefreq,
          priority: meta.priority,
        };
      },
    }),
  ],
  vite: {
    server: {
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
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    }
  }
});
