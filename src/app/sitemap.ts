import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-metadata";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/experience", "/projects", "/resume", "/contact", "/music"].map(route => ({ url: `${siteUrl}${route}` }));
}
