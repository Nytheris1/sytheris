import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [40, 60, 75, 85, 90],
    remotePatterns: [
      { protocol: "https", hostname: "**.anilist.co" },
      { protocol: "https", hostname: "**.anili.st" },
      { protocol: "https", hostname: "**.myanimelist.net" },
      { protocol: "https", hostname: "**.ytimg.com" },
    ],
  },
};

export default nextConfig;