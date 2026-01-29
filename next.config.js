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
      return config
    },
  }
  
  module.exports = nextConfig
  