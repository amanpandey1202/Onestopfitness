import type { NextConfig } from "next";

const supabaseHost = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : "";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // lib/storage.ts validateUpload + assertUploadContent reject SVG uploads, so
    // the optimizer only ever receives raster images (local or Supabase public
    // bucket). Static SVG placeholders render via plain <img> components.
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        // Local uploads are content-hashed — safe to cache aggressively.
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;