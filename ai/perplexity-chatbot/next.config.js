/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    COHERE_API_KEY: process.env.COHERE_API_KEY,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  },
  images: {
    unoptimized: true,
  },
  // Webpack configuration for edge runtime compatibility
  webpack: (config, { isServer, nextRuntime }) => {
    // For edge runtime, exclude Node.js modules
    if (nextRuntime === 'edge' || isServer) {
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
        buffer: false,
        process: false,
        child_process: false,
        worker_threads: false,
        dns: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    
    return config;
  },
  // Experimental edge runtime settings
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'mongoose']
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
