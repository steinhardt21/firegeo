import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Configure for Railway deployment
  output: 'standalone',
  // Railway-specific optimizations
  ...(process.env.RAILWAY_ENVIRONMENT && {
    // Skip static generation for pages that require auth during build
    generateBuildId: async () => {
      return 'railway-build-' + Date.now();
    },
  }),
};

export default nextConfig;
