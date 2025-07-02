
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Other experimental features can go here if needed
  },
  // allowedDevOrigins should be a top-level key
  allowedDevOrigins: [
    'https://6000-firebase-studio-1750279304267.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev',
    'https://9000-firebase-studio-1750279304267.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev',
    'http://localhost:9002',
  ],
};

export default nextConfig;
