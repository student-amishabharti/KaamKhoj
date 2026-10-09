"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { postJson, useMe } from "@/lib/client";
import { catInfo, dayLabel, timeLabel } from "@/lib/format";

type OpenJob = {
  id: number; category: string; work_date: string; start_time: string; hours: number; note: string | null;
  area: string; city: string; customer_name: string; distance_km: number;
  my_status: string | null; interested: number;
};

export default function OpenJobsPage() {
  const me = useMe();
  const [jobs, setJobs] = useState<OpenJob[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/jobs?scope=open");
    const d = await res.json();
    if (!res.ok) setError(d.error);
    else setJobs(d.jobs);
  }, []);

  useEffect(() => {
    if (me && me.role !== "customer") load();
  }, [me, load]);

  async function apply(id: number) {
    setError("");
    setBusy(true);
    try {
      await postJson(`/api/jobs/${id}`, { action: "apply" });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (me === undefined) return <p className="p-6 text-center text-xl">Load ho raha hai...</p>;
  if (!me || me.role === "customer") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-xl">Khule kaam sirf kaarigar ke liye hain</p>
        <Link href="/" className="rounded-2xl bg-orange-600 px-8 py-4 text-2xl font-bold text-white">🏠 Home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-32">
      <TopBar title="Khule kaam" />
      <p className="text-gray-700">Aapki skill ke kaam, paas wale pehle. Jo theek lage, haan bolo.</p>
      {error && <p className="rounded-2xl bg-red-100 p-4 text-lg text-red-700">{error}</p>}
      {jobs === null && !error && <p className="text-center text-xl">Load ho raha hai...</p>}
      {jobs?.length === 0 && (
        <p className="rounded-2xl bg-white p-4 text-center text-lg shadow">
          Abhi koi khula kaam nahi. Profile mein skills check karo, ya thodi der baad dekho.
        </p>
      )}

      {jobs?.map((j) => {
        const c = catInfo(j.category);
        return (
          <section key={j.id} className="rounded-3xl bg-white p-4 shadow">
            <p className="text-xl font-bold">{c.icon} {c.label} · {j.hours} ghante</p>
            <p className="text-lg">🗓️ {dayLabel(j.work_date)}, {timeLabel(j.start_time)}</p>
            <p className="text-gray-700">📍 {j.area}, {j.city} · <b>{j.distance_km} km</b></p>
            <p className="text-gray-700">🙂 {j.customer_name}</p>
            {j.note && <p className="mt-1 text-gray-800">📝 {j.note}</p>}
            {j.interested > 0 && <p className="text-sm text-gray-500">{j.interested} kaarigar ne haan kaha hai</p>}

            {!j.my_status || j.my_status === "withdrawn" ? (
              <button disabled={busy} onClick={() => apply(j.id)}
                className="mt-3 w-full rounded-2xl bg-orange-600 p-4 text-2xl font-bold text-white">
                🙋 Main aaunga
              </button>
            ) : (
              <p className="mt-3 rounded-2xl bg-yellow-50 p-3 text-lg">
                {j.my_status === "applied" ? "⏳ Aapne haan kaha. Malik ke jawab ka intezaar." : "📋 Ye kaam 'Mere kaam' mein hai"}
              </p>
            )}
          </section>
        );
      })}
    </main>
  );
}