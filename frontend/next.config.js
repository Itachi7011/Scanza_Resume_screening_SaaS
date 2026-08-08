/** @type {import('next').NextConfig} */
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
const MAIN_SERVICE_URL = process.env.MAIN_SERVICE_URL || "http://localhost:5002";

const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },

  // This is the single place the frontend connects to the two backend
  // microservices — the direct equivalent of the Vite `server.proxy` example
  // you shared. The browser only ever talks to the Next.js origin; Next.js
  // transparently forwards to whichever service owns the route. No separate
  // API/CORS layer for the browser to deal with.
  async rewrites() {
    return [
      { source: "/api/auth/:path*", destination: `${AUTH_SERVICE_URL}/api/auth/:path*` },
      { source: "/api/app/:path*", destination: `${MAIN_SERVICE_URL}/api/app/:path*` },
    ];
  },
};

module.exports = nextConfig;
