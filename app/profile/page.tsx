"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Icon, { type IconName } from "@/components/Icon";
import { logout, useMe, type Me } from "@/lib/client";

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

  useEffect(() => {
    setMe(loaded);
    if (loaded) setName(loaded.name);
  }, [loaded]);

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

  const working = me.role !== "customer";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-bg p-4 pb-16 text-fg">
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
              <p className="flex items-center gap-1 text-muted">
                <Icon name="pin" className="h-4 w-4" /> {me.area_name ?? "Area nahi chuna"}
              </p>
              <button onClick={() => { setEditing(true); setSaved(""); }} className="mt-1 text-sm font-semibold text-brand hover:underline">
                Naam badlo
              </button>
            </>
          )}
        </div>
      </section>

      {saved && <p role="status" className="rounded-xl bg-ok/15 p-3 text-green-300">{saved}</p>}
      {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{error}</p>}

      <p className="rounded-xl border border-line bg-surface p-3 text-sm text-muted">
        Abhi aap <b className="text-fg">{working ? "Kaam chahiye" : "Kaam karwana hai"}</b> mode mein ho. Badalne ke liye Home par upar ka switch dabao.
      </p>

      {/* Mera kaam */}
      {working ? (
        <>
          <Row href="/worker" icon="users" title="Kaam ki settings" sub="Available, skills, helper, reviews" />
          <Row href="/jobs" icon="check" title="Mere kaam" sub="Jo kaam aapne liye" />
          <Row href="/open" icon="briefcase" title="Naye kaam" sub="Aapke area ke kaam" />
        </>
      ) : (
        <>
          <Row href="/jobs" icon="briefcase" title="Meri bookings" sub="Post kiye kaam aur aane wale kaarigar" />
          <Row href="/post" icon="users" title="Naya kaam post karo" sub="Kya kaam, kab, kitne ghante" />
        </>
      )}

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
