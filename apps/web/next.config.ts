import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@twelve-cycle/domain"],
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
