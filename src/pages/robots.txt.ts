import type { APIRoute } from "astro";

import { PRIVATE_ROUTE_PREFIXES, SITE_URL, SITEMAP_INDEX_PATH } from "@/lib/site.js";

const renderRobotsTxt = (site: URL) => {
  const sitemapUrl = new URL(SITEMAP_INDEX_PATH, site);

  return [
    "User-agent: *",
    "Allow: /",
    "",
    "# Private routes",
    ...PRIVATE_ROUTE_PREFIXES.map((prefix) => `Disallow: ${prefix}`),
    "",
    `Sitemap: ${sitemapUrl.href}`,
    "",
  ].join("\n");
};

export const GET: APIRoute = ({ site }) => {
  const resolvedSite = site ?? new URL(SITE_URL);

  return new Response(renderRobotsTxt(resolvedSite), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
