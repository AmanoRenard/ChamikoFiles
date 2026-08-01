/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    serverComponentsExternalPackages: ['archiver'],
  },
};

module.exports = nextConfig;
