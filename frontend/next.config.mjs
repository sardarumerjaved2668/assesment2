/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['picsum.photos', 'res.cloudinary.com', 'images.unsplash.com', 'share.google', 'localhost'],
  },
}

export default nextConfig
