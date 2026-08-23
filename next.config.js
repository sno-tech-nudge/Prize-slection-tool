/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // default server action body limit is 1MB — too small for a rubric/guidelines PDF upload
  // (settings/view). Kept just under typical serverless request-body ceilings.
  experimental: { serverActions: { bodySizeLimit: '4.5mb' } },
};

module.exports = nextConfig;
