import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = new URL(SITE_URL);
  const last = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/learn",
    "/roadmap",
    "/recruit",
    "/quiz",
    "/about",
    "/sources",
  ].map((p) => ({
    url: new URL(p, base).toString(),
    lastModified: last,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = getAllArticles().map((a) => ({
    url: new URL(`/learn/${a.slug}`, base).toString(),
    lastModified: a.updated ? new Date(a.updated) : last,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
