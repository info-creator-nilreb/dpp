/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      // TypeScript-Fehler blockieren Builds nicht (schnellere Dev-Umgebung)
      ignoreBuildErrors: true,
    },
    // Turbopack optimizations
    turbopack: {
      // Enable experimental features for better performance
      resolveAlias: {
        // Add any custom aliases here if needed
      },
    },
    // Webpack config (fallback für --webpack flag, wird mit --turbo ignoriert)
    webpack: (config, { isServer }) => {
      // Exclude Node.js modules from client-side bundle
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
        
        // Mark nodemailer as external for client builds
        config.externals = config.externals || []
        config.externals.push('nodemailer')
      }
      return config
    },
  }
  
  module.exports = nextConfig
  