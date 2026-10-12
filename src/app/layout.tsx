import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WireframeBackground } from "@/components/wireframe-background";
import "./globals.css";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Spencer Wilford",
  description: "Projects, experience, and the things I make.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={bodyFont.variable}>
      <body><a className="skip-link" href="#main">Skip to content</a><WireframeBackground /><SiteHeader />{children}<SiteFooter /></body>
    </html>
  );
}
