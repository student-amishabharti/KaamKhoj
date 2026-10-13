"use client";

// Har tay hue kaam par: SOS (112) aur "Ghar walon ko batao"
export default function SafetyBar({ summary }: { summary: string }) {
  async function share() {
    const text = `KaamKhoj booking: ${summary}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // user ne band kar diya, WhatsApp wala raasta try karo
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <a
        href="tel:112"
        className="rounded-2xl bg-red-600 p-3 text-center text-lg font-bold text-white"
      >
        🆘 SOS 112
      </a>
      <button onClick={share} className="rounded-2xl bg-blue-600 p-3 text-lg font-bold text-white">
        📤 Ghar walon ko batao
      </button>
    </div>
  );
}
