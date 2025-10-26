// next.config.js

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Config options here
  
  // 🚨 ITO ANG SOLUTION PARA SA NEXT/IMAGE COMPONENT
  images: {
    remotePatterns: [
      {
        // Para sa Production (Railway Domain)
        protocol: 'https',
        hostname: '**', // Pwedeng ** para sa anumang domain na naka-host sa sarili
        pathname: '/uploads/**', // Tiyakin na ang base path ay /uploads
      },
      {
        // Para sa Local Development (kung mag-de-develop ka ulit sa local)
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },

  /* Iba pang config options mo dito, kung meron man */
};

export default nextConfig;