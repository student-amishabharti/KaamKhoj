"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { useMe } from "@/lib/client";

type Log = {
  id: number;
  input: string;
  created_at: string;
  result: {
    source: string; intent: string; tool: string; reply: string; navigateTo?: string;
    steps: string[]; invalidFromModel: string[]; latencyMs: number; changedData?: boolean;
  };
};

const SOURCE: Record<string, string> = {
  gemma: "Gemma AI",
  gemini: "Gemini AI",
  rules: "Rules (bina AI)",
  guard: "Suraksha check",
};

const INTENT: Record<string, string> = {
  post_job: "Kaam ka form bhara",
  find_workers: "Kaarigar dhoondhe",
  set_availability: "Available badla",
  set_skills: "Skills badli",
  navigate: "Page khola",
  clarify: "Sawaal poocha",
  refuse: "Mana kiya",
};

function when(s: string) {
  return new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export default function ActivityPage() {
  const me = useMe();
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!me) return;
    fetch("/api/activity")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setLogs(d.logs);
      })
      .catch((e) => setError(e.message || "Load nahi hua"));
  }, [me]);

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 bg-bg p-4 pb-28 text-fg">
      <TopBar title="AI activity" />
      <p className="text-fg-2">
        Aapne jo bola, AI ne kya samjha aur kya kiya. AI kabhi khud kaam post nahi karta, kaarigar nahi chunta, number nahi deta.
      </p>

      {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{error}</p>}
      {!logs && !error && <p className="py-4 text-center text-muted">Load ho raha hai...</p>}
      {logs && logs.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line p-5 text-center text-muted">
          Abhi kuch nahi. Neeche mic dabakar boliye, jaise &quot;kal 10 baje plumber chahiye&quot;.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {logs?.map((l) => (
          <li key={l.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-bold">“{l.input}”</p>
              <span className="text-xs text-muted">{when(l.created_at)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-brand-soft px-2 py-1 font-semibold text-brand">{SOURCE[l.result.source] ?? l.result.source}</span>
              <span className="rounded-full bg-surface-2 px-2 py-1 text-fg-2">{INTENT[l.result.intent] ?? l.result.intent}</span>
              <span className="rounded-full bg-surface-2 px-2 py-1 text-fg-2">{(l.result.latencyMs / 1000).toFixed(1)} sec</span>
              {l.result.changedData && <span className="rounded-full bg-ok/15 px-2 py-1 text-ok">Data badla</span>}
              {l.result.invalidFromModel?.length > 0 && (
                <span className="rounded-full bg-warn/15 px-2 py-1 text-warn">AI ki galti pakdi</span>
              )}
            </div>
            <p className="mt-2 text-fg-2">AI: {l.result.reply}</p>
            <details className="mt-2 text-sm text-muted">
              <summary className="cursor-pointer select-none">Kadam dekho</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {l.result.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </details>
            {l.result.navigateTo && (
              <Link href={l.result.navigateTo} className="mt-2 inline-block text-sm font-semibold text-brand underline">
                Wahi page kholo
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
