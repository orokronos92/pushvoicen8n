/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
    JWT_SECRET: process.env.JWT_SECRET || 'pushvoice-secret-key-very-long-and-complex-2025',
  },
  output: 'standalone',
  // Transpiler pour les modules qui utilisent des fonctionnalités ES6+
  transpilePackages: ['react-speech-recognition'],
  experimental: {
    // Assurer que les polyfills sont correctement chargés
    esmExternals: false,
  },
  // Utiliser SWC pour la transpilation (plus rapide que Babel)
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Fallbacks pour les modules Node.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
      };
      
      // Ajouter le polyfill pour regeneratorRuntime
      config.resolve.alias = {
        ...config.resolve.alias,
        'regenerator-runtime/runtime': require.resolve('regenerator-runtime/runtime'),
      };
      
      // Injecter le polyfill dans le bundle principal
      if (config.entry) {
        Object.keys(config.entry).forEach(key => {
          if (Array.isArray(config.entry[key])) {
            config.entry[key].unshift('regenerator-runtime/runtime');
          } else if (typeof config.entry[key] === 'string') {
            config.entry[key] = ['regenerator-runtime/runtime', config.entry[key]];
          }
        });
      }
    }
    
    return config;
  },
}

module.exports = nextConfig