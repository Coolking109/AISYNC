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
  webpack: (config, { isServer, dev }) => {
    // Fix OpenAI SDK module resolution issues
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      },
    };

    // External modules for server-side
    if (isServer) {
      // Optimize server-side bundles
      config.externals.push('_http_common');
      
      // Fix AI SDK imports
      config.externals.push({
        'openai': 'commonjs openai',
        '@anthropic-ai/sdk': 'commonjs @anthropic-ai/sdk',
        '@google/generative-ai': 'commonjs @google/generative-ai',
      });
    }

    // Fix OpenAI shims resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      'openai/_shims/auto/runtime': false,
      'openai/_shims/node-runtime': false,
    };

    // Add rule for handling ES modules
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });
    
    // Optimize chunk sizes
    if (!dev) {
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
            openai: {
              test: /[\\/]node_modules[\\/]openai[\\/]/,
              name: 'openai',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
}

module.exports = nextConfig
