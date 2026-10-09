import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-orange-50 p-6">
      <h1 className="text-4xl font-bold text-orange-700">KaamKhoj</h1>
      <p className="text-lg text-gray-700 text-center">Bolo, aur kaam ka aadmi paao</p>

      <button
        className="w-32 h-32 rounded-full bg-orange-600 text-white text-5xl shadow-lg active:scale-95"
        aria-label="Bolne ke liye dabayein"
      >
        🎤
      </button>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link href="/search" className="rounded-2xl bg-white p-4 text-center text-xl font-semibold shadow">
          🔍 Kaam dhoondho
        </Link>
        <Link href="/login" className="rounded-2xl bg-white p-4 text-center text-xl font-semibold shadow">
          📱 Login
        </Link>
      </div>
    </main>
  );
}