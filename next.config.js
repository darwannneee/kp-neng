/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co'], // Add your Supabase storage domain here
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Maximum limit - though on Vercel, function limits will still apply
    },
    responseLimit: false, // No limit on response size
  },
  eslint: {
    // Warning instead of error during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Exclude /product/id from build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = nextConfig