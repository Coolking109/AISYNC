/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    COHERE_API_KEY: process.env.COHERE_API_KEY,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  },
  // Edge runtime configuration
  images: {
    unoptimized: true,
  },
  // Webpack config for edge runtime
  webpack: (config, { isServer, nextRuntime }) => {
    if (nextRuntime === 'edge') {
      return config;
    }
    
    // For edge runtime, exclude Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      util: false,
      url: false,
      querystring: false,
      path: false,
      os: false,
    };
    
    return config;
  },
  // Experimental edge features
  experimental: {
    runtime: 'edge',
    serverComponentsExternalPackages: []
  },
  // Ignore build errors during transition
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
