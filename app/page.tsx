"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import HeroArt from "@/components/HeroArt";
import Icon, { type IconName } from "@/components/Icon";
import ProfileButton from "@/components/ProfileButton";
import Toggle from "@/components/Toggle";
import { CATEGORIES } from "@/lib/categories";
import { useMe, type Me } from "@/lib/client";

/* ---------------- Login se pehle: pehla page ---------------- */

const STEPS = [
  { title: "Kaam batao", text: "Bolke ya tap karke: kaunsa kaam, kab, kitne ghante." },
  { title: "Kaarigar haan kehte hain", text: "Aapke area ke kaarigar kaam dekh ke jawab dete hain." },
  { title: "Aap chuno", text: "Rating aur reviews dekh ke chuno, fir phone par baat karo." },
];

const TRUST: { icon: IconName; title: string; text: string }[] = [
  { icon: "star", title: "Asli rating", text: "Sirf poore hue kaam ke reviews se" },
  { icon: "phone", title: "Number surakshit", text: "Chunne ke baad hi dikhta hai" },
  { icon: "pin", title: "Pura pata nahi", text: "App mein sirf area aur doori" },
  { icon: "sos", title: "SOS 112", text: "Har booking par ek tap mein madad" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <Link href="/login" className="rounded-full border border-line px-5 py-2 font-semibold text-fg-2 hover:border-brand hover:text-fg">
          Login
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-4 sm:px-6 md:grid-cols-2 md:pt-10">
          <div className="order-2 md:order-1">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
              <Icon name="pin" className="h-4 w-4" /> Durg–Bhilai ke liye
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Kaam chahiye?
              <br />
              <span className="text-brand">Ya kaarigar chahiye?</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-fg-2">
              Apne area mein kaam dhoondho ya bharosemand kaarigar bulao. Bas bolo ya tap karo.
            </p>

            <div className="mt-7 grid gap-3 sm:max-w-md">
              <Link href="/login?intent=hire"
                className="group flex items-center gap-4 rounded-2xl bg-brand p-4 text-bg transition hover:brightness-110">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-bg/15">
                  <Icon name="users" className="h-7 w-7" />
                </span>
                <span className="flex-1">
                  <span className="block text-xl font-extrabold">Mujhe kaam karwana hai</span>
                  <span className="block text-sm font-medium opacity-80">Paas ke kaarigar bulao</span>
                </span>
                <Icon name="arrow" className="h-6 w-6 transition group-hover:translate-x-1" />
              </Link>

              <Link href="/login?intent=work"
                className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon name="briefcase" className="h-7 w-7" />
                </span>
                <span className="flex-1">
                  <span className="block text-xl font-extrabold">Mujhe kaam chahiye</span>
                  <span className="block text-sm text-muted">Apne area mein naye kaam paao</span>
                </span>
                <Icon name="arrow" className="h-6 w-6 text-muted transition group-hover:translate-x-1" />
              </Link>
            </div>

            <p className="mt-5 flex items-center gap-2 text-sm text-muted">
              <Icon name="mic" className="h-5 w-5 text-brand" />
              Padhna zaroori nahi. App bolke bhi chalti hai.
            </p>
          </div>

          <div className="order-1 mx-auto w-full max-w-sm md:order-2 md:max-w-lg">
            <HeroArt />
          </div>
        </section>

        {/* Kaam ke prakar */}
        <section className="border-y border-line bg-surface/60">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <h2 className="text-lg font-bold text-fg-2">Kaun-kaun se kaam</h2>
            <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {CATEGORIES.map((c) => (
                <li key={c.id} className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon name={c.id} className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-semibold">{c.label}</span>
                  <span className="text-xs text-muted">{c.hi}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Kaise kaam karta hai */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="text-2xl font-extrabold">Kaise kaam karta hai</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-lg font-extrabold text-bg">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-lg font-bold">{s.title}</span>
                  <span className="mt-1 block text-fg-2">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Bharosa */}
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold">
            <Icon name="shield" className="h-7 w-7 text-ok" /> Bharosa aur suraksha
          </h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {TRUST.map((t) => (
              <li key={t.title} className="rounded-2xl border border-line bg-surface p-4">
                <Icon name={t.icon} className={`h-6 w-6 ${t.icon === "sos" ? "text-danger" : "text-brand"}`} />
                <p className="mt-2 font-bold">{t.title}</p>
                <p className="text-sm text-muted">{t.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
          <Logo size="sm" />
          <p>Durg–Bhilai, Chhattisgarh · Demo version</p>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- Login ke baad: Home ---------------- */

function Tile({ href, icon, title, sub }: { href: string; icon: IconName; title: string; sub: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand md:flex-col md:items-start md:p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <span className="flex-1">
        <span className="block text-xl font-bold">{title}</span>
        <span className="block text-sm text-muted">{sub}</span>
      </span>
      <Icon name="arrow" className="h-5 w-5 text-muted transition group-hover:translate-x-1 md:hidden" />
    </Link>
  );
}

function Dashboard({ me }: { me: NonNullable<Me> }) {
  const [user, setUser] = useState(me);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const hiring = user.role === "customer";

  // Kaam chahiye mode mein: available hai ya nahi, server se
  useEffect(() => {
    if (hiring) return;
    fetch("/api/worker/profile").then((r) => r.json()).then((d) => setAvailable(d.profile?.available ?? null)).catch(() => {});
  }, [hiring]);

  async function patch(url: string, body: object) {
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error);
    return d;
  }

  async function switchMode(mode: "hire" | "work") {
    if ((mode === "hire") === hiring || busy) return;
    setBusy(true);
    setError("");
    try {
      const d = await patch("/api/me", { mode });
      setUser(d.user);
    } catch (err) {
      setError((err as Error).message || "Internet check karo, fir koshish karo");
    } finally {
      setBusy(false);
    }
  }

  async function setAvail(v: boolean) {
    setBusy(true);
    setError("");
    try {
      const d = await patch("/api/worker/profile", { available: v });
      setAvailable(d.profile.available);
    } catch (err) {
      setError((err as Error).message || "Save nahi hua. Internet check karo");
    } finally {
      setBusy(false);
    }
  }

  const seg = (on: boolean) =>
    `flex-1 rounded-xl px-3 py-3 text-base font-bold transition ${on ? "bg-brand text-bg" : "text-fg-2 hover:text-fg"}`;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo size="sm" />
        <ProfileButton name={user.name} />
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-16 sm:px-6">
        <div>
          <p className="text-2xl font-extrabold sm:text-3xl">{user.name.trim() ? `Namaste, ${user.name}` : "Namaste"}</p>
          <p className="flex items-center gap-1 text-muted">
            <Icon name="pin" className="h-4 w-4" /> {user.area_name ?? "Area nahi chuna"}
          </p>
        </div>

        {user.role !== "business" && (
          <div className="flex max-w-md gap-1 rounded-2xl border border-line bg-surface p-1" role="group" aria-label="Aap abhi kya karna chahte ho">
            <button disabled={busy} aria-pressed={hiring} className={seg(hiring)} onClick={() => switchMode("hire")}>
              Kaam karwana hai
            </button>
            <button disabled={busy} aria-pressed={!hiring} className={seg(!hiring)} onClick={() => switchMode("work")}>
              Kaam chahiye
            </button>
          </div>
        )}
        {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-sm text-red-300">{error}</p>}

        {!hiring && available !== null && (
          <div className="max-w-md">
            <Toggle
              label="Main aaj available hoon"
              sub={available ? "Malik aapko Available dekhenge" : "ON karo, taaki malik aapko dekh sakein"}
              checked={available}
              disabled={busy}
              onChange={setAvail}
            />
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {hiring ? (
            <>
              <Tile href="/post" icon="users" title="Kaam post karo" sub="Kaunsa kaam, kab, kitne ghante" />
              <Tile href="/jobs" icon="briefcase" title="Meri bookings" sub="Kaun aa raha hai, aage kya karna hai" />
              <Tile href="/search" icon="star" title="Kaarigar dekho" sub="Rating dekh ke seedha bulao" />
            </>
          ) : (
            <>
              <Tile href="/open" icon="briefcase" title="Naye kaam" sub="Aapke area ke kaam" />
              <Tile href="/jobs" icon="check" title="Mere kaam" sub="Jo kaam aapne liye" />
              <Tile href="/worker" icon="users" title="Kaam ki settings" sub="Skills, helper, reviews" />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  const me = useMe();
  if (me === undefined) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <Logo size="lg" />
      </div>
    );
  }
  return me ? <Dashboard me={me} /> : <Landing />;
}
