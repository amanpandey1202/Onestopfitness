import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Gallery uses themed SVG placeholders until real photos are added.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
