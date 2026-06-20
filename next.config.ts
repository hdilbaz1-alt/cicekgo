import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',          // statik export (nginx ile sunulur)
  images: { unoptimized: true },
  trailingSlash: true,       // /login/ -> /login/index.html (nginx ile temiz routing)
};

export default nextConfig;
