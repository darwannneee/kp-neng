/** @type {import('next').NextConfig} */
const nextConfig = {

  reactStrictMode: true, // or any other existing configurations you have
  images: {
    domains: ['www.stories.com', 'sdmntprwestus.oaiusercontent.com', 'sdmntpreastus2.oaiusercontent.com', 'rvfvqtugsptkfkmdfhnv.supabase.co'], // add new domain here
  },
};

module.exports = nextConfig;