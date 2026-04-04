/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    // Explicitly disabling these if not used can silence the "Plugin transform skipped" warning
    // which occurs when Next.js detects potential usage but the SWC plugin version mismatches.
    styledComponents: false,
    emotion: false,
  },
};

export default nextConfig;
