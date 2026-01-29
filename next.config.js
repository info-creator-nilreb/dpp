/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
      // TypeScript-Fehler blockieren Builds nicht (schnellere Dev-Umgebung)
      ignoreBuildErrors: true,
    },
    // Next.js 16: Turbopack is default
    // Empty turbopack config to silence the warning
    turbopack: {},
    // Webpack config for production builds - exclude Node.js modules from client bundle
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
          dns: false,
          stream: false,
          url: false,
          util: false,
          http: false,
          https: false,
          zlib: false,
          path: false,
          os: false,
        }
        // Mark server-only modules as external for client builds
        config.externals = config.externals || []
        if (Array.isArray(config.externals)) {
          config.externals.push('nodemailer')
          config.externals.push('crypto')
        }
      }
      
      // Fix for Next.js 14.2+ route modules path resolution
      if (isServer) {
        config.resolve.alias = {
          ...config.resolve.alias,
          'next/dist/server/route-modules/pages/module.compiled': 
            require.resolve('next/dist/server/future/route-modules/pages/module.compiled'),
        }
      }
      
      return config
    },
  }
  
  module.exports = nextConfig
  