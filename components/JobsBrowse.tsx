"use client";

// "Kaam dekho": kaarigar ke liye khule kaam (asli database se), search + filter ke saath.
// Sirf wahi kaam aate hain jo server bhejta hai: khule, aapki skill ke, aur jinke malik ne aapko block nahi kiya.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import Toggle from "@/components/Toggle";
import { CATEGORIES } from "@/lib/categories";
import { catInfo, dayLabel, distLabel, timeLabel, todayPlus } from "@/lib/format";

export type OpenJob = {
  id: number; category: string; work_date: string; start_time: string; hours: number; note: string | null;
  area: string; city: string; customer_name: string; distance_km: number | null;
  my_status: string | null; interested: number;
};
type Profile = { skills: string[]; available: boolean };
type Filters = { q: string; cat: string; area: string; day: "all" | "today" | "tomorrow" | "week"; onlyNew: boolean };

const EMPTY: Filters = { q: "", cat: "", area: "", day: "all", onlyNew: false };
const FKEY = "kk_jobs_filters";

// Kaarigar ka jawab: asli status se
export const MY_STATUS: Record<string, { text: string; cls: string }> = {
  applied: { text: "Request bhej di gayi", cls: "bg-blue-500/15 text-blue-300" },
  invited: { text: "Malik ne aapko bulaya", cls: "bg-brand-soft text-brand" },
  selected: { text: "Aap chune gaye", cls: "bg-ok/15 text-green-300" },
  rejected: { text: "Kisi aur ko chuna gaya", cls: "bg-surface-2 text-muted" },
  withdrawn: { text: "Aapne mana kiya", cls: "bg-surface-2 text-muted" },
};

function inDay(date: string, day: Filters["day"]) {
  if (day === "all") return true;
  if (day === "today") return date === todayPlus(0);
  if (day === "tomorrow") return date === todayPlus(1);
  return date <= todayPlus(6);
}

