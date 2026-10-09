"use client";

import Link from "next/link";
import { logout, useMe } from "@/lib/client";

// Bada button: icon + do line
function Tile({ href, icon, title, sub }: { href: string; icon: string; title: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow active:scale-[0.98]">
      <span className="text-5xl">{icon}</span>
      <span>
        <span className="block text-2xl font-bold text-gray-900">{title}</span>
        <span className="block text-gray-600">{sub}</span>
      </span>
    </Link>
  );
}

export default function Home() {
  const me = useMe();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-32">
      <div className="pt-6 text-center">
        <h1 className="text-4xl font-bold text-orange-700">KaamKhoj</h1>
        <p className="text-lg text-gray-700">Bolo, aur kaam ka aadmi paao</p>
      </div>

      {me === undefined && <p className="text-center text-xl">Load ho raha hai...</p>}

      {me === null && (
        <>
          <p className="rounded-3xl bg-white p-5 text-lg shadow">
            🏠 Ghar mein kaam karwana hai? Kaam post karo, paas ke kaarigar haan kahenge.
            <br />
            🛠️ Kaarigar ho? Apna kaam chuno aur roz naya kaam paao.
          </p>
          <Link href="/login" className="rounded-3xl bg-orange-600 p-5 text-center text-2xl font-bold text-white shadow">
            📱 Shuru karo (Login)
          </Link>
        </>
      )}

      {me && (
        <>
          <p className="text-center text-lg">
            Namaste, <b>{me.name}</b> · 📍 {me.area_name}
          </p>

          {me.role === "customer" ? (
            <>
              <Tile href="/post" icon="➕" title="Kaam post karo" sub="Kya kaam, kab, kitne ghante" />
              <Tile href="/jobs" icon="📋" title="Mere kaam" sub="Kaun aa raha hai, number, rating" />
              <Tile href="/search" icon="👷" title="Kaarigar dekho" sub="Jinhe kaam chahiye, unhe bulao" />
            </>
          ) : (
            <>
              <Tile href="/open" icon="🔔" title="Khule kaam" sub="Paas ke kaam, haan bolo" />
              <Tile href="/jobs" icon="📋" title="Mere kaam" sub="Kahan jaana hai, malik ka number" />
              <Tile href="/worker" icon="👤" title="Meri profile" sub="Available, skills, rating" />
            </>
          )}

          <button onClick={logout} className="mt-2 text-center text-orange-700 underline">
            Logout
          </button>
        </>
      )}
    </main>
  );
}