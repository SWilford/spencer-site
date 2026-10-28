import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [{source:"/demos/:path*",headers:[{key:"X-Robots-Tag",value:"noindex, nofollow"},{key:"Access-Control-Allow-Origin",value:"*"},{key:"Content-Security-Policy",value:"sandbox allow-scripts"}]},{ source: "/((?!demos/).*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
    ] }];
  },
  distDir: process.env.NODE_ENV === "development" ? ".next-local" : ".next",
  /* config options here */
  outputFileTracingExcludes: { "/api/music-stats": ["./private-data/music/*.json", "./private-data/music/*.zip", "./private-data/music/spotify/**/*", "./private-data/music/apple/**/*", "./private-data/music/hosted/**/*", "./private-data/music/python-env/**/*"] },
  outputFileTracingIncludes: { "/api/music-stats": ["./private-data/music/site-bundle/**/*"] },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
