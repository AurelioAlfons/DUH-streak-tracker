import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // keep next from writing into my project notes on dev start
  agentRules: false,
};

export default nextConfig;
