/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
    JWT_SECRET: process.env.JWT_SECRET || 'pushvoice-secret-key-very-long-and-complex-2025',
  },
  output: 'standalone',
  // SWC est utilisé par défaut, pas besoin de configuration webpack complexe
}

module.exports = nextConfig