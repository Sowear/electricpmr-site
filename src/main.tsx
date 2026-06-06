import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isPrerenderRuntime } from "./lib/runtime";

const rootElement = document.getElementById("root")!;

// List of routes pre-rendered during the build process
const prerenderedRoutes = [
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
];

const pathname = window.location.pathname.replace(/\/$/, '') || '/';
const isPrerendered = prerenderedRoutes.includes(pathname);

if (rootElement.hasChildNodes() && isPrerendered) {
  // @prerenderer captures a live browser DOM, not React SSR output.
  rootElement.replaceChildren();
}

createRoot(rootElement).render(<App />);

// Manually register Service Worker to handle errors and avoid uncaught promise rejections
if ('serviceWorker' in navigator && !isPrerenderRuntime()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered successfully with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('Service Worker registration skipped or failed (this is normal in some environments):', error);
      });
  });
}