export default function JobsBrowse() {
  const [jobs, setJobs] = useState<OpenJob[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [f, setF] = useState<Filters>(EMPTY);
  const [pickSkills, setPickSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [jr, pr] = await Promise.all([fetch("/api/jobs?scope=open"), fetch("/api/worker/profile")]);
      const jd = await jr.json();
      const pd = await pr.json();
      if (!jr.ok) throw new Error(jd.error);
      setJobs(jd.jobs);
      if (pd.profile) setProfile({ skills: pd.profile.skills ?? [], available: pd.profile.available });
    } catch (e) {
      setError((e as Error).message || "Kaam load nahi hue. Internet check karo");
      setJobs((j) => j ?? []);
    }
  }, []);

  // Pichhle filter yaad (Details se wapas aao to wahi list), aur URL / voice se aaya kaam
  useEffect(() => {
    let start = EMPTY;
    try { start = { ...EMPTY, ...JSON.parse(sessionStorage.getItem(FKEY) ?? "{}") }; } catch { /* */ }
    const c = new URLSearchParams(window.location.search).get("category");
    if (c && CATEGORIES.some((x) => x.id === c)) start = { ...start, cat: c };
    setF(start);
    setReady(true);
    load();
    const onData = () => { load(); };
    const onVoice = (e: Event) => {
      const url = String((e as CustomEvent).detail ?? "");
      const cat = new URLSearchParams(url.split("?")[1] ?? "").get("category");
      if (cat) setF((x) => ({ ...x, cat }));
    };
    window.addEventListener("kk:data-changed", onData);
    window.addEventListener("kk:voice-nav", onVoice);
    return () => {
      window.removeEventListener("kk:data-changed", onData);
      window.removeEventListener("kk:voice-nav", onVoice);
    };
  }, [load]);

  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(FKEY, JSON.stringify(f)); } catch { /* */ }
  }, [f, ready]);

  const areas = useMemo(() => [...new Set((jobs ?? []).map((j) => j.area))].sort(), [jobs]);

  const shown = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return (jobs ?? []).filter((j) => {
      if (f.cat && j.category !== f.cat) return false;
      if (f.area && j.area !== f.area) return false;
      if (!inDay(j.work_date, f.day)) return false;
      if (f.onlyNew && j.my_status && j.my_status !== "withdrawn") return false;
      if (q) {
        const c = catInfo(j.category);
        const hay = `${c.label} ${c.hi} ${j.area} ${j.city} ${j.note ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, f]);

  const filtered = f.q || f.cat || f.area || f.day !== "all" || f.onlyNew;

  async function patchProfile(body: object) {
    setSaving(true);
    try {
      const r = await fetch("/api/worker/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setProfile({ skills: d.profile.skills ?? [], available: d.profile.available });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const sel = "rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-fg focus:border-brand focus:outline-none";

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-extrabold">Aapke liye kaam</h2>
        <p className="text-fg-2">Apne area mein available kaam dekhein</p>
      </div>

      {/* Pehli baar: sirf itna poochho ki kya kaam karte ho */}
      {profile && profile.skills.length === 0 && (
        <div className="rounded-2xl border-2 border-brand/50 bg-surface p-4">
          <p className="text-lg font-bold">Aap kaunsa kaam karte ho?</p>
          <p className="text-sm text-muted">Ek ya zyada chuno. Isi hisaab se kaam dikhenge.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const on = pickSkills.includes(c.id);
              return (
                <button key={c.id} aria-pressed={on}
                  onClick={() => setPickSkills((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 ${on ? "border-brand bg-brand-soft" : "border-line"}`}>
                  <Icon name={c.id} className="h-7 w-7 text-brand" />
                  <span className="text-xs font-semibold">{c.label}</span>
                </button>
              );
            })}
          </div>
          <button disabled={!pickSkills.length || saving} onClick={() => patchProfile({ skills: pickSkills })}
            className="mt-3 w-full rounded-xl bg-brand p-3 font-extrabold text-bg disabled:opacity-50">
            {saving ? "Save ho raha hai..." : "Save karo aur kaam dekho"}
          </button>
        </div>
      )}

      {profile && profile.skills.length > 0 && (
        <Toggle label={profile.available ? "Aap Available ho" : "Aap abhi Available nahi ho"}
          sub={profile.available ? "Malik aapko seedha bula sakte hain" : "ON karo taaki malik aapko dhoondh sakein"}
          checked={profile.available} disabled={saving} onChange={(v) => patchProfile({ available: v })} />
      )}

      {/* Search + filter */}
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3">
        <label className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3">
          <Icon name="search" className="h-5 w-5 text-muted" />
          <span className="sr-only">Kaam dhoondho</span>
          <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Dhoondho: nal, paint, Supela..."
            className="min-w-0 flex-1 bg-transparent py-3 text-fg placeholder:text-muted focus:outline-none" />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Kaam ka prakaar">
          <button onClick={() => setF({ ...f, cat: "" })} aria-pressed={!f.cat}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold ${!f.cat ? "border-brand bg-brand-soft" : "border-line text-fg-2"}`}>Sab kaam</button>
          {CATEGORIES.filter((c) => !profile || profile.skills.length === 0 || profile.skills.includes(c.id)).map((c) => (
            <button key={c.id} onClick={() => setF({ ...f, cat: f.cat === c.id ? "" : c.id })} aria-pressed={f.cat === c.id}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${f.cat === c.id ? "border-brand bg-brand-soft" : "border-line text-fg-2"}`}>
              <Icon name={c.id} className="h-4 w-4 text-brand" />{c.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-muted">Area
            <select value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} className={sel}>
              <option value="">Sab area</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">Din
            <select value={f.day} onChange={(e) => setF({ ...f, day: e.target.value as Filters["day"] })} className={sel}>
              <option value="all">Koi bhi din</option>
              <option value="today">Aaj</option>
              <option value="tomorrow">Kal</option>
              <option value="week">Is hafte</option>
            </select>
          </label>
          <label className="col-span-2 flex items-center gap-2 text-sm text-fg-2 sm:col-span-1 sm:mt-5">
            <input type="checkbox" checked={f.onlyNew} onChange={(e) => setF({ ...f, onlyNew: e.target.checked })} className="h-5 w-5 accent-[#ff6500]" />
            Sirf jinpar jawab nahi diya
          </label>
        </div>
        {filtered && (
          <button onClick={() => setF(EMPTY)} className="self-start text-sm font-bold text-brand underline">Filter hatao</button>
        )}
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-danger/15 p-3 text-red-300">
          <span>{error}</span>
          <button onClick={load} className="shrink-0 rounded-lg border border-red-300/40 px-3 py-1 text-sm font-bold">Dobara</button>
        </div>
      )}

      {jobs === null && (
        <div className="flex flex-col gap-3" aria-label="Load ho raha hai">
          {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      )}

      {jobs !== null && shown.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="text-lg font-bold">Abhi aapke area mein koi matching kaam nahi mila</p>
          <p className="mt-1 text-muted">
            {filtered ? "Filter badal kar dekho." : "Thodi der baad dekho, ya Profile mein apne kaam (skills) badlo."}
          </p>
          {filtered
            ? <button onClick={() => setF(EMPTY)} className="mt-3 rounded-xl border border-line px-4 py-2 font-bold text-brand">Saare filter hatao</button>
            : <Link href="/worker" className="mt-3 inline-block rounded-xl border border-line px-4 py-2 font-bold text-brand">Kaam ki settings</Link>}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {shown.map((j) => {
          const c = catInfo(j.category);
          const st = j.my_status ? MY_STATUS[j.my_status] : null;
          return (
            <li key={j.id}>
              <article className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon name={j.category as IconName} className="h-7 w-7" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold leading-tight">{c.label} <span className="text-sm font-normal text-muted">{c.hi}</span></h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${st ? st.cls : "bg-ok/15 text-green-300"}`}>
                        {st ? st.text : "Khula"}
                      </span>
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-fg-2">
                      <span className="inline-flex items-center gap-1"><Icon name="calendar" className="h-4 w-4" />{dayLabel(j.work_date)}, {timeLabel(j.start_time)}</span>
                      <span className="inline-flex items-center gap-1"><Icon name="clock" className="h-4 w-4" />{j.hours} ghante</span>
                    </p>
                    <p className="inline-flex items-center gap-1 text-sm text-muted"><Icon name="pin" className="h-4 w-4" />{j.area}, {j.city} · {distLabel(j.distance_km)}</p>
                  </div>
                </div>
                {j.note && <p className="mt-2 line-clamp-2 rounded-lg bg-bg p-2 text-sm text-fg-2">{j.note}</p>}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">{j.interested > 0 ? `${j.interested} kaarigar ne haan kaha` : "Abhi kisi ne haan nahi kaha"}</span>
                  <Link href={`/kaam/${j.id}`} className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-2.5 font-extrabold text-bg hover:brightness-110">
                    Details dekhein <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
