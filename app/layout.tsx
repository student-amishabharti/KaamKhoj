import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

// Noto Sans: English/Hinglish ke liye. Noto Sans Devanagari: हिंदी ke liye.
const noto = Noto_Sans({ subsets: ["latin"], variable: "--font-noto", display: "swap" });
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-deva", display: "swap" });

export const metadata: Metadata = {
  title: "KaamKhoj – Bolo, aur kaam ka aadmi paao",
  description: "Durg–Bhilai mein paas ke kaarigar bulao, ya apne area mein kaam paao. Bas bolo ya tap karo.",
};

export const viewport: Viewport = {
  themeColor: "#101114",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi" className={`${noto.variable} ${deva.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}