import type { NextConfig } from "next";
import withPWAInit, { runtimeCaching } from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Dynamic authenticated API calls must never fall back to stale or empty caches
        urlPattern: /\/api\/(?!auth).*/i,
        handler: "NetworkOnly",
        method: "GET",
      },
      {
        // Dynamic SSR pages: ensure direct network fetch and eliminate Workbox promise rejections
        urlPattern: /\/(clients|routines|diets|messages|profile|exercises|food-bank|recipes|admin)(\/.*)?$/i,
        handler: "NetworkOnly",
      },
      ...runtimeCaching,
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
