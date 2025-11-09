/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other configurations
  images: {
    // For Next.js 13.4+ / Next.js 14+ / Next.js 15+
    remotePatterns: [
      {
        protocol: 'https', // or 'http' if you're not using SSL (but use https if possible)
        hostname: 'nexnex.johnmichaeljonatas.site',
        // Optional: Include a pathname pattern if you only want to allow specific subdirectories
        // pathname: '/upload/**', 
      },
      // You may need to also include 'localhost.sslip.io' if you access the app via that domain
      {
        protocol: 'http', 
        hostname: '*.localhost.sslip.io', 
      },
    ],
    // For older Next.js versions (pre-13.4), you would use: domains: ['nexnex.johnmichaeljonatas.site'],
  },
  // ... other configurations
};

export default nextConfig; // or module.exports = nextConfig;