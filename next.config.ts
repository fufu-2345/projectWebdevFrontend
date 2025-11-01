import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["127.0.0.1", "localhost"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
