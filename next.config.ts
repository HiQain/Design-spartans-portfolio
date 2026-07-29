import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const apiHostname = apiBaseUrl ? new URL(apiBaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: apiHostname
      ? [
          { protocol: "http", hostname: apiHostname },
          { protocol: "https", hostname: apiHostname },
        ]
      : [],
    // Next's image optimizer refuses to fetch any upstream URL that resolves to a
    // private/loopback IP (SSRF protection) - true whenever the API is running
    // locally (dev or a local production-mode test alike, so this can't key off
    // NODE_ENV). The real deployed API is on a public domain, so this only
    // disables optimization for local testing, never in the actual deployment.
    unoptimized: apiHostname === "localhost" || apiHostname === "127.0.0.1",
  },
};

export default nextConfig;
