/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove env section - use Vercel environment variables instead
  images: {
    unoptimized: true,
    domains: ['aisync.dev'],
  },
  // Optimized settings for Vercel deployment
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'speakeasy', 'nodemailer', 'qrcode'],
    // Optimize for serverless functions
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Production optimizations
  eslint: {
    ignoreDuringBuilds: false, // Enable linting in production
  },
  typescript: {
    ignoreBuildErrors: false, // Enable type checking in production
  },
  // Vercel-specific optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  // API route optimizations
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '8mb',
  },
  // Webpack optimizations for serverless
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Optimize server-side bundles
      config.externals.push('_http_common');
      
      // Reduce bundle size for AI SDKs
      config.resolve.alias = {
        ...config.resolve.alias,
        '@anthropic-ai/sdk': require.resolve('@anthropic-ai/sdk'),
        'openai': require.resolve('openai'),
        '@google/generative-ai': require.resolve('@google/generative-ai'),
      };
    }
    
    // Optimize chunk sizes
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
    
    return config;
  },
}

module.exports = nextConfig
