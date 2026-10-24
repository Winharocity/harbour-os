import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Needed for the lean multi-stage Dockerfile (node server.js)
  output: "standalone",
};

export default nextConfig;
