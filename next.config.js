/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  },
}

module.exports = nextConfig