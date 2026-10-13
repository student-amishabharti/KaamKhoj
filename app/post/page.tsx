"use client";

// Kaam post karna: 1) form bharo (ya AI se bharwao)  2) check karo (review)  3) "Pakka, post karo"
// Post sirf user ke "Pakka, post karo" dabane par hota hai. Kaarigar khud nahi chune jaate, number nahi dikhta.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Icon, { type IconName } from "@/components/Icon";
import { CATEGORIES } from "@/lib/categories";
import { postJson, useMe } from "@/lib/client";
import { catInfo, dayLabel, timeLabel, todayPlus } from "@/lib/format";

const DAYS = [0, 1, 2];
const TIMES = ["09:00", "10:00", "14:00", "17:00"];
const HOURS = [1, 2, 4, 8];
const DRAFT_KEY = "kk_post_draft";

type Errors = { category?: string; date?: string; time?: string; hours?: string; area?: string; form?: string };
type Area = { id: number; name: string; city: string };
type Step = "form" | "review" | "done";

// Aaj ka din chuna ho aur time beet chuka ho?
function isPast(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime() < Date.now();
}

// Browser ki SpeechRecognition (sirf "kaam ke baare mein" bolkar likhne ke liye)
type Rec = {
  lang: string; interimResults: boolean; continuous: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
function makeRec(): Rec | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return C ? new C() : null;
}

function Req() {
  return <span className="ml-1 text-brand" aria-hidden>*</span>;
}

