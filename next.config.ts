import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    eslint: {
        ignoreDuringBuilds: true, // 빌드 시 ESLint 건너뜀
    },
};

export default nextConfig;
