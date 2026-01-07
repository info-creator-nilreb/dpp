/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
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
  