export default function PostJobPage() {
  const router = useRouter();
  const me = useMe();
  const [step, setStep] = useState<Step>("form");
  const [category, setCategory] = useState("");
  const [workDate, setWorkDate] = useState(todayPlus(1));
  const [startTime, setStartTime] = useState("10:00");
  const [hours, setHours] = useState(2);
  const [note, setNote] = useState("");
  const [invite, setInvite] = useState<{ id: number; name: string } | null>(null);
  const [fromAi, setFromAi] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [noteMic, setNoteMic] = useState<"off" | "on" | "na">("off");
  const [noteMicErr, setNoteMicErr] = useState("");
  const sending = useRef(false); // double-click se do baar na jaaye
  const recRef = useRef<Rec | null>(null);
  const restored = useRef(false);

  // AI ya "Isko bulao" button se aaye to form pehle se bhara hota hai. Warna pichhla adhoora form wapas.
  useEffect(() => {
    function fill(search: string) {
      const q = new URLSearchParams(search);
      const ai = q.get("from") === "ai";
      // AI se aaye to jo user ne nahi bola wo khaali chhodo (khud se bharna = galat jaankari)
      if (ai) { setCategory(""); setWorkDate(""); setStartTime(""); setHours(0); setNote(""); setErrors({}); }
      if (q.get("category")) setCategory(q.get("category")!);
      if (q.get("date")) setWorkDate(q.get("date")!);
      if (q.get("time")) setStartTime(q.get("time")!);
      if (q.get("hours")) setHours(Number(q.get("hours")));
      if (q.get("note")) setNote(q.get("note")!);
      if (q.get("workerId")) setInvite({ id: Number(q.get("workerId")), name: q.get("workerName") ?? "Kaarigar" });
      setFromAi(ai);
      setStep("form");
      return q.toString().length > 0;
    }
    const hadQuery = fill(window.location.search);
    if (!hadQuery) {
      try {
        const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
        if (d) {
          if (d.category) setCategory(d.category);
          if (d.workDate && d.workDate >= todayPlus(0)) setWorkDate(d.workDate);
          if (d.startTime) setStartTime(d.startTime);
          if (d.hours) setHours(d.hours);
          if (d.note) setNote(d.note);
          if (d.areaId) setAreaId(d.areaId);
        }
      } catch { /* purana draft nahi mila to koi baat nahi */ }
    }
    restored.current = true;
    fetch("/api/areas").then((r) => r.json()).then((d) => setAreas(d.areas ?? [])).catch(() => setAreas([]));
    // Isi page par dobara bola ("kal 3 baje karo") to form naye sire se bharo
    const onVoice = (e: Event) => {
      const url = String((e as CustomEvent).detail ?? "");
      if (url.startsWith("/post")) fill(url.split("?")[1] ?? "");
    };
    window.addEventListener("kk:voice-nav", onVoice);
    return () => {
      window.removeEventListener("kk:voice-nav", onVoice);
      recRef.current?.abort();
    };
  }, []);

  // Kaam ka area: pehle se apna area
  useEffect(() => {
    if (me?.area_id && areaId === null) setAreaId(me.area_id);
  }, [me, areaId]);

  // Adhoora form yaad rakho (page chhod kar wapas aaye to bhi bhara mile)
  useEffect(() => {
    if (!restored.current || step === "done") return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ category, workDate, startTime, hours, note, areaId }));
    } catch { /* storage band ho to bhi form chalega */ }
  }, [category, workDate, startTime, hours, note, areaId, step]);

  useEffect(() => {
    if (!makeRec()) setNoteMic("na");
  }, []);

  // "Kaam ke baare mein" bolkar likhna
  function toggleNoteMic() {
    if (noteMic === "on") { recRef.current?.stop(); return; }
    const rec = makeRec();
    if (!rec) { setNoteMic("na"); return; }
    setNoteMicErr("");
    rec.lang = "hi-IN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript;
      if (t.trim()) setNote((n) => (n ? `${n} ${t.trim()}` : t.trim()).slice(0, 200));
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setNoteMicErr(e.error === "not-allowed" ? "Mic ki ijaazat nahi mili. Likh dijiye." : "Sunai nahi diya. Dobara dabakar boliye, ya likh dijiye.");
    };
    rec.onend = () => { recRef.current = null; setNoteMic("off"); };
    recRef.current = rec;
    try { rec.start(); setNoteMic("on"); } catch { setNoteMic("off"); }
  }

  // Step 1 -> 2: sab check karke review dikhao
  function goReview() {
    const e: Errors = {};
    if (!category) e.category = "Kaunsa kaam chahiye? Upar se chuno";
    if (!areaId) e.area = "Kaam kis area mein hai? Chuno";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) e.date = "Kis din? Din chuno";
    else if (workDate < todayPlus(0)) e.date = "Beeta hua din nahi chal sakta. Aaj ya aage ka din chuno";
    if (!/^\d{2}:\d{2}$/.test(startTime)) e.time = "Kitne baje? Time chuno";
    if (!e.date && !e.time && isPast(workDate, startTime)) e.time = "Ye samay beet chuka hai. Aage ka time chuno";
    if (!(hours >= 1 && hours <= 12)) e.hours = "Kitne ghante ka kaam? 1 se 12 mein chuno";
    setErrors(e);
    if (Object.keys(e).length) {
      // Pehli galti tak scroll
      const first = ["category", "area", "date", "time", "hours"].find((k) => e[k as keyof Errors]);
      document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Step 2 -> post: sirf "Pakka, post karo" dabane par
  async function confirmPost() {
    if (sending.current) return;
    if (isPast(workDate, startTime)) {
      setErrors({ time: "Ye samay beet chuka hai. Aage ka time chuno" });
      setStep("form");
      return;
    }
    sending.current = true;
    setBusy(true);
    setErrors({});
    try {
      const d = await postJson("/api/jobs", {
        category, workDate, startTime, hours, note, areaId,
        inviteWorkerId: invite?.id,
      });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* */ }
      setStep("done");
      // Safal: button band hi rehne do jab tak naya page na khule
      setTimeout(() => router.push(`/jobs?posted=${d.id}`), 900);
    } catch (err) {
      sending.current = false;
      setBusy(false);
      setErrors({ form: (err as Error).message || "Internet check karo, fir koshish karo" });
    }
  }

  if (me === undefined) return <p className="p-6 text-center text-xl text-fg">Load ho raha hai...</p>;
  if (!me || me.role === "business") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-bg p-6 text-center text-fg">
        <p className="text-xl">{me ? "Business account se kaam post nahi hota" : "Kaam post karne ke liye pehle login karo"}</p>
        <Link href={me ? "/" : "/login?next=/post"} className="rounded-xl bg-brand px-8 py-4 text-xl font-bold text-bg">{me ? "Home" : "Login"}</Link>
      </main>
    );
  }

  const chip = (on: boolean) =>
    `rounded-xl border-2 px-3 py-3 text-base font-semibold transition ${on ? "border-brand bg-brand-soft text-fg" : "border-line bg-surface text-fg-2 hover:border-brand"}`;
  const errorText = (msg?: string) => (msg ? <p role="alert" className="text-sm font-medium text-red-300">{msg}</p> : null);
  const areaName = areas.find((a) => a.id === areaId);

  // ---------- Safal ----------
  if (step === "done") {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-3 bg-bg p-6 text-center text-fg">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-ok/15 text-ok"><Icon name="check" className="h-10 w-10" /></span>
        <p className="text-2xl font-extrabold">Kaam post ho gaya!</p>
        <p className="text-fg-2">Paas ke {catInfo(category).label} ko dikh raha hai. &quot;Meri bookings&quot; khul rahi hai...</p>
      </main>
    );
  }

  // ---------- Step 2: Check karo ----------
  if (step === "review") {
    const rows: [string, string][] = [
      ["Kaam", `${catInfo(category).label} (${catInfo(category).hi})`],
      ["Area", areaName ? `${areaName.name}, ${areaName.city}` : me.area_name ?? ""],
      ["Din", dayLabel(workDate)],
      ["Time", timeLabel(startTime)],
      ["Kitne ghante", `${hours} ghante`],
      ["Kaam ke baare mein", note.trim() || "—"],
    ];
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-bg p-4 pb-28 text-fg">
        <TopBar title="Check karo" />
        <p className="text-fg-2">Sab sahi hai? &quot;Pakka, post karo&quot; dabane par hi kaam post hoga.</p>

        <section className="rounded-2xl border-2 border-brand/60 bg-surface p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
              <Icon name={category as IconName} className="h-7 w-7" />
            </span>
            <p className="text-xl font-extrabold">{catInfo(category).label} chahiye</p>
          </div>
          <dl className="divide-y divide-line">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {invite && <p className="mt-3 rounded-xl bg-ok/10 p-3 text-sm text-green-300">Ye kaam seedha <b>{invite.name}</b> ko bhi jaayega. Wo haan kahega tab booking pakki hogi.</p>}
        </section>

        <p className="flex items-start gap-2 text-sm text-muted">
          <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
          Sirf area dikhega, pura pata nahi. Aapka number sirf usi kaarigar ko dikhega jise aap khud chunoge. Daam phone par tay hoga.
        </p>

        {errors.form && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{errors.form}</p>}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setStep("form"); setErrors({}); }} disabled={busy}
            className="rounded-xl border-2 border-line p-4 text-lg font-bold disabled:opacity-50">
            ✎ Badlo
          </button>
          <button onClick={confirmPost} disabled={busy}
            className="rounded-xl bg-brand p-4 text-lg font-extrabold text-bg transition hover:brightness-110 disabled:opacity-60">
            {busy ? "Post ho raha hai..." : "Pakka, post karo"}
          </button>
        </div>
      </main>
    );
  }

  // ---------- Step 1: Form ----------
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-bg p-4 pb-28 text-fg">
      <TopBar title="Kaam post karo" />

      {fromAi && (
        <p className="rounded-xl bg-blue-100 p-3 text-blue-900">
          AI ne aapki baat se form bhara hai. Jo khaali hai wo chuno, fir <b>Aage: check karo</b> dabao.
        </p>
      )}
      {invite && (
        <p className="rounded-xl bg-green-100 p-3 text-green-900">
          Ye kaam seedha <b>{invite.name}</b> ko jaayega. Wo &quot;Aaunga&quot; dabayega tab booking pakki hogi.
        </p>
      )}
      <p className="text-sm text-muted"><span className="text-brand">*</span> wale zaroori hain. Mic dabakar bolkar bhi bhar sakte ho.</p>

      <h2 id="f-category" className="text-lg font-bold">1. Kaunsa kaam?<Req /></h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => { setCategory(c.id); setErrors((e) => ({ ...e, category: undefined })); }} aria-pressed={category === c.id}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition ${
              category === c.id ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand"
            }`}>
            <Icon name={c.id} className="h-9 w-9 text-brand" />
            <span className="text-sm font-semibold">{c.label}</span>
            <span className="text-xs text-muted">{c.hi}</span>
          </button>
        ))}
      </div>
      {errorText(errors.category)}

      <h2 id="f-area" className="text-lg font-bold">2. Kaam kahan hai?<Req /></h2>
      <select value={areaId ?? ""} onChange={(e) => { setAreaId(Number(e.target.value)); setErrors((x) => ({ ...x, area: undefined })); }}
        className="rounded-xl border-2 border-line bg-surface p-3 text-base text-fg">
        <option value="" disabled>Area chuno</option>
        {areas.map((a) => <option key={a.id} value={a.id}>{a.name}, {a.city}{a.id === me.area_id ? " (mera area)" : ""}</option>)}
      </select>
      <p className="-mt-2 text-xs text-muted">Sirf area dikhega, pura pata nahi. Pata phone par batana.</p>
      {errorText(errors.area)}

      <h2 id="f-date" className="text-lg font-bold">3. Kis din?<Req /></h2>
      <div className="grid grid-cols-3 gap-2">
        {DAYS.map((d) => (
          <button key={d} className={chip(workDate === todayPlus(d))} onClick={() => { setWorkDate(todayPlus(d)); setErrors((e) => ({ ...e, date: undefined })); }}>
            {dayLabel(todayPlus(d))}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 text-sm text-muted">
        Ya calendar se:
        <input type="date" min={todayPlus(0)} value={workDate} onChange={(e) => setWorkDate(e.target.value)}
          className="flex-1 rounded-xl border-2 border-line bg-surface p-3 text-base text-fg" />
      </label>
      {errorText(errors.date)}

      <h2 id="f-time" className="text-lg font-bold">4. Kitne baje shuru?<Req /></h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TIMES.map((t) => (
          <button key={t} className={chip(startTime === t)} onClick={() => { setStartTime(t); setErrors((e) => ({ ...e, time: undefined })); }}>
            {timeLabel(t)}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 text-sm text-muted">
        Ya apna time:
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
          className="flex-1 rounded-xl border-2 border-line bg-surface p-3 text-base text-fg" />
      </label>
      {errorText(errors.time)}

      <h2 id="f-hours" className="text-lg font-bold">5. Kitne ghante ka kaam? (andaaza)<Req /></h2>
      <div className="grid grid-cols-4 gap-2">
        {HOURS.map((h) => (
          <button key={h} className={chip(hours === h)} onClick={() => { setHours(h); setErrors((e) => ({ ...e, hours: undefined })); }}>
            {h} ghante
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 text-sm text-muted">
        Ya:
        <select value={hours || ""} onChange={(e) => setHours(Number(e.target.value))}
          className="flex-1 rounded-xl border-2 border-line bg-surface p-3 text-base text-fg">
          <option value="" disabled>Ghante chuno</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{h} ghante</option>)}
        </select>
      </label>
      {errorText(errors.hours)}

      <h2 className="text-lg font-bold">6. Kaam ke baare mein <span className="font-normal text-muted">(chahe to)</span></h2>
      <div className="flex gap-2">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} rows={2}
          placeholder="Jaise: do kamre paint karne hain / bathroom ka nal tapak raha hai"
          className="min-w-0 flex-1 rounded-xl border-2 border-line bg-surface p-3 text-base text-fg outline-none focus:border-brand" />
        {noteMic !== "na" && (
          <button type="button" onClick={toggleNoteMic} aria-pressed={noteMic === "on"}
            aria-label={noteMic === "on" ? "Sunna band karo" : "Bolkar likho"}
            className={`grid w-14 shrink-0 place-items-center rounded-xl border-2 transition ${noteMic === "on" ? "border-brand bg-brand text-bg" : "border-line bg-surface text-brand hover:border-brand"}`}>
            <Icon name="mic" className="h-6 w-6" />
          </button>
        )}
      </div>
      <p className="-mt-2 flex justify-between text-xs text-muted">
        <span>{noteMic === "on" ? "Sun raha hoon... boliye" : noteMicErr || "Mic dabakar bolkar bhi likh sakte ho"}</span>
        <span>{note.length}/200</span>
      </p>

      <button onClick={goReview}
        className="rounded-xl bg-brand p-4 text-xl font-extrabold text-bg transition hover:brightness-110">
        Aage: check karo →
      </button>
    </main>
  );
}
