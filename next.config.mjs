/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'default-secret-change-in-production',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },

    // Ensure trailing slashes are handled consistently
  trailingSlash: true, // or false, but be consistent
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,
  // Configure page extensions
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  // Configure images
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
