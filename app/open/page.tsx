"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Icon from "@/components/Icon";
import { postJson, useMe } from "@/lib/client";
import { catInfo, dayLabel, distLabel, timeLabel } from "@/lib/format";

type OpenJob = {
  id: number; category: string; work_date: string; start_time: string; hours: number; note: string | null;
  area: string; city: string; customer_name: string; distance_km: number;
  my_status: string | null; interested: number;
};

// Kaarigar ka jawab de chuka ho to button ki jagah ye sandesh
const MY_STATUS: Record<string, string> = {
  applied: "Aapne haan kaha. Malik ke jawab ka intezaar.",
  invited: "Malik ne aapko bulaya hai. 'Mere kaam' mein jawab do.",
  selected: "Aap chune gaye ho. 'Mere kaam' mein malik ka number hai.",
  rejected: "Malik ne is kaam ke liye kisi aur ko chuna.",
};

export default function OpenJobsPage() {
  const me = useMe();
  const [jobs, setJobs] = useState<OpenJob[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const sending = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs?scope=open");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setJobs(d.jobs);
      setError("");
    } catch (err) {
      setError((err as Error).message || "Kaam load nahi hue. Internet check karo");
    }
  }, []);

  useEffect(() => {
    if (me && me.role !== "customer") load();
  }, [me, load]);

  async function apply(id: number) {
    if (sending.current) return;
    sending.current = true;
    setBusyId(id);
    setError("");
    try {
      await postJson(`/api/jobs/${id}`, { action: "apply" });
      await load();
    } catch (err) {
      setError((err as Error).message);
      await load();
    } finally {
      sending.current = false;
      setBusyId(null);
    }
  }

  if (me === undefined) return <p className="p-6 text-center text-xl text-fg">Load ho raha hai...</p>;
  if (!me || me.role === "customer") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-bg p-6 text-center text-fg">
        <p className="text-xl">Naye kaam dekhne ke liye Home par &quot;Kaam chahiye&quot; chuno</p>
        <Link href="/" className="rounded-xl bg-brand px-8 py-4 text-xl font-bold text-bg">Home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 bg-bg p-4 pb-16 text-fg">
      <TopBar title="Naye kaam" />
      <p className="text-fg-2">Aapke kaam (skill) ke khule kaam, paas wale pehle.</p>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-danger/15 p-3 text-red-300">
          <span>{error}</span>
          <button onClick={load} className="shrink-0 rounded-lg border border-red-300/40 px-3 py-1 text-sm font-bold">Dobara</button>
        </div>
      )}
      {jobs === null && !error && <p className="py-6 text-center text-lg text-muted">Kaam dhoondh rahe hain...</p>}
      {jobs?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="text-lg font-bold">Abhi koi naya kaam nahi</p>
          <p className="mt-1 text-muted">Profile mein apne kaam (skills) check karo, ya thodi der baad dekho.</p>
          <Link href="/worker" className="mt-3 inline-block rounded-xl border border-line px-4 py-2 font-bold text-brand">Kaam ki settings</Link>
        </div>
      )}

      {jobs?.map((j) => {
        const c = catInfo(j.category);
        const canApply = !j.my_status || j.my_status === "withdrawn";
        return (
          <article key={j.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon name={j.category as "painter"} className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">{c.label} · {j.hours} ghante</p>
                <p className="text-fg-2">{dayLabel(j.work_date)}, {timeLabel(j.start_time)}</p>
                <p className="text-sm text-muted">{j.area}, {j.city} · {distLabel(j.distance_km)} · {j.customer_name}</p>
              </div>
            </div>
            {j.note && <p className="mt-2 rounded-lg bg-bg p-2 text-fg-2">{j.note}</p>}
            {j.interested > 0 && <p className="mt-2 text-sm text-muted">{j.interested} kaarigar ne haan kaha hai</p>}

            {canApply ? (
              <button disabled={busyId !== null} onClick={() => apply(j.id)}
                className="mt-3 w-full rounded-xl bg-brand py-3 text-lg font-extrabold text-bg transition hover:brightness-110 disabled:opacity-50">
                {busyId === j.id ? "Bhej rahe hain..." : "Main aaunga"}
              </button>
            ) : (
              <p className="mt-3 rounded-xl bg-bg p-3 text-fg-2">{MY_STATUS[j.my_status!] ?? "Ye kaam 'Mere kaam' mein hai"}</p>
            )}
          </article>
        );
      })}
    </main>
  );
}
