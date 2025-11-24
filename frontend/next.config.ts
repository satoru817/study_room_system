// import type { NextConfig } from "next";
// import withPWAInit from "@ducanh2912/next-pwa";

// const withPWA = withPWAInit({
//   dest: "public",
//   disable: process.env.NODE_ENV === "development",
//   register: true,
// });

// const nextConfig: NextConfig = {
//   output: "export",
//   distDir: "out",
//   turbopack: {},
//   images: {
//     unoptimized: true,
//   },
//   async rewrites() {
//     return [
//       {
//         source: "/api/:path*",
//         destination: "http://localhost:8080/api/:path*",
//       },
//     ];
//   },
// };

// export default withPWA(nextConfig);

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: "http://localhost:8080/api/:path*",
  //     },
  //   ];
  // },
  // ✅ rewrites は使えないので削除
  // ✅ distDir も不要
  // ✅ turbopack は残しても消してもOK
};

export default nextConfig;
