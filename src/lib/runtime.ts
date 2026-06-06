const hasPrerenderFlag = () =>
  typeof globalThis !== "undefined" &&
  (globalThis as typeof globalThis & { __ELECTRICPMR_PRERENDER__?: boolean })
    .__ELECTRICPMR_PRERENDER__ === true;

export const isPrerenderRuntime = () =>
  hasPrerenderFlag() ||
  (typeof navigator !== "undefined" &&
    (navigator.webdriver || navigator.userAgent.includes("HeadlessChrome")));
