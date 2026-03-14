import type { NextConfig } from "next";

// Next.js loads .env.local from the project root automatically (no config needed).
// Put your secrets in .env.local and restart the dev server.

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
      { protocol: "https", hostname: "edealindia.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
