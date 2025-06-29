/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' to enable API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.externals = [...config.externals, 'utf-8-validate', 'bufferutil'];
    return config;
  },
};

module.exports = nextConfig;