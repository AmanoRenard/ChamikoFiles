/** @type {import('next').NextConfig} */
const nextConfig = {
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
