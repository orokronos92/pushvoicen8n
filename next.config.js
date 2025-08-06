/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  },
  output: 'standalone',
  webpack: (config, { isServer, dev }) => {
    // Assurer que regenerator-runtime est disponible
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
      
      // Ajouter regenerator-runtime comme entry point
      config.entry = async () => {
        const entries = await config.entry()
        if (entries['main.js'] && !entries['main.js'].includes('regenerator-runtime/runtime')) {
          entries['main.js'] = ['regenerator-runtime/runtime', ...entries['main.js']]
        }
        return entries
      }
    }
    
    return config
  },
}

module.exports = nextConfig