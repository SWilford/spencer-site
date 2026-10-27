import type { Metadata } from "next";
export const siteUrl = "https://spencerwilford.com";
export const siteDescription = "Spencer Wilford: JMU computer science student, former software engineering intern at NSWCDD and NGA. Projects, experience, and music statistics.";
export function pageMetadata(title: string, description: string, pathname: string, index = true): Metadata {
  const url = `${siteUrl}${pathname}`;
  return { title, description, alternates: { canonical: url }, robots: { index, follow: true },
    openGraph: { title: `${title} · Spencer Wilford`, description, url, siteName: "Spencer Wilford", type: "website", locale: "en_US", images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Spencer Wilford — software engineering portfolio" }] },
    twitter: { card: "summary_large_image", title: `${title} · Spencer Wilford`, description, images: [`${siteUrl}/opengraph-image`] } };
}
