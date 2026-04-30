// vite.config.ts
import { defineConfig } from "file:///C:/Users/mmxxn/OneDrive/%D0%94%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D1%8B/GitHub/electricpmr-site/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/mmxxn/OneDrive/%D0%94%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D1%8B/GitHub/electricpmr-site/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/mmxxn/OneDrive/%D0%94%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D1%8B/GitHub/electricpmr-site/node_modules/lovable-tagger/dist/index.js";
import prerender from "file:///C:/Users/mmxxn/OneDrive/%D0%94%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D1%8B/GitHub/electricpmr-site/node_modules/@prerenderer/rollup-plugin/index.mjs";
import PuppeteerRenderer from "file:///C:/Users/mmxxn/OneDrive/%D0%94%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D1%8B/GitHub/electricpmr-site/node_modules/@prerenderer/renderer-puppeteer/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\mmxxn\\OneDrive\\\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B\\GitHub\\electricpmr-site";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8787",
        changeOrigin: true
      },
      "/files": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8787",
        changeOrigin: true
      }
    },
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    prerender({
      staticDir: path.join(__vite_injected_original_dirname, "dist"),
      routes: [
        "/",
        "/uslugi",
        "/stoimost",
        "/elektrik-v-tiraspole",
        "/elektrik-v-benderah",
        "/elektrik-v-slobodzee"
      ],
      renderer: new PuppeteerRenderer({
        renderAfterTime: 5e3,
        headless: true
      })
    })
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["framer-motion", "lucide-react", "recharts", "sonner"],
          supabase: ["@supabase/supabase-js"]
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtbXh4blxcXFxPbmVEcml2ZVxcXFxcdTA0MTRcdTA0M0VcdTA0M0FcdTA0NDNcdTA0M0NcdTA0MzVcdTA0M0RcdTA0NDJcdTA0NEJcXFxcR2l0SHViXFxcXGVsZWN0cmljcG1yLXNpdGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG1teHhuXFxcXE9uZURyaXZlXFxcXFx1MDQxNFx1MDQzRVx1MDQzQVx1MDQ0M1x1MDQzQ1x1MDQzNVx1MDQzRFx1MDQ0Mlx1MDQ0QlxcXFxHaXRIdWJcXFxcZWxlY3RyaWNwbXItc2l0ZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvbW14eG4vT25lRHJpdmUvJUQwJTk0JUQwJUJFJUQwJUJBJUQxJTgzJUQwJUJDJUQwJUI1JUQwJUJEJUQxJTgyJUQxJThCL0dpdEh1Yi9lbGVjdHJpY3Btci1zaXRlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5cbmltcG9ydCBwcmVyZW5kZXIgZnJvbSAnQHByZXJlbmRlcmVyL3JvbGx1cC1wbHVnaW4nO1xuaW1wb3J0IFB1cHBldGVlclJlbmRlcmVyIGZyb20gJ0BwcmVyZW5kZXJlci9yZW5kZXJlci1wdXBwZXRlZXInO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCI6OlwiLFxuICAgIHBvcnQ6IDgwODAsXG4gICAgcHJveHk6IHtcbiAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgIHRhcmdldDogcHJvY2Vzcy5lbnYuVklURV9BUElfUFJPWFlfVEFSR0VUIHx8IFwiaHR0cDovLzEyNy4wLjAuMTo4Nzg3XCIsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBcIi9maWxlc1wiOiB7XG4gICAgICAgIHRhcmdldDogcHJvY2Vzcy5lbnYuVklURV9BUElfUFJPWFlfVEFSR0VUIHx8IFwiaHR0cDovLzEyNy4wLjAuMTo4Nzg3XCIsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBobXI6IHtcbiAgICAgIG92ZXJsYXk6IGZhbHNlLFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKSxcbiAgICBwcmVyZW5kZXIoe1xuICAgICAgc3RhdGljRGlyOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZGlzdCcpLFxuICAgICAgcm91dGVzOiBbXG4gICAgICAgICcvJyxcbiAgICAgICAgJy91c2x1Z2knLFxuICAgICAgICAnL3N0b2ltb3N0JyxcbiAgICAgICAgJy9lbGVrdHJpay12LXRpcmFzcG9sZScsXG4gICAgICAgICcvZWxla3RyaWstdi1iZW5kZXJhaCcsXG4gICAgICAgICcvZWxla3RyaWstdi1zbG9ib2R6ZWUnXG4gICAgICBdLFxuICAgICAgcmVuZGVyZXI6IG5ldyBQdXBwZXRlZXJSZW5kZXJlcih7XG4gICAgICAgIHJlbmRlckFmdGVyVGltZTogNTAwMCxcbiAgICAgICAgaGVhZGxlc3M6IHRydWVcbiAgICAgIH0pXG4gICAgfSlcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgIHVpOiBbJ2ZyYW1lci1tb3Rpb24nLCAnbHVjaWRlLXJlYWN0JywgJ3JlY2hhcnRzJywgJ3Nvbm5lciddLFxuICAgICAgICAgIHN1cGFiYXNlOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1osU0FBUyxvQkFBb0I7QUFDcmIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUVoQyxPQUFPLGVBQWU7QUFDdEIsT0FBTyx1QkFBdUI7QUFOOUIsSUFBTSxtQ0FBbUM7QUFTekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRLFFBQVEsSUFBSSx5QkFBeUI7QUFBQSxRQUM3QyxjQUFjO0FBQUEsTUFDaEI7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNSLFFBQVEsUUFBUSxJQUFJLHlCQUF5QjtBQUFBLFFBQzdDLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDMUMsVUFBVTtBQUFBLE1BQ1IsV0FBVyxLQUFLLEtBQUssa0NBQVcsTUFBTTtBQUFBLE1BQ3RDLFFBQVE7QUFBQSxRQUNOO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxVQUFVLElBQUksa0JBQWtCO0FBQUEsUUFDOUIsaUJBQWlCO0FBQUEsUUFDakIsVUFBVTtBQUFBLE1BQ1osQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUFBLEVBQ0gsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ2pELElBQUksQ0FBQyxpQkFBaUIsZ0JBQWdCLFlBQVksUUFBUTtBQUFBLFVBQzFELFVBQVUsQ0FBQyx1QkFBdUI7QUFBQSxRQUNwQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
