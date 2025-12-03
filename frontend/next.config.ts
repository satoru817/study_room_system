import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // rewrite request only in dev mood
  ...(isDev
    ? {
        async rewrites() {
          return [
            {
              source: "/:path*",
              destination: "http://localhost:8080/:path*",
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
