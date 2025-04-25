/** @type {import('next').NextConfig} */
const nextConfig = {

  reactStrictMode: true, // or any other existing configurations you have
  images: {
    domains: ['www.stories.com'], // add new domain here
  },
};

module.exports = nextConfig;