"use client";

// Kaam ki poori jaankari (kaarigar ke liye) + "Main aaunga".
// Request tabhi "bhej di gayi" dikhti hai jab server haan kahe. Number sirf chune jaane ke baad.
import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import Icon, { type IconName } from "@/components/Icon";
import { MY_STATUS } from "@/components/JobsBrowse";
import { catInfo, dayLabel, distLabel, timeLabel } from "@/lib/format";

type Job = {
  id: number; category: string; work_date: string; start_time: string; hours: number; note: string | null;
  status: "open" | "assigned" | "completed" | "cancelled"; area: string; city: string; customer_name: string;
  distance_km: number | null; my_status: string | null; customer_phone: string | null;
  interested: number; customer_posts: number; mine: boolean;
};

const JOB_STATE: Record<Job["status"], string> = {
  open: "Kaam khula hai",
  assigned: "Kaarigar chun liya gaya",
  completed: "Kaam poora ho gaya",
  cancelled: "Malik ne kaam cancel kiya",
};

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "login" | "missing" | "error">("loading");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/jobs/${id}`);
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) { setState("login"); return; }
      if (r.status === 404 || r.status === 400) { setState("missing"); setError(d.error ?? ""); return; }
      if (!r.ok) throw new Error(d.error);
      setJob(d.job);
      setState("ok");
    } catch (e) {
      setError((e as Error).message || "Load nahi hua. Internet check karo");
      setState("error");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Login nahi: login ke baad isi kaam par wapas
  useEffect(() => {
    if (state === "login") router.replace(`/login?intent=work&next=${encodeURIComponent(`/kaam/${id}`)}`);
  }, [state, id, router]);

  async function sendRequest() {
    if (lock.current) return; // do baar na jaaye
    lock.current = true;
    setSending(true);
    setError("");
    try {
      const r = await fetch(`/api/jobs/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply" }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) { setState("login"); return; }
      if (!r.ok) throw new Error(d.error ?? "Request nahi gayi");
      setNotice("Aapki request customer ko bhej di gayi hai.");
      setConfirming(false);
      window.dispatchEvent(new Event("kk:data-changed"));
    } catch (e) {
      setError((e as Error).message || "Internet check karo, fir koshish karo");
      setConfirming(false);
    } finally {
      await load(); // jo bhi hua, server ka asli haal dikhao
      lock.current = false;
      setSending(false);
    }
  }

  const back = (
    <Link href="/explore?tab=jobs" className="inline-flex items-center gap-1 text-sm font-bold text-brand">
      <Icon name="back" className="h-4 w-4" /> Saare kaam
    </Link>
  );

  if (state === "loading" || state === "login") {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 bg-bg p-4 text-fg">
        <TopBar title="Kaam ki jaankari" />
        <div className="h-48 animate-pulse rounded-2xl bg-surface" />
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
      </main>
    );
  }

  if (state !== "ok" || !job) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 bg-bg p-4 text-fg">
        <TopBar title="Kaam ki jaankari" />
        {back}
        <div className="rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="text-lg font-bold">{state === "missing" ? "Ye kaam ab dikh nahi sakta" : "Load nahi hua"}</p>
          <p className="mt-1 text-muted">{error || "Ho sakta hai kaam band ho gaya ho."}</p>
          {state === "error" && <button onClick={load} className="mt-3 rounded-xl border border-line px-4 py-2 font-bold text-brand">Dobara koshish</button>}
        </div>
      </main>
    );
  }

  const c = catInfo(job.category);
  const invited = job.my_status === "invited";
  const canApply = !job.mine && job.status === "open" && (!job.my_status || job.my_status === "withdrawn" || invited);
  const st = job.my_status ? MY_STATUS[job.my_status] : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-bg p-4 pb-44 text-fg md:pb-28">
      <TopBar title="Kaam ki jaankari" />
      {back}

      <section className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Icon name={job.category as IconName} className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold leading-tight">{c.label} ka kaam</h1>
            <p className="text-muted">{c.hi}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${job.status === "open" ? "bg-ok/15 text-green-300" : "bg-surface-2 text-muted"}`}>
            {JOB_STATE[job.status]}
          </span>
        </div>

        <h2 className="mt-4 text-sm font-bold uppercase tracking-wide text-muted">Kaam ki jaankari</h2>
        <dl className="mt-1 divide-y divide-line">
          <div className="flex items-center justify-between gap-3 py-2.5"><dt className="flex items-center gap-2 text-muted"><Icon name="calendar" className="h-5 w-5" />Din</dt><dd className="font-semibold">{dayLabel(job.work_date)}</dd></div>
          <div className="flex items-center justify-between gap-3 py-2.5"><dt className="flex items-center gap-2 text-muted"><Icon name="clock" className="h-5 w-5" />Shuru</dt><dd className="font-semibold">{timeLabel(job.start_time)}</dd></div>
          <div className="flex items-center justify-between gap-3 py-2.5"><dt className="flex items-center gap-2 text-muted"><Icon name="clock" className="h-5 w-5" />Andaazan</dt><dd className="font-semibold">{job.hours} ghante</dd></div>
          <div className="flex items-center justify-between gap-3 py-2.5"><dt className="flex items-center gap-2 text-muted"><Icon name="pin" className="h-5 w-5" />Area</dt><dd className="text-right font-semibold">{job.area}, {job.city}<span className="block text-xs font-normal text-muted">{distLabel(job.distance_km)}</span></dd></div>
        </dl>
        <div className="mt-2 rounded-xl bg-bg p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Kaam ke baare mein</p>
          <p className="mt-1 text-fg-2">{job.note || "Malik ne kuch nahi likha. Phone par poochh lena."}</p>
        </div>
        <p className="mt-2 text-sm text-muted">{job.interested > 0 ? `${job.interested} kaarigar ne haan kaha hai` : "Abhi kisi ne haan nahi kaha"}</p>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Malik</h2>
        <p className="mt-1 text-lg font-bold">{job.customer_name}</p>
        <p className="text-sm text-muted">KaamKhoj par {job.customer_posts} kaam post kiye</p>
        {job.customer_phone ? (
          <a href={`tel:${job.customer_phone}`} className="mt-3 block rounded-xl bg-ok p-3 text-center text-lg font-extrabold text-bg">
            Malik ko call karo: +91 {job.customer_phone}
          </a>
        ) : (
          <p className="mt-2 flex items-start gap-2 text-sm text-muted">
            <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
            Number aur pura pata tabhi dikhega jab malik aapko chunega. Daam phone par tay hoga.
          </p>
        )}
      </section>

      {notice && <p role="status" className="rounded-xl bg-ok/15 p-3 font-semibold text-green-300">{notice}</p>}
      {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{error}</p>}

      {/* Neeche chipka hua mukhya button (phone par menu ke upar) */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+64px)] z-20 border-t border-line bg-bg/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-2xl">
          {job.mine ? (
            <Link href="/jobs" className="block rounded-xl border border-line p-4 text-center font-bold">Ye aapka hi kaam hai: Mera kaam mein dekho</Link>
          ) : canApply ? (
            <button onClick={() => setConfirming(true)} disabled={sending}
              className="w-full rounded-xl bg-brand p-4 text-xl font-extrabold text-bg transition hover:brightness-110 disabled:opacity-60">
              {sending ? "Bhej rahe hain..." : invited ? "Malik ne bulaya hai: Haan, main aaunga" : "Main aaunga"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`flex-1 rounded-xl p-4 text-center font-bold ${st?.cls ?? "bg-surface-2 text-muted"}`}>
                {st?.text ?? (job.status === "open" ? "Kaam khula hai" : JOB_STATE[job.status])}
              </span>
              <Link href="/jobs" className="rounded-xl border border-line px-4 py-4 font-bold">Mera kaam</Link>
            </div>
          )}
        </div>
      </div>

      {/* Pakka karne ka chhota dialog */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 md:items-center" role="dialog" aria-modal="true" aria-labelledby="ap-title">
          <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-5">
            <h2 id="ap-title" className="text-xl font-extrabold">Is kaam ke liye haan kahein?</h2>
            <p className="mt-2 text-fg-2">
              {c.label}, {dayLabel(job.work_date)} {timeLabel(job.start_time)}, {job.area}.
              Malik ko aapka naam aur rating dikhegi. Wo aapko chunega tab dono ko ek dusre ka number milega.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirming(false)} disabled={sending} className="rounded-xl border border-line p-3 font-bold">Nahi</button>
              <button onClick={sendRequest} disabled={sending} autoFocus
                className="rounded-xl bg-brand p-3 font-extrabold text-bg disabled:opacity-60">
                {sending ? "Bhej rahe hain..." : "Haan, bhejo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
