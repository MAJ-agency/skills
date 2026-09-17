import type { NextConfig } from "next";

// Monorepo : les paquets partagés exposent leurs SOURCES (packages/CLAUDE.md),
// Next doit donc les transpiler comme s'ils étaient dans src/.
const paquetsPartages = ["@{{SCOPE}}/{{PROJET}}-contracts"];

const config: NextConfig = {
  transpilePackages: paquetsPartages,
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // En développement, le navigateur appelle l'API en MÊME ORIGINE (/api/*) et
  // Next relaie vers l'API : un cookie httpOnly posé par l'API sur localhost:3001
  // ne serait pas renvoyé vers localhost:3000. Hors développement, le client
  // appelle NEXT_PUBLIC_API_URL directement et le relais est absent.
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const cible = process.env.API_INTERNAL_URL ?? "http://localhost:3000";
    return [{ source: "/api/:path*", destination: `${cible}/:path*` }];
  },
};

export default config;
