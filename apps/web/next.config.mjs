// Markdown files import as plain text (used for crew/kumo.md, Kumo's versioned review prompt).
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({ test: /\.md$/, type: "asset/source" });
    return config;
  },
};

export default nextConfig;
