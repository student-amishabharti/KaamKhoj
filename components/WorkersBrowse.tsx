"use client";

// Kaarigar dhoondhna: kaam / naam / area / available -> server se asli kaarigar (saaf ranking).
// Card par sirf sabko dikhne wali jaankari. Number kabhi nahi.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import InviteDialog, { type InviteWorker } from "@/components/InviteDialog";
import { CATEGORIES } from "@/lib/categories";
import { catInfo, distLabel, ratingText } from "@/lib/format";

type Worker = {
  id: number; name: string; role: string; area: string; city: string; skills: string[];
  available: boolean; work_note: string | null; is_learner: boolean;
  rating_avg: number; review_count: number; jobs_completed: number;
  distance_km: number | null; team_size: number | null; working_hours: string | null;
  business_name: string | null;
};
type Area = { id: number; name: string; city: string };
type F = { category: string; q: string; areaId: number | null; onlyAvail: boolean };

const FKEY = "kk_workers_filters";

export default function WorkersBrowse({ myAreaId, canInvite, meId }: { myAreaId: number | null; canInvite: boolean; meId: number }) {
  const [f, setF] = useState<F>({ category: "", q: "", areaId: myAreaId, onlyAvail: false });
  const [typed, setTyped] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [workers, setWorkers] = useState<Worker[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [invite, setInvite] = useState<InviteWorker | null>(null);

  useEffect(() => {
    fetch("/api/areas").then((r) => r.json()).then((d) => setAreas(d.areas ?? [])).catch(() => setAreas([]));
    let start: F = { category: "", q: "", areaId: myAreaId, onlyAvail: false };
    try { start = { ...start, ...JSON.parse(sessionStorage.getItem(FKEY) ?? "{}") }; } catch { /* */ }
    const q = new URLSearchParams(window.location.search);
    const c = q.get("category");
    if (c && CATEGORIES.some((x) => x.id === c)) start.category = c;
    if (q.get("avail") === "1") start.onlyAvail = true;
    if (!start.areaId) start.areaId = myAreaId;
    setF(start);
    setTyped(start.q);
    setReady(true);
    // Voice: "plumber dikhao" / "available kaarigar dikhao" isi page par
    const onVoice = (e: Event) => {
      const url = String((e as CustomEvent).detail ?? "");
      const p = new URLSearchParams(url.split("?")[1] ?? "");
      const cat = p.get("category");
      setF((x) => ({
        ...x,
        category: cat && CATEGORIES.some((y) => y.id === cat) ? cat : x.category,
        onlyAvail: p.get("avail") === "1" ? true : x.onlyAvail,
      }));
    };
    window.addEventListener("kk:voice-nav", onVoice);
    return () => window.removeEventListener("kk:voice-nav", onVoice);
  }, [myAreaId]);

  // Naam likhte waqt har akshar par server na jaaye
  useEffect(() => {
    const t = setTimeout(() => setF((x) => (x.q === typed.trim() ? x : { ...x, q: typed.trim() })), 400);
    return () => clearTimeout(t);
  }, [typed]);

  const search = useCallback(async (fl: F) => {
    if ((!fl.category && fl.q.length < 2) || !fl.areaId) { setWorkers(null); return; }
    setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams({ areaId: String(fl.areaId) });
      if (fl.category) p.set("category", fl.category);
      if (fl.q.length >= 2) p.set("q", fl.q);
      if (fl.onlyAvail) p.set("available", "1");
      const r = await fetch(`/api/search?${p.toString()}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setWorkers(d.workers);
    } catch (e) {
      setError((e as Error).message || "Load nahi hua. Internet check karo");
      setWorkers(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(FKEY, JSON.stringify(f)); } catch { /* */ }
    search(f);
  }, [f, ready, search]);

  const filtered = f.category || f.q || f.onlyAvail || f.areaId !== myAreaId;
  const clear = () => { setTyped(""); setF({ category: "", q: "", areaId: myAreaId, onlyAvail: false }); };
  const sel = "rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-fg focus:border-brand focus:outline-none";

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-extrabold">Apne area mein kaarigar dhoondhein</h2>
        <p className="text-fg-2">Skill aur availability ke hisaab se sahi kaarigar chunein.</p>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3">
        <label className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3">
          <Icon name="search" className="h-5 w-5 text-muted" />
          <span className="sr-only">Naam se dhoondho</span>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Naam se dhoondho (jaise Ramesh)"
            className="min-w-0 flex-1 bg-transparent py-3 text-fg placeholder:text-muted focus:outline-none" />
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="group" aria-label="Kaunsa kaam">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setF({ ...f, category: f.category === c.id ? "" : c.id })} aria-pressed={f.category === c.id}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition ${
                f.category === c.id ? "border-brand bg-brand-soft" : "border-line bg-bg hover:border-brand"
              }`}>
              <Icon name={c.id} className="h-7 w-7 text-brand" />
              <span className="text-xs font-semibold">{c.label}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted">Kahan ke paas
            <select value={f.areaId ?? ""} onChange={(e) => setF({ ...f, areaId: Number(e.target.value) })} className={sel}>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}, {a.city}{a.id === myAreaId ? " (mera)" : ""}</option>)}
            </select>
          </label>
          <label className="mt-5 flex items-center gap-2 text-sm text-fg-2">
            <input type="checkbox" checked={f.onlyAvail} onChange={(e) => setF({ ...f, onlyAvail: e.target.checked })} className="h-5 w-5 accent-[#ff6500]" />
            Sirf Available
          </label>
        </div>
        {filtered && <button onClick={clear} className="self-start text-sm font-bold text-brand underline">Filter hatao</button>}
      </div>

      {!f.category && f.q.length < 2 && (
        <p className="rounded-2xl border border-dashed border-line p-5 text-center text-muted">Upar se kaam chuno ya naam likho, paas ke kaarigar dikhenge. Mic dabakar bhi bol sakte ho: &quot;plumber dikhao&quot;.</p>
      )}
      {loading && <div className="flex flex-col gap-3" aria-label="Load ho raha hai">{[0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface" />)}</div>}
      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-danger/15 p-3 text-red-300">
          <span>{error}</span>
          <button onClick={() => search(f)} className="shrink-0 rounded-lg border border-red-300/40 px-3 py-1 text-sm font-bold">Dobara</button>
        </div>
      )}
      {!loading && !error && workers && workers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-5 text-center">
          <p className="font-bold">Is khoj mein koi kaarigar nahi mila</p>
          <p className="mt-1 text-sm text-muted">Doosra kaam ya area chuno, &quot;Sirf Available&quot; hatao, ya kaam post karo taaki kaarigar khud aayein.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {filtered && <button onClick={clear} className="rounded-xl border border-line px-4 py-2 font-bold text-brand">Filter hatao</button>}
            {canInvite && <Link href={`/post${f.category ? `?category=${f.category}` : ""}`} className="rounded-xl bg-brand px-4 py-2 font-bold text-bg">Kaam post karo</Link>}
          </div>
        </div>
      )}

      {!loading && workers && workers.length > 0 && (
        <ul className="flex flex-col gap-3">
          {workers.map((w) => (
            <li key={w.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-xl font-extrabold text-brand">
                  {w.name.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-bold leading-tight">
                      {w.name}
                      {w.is_learner && <span className="ml-2 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">Helper</span>}
                      {w.role === "business" && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-fg-2">Team</span>}
                    </p>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${w.available ? "bg-ok/15 text-green-300" : "bg-surface-2 text-muted"}`}>
                      {w.available ? "Available" : "Abhi nahi"}
                    </span>
                  </div>
                  <p className="text-sm text-fg-2">{w.skills.map((s) => catInfo(s).label).join(" · ")}</p>
                  <p className="inline-flex items-center gap-1 text-sm text-muted"><Icon name="pin" className="h-4 w-4" />{w.area}, {w.city} · {distLabel(w.distance_km)}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-fg-2">{ratingText(w.rating_avg, w.review_count)}{w.jobs_completed > 0 ? ` · ${w.jobs_completed} kaam poore` : ""}</p>
              {w.work_note && <p className="mt-2 line-clamp-2 rounded-lg bg-bg p-2 text-sm text-fg-2">“{w.work_note}”</p>}
              <div className={`mt-3 grid gap-2 ${canInvite && w.id !== meId ? "grid-cols-2" : "grid-cols-1"}`}>
                <Link href={`/kaarigar/${w.id}`} className="rounded-xl border border-line p-3 text-center font-bold hover:border-brand">Profile dekhein</Link>
                {canInvite && w.id !== meId && (
                  <button onClick={() => setInvite({ id: w.id, name: w.name, skills: w.skills })}
                    className="rounded-xl bg-brand p-3 font-extrabold text-bg hover:brightness-110">
                    Invite karein
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {workers && workers.length > 0 && (
        <p className="text-xs text-muted">
          Order: pehle Available, fir paas wale, fir rating (kam review walon ki rating 3.5 ki taraf), fir poore kaam.
          Rating aur poore kaam asli bookings se gine jaate hain. Number tabhi dikhega jab aap kaarigar ko chunoge.
        </p>
      )}

      {invite && <InviteDialog worker={invite} onClose={() => setInvite(null)} />}
    </section>
  );
}
