import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  //output: "export", // 静的HTMLエクスポートを有効化
  distDir: "out", // 出力ディレクトリ（デフォルトは'out'）
  images: {
    unoptimized: true, // 静的エクスポート時は画像最適化を無効化
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
        // destination: process.env.NEXT_PUBLIC_BACKEND_URL
        //   ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`
        //   : "http://localhost:8080/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
