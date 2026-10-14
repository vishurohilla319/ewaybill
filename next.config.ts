import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // We run tsc during tests, ignore build blocker in CI if version mismatch
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
