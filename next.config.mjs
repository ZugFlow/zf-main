/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com']
  },
  // Rimuoviamo i rewrites da qui perché li gestiamo nel middleware
  // I rewrites in next.config.mjs potrebbero interferire con il middleware
};

export default nextConfig;
