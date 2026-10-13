"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import HeroArt from "@/components/HeroArt";
import Icon, { type IconName } from "@/components/Icon";
import ProfileButton from "@/components/ProfileButton";
import Toggle from "@/components/Toggle";
import { CATEGORIES } from "@/lib/categories";
import { forgetMe, useMe, type Me } from "@/lib/client";

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

type Summary = { responses: number; open: number; booked: number; sent: number; selected: number; invited: number };

// Asli data se chhota haal-chaal (kuch bhi banaya hua nahi)
function useSummary() {
  const [s, setS] = useState<Summary | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [c, w] = await Promise.all([
          fetch("/api/jobs?as=customer").then((r) => r.json()),
          fetch("/api/jobs?as=worker").then((r) => r.json()),
        ]);
        type P = { status: string; applicants: { status: string }[] };
        type J = { job_status: string; my_status: string };
        const posts: P[] = c.posts ?? [];
        const jobs: J[] = w.jobs ?? [];
        const live = (x: string) => x === "open" || x === "assigned";
        if (!alive) return;
        setS({
          responses: posts.filter((p) => p.status === "open" && p.applicants.some((a) => a.status === "applied")).length,
          open: posts.filter((p) => p.status === "open").length,
          booked: posts.filter((p) => p.status === "assigned").length,
          sent: jobs.filter((j) => live(j.job_status) && j.my_status === "applied").length,
          invited: jobs.filter((j) => live(j.job_status) && j.my_status === "invited").length,
          selected: jobs.filter((j) => j.job_status === "assigned" && j.my_status === "selected").length,
        });
      } catch { /* haal-chaal na mile to bhi Home chale */ }
    };
    load();
    window.addEventListener("kk:data-changed", load);
    return () => { alive = false; window.removeEventListener("kk:data-changed", load); };
  }, []);
  return s;
}

function Stat({ href, n, label, tone }: { href: string; n: number; label: string; tone: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-brand">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg font-extrabold ${tone}`}>{n}</span>
      <span className="text-sm font-semibold text-fg-2">{label}</span>
    </Link>
  );
}

function Dashboard({ me }: { me: NonNullable<Me> }) {
  const [user, setUser] = useState(me);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const summary = useSummary();
  const business = user.role === "business";

  // Voice assistant ne mode badla to yahan bhi
  useEffect(() => {
    const on = (e: Event) => { const u = (e as CustomEvent).detail; if (u) setUser((p) => ({ ...p, ...u })); };
    window.addEventListener("kk:mode-changed", on);
    return () => window.removeEventListener("kk:mode-changed", on);
  }, []);

  useEffect(() => {
    const load = () =>
      fetch("/api/worker/profile").then((r) => r.json()).then((d) => setAvailable(d.profile?.available ?? null)).catch(() => {});
    load();
    window.addEventListener("kk:data-changed", load);
    return () => window.removeEventListener("kk:data-changed", load);
  }, []);

  // Aakhri iraada yaad rakho (AI assistant isi se samajhta hai "kaam chahiye" ka matlab). Rok-tok nahi hai.
  function remember(mode: "hire" | "work") {
    if (business) return;
    if ((mode === "hire") === (user.role === "customer")) return;
    fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) })
      .then((r) => r.json()).then((d) => { if (d.user) { setUser(d.user); forgetMe(d.user); } }).catch(() => {});
  }

  async function setAvail(v: boolean) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/worker/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ available: v }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setAvailable(d.profile.available);
    } catch (err) {
      setError((err as Error).message || "Save nahi hua. Internet check karo");
    } finally {
      setBusy(false);
    }
  }

  const big = "flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-extrabold transition";
  const stats = summary
    ? [
        summary.responses > 0 && <Stat key="r" href="/jobs?view=customer" n={summary.responses} label="Kaam par kaarigaron ne haan kaha" tone="bg-brand-soft text-brand" />,
        summary.booked > 0 && <Stat key="b" href="/jobs?view=customer" n={summary.booked} label="Pakki booking" tone="bg-ok/15 text-green-300" />,
        summary.open - summary.responses > 0 && <Stat key="o" href="/jobs?view=customer" n={summary.open - summary.responses} label="Kaam jawab ke intezaar mein" tone="bg-surface-2 text-fg" />,
        summary.invited > 0 && <Stat key="i" href="/jobs?view=worker" n={summary.invited} label="Malik ne aapko bulaya" tone="bg-brand-soft text-brand" />,
        summary.selected > 0 && <Stat key="s" href="/jobs?view=worker" n={summary.selected} label="Aap chune gaye" tone="bg-ok/15 text-green-300" />,
        summary.sent > 0 && <Stat key="t" href="/jobs?view=worker" n={summary.sent} label="Request bheji, jawab ka intezaar" tone="bg-surface-2 text-fg" />,
      ].filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="md:invisible"><Logo size="sm" /></span>
        <ProfileButton name={user.name} />
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 pb-28 sm:px-6">
        <div>
          <p className="text-muted">{user.name.trim() ? `Namaste, ${user.name}` : "Namaste"} · <Icon name="pin" className="inline h-4 w-4" /> {user.area_name ?? "Area nahi chuna"}</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Aaj kya karna hai?</h1>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {!business && (
            <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon name="users" className="h-7 w-7" /></span>
                <div>
                  <h2 className="text-xl font-extrabold">Mujhe kaarigar chahiye</h2>
                  <p className="text-sm text-muted">Bijli, nal, paint, badhai, chinai, safai</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/post" onClick={() => remember("hire")} className={`${big} bg-brand text-bg hover:brightness-110`}>Kaam post karo</Link>
                <Link href="/explore?tab=workers" onClick={() => remember("hire")} className={`${big} border border-line hover:border-brand`}>Kaarigar dekho</Link>
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon name="briefcase" className="h-7 w-7" /></span>
              <div>
                <h2 className="text-xl font-extrabold">Mujhe kaam chahiye</h2>
                <p className="text-sm text-muted">Paas ke kaam dekho, &quot;Main aaunga&quot; bolo</p>
              </div>
            </div>
            <Link href="/explore?tab=jobs" onClick={() => remember("work")} className={`${big} bg-brand text-bg hover:brightness-110`}>Kaam dekho</Link>
            {available !== null && (
              <Toggle label={available ? "Main Available hoon" : "Abhi Available nahi"}
                sub={available ? "Malik aapko dhoondh kar bula sakte hain" : "ON karo taaki malik aapko dekh sakein"}
                checked={available} disabled={busy} onChange={setAvail} />
            )}
          </section>
        </div>
        {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-sm text-red-300">{error}</p>}

        {stats.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Aapka haal</h2>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">{stats}</div>
          </section>
        )}

        <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
          <Icon name="mic" className="mt-0.5 h-6 w-6 shrink-0 text-brand" />
          <p className="text-fg-2">
            <b className="text-fg">Mic</b> dabakar bolo (phone par neeche beech mein, computer par baayein menu mein), jaise &quot;kal subah 10 baje plumber chahiye&quot; ya &quot;naye kaam dikhao&quot;.
            AI form bharega ya page kholega; aakhri button aap dabaoge.
          </p>
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
