import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components band: hume har baar database ka taaza data chahiye
  cacheComponents: false,

  // Tailwind (design) ko CSS files par chalane ke liye. Ise kabhi mat hatana.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;