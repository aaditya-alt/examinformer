import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }
    ]
  },
  outputFileTracingExcludes: {
    '*': [
      './scripts/**',
      './supabase/**',
    ],
    '/api/reviews': ['./src/data/tests/**'],
    '/api/question-reports': ['./src/data/tests/**'],
    '/api/admin/**': ['./src/data/tests/**'],
    '/api/score-calculator/**': ['./src/data/tests/**'],
    '/api/attempts': ['./src/data/tests/**'],
    '/api/auth/**': ['./src/data/tests/**'],
    '/api/saved-questions': ['./src/data/tests/**'],
  },
};

export default nextConfig;
