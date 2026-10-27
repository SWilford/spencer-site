import type { Metadata } from "next";
import { siteUrl, siteDescription } from "@/lib/site-metadata";
import { Chakra_Petch, Manrope } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { PageMotion } from "@/components/page-motion";
import { SiteFooter } from "@/components/site-footer";
import { WireframeBackground } from "@/components/wireframe-background";
import { SensorCursor } from "@/components/sensor-cursor";
import { SurveyScrollbar } from "@/components/survey-scrollbar";
import "./globals.css";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const nameFont = Chakra_Petch({subsets:["latin"],weight:"600",variable:"--font-name",display:"swap"});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Spencer Wilford | Software Engineering", template: "%s · Spencer Wilford" },
  description: siteDescription,
  authors: [{ name: "Spencer Wilford", url: siteUrl }],
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  openGraph: { title: "Spencer Wilford", description: siteDescription, url: siteUrl, siteName: "Spencer Wilford", type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image", title: "Spencer Wilford", description: siteDescription },
  alternates: { canonical: siteUrl },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${nameFont.variable}`}>
      <body><a className="skip-link" href="#main">Skip to content</a><WireframeBackground /><SiteHeader /><PageMotion>{children}</PageMotion><SiteFooter /><SensorCursor /><SurveyScrollbar /></body>
    </html>
  );
}
