"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { CATEGORIES } from "@/lib/categories";
import { useMe } from "@/lib/client";

type Worker = {
  id: number; name: string; role: string; area: string; city: string;
  available: boolean; work_note: string | null; is_learner: boolean;
  rating_avg: number; review_count: number; jobs_completed: number;
  distance_km: number; team_size: number | null; working_hours: string | null;
  starting_price: number | null;
};

export default function SearchPage() {
  const me = useMe();
  const [category, setCategory] = useState("");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(cat: string) {
    setCategory(cat);
    setLoading(true);
    setError("");
    const res = await fetch(`/api/search?category=${cat}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      setWorkers([]);
      return;
    }
    setWorkers(data.workers);
  }

  if (me === undefined) return <p className="p-6 text-center text-xl">Load ho raha hai...</p>;
  if (me === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6">
        <p className="text-xl">Pehle login karo</p>
        <Link href="/login" className="rounded-2xl bg-orange-600 px-8 py-4 text-2xl font-bold text-white">📱 Login</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-32">
      <TopBar title="Kaarigar dekho" />
      <p className="text-gray-700">📍 {me.area_name} ke paas · kaam chuno</p>

      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => search(c.id)}
            className={`flex flex-col items-center rounded-2xl border-2 p-2 ${
              category === c.id ? "border-orange-600 bg-orange-100" : "border-orange-200 bg-white"
            }`}>
            <span className="text-4xl">{c.icon}</span>
            <span className="text-sm font-semibold">{c.label}</span>
            <span className="text-xs text-gray-600">{c.hi}</span>
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-lg">Dhoondh rahe hain...</p>}
      {error && <p className="rounded-2xl bg-red-100 p-4 text-red-700">{error}</p>}
      {category && !loading && !error && workers.length === 0 && (
        <p className="text-center text-lg">Is kaam ke liye abhi koi nahi mila</p>
      )}

      <ul className="flex flex-col gap-3">
        {workers.map((w) => (
          <li key={w.id} className="rounded-3xl bg-white p-4 shadow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xl font-bold">{w.name}</p>
                {w.is_learner && <span className="rounded-full bg-blue-100 px-2 text-sm text-blue-800">🎓 Seekhne wala (helper)</span>}
                {w.role === "business" && (
                  <p className="text-sm text-gray-600">
                    🏢 Team: {w.team_size} log · {w.working_hours} · ₹{w.starting_price} se shuru
                  </p>
                )}
                <p className="text-gray-600">📍 {w.area}, {w.city} · {w.distance_km} km</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                w.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {w.available ? "🟢 Available" : "🔴 Abhi nahi"}
              </span>
            </div>
            <p className="mt-2 text-lg">
              ⭐ {w.rating_avg} ({w.review_count} reviews) · 🧰 {w.jobs_completed} kaam
            </p>
            {w.work_note && <p className="mt-1 rounded-xl bg-orange-50 p-2">💬 “{w.work_note}”</p>}

            {me.role === "customer" && (
              <Link
                href={`/post?category=${category}&workerId=${w.id}&workerName=${encodeURIComponent(w.name)}`}
                className="mt-3 block rounded-2xl bg-orange-600 p-3 text-center text-xl font-bold text-white"
              >
                📨 Isko bulao
              </Link>
            )}
          </li>
        ))}
      </ul>

      {workers.length > 0 && (
        <p className="text-sm text-gray-500">
          Order ka formula: 40% available, 30% paas hona, 20% rating, 10% poore kaam.
          Chunna aapke haath mein hai.
        </p>
      )}
    </main>
  );
}