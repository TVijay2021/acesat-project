/** @type {import('next').NextConfig} */
const nextConfig = {
  // The service worker is hand-written in public/sw.js. It must never be
  // cached by the CDN or a stale worker will keep serving an old shell.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
