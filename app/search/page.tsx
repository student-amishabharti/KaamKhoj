"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Icon from "@/components/Icon";
import { CATEGORIES } from "@/lib/categories";
import { useMe } from "@/lib/client";
import { distLabel, ratingText } from "@/lib/format";

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
    try {
      const res = await fetch(`/api/search?category=${cat}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWorkers(data.workers);
    } catch (err) {
      setError((err as Error).message || "Load nahi hua. Internet check karo");
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }

  if (me === undefined) return <p className="p-6 text-center text-xl text-fg">Load ho raha hai...</p>;
  if (me === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-bg p-6 text-fg">
        <p className="text-xl">Pehle login karo</p>
        <Link href="/login" className="rounded-xl bg-brand px-8 py-4 text-xl font-bold text-bg">Login</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 bg-bg p-4 pb-16 text-fg">
      <TopBar title="Kaarigar dekho" />
      <p className="text-fg-2">{me.area_name} ke paas · kaunsa kaam chahiye?</p>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => search(c.id)} aria-pressed={category === c.id}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition ${
              category === c.id ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand"
            }`}>
            <Icon name={c.id} className="h-7 w-7 text-brand" />
            <span className="text-sm font-semibold">{c.label}</span>
            <span className="text-xs text-muted">{c.hi}</span>
          </button>
        ))}
      </div>

      {!category && <p className="rounded-2xl border border-dashed border-line p-5 text-center text-muted">Upar se kaam chuno, paas ke kaarigar dikhenge</p>}
      {loading && <p className="py-4 text-center text-lg text-muted">Dhoondh rahe hain...</p>}
      {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{error}</p>}
      {category && !loading && !error && workers.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line p-5 text-center text-muted">
          Is kaam ke liye abhi koi kaarigar nahi mila. Kaam post karo, naye kaarigar bhi dekh sakenge.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {workers.map((w) => (
          <li key={w.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-lg font-bold">
                  {w.name}
                  {w.is_learner && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Helper</span>}
                </p>
                {w.role === "business" && (
                  <p className="text-sm text-muted">Team: {w.team_size} log · {w.working_hours} · ₹{w.starting_price} se shuru</p>
                )}
                <p className="text-sm text-muted">{w.area}, {w.city} · {distLabel(w.distance_km)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                w.available ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
              }`}>
                {w.available ? "Available" : "Abhi nahi"}
              </span>
            </div>
            <p className="mt-2 text-fg-2">{ratingText(w.rating_avg, w.review_count)} · {w.jobs_completed} kaam poore</p>
            {w.work_note && <p className="mt-2 rounded-lg bg-bg p-2 text-fg-2">“{w.work_note}”</p>}

            {me.role === "customer" && (
              <Link
                href={`/post?category=${category}&workerId=${w.id}&workerName=${encodeURIComponent(w.name)}`}
                className="mt-3 block rounded-xl bg-brand p-3 text-center text-lg font-extrabold text-bg transition hover:brightness-110"
              >
                Isko bulao
              </Link>
            )}
          </li>
        ))}
      </ul>

      {workers.length > 0 && (
        <p className="text-sm text-muted">
          Order kaise tay hota hai: pehle Available, fir paas wale, fir rating (kam review walon ki rating 3.5 ki taraf), fir poore kaam.
          Chunna aapke haath mein hai. &quot;Isko bulao&quot; se kaam bhejte ho; kaarigar haan kahega tab booking pakki hogi.
        </p>
      )}
    </main>
  );
}
