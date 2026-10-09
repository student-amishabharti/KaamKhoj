import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KaamKhoj",
  description: "Bolo, aur kaam ka aadmi paao",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi">
      <body className="antialiased">{children}</body>
    </html>
  );
}