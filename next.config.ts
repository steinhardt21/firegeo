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
  // Disable static optimization during Railway build to avoid auth issues
  ...(process.env.RAILWAY_ENVIRONMENT && {
    experimental: {
      outputStandalone: true,
    },
    // Skip static generation for pages that require auth during build
    generateBuildId: async () => {
      return 'railway-build-' + Date.now();
    },
  }),
};

export default nextConfig;
