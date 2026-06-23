/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.*.*'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
