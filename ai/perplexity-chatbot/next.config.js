/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    COHERE_API_KEY: process.env.COHERE_API_KEY,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  },
  // Cloudflare Pages configuration
  images: {
    unoptimized: true,
  },
  // Webpack configuration for problematic packages
  webpack: (config, { isServer }) => {
    // Ignore problematic packages during client-side builds
    if (!isServer) {
      config.resolve.fallback = {
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
      };
    }
    
    // Ignore specific problematic modules
    config.externals = config.externals || [];
    config.externals.push({
      'speakeasy': 'speakeasy',
      'qrcode': 'qrcode',
      'nodemailer': 'nodemailer',
    });
    
    return config;
  },
  // Ignore build errors temporarily
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
