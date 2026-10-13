import type { MetadataRoute } from "next";

// PWA: phone par "Add to Home screen" se app jaisa khulega
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KaamKhoj – Bolo, aur kaam ka aadmi paao",
    short_name: "KaamKhoj",
    description: "Durg–Bhilai mein paas ke kaarigar bulao, ya kaam paao. Bolkar ya tap karke.",
    start_url: "/",
    display: "standalone",
    background_color: "#101114",
    theme_color: "#101114",
    lang: "hi",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
