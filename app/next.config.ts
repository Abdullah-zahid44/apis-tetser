import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Expose only the non-sensitive local bypass state to the client bundle.
  // The server still enforces NODE_ENV === 'development' in requireAuth().
  env: {
    NEXT_PUBLIC_DEV_BYPASS_AUTH:
      process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true'
        ? 'true'
        : 'false',
  },
};

export default nextConfig;
