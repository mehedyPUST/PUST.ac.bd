/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // Enable Next.js image optimization for allowed remote hosts.
    // Local static assets (e.g. /assets/pust-logo.png) remain optimizable by default.
    remotePatterns: [
      // imgbb (both common hostnames)
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ibb.co',
        pathname: '/**',
      },
      // ImageKit delivery + related hosts
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imagekit.io',
        pathname: '/**',
      },
      // Official PUST site assets (banners, forms, slides)
      {
        protocol: 'https',
        hostname: 'pust.ac.bd',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pust.ac.bd',
        pathname: '/**',
      },
    ],
    // Prefer modern formats when the optimizer can produce them.
    formats: ['image/avif', 'image/webp'],
    // Cache optimized variants for 24h (seconds).
    minimumCacheTTL: 60 * 60 * 24,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
