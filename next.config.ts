import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@nillion/secretvaults", "@nillion/nuc", "@nillion/blindfold"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;