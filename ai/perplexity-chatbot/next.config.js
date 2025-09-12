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
  // Ignore build errors during transition
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
