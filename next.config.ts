import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Admin forms post metadata only; audio files go through the upload route.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
