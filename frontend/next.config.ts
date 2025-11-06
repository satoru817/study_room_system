import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: "export", // 静的HTMLエクスポートを有効化
  distDir: "out", // 出力ディレクトリ（デフォルトは'out'）
  images: {
    unoptimized: true, // 静的エクスポート時は画像最適化を無効化
  },
  trailingSlash: true, // オプション：末尾スラッシュを追加
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
