/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { globalNotFound: true },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "benchmarks.gabrielgreco.com" }],
        destination: "https://gabrielgreco.com/benchmarks/:path*",
        permanent: false,
      },
      { source: "/data-engineer", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
