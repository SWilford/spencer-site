import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spencer Wilford",
  description: "Projects, experience, and the things I make.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
