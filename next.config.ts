import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "blogwebsite-53f01.firebasestorage.app",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
