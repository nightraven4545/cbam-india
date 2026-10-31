import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/markets", destination: "/esg", permanent: true }];
  },
};

export default nextConfig;
