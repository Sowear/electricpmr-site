import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
