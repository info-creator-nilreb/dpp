/** @type {import('next').NextConfig} */
const nextConfig = {
    // Nodemailer und Node-Built-ins (crypto, fs, net, dns, tls) nicht bündeln – nur auf dem Server mit require laden
    serverExternalPackages: ["nodemailer"],
    // Next.js 16: Turbopack ist Standard; leere Config unterdrückt Warnung bei vorhandener webpack-Config
    turbopack: {},
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
  