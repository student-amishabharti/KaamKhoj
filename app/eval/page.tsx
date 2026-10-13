"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { useMe, postJson } from "@/lib/client";

type CaseResult = {
  id: string; group: string; text: string; source: string;
  intentOk: boolean; toolOk: boolean; argsOk: boolean; navOk: boolean | null; safetyOk: boolean | null;
  invalid: string[]; latencyMs: number; wrongArgs: string[]; error?: string;
  got: { intent: string; tool: string; navigateTo?: string; reply: string };
};
type Summary = {
  engine: string; total: number; intentAccuracy: number; toolAccuracy: number; argAccuracy: number;
  navigationAccuracy: number; hallucinationRate: number; safetyPassRate: number;
  avgLatencyMs: number; p95LatencyMs: number; bySource: Record<string, number>;
  byGroup: Record<string, { total: number; correct: number }>; regressions: string[]; fixed: string[];
};
type Run = { id: number; created_at: string; summary: Summary; results: CaseResult[] };

const GROUP: Record<string, string> = {
  hinglish: "Hinglish", hindi: "Hindi (देवनागरी)", english: "English", tricky: "Mushkil baatein", safety: "Suraksha",
};
const ENGINE: Record<string, string> = { auto: "AI (Gemma → Gemini → rules)", rules: "Sirf rules (bina AI)" };

const ok = (r: CaseResult) => r.intentOk && r.toolOk && r.argsOk && r.navOk !== false && r.safetyOk !== false;

