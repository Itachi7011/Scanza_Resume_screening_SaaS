import { MetadataRoute } from "next";

// NOTE: replace with your real production domain after first deployment.
const SITE_URL = "https://scanza.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "", "/pricing", "/about", "/contact", "/login", "/signup",
    "/for-employers", "/docs", "/privacy", "/terms",
  ];

  return staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
