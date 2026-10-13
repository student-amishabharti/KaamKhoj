"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Icon from "@/components/Icon";
import { CATEGORIES } from "@/lib/categories";
import { postJson, useMe } from "@/lib/client";
import { catInfo, dayLabel, timeLabel, todayPlus } from "@/lib/format";

const DAYS = [0, 1, 2];
const TIMES = ["09:00", "10:00", "14:00", "17:00"];
const HOURS = [1, 2, 4, 8];

type Errors = { category?: string; date?: string; time?: string; form?: string };

// Aaj ka din chuna ho aur time beet chuka ho?
function isPast(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime() < Date.now();
}

export default function PostJobPage() {
  const router = useRouter();
  const me = useMe();
  const [category, setCategory] = useState("");
  const [workDate, setWorkDate] = useState(todayPlus(1));
  const [startTime, setStartTime] = useState("10:00");
  const [hours, setHours] = useState(2);
  const [note, setNote] = useState("");
  const [invite, setInvite] = useState<{ id: number; name: string } | null>(null);
  const [fromAi, setFromAi] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const sending = useRef(false); // double-click se do baar na jaaye

  // AI ya "Isko bulao" button se aaye to form pehle se bhara hota hai
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("category")) setCategory(q.get("category")!);
    if (q.get("date")) setWorkDate(q.get("date")!);
    if (q.get("time")) setStartTime(q.get("time")!);
    if (q.get("hours")) setHours(Number(q.get("hours")));
    if (q.get("note")) setNote(q.get("note")!);
    if (q.get("workerId")) setInvite({ id: Number(q.get("workerId")), name: q.get("workerName") ?? "Kaarigar" });
    setFromAi(q.get("from") === "ai");
  }, []);

  async function submit() {
    if (sending.current) return;
    const e: Errors = {};
    if (!category) e.category = "Kaunsa kaam chahiye? Upar se chuno";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) e.date = "Din chuno";
    if (!/^\d{2}:\d{2}$/.test(startTime)) e.time = "Time chuno";
    if (!e.date && !e.time && isPast(workDate, startTime)) e.time = "Ye samay beet chuka hai. Aage ka time chuno";
    setErrors(e);
    if (Object.keys(e).length) return;

    sending.current = true;
    setBusy(true);
    try {
      const d = await postJson("/api/jobs", {
        category, workDate, startTime, hours, note,
        inviteWorkerId: invite?.id,
      });
      // Safal: button band hi rehne do jab tak naya page na khule
      router.push(`/jobs?posted=${d.id}`);
    } catch (err) {
      sending.current = false;
      setBusy(false);
      setErrors({ form: (err as Error).message || "Internet check karo, fir koshish karo" });
    }
  }

  if (me === undefined) return <p className="p-6 text-center text-xl text-fg">Load ho raha hai...</p>;
  if (!me || me.role !== "customer") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-bg p-6 text-center text-fg">
        <p className="text-xl">Kaam post karne ke liye Home par &quot;Kaam karwana hai&quot; chuno</p>
        <Link href="/" className="rounded-xl bg-brand px-8 py-4 text-xl font-bold text-bg">Home</Link>
      </main>
    );
  }

  const chip = (on: boolean) =>
    `rounded-xl border-2 px-3 py-3 text-base font-semibold transition ${on ? "border-brand bg-brand-soft text-fg" : "border-line bg-surface text-fg-2 hover:border-brand"}`;
  const errorText = (msg?: string) => (msg ? <p role="alert" className="text-sm font-medium text-red-300">{msg}</p> : null);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-bg p-4 pb-16 text-fg">
      <TopBar title="Kaam post karo" />

      {fromAi && (
        <p className="rounded-xl bg-blue-100 p-3 text-blue-900">
          AI ne aapki baat se form bhara hai. Check karo, fir <b>Kaam post karo</b> dabao.
        </p>
      )}
      {invite && (
        <p className="rounded-xl bg-green-100 p-3 text-green-900">
          Ye kaam seedha <b>{invite.name}</b> ko jaayega. Wo &quot;Aaunga&quot; dabayega tab booking pakki hogi.
        </p>
      )}

      <h2 className="text-lg font-bold">1. Kaunsa kaam?</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)} aria-pressed={category === c.id}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition ${
              category === c.id ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand"
            }`}>
            <Icon name={c.id} className="h-7 w-7 text-brand" />
            <span className="text-sm font-semibold">{c.label}</span>
            <span className="text-xs text-muted">{c.hi}</span>
          </button>
        ))}
      </div>
      {errorText(errors.category)}

      <h2 className="text-lg font-bold">2. Kis din?</h2>
      <div className="grid grid-cols-3 gap-2">
        {DAYS.map((d) => (
          <button key={d} className={chip(workDate === todayPlus(d))} onClick={() => setWorkDate(todayPlus(d))}>
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

      <h2 className="text-lg font-bold">3. Kitne baje?</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TIMES.map((t) => (
          <button key={t} className={chip(startTime === t)} onClick={() => setStartTime(t)}>
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

      <h2 className="text-lg font-bold">4. Kitne ghante ka kaam?</h2>
      <div className="grid grid-cols-4 gap-2">
        {HOURS.map((h) => (
          <button key={h} className={chip(hours === h)} onClick={() => setHours(h)}>
            {h} ghante
          </button>
        ))}
      </div>

      <h2 className="text-lg font-bold">5. Kuch aur batana hai? <span className="font-normal text-muted">(chahe to)</span></h2>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} rows={2}
        placeholder="Jaise: do kamre paint karne hain"
        className="rounded-xl border-2 border-line bg-surface p-3 text-base text-fg outline-none focus:border-brand" />

      {category && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-muted">Aapka kaam</p>
          <p className="text-lg font-bold">
            {catInfo(category).label} · {dayLabel(workDate)}, {timeLabel(startTime)} · {hours} ghante
          </p>
          <p className="text-sm text-muted">{me.area_name} (sirf area dikhega, pura pata nahi)</p>
        </div>
      )}

      {errors.form && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{errors.form}</p>}

      <button onClick={submit} disabled={busy}
        className="rounded-xl bg-brand p-4 text-xl font-extrabold text-bg transition hover:brightness-110 disabled:opacity-50">
        {busy ? "Post ho raha hai..." : "Kaam post karo"}
      </button>
    </main>
  );
}
