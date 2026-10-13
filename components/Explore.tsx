"use client";

// Explore: ek hi jagah do tab. "Kaam dekho" (kaarigar ke liye) aur "Kaarigar dekho" (kaam karwane wale ke liye).
// Ek hi account dono kar sakta hai; aakhri chuna tab yaad rehta hai.
import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Icon from "@/components/Icon";
import JobsBrowse from "@/components/JobsBrowse";
import WorkersBrowse from "@/components/WorkersBrowse";
import { useMe } from "@/lib/client";

type Tab = "jobs" | "workers";
const TKEY = "kk_explore_tab";

export default function Explore({ initial }: { initial?: Tab }) {
  const me = useMe();
  const [tab, setTab] = useState<Tab | null>(initial ?? null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    if (q === "jobs" || q === "workers") { setTab(q); return; }
    if (initial) return;
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(TKEY); } catch { /* */ }
    setTab(saved === "jobs" || saved === "workers" ? saved : null);
  }, [initial]);

  // Voice se "kaarigar dekho" / "naye kaam dikhao" isi page par bola
  useEffect(() => {
    const on = (e: Event) => {
      const url = String((e as CustomEvent).detail ?? "");
      const t = new URLSearchParams(url.split("?")[1] ?? "").get("tab");
      if (url.startsWith("/explore") && (t === "jobs" || t === "workers")) setTab(t);
    };
    window.addEventListener("kk:voice-nav", on);
    return () => window.removeEventListener("kk:voice-nav", on);
  }, []);

  // Tab na chuna ho to user ke abhi ke mode se
  useEffect(() => {
    if (tab || !me) return;
    setTab(me.role === "customer" ? "workers" : "jobs");
  }, [tab, me]);

  function choose(t: Tab) {
    setTab(t);
    try { sessionStorage.setItem(TKEY, t); } catch { /* */ }
    window.history.replaceState(null, "", `/explore?tab=${t}`);
  }

  if (me === undefined) return <p className="p-6 text-center text-xl text-fg">Load ho raha hai...</p>;
  if (me === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-bg p-6 text-fg">
        <p className="text-xl">Pehle login karo</p>
        <Link href="/login?next=/explore" className="rounded-xl bg-brand px-8 py-4 text-xl font-bold text-bg">Login</Link>
      </main>
    );
  }

  const tabBtn = (t: Tab, label: string, icon: "briefcase" | "users") => (
    <button role="tab" aria-selected={tab === t} onClick={() => choose(t)}
      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-base font-extrabold transition ${
        tab === t ? "bg-brand text-bg" : "text-fg-2 hover:bg-surface-2"
      }`}>
      <Icon name={icon} className="h-5 w-5" />{label}
    </button>
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-bg p-4 pb-28 text-fg">
      <TopBar title="Explore" />
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
        {tabBtn("jobs", "Kaam dekho", "briefcase")}
        {tabBtn("workers", "Kaarigar dekho", "users")}
      </div>
      {tab === "jobs" && <JobsBrowse />}
      {tab === "workers" && <WorkersBrowse myAreaId={me.area_id} canInvite={me.role !== "business"} meId={me.id} />}
    </main>
  );
}