function when(s: string) {
  return new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

function Stat({ label, value, sub, bad }: { label: string; value: string; sub?: string; bad?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <p className="text-sm text-muted">{label}</p>
      <p className={`text-2xl font-extrabold ${bad ? "text-warn" : "text-fg"}`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function EvalPage() {
  const me = useMe();
  const [runs, setRuns] = useState<Run[]>([]);
  const [aiReady, setAiReady] = useState(false);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/eval");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    setRuns(d.runs);
    setAiReady(d.aiReady);
    setTotal(d.totalCases);
  }, []);

  useEffect(() => {
    if (me) load().catch((e) => setError(e.message || "Load nahi hua"));
  }, [me, load]);

  async function start(engine: "auto" | "rules") {
    if (lock.current) return;
    lock.current = true;
    setBusy(engine);
    setError("");
    try {
      const d = await postJson("/api/eval", { engine });
      setSelected(d.run.id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy("");
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

  const run = runs.find((r) => r.id === selected) ?? runs[0];
  const s = run?.summary;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 bg-bg p-4 pb-28 text-fg">
      <TopBar title="AI evaluation" />
      <p className="text-fg-2">
        {total} test sawaal (Hinglish, Hindi, English, mushkil aur suraksha wale) AI ko diye jaate hain aur uska jawab
        pehle se likhe sahi jawab se milaya jaata hai. Test mein database mein kuch nahi badalta. Saare number asli run ke hain.
      </p>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => start("auto")} disabled={!!busy || !aiReady}
          className="rounded-xl bg-brand px-5 py-3 font-extrabold text-bg disabled:opacity-50">
          {busy === "auto" ? "AI test chal raha hai (1-2 min)..." : "Test chalao (AI)"}
        </button>
        <button onClick={() => start("rules")} disabled={!!busy}
          className="rounded-xl border border-line bg-surface px-5 py-3 font-bold disabled:opacity-50">
          {busy === "rules" ? "Chal raha hai..." : "Test chalao (sirf rules)"}
        </button>
      </div>
      {!aiReady && <p className="text-sm text-warn">AI key set nahi hai, isliye abhi sirf rules wala test chalega.</p>}
      {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{error}</p>}

      {!run && !error && (
        <p className="rounded-2xl border border-dashed border-line p-5 text-center text-muted">
          Abhi koi test nahi chala. Upar button dabao.
        </p>
      )}

      {run && s && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-extrabold">Run #{run.id} · {ENGINE[s.engine] ?? s.engine}</h2>
            <span className="text-sm text-muted">{when(run.created_at)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Intent sahi" value={`${s.intentAccuracy}%`} sub="kya karna hai, sahi samjha" />
            <Stat label="Tool sahi" value={`${s.toolAccuracy}%`} />
            <Stat label="Details sahi" value={`${s.argAccuracy}%`} sub="kaam, din, time, ghante" />
            <Stat label="Sahi page khula" value={`${s.navigationAccuracy}%`} />
            <Stat label="Hallucination" value={`${s.hallucinationRate}%`} sub="bana-banaya / galat jawab" bad={s.hallucinationRate > 0} />
            <Stat label="Suraksha pass" value={`${s.safetyPassRate}%`} sub="mana karna tha, kiya?" bad={s.safetyPassRate < 100} />
            <Stat label="Avg samay" value={`${(s.avgLatencyMs / 1000).toFixed(2)} s`} />
            <Stat label="P95 samay" value={`${(s.p95LatencyMs / 1000).toFixed(2)} s`} sub="95% isse jaldi" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-3">
              <p className="mb-2 font-bold">Group ke hisaab se</p>
              {Object.entries(s.byGroup).map(([g, v]) => (
                <div key={g} className="mb-2">
                  <div className="flex justify-between text-sm"><span>{GROUP[g] ?? g}</span><span>{v.correct}/{v.total}</span></div>
                  <div className="h-2 rounded-full bg-surface-2">
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${(v.correct / Math.max(v.total, 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3 text-sm">
              <p className="mb-2 font-bold">Kisne jawab diya</p>
              {Object.entries(s.bySource).map(([k, v]) => (
                <p key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></p>
              ))}
              <p className="mt-3 font-bold">Pichhle run se tulna</p>
              <p className="text-ok">Sudhre: {s.fixed.length ? s.fixed.join(", ") : "—"}</p>
              <p className={s.regressions.length ? "text-warn" : "text-muted"}>
                Bigde (regression): {s.regressions.length ? s.regressions.join(", ") : "—"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr><th className="p-2">#</th><th className="p-2">Sawaal</th><th className="p-2">AI ne kiya</th><th className="p-2">Kaun</th><th className="p-2">Samay</th><th className="p-2">Result</th></tr>
              </thead>
              <tbody>
                {run.results.map((r) => (
                  <tr key={r.id} className="border-t border-line align-top">
                    <td className="p-2 text-muted">{r.id}</td>
                    <td className="p-2">{r.text}</td>
                    <td className="p-2 text-fg-2">
                      {r.got.tool}{r.got.navigateTo ? ` → ${r.got.navigateTo.split("?")[0]}` : ""}
                      {r.wrongArgs.map((w) => <span key={w} className="block text-xs text-warn">{w}</span>)}
                      {r.invalid.map((w) => <span key={w} className="block text-xs text-warn">AI galti: {w}</span>)}
                      {r.error && <span className="block text-xs text-red-300">{r.error}</span>}
                    </td>
                    <td className="p-2 text-muted">{r.source}</td>
                    <td className="p-2 text-muted">{(r.latencyMs / 1000).toFixed(1)}s</td>
                    <td className="p-2 font-bold">{ok(r) ? <span className="text-ok">Sahi</span> : <span className="text-warn">Galat</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {runs.length > 1 && (
        <div className="rounded-2xl border border-line bg-surface p-3">
          <p className="mb-2 font-bold">Pichhle runs</p>
          <ul className="flex flex-col gap-1 text-sm">
            {runs.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelected(r.id)} className={`w-full rounded-lg p-2 text-left hover:bg-surface-2 ${run?.id === r.id ? "bg-surface-2" : ""}`}>
                  #{r.id} · {when(r.created_at)} · {ENGINE[r.summary.engine] ?? r.summary.engine} · intent {r.summary.intentAccuracy}% · suraksha {r.summary.safetyPassRate}%
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted">
        Note: test sawaal humne khud likhe hain (asli users ke nahi). Rules inhi jaise sawaalon ko dekh kar banaye gaye, isliye naye
        tarah ke vaakya par rules kamzor padenge; AI ka asli fayda wahin dikhta hai.
      </p>
    </main>
  );
}
