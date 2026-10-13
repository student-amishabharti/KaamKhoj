"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Icon, { type IconName } from "@/components/Icon";
import Toggle from "@/components/Toggle";
import { forgetMe, logout, useMe, type Me } from "@/lib/client";
import { catInfo } from "@/lib/format";

type Area = { id: number; name: string; city: string };
type WorkerInfo = { skills: string[]; available: boolean };

function Row({ href, icon, title, sub }: { href: string; icon: IconName; title: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <span className="flex-1">
        <span className="block text-lg font-bold">{title}</span>
        <span className="block text-sm text-muted">{sub}</span>
      </span>
      <Icon name="arrow" className="h-5 w-5 text-muted" />
    </Link>
  );
}

export default function ProfilePage() {
  const loaded = useMe();
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [worker, setWorker] = useState<WorkerInfo | null>(null);

  useEffect(() => {
    setMe(loaded);
    if (loaded) setName(loaded.name);
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    fetch("/api/areas").then((r) => r.json()).then((d) => setAreas(d.areas ?? [])).catch(() => {});
    fetch("/api/worker/profile").then((r) => r.json())
      .then((d) => d.profile && setWorker({ skills: d.profile.skills ?? [], available: d.profile.available }))
      .catch(() => {});
  }, [loaded]);

  async function patch(url: string, body: object, ok: string) {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      if (d.user) { setMe(d.user); forgetMe(d.user); }
      if (d.profile) setWorker({ skills: d.profile.skills ?? [], available: d.profile.available });
      setSaved(ok);
    } catch (err) {
      setError((err as Error).message || "Internet check karo, fir koshish karo");
    } finally {
      setBusy(false);
    }
  }

  async function saveName() {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMe(d.user);
      forgetMe(d.user);
      setEditing(false);
      setSaved("Naam save ho gaya");
    } catch (err) {
      setError((err as Error).message || "Internet check karo, fir koshish karo");
    } finally {
      setBusy(false);
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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-bg p-4 pb-28 text-fg">
      <TopBar title="Meri profile" />

      {/* Meri jaankari */}
      <section className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-soft text-3xl font-extrabold text-brand">
          {me.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-semibold text-fg-2">Aapka naam</label>
              <input id="name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border-2 border-line bg-bg px-3 py-2 text-lg text-fg outline-none focus:border-brand" />
              <div className="flex gap-2">
                <button disabled={busy} onClick={saveName} className="rounded-xl bg-brand px-4 py-2 font-bold text-bg disabled:opacity-50">
                  {busy ? "Save ho raha..." : "Save karo"}
                </button>
                <button disabled={busy} onClick={() => { setEditing(false); setName(me.name); setError(""); }}
                  className="rounded-xl border border-line px-4 py-2 font-semibold text-fg-2">
                  Rehne do
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="truncate text-2xl font-extrabold">{me.name || "Naam nahi diya"}</p>
              <p className="text-fg-2">+91 {me.phone}</p>
              <label className="mt-1 flex items-center gap-2 text-muted">
                <Icon name="pin" className="h-4 w-4" />
                <span className="sr-only">Mera area</span>
                <select value={me.area_id ?? ""} disabled={busy}
                  onChange={(e) => patch("/api/me", { areaId: Number(e.target.value) }, "Area badal gaya")}
                  className="rounded-lg border border-line bg-bg px-2 py-1 text-sm text-fg">
                  {!me.area_id && <option value="">Area chuno</option>}
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}, {a.city}</option>)}
                </select>
              </label>
              <button onClick={() => { setEditing(true); setSaved(""); }} className="mt-1 text-sm font-semibold text-brand hover:underline">
                Naam badlo
              </button>
            </>
          )}
        </div>
      </section>

      {saved && <p role="status" className="rounded-xl bg-ok/15 p-3 text-green-300">{saved}</p>}
      {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{error}</p>}

      {/* Kaarigar wala hissa: har account mein (ek account dono kaam kar sakta hai) */}
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-lg font-extrabold">Kaarigar ke roop mein</h2>
        {worker ? (
          <>
            <Toggle label={worker.available ? "Main Available hoon" : "Abhi Available nahi"}
              sub="ON ho to malik aapko dhoondh kar bula sakte hain"
              checked={worker.available} disabled={busy}
              onChange={(v) => patch("/api/worker/profile", { available: v }, v ? "Ab aap Available ho" : "Available band")} />
            <p className="text-sm text-fg-2">
              Mere kaam: {worker.skills.length ? worker.skills.map((k) => catInfo(k).label).join(", ") : <span className="text-muted">abhi nahi chune</span>}
            </p>
          </>
        ) : <p className="text-sm text-muted">Load ho raha hai...</p>}
        <Row href="/worker" icon="users" title="Kaam ki settings" sub="Skills, helper, kaam chahiye sandesh, reviews" />
      </section>

      <Row href="/jobs" icon="briefcase" title="Mera kaam" sub="Meri bookings aur jin kaamon par maine haan kaha" />
      <Row href="/activity" icon="mic" title="AI activity" sub="Aapne kya bola, AI ne kya kiya" />
      <Row href="/eval" icon="check" title="AI evaluation" sub="AI kitna sahi hai: test aur number" />

      <p className="flex items-start gap-2 px-1 text-sm text-muted">
        <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
        Aapka number sirf usi ko dikhta hai jise aap kaam ke liye chuno, ya jo aapko chune.
      </p>

      <button onClick={logout} className="mt-2 rounded-2xl border border-danger/50 p-4 text-lg font-bold text-red-300 hover:bg-danger/10">
        Logout
      </button>
    </main>
  );
}
