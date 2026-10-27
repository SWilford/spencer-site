import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-metadata";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/journal", "/photos"] }, sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl };
}
