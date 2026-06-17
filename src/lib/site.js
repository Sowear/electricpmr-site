export const SITE_URL = "https://electricpmr.vercel.app";

export const SITEMAP_INDEX_PATH = "/sitemap-index.xml";

export const PRIVATE_ROUTE_PREFIXES = [
  "/auth",
  "/dashboard",
  "/projects",
  "/estimator",
  "/admin",
  "/catalog",
];

export function normalizePathname(pathname = "/") {
  if (pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function isPrivateRoutePath(pathname = "/") {
  const normalizedPath = normalizePathname(pathname);

  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}
