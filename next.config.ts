import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  distDir: process.env.NODE_ENV === "development" ? ".next-local" : ".next",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
