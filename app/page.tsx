export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-orange-50 p-6">
      <h1 className="text-4xl font-bold text-orange-700">KaamKhoj</h1>

      <p className="text-lg text-gray-700 text-center">
        Bolo, aur kaam ka aadmi paao
      </p>

      <button
        className="w-32 h-32 rounded-full bg-orange-600 text-white text-5xl shadow-lg active:scale-95"
        aria-label="Bolne ke liye dabayein"
      >
        🎤
      </button>

      <p className="text-sm text-gray-500">Step 1: setup ho gaya ✅</p>
    </main>
  );
}