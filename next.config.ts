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
    allowedDevOrigins: [
      'https://6000-firebase-studio-1750279304267.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev',
      'https://9000-firebase-studio-1750279304267.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev',
      // It's good practice to also allow http if that's how you access it sometimes,
      // though the log specifically showed https.
      // 'http://6000-firebase-studio-1750279304267.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev',
      // 'http://9000-firebase-studio-1750279304267.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev'
    ],
  },
};

export default nextConfig;
