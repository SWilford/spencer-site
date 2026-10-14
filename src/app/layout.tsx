import type { Metadata } from "next";
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
  title: "Spencer Wilford",
  description: "Projects, experience, and the things I make.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${nameFont.variable}`}>
      <body><a className="skip-link" href="#main">Skip to content</a><WireframeBackground /><SiteHeader /><PageMotion>{children}</PageMotion><SiteFooter /><SensorCursor /><SurveyScrollbar /></body>
    </html>
  );
}
