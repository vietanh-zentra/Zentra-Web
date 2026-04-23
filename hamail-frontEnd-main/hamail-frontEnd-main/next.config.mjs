/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["pxpfmgckgtncgjkvvdku.supabase.co"],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://54.254.198.56:2000/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
