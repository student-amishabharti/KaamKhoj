import Link from "next/link";

// Har screen ke upar: Home button + screen ka naam
export default function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-1 flex items-center gap-3 bg-orange-50/95 px-4 py-3 backdrop-blur">
      <Link href="/" aria-label="Home" className="rounded-full bg-white px-4 py-2 text-xl shadow">
        🏠
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    </header>
  );
}