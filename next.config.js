/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        // Applies to every route, including API routes — these are cheap,
        // broadly-applicable defenses with no functional downside for this
        // app (no third-party iframe embedding, no cross-origin framing
        // need), so there's no reason to scope them narrower.
        source: "/:path*",
        headers: [
          // Prevents this app from being embedded in a hostile iframe for
          // clickjacking — Pulse has no legitimate reason to be framed.
          { key: "X-Frame-Options", value: "DENY" },
          // Stops browsers from MIME-sniffing a response into a different
          // content type than declared, which is how some XSS payloads
          // smuggle themselves in via file upload / static asset routes.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Limits how much of this site's URL is leaked to external
          // destinations when a user clicks an outbound link.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Explicitly opts out of legacy browser features this app never
          // uses, rather than leaving the (increasingly unsafe) defaults.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
