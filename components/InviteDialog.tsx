"use client";

// Kaarigar ko seedha bulana: 1) kaunsa kaam (apne khule kaam ya naya)  2) check karo  3) "Invite bhejein"
// Server check karta hai: kaam aapka hai, khula hai, kaarigar us kaam ka hai, pehle se juda nahi.
// Invite = booking nahi. Kaarigar haan kahega, fir aap chunoge; number tabhi dikhega.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { catInfo, dayLabel, timeLabel } from "@/lib/format";

type Post = {
  id: number; category: string; work_date: string; start_time: string; hours: number; status: string; area: string;
  applicants: { worker_id: number; status: string }[];
};
export type InviteWorker = { id: number; name: string; skills: string[] };

export default function InviteDialog({ worker, onClose }: { worker: InviteWorker; onClose: () => void }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<Post | null>(null);
  const [step, setStep] = useState<"pick" | "review" | "done">("pick");
  const [sending, setSending] = useState(false);
  const lock = useRef(false);

  async function load() {
    setError("");
    try {
      const r = await fetch("/api/jobs?as=customer");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPosts((d.posts ?? []).filter((p: Post) => p.status === "open"));
    } catch (e) {
      setError((e as Error).message || "Load nahi hua");
      setPosts([]);
    }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !sending) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, sending]);

  async function send() {
    if (!picked || lock.current) return;
    lock.current = true;
    setSending(true);
    setError("");
    try {
      const r = await fetch(`/api/jobs/${picked.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite", workerId: worker.id }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Invitation nahi gaya");
      setStep("done");
      window.dispatchEvent(new Event("kk:data-changed"));
    } catch (e) {
      setError((e as Error).message || "Internet check karo, fir koshish karo");
      lock.current = false;
    } finally {
      setSending(false);
    }
  }

  // Kaam is kaarigar ke liye theek hai? (server bhi yahi check karta hai)
  function why(p: Post): string | null {
    if (!worker.skills.includes(p.category)) return `${worker.name.split(" ")[0]} ye kaam (${catInfo(p.category).label}) nahi karte`;
    const a = p.applicants.find((x) => x.worker_id === worker.id);
    if (a?.status === "invited") return "Pehle hi bulaya ja chuka hai";
    if (a) return "Ye kaarigar pehle se is kaam mein hai";
    return null;
  }

  const mainSkill = worker.skills[0] ?? "";
  const newJobHref = `/post?${new URLSearchParams({ category: mainSkill, workerId: String(worker.id), workerName: worker.name }).toString()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 md:items-center" role="dialog" aria-modal="true" aria-labelledby="inv-title">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-surface p-5 text-fg">
        <div className="flex items-start justify-between gap-3">
          <h2 id="inv-title" className="text-xl font-extrabold">
            {step === "pick" && "Kis kaam ke liye invite karna hai?"}
            {step === "review" && "Invitation check karo"}
            {step === "done" && "Invitation bhej diya"}
          </h2>
          <button onClick={onClose} disabled={sending} aria-label="Band karo" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line">✕</button>
        </div>

        {step === "pick" && (
          <>
            <p className="mt-1 text-sm text-muted">{worker.name} ko apne kisi khule kaam ke liye bulao, ya naya kaam post karo.</p>
            {posts === null && <div className="mt-3 h-20 animate-pulse rounded-2xl bg-bg" />}
            {posts !== null && posts.length === 0 && !error && (
              <p className="mt-3 rounded-xl border border-dashed border-line p-4 text-center text-muted">Aapka koi khula kaam nahi hai.</p>
            )}
            <ul className="mt-3 flex flex-col gap-2">
              {posts?.map((p) => {
                const reason = why(p);
                return (
                  <li key={p.id}>
                    <button disabled={!!reason} onClick={() => { setPicked(p); setStep("review"); }}
                      className="flex w-full items-center gap-3 rounded-2xl border-2 border-line bg-bg p-3 text-left transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-50">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Icon name={p.category as IconName} className="h-6 w-6" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{catInfo(p.category).label} · {p.area}</span>
                        <span className="block text-sm text-fg-2">{dayLabel(p.work_date)}, {timeLabel(p.start_time)} · {p.hours} ghante · Khula</span>
                        {reason && <span className="block text-xs text-warn">{reason}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link href={newJobHref} className="mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/60 p-3 font-bold text-brand">
              + Naya kaam post karo aur {worker.name.split(" ")[0]} ko bulao
            </Link>
          </>
        )}

        {step === "review" && picked && (
          <>
            <dl className="mt-3 divide-y divide-line rounded-2xl bg-bg px-3">
              <div className="flex justify-between gap-3 py-2.5"><dt className="text-muted">Kaarigar</dt><dd className="font-semibold">{worker.name}</dd></div>
              <div className="flex justify-between gap-3 py-2.5"><dt className="text-muted">Kaam</dt><dd className="font-semibold">{catInfo(picked.category).label}</dd></div>
              <div className="flex justify-between gap-3 py-2.5"><dt className="text-muted">Area</dt><dd className="font-semibold">{picked.area}</dd></div>
              <div className="flex justify-between gap-3 py-2.5"><dt className="text-muted">Kab</dt><dd className="text-right font-semibold">{dayLabel(picked.work_date)}, {timeLabel(picked.start_time)} · {picked.hours} ghante</dd></div>
            </dl>
            <p className="mt-3 flex items-start gap-2 text-sm text-muted">
              <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
              Kaarigar ko ye kaam dikhega. Wo haan kahega, fir aap chunoge. Number dono ko tabhi dikhega.
            </p>
            {error && <p role="alert" className="mt-3 rounded-xl bg-danger/15 p-3 text-sm text-red-300">{error}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => { setStep("pick"); setError(""); }} disabled={sending} className="rounded-xl border border-line p-3 font-bold">✎ Badlo</button>
              <button onClick={send} disabled={sending} className="rounded-xl bg-brand p-3 font-extrabold text-bg disabled:opacity-60">
                {sending ? "Bhej rahe hain..." : "Invite bhejein"}
              </button>
            </div>
          </>
        )}

        {step === "done" && picked && (
          <>
            <p className="mt-3 rounded-xl bg-ok/15 p-3 font-semibold text-green-300">Aapka invitation bhej diya gaya hai.</p>
            <p className="mt-2 text-sm text-muted">{worker.name} ke jawab ka haal &quot;Mera kaam&quot; mein dikhega.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={onClose} className="rounded-xl border border-line p-3 font-bold">Theek hai</button>
              <Link href={`/jobs?view=customer&job=${picked.id}`} className="rounded-xl bg-brand p-3 text-center font-extrabold text-bg">Kaam dekho</Link>
            </div>
          </>
        )}

        {step === "pick" && error && <p role="alert" className="mt-3 rounded-xl bg-danger/15 p-3 text-sm text-red-300">{error} <button onClick={load} className="underline">Dobara</button></p>}
      </div>
    </div>
  );
}
