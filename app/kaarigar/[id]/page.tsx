"use client";

// Kaarigar ki profile: sirf sabko dikhne wali jaankari + asli reviews. Number / pata kabhi nahi.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Icon, { type IconName } from "@/components/Icon";
import InviteDialog from "@/components/InviteDialog";
import { catInfo, ratingText } from "@/lib/format";

type Worker = {
  id: number; name: string; role: string; area: string | null; city: string | null; skills: string[];
  available: boolean; work_note: string | null; is_learner: boolean;
  business_name: string | null; team_size: number | null; working_hours: string | null; service_areas: string | null;
  rating_avg: number; review_count: number; jobs_completed: number; joined: string;
  reviews: { stars: number; comment: string | null; date: string; category: string }[];
  self: boolean;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [w, setW] = useState<Worker | null>(null);
  const [canInvite, setCanInvite] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState(false);

  async function load() {
    setState("loading");
    try {
      const r = await fetch(`/api/workers/${id}`);
      const d = await r.json().catch(() => ({}));
      if (r.status === 404 || r.status === 400) { setState("missing"); return; }
      if (!r.ok) throw new Error(d.error);
      setW(d.worker);
      setCanInvite(d.canInvite);
      setLoggedIn(d.loggedIn);
      setState("ok");
      // Login ke baad "?invite=1" ke saath wapas aaye to seedha invite kholo
      if (d.canInvite && new URLSearchParams(window.location.search).get("invite") === "1") setInviting(true);
    } catch (e) {
      setError((e as Error).message || "Load nahi hua");
      setState("error");
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const back = (
    <Link href="/explore?tab=workers" className="inline-flex items-center gap-1 text-sm font-bold text-brand">
      <Icon name="back" className="h-4 w-4" /> Kaarigar search par wapas
    </Link>
  );

  if (state === "loading") {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 bg-bg p-4 text-fg">
        <TopBar title="Kaarigar ki profile" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface" />
        <div className="h-28 animate-pulse rounded-2xl bg-surface" />
      </main>
    );
  }
  if (state !== "ok" || !w) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 bg-bg p-4 text-fg">
        <TopBar title="Kaarigar ki profile" />
        {back}
        <div className="rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="text-lg font-bold">{state === "missing" ? "Ye kaarigar nahi mila" : "Load nahi hua"}</p>
          {state === "error" && <><p className="mt-1 text-muted">{error}</p><button onClick={load} className="mt-3 rounded-xl border border-line px-4 py-2 font-bold text-brand">Dobara koshish</button></>}
        </div>
      </main>
    );
  }

  const [y, m] = w.joined.split("-").map(Number);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-bg p-4 pb-44 text-fg md:pb-28">
      <TopBar title="Kaarigar ki profile" />
      {back}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-soft text-3xl font-extrabold text-brand">
            {w.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold leading-tight">{w.name}</h1>
            {w.business_name && w.business_name !== w.name && <p className="text-fg-2">{w.business_name}</p>}
            <p className="inline-flex items-center gap-1 text-muted"><Icon name="pin" className="h-4 w-4" />{w.area ?? "Area nahi diya"}{w.city ? `, ${w.city}` : ""}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
              <span className={`rounded-full px-2.5 py-1 ${w.available ? "bg-ok/15 text-green-300" : "bg-surface-2 text-muted"}`}>{w.available ? "Available" : "Abhi Available nahi"}</span>
              {w.is_learner && <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-blue-300">Helper / seekh raha hai</span>}
              {w.role === "business" && <span className="rounded-full bg-surface-2 px-2.5 py-1 text-fg-2">Team{w.team_size ? `: ${w.team_size} log` : ""}</span>}
            </div>
          </div>
        </div>

        <h2 className="mt-4 text-sm font-bold uppercase tracking-wide text-muted">Kaam (skills)</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {w.skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-bg px-3 py-2 text-sm font-semibold">
              <Icon name={s as IconName} className="h-5 w-5 text-brand" />{catInfo(s).label} <span className="text-muted">{catInfo(s).hi}</span>
            </span>
          ))}
        </div>

        {w.work_note && (
          <>
            <h2 className="mt-4 text-sm font-bold uppercase tracking-wide text-muted">Kaarigar ne likha</h2>
            <p className="mt-1 rounded-xl bg-bg p-3 text-fg-2">“{w.work_note}”</p>
          </>
        )}
        {w.working_hours && <p className="mt-3 text-sm text-fg-2">Kaam ka samay: {w.working_hours}</p>}
        {w.service_areas && <p className="text-sm text-fg-2">Kin areas mein: {w.service_areas}</p>}
        <p className="mt-3 text-xs text-muted">KaamKhoj par {MONTHS[(m || 1) - 1]} {y} se. Ye jaankari kaarigar ne khud di hai.</p>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Rating aur kaam (asli bookings se)</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-bg p-3">
            <p className="text-2xl font-extrabold">{w.review_count ? `★ ${Number(w.rating_avg).toFixed(1)}` : "—"}</p>
            <p className="text-xs text-muted">{ratingText(w.rating_avg, w.review_count)}</p>
          </div>
          <div className="rounded-xl bg-bg p-3">
            <p className="text-2xl font-extrabold">{w.jobs_completed}</p>
            <p className="text-xs text-muted">KaamKhoj par poore kiye kaam</p>
          </div>
        </div>
        <h3 className="mt-4 font-bold">Grahakon ki raay</h3>
        {w.reviews.length === 0 ? (
          <p className="mt-1 text-sm text-muted">Abhi koi review nahi.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {w.reviews.map((r, i) => (
              <li key={i} className="rounded-xl bg-bg p-3">
                <p className="text-sm"><span className="text-brand">{"★".repeat(r.stars)}</span><span className="text-muted">{"★".repeat(5 - r.stars)}</span> · {catInfo(r.category).label} · <span className="text-muted">{r.date}</span></p>
                {r.comment && <p className="mt-1 text-fg-2">“{r.comment}”</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 text-sm text-muted">
        <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
        Number aur pata yahan nahi dikhte. Aap kaarigar ko chunoge tab hi dono ko number milega. Daam phone par tay hoga.
      </p>

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+64px)] z-20 border-t border-line bg-bg/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-2xl">
          {w.self ? (
            <Link href="/worker" className="block rounded-xl border border-line p-4 text-center font-bold">Ye aapki profile hai: Kaam ki settings badlo</Link>
          ) : canInvite ? (
            <button onClick={() => setInviting(true)} className="w-full rounded-xl bg-brand p-4 text-lg font-extrabold text-bg hover:brightness-110">
              Kaam ke liye invite karein
            </button>
          ) : !loggedIn ? (
            <Link href={`/login?intent=hire&next=${encodeURIComponent(`/kaarigar/${w.id}?invite=1`)}`} className="block rounded-xl bg-brand p-4 text-center text-lg font-extrabold text-bg">
              Login karke invite karein
            </Link>
          ) : null}
        </div>
      </div>

      {inviting && <InviteDialog worker={{ id: w.id, name: w.name, skills: w.skills }} onClose={() => setInviting(false)} />}
    </main>
  );
}
