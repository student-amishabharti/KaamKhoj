"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { CATEGORIES } from "@/lib/categories";
import { postJson, useMe } from "@/lib/client";
import { catInfo, dayLabel, timeLabel, todayPlus } from "@/lib/format";

const DAYS = [0, 1, 2];
const TIMES = ["09:00", "10:00", "14:00", "17:00"];
const HOURS = [1, 2, 4, 8];

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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // AI ya "Bulao" button se aaye to form pehle se bhara hota hai
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
    setError("");
    setBusy(true);
    try {
      await postJson("/api/jobs", {
        category, workDate, startTime, hours, note,
        inviteWorkerId: invite?.id,
      });
      router.push("/jobs");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (me === undefined) return <p className="p-6 text-center text-xl">Load ho raha hai...</p>;
  if (!me || me.role !== "customer") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-xl">Kaam post karne ke liye malik (customer) ke roop mein login karo</p>
        <Link href="/login" className="rounded-2xl bg-orange-600 px-8 py-4 text-2xl font-bold text-white">📱 Login</Link>
      </main>
    );
  }

  const chip = (on: boolean) =>
    `rounded-2xl border-2 px-3 py-3 text-lg font-semibold ${on ? "border-orange-600 bg-orange-100" : "border-orange-200 bg-white"}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-32">
      <TopBar title="Kaam post karo" />

      {fromAi && (
        <p className="rounded-2xl bg-blue-100 p-3 text-blue-900">
          🤖 AI ne aapki baat se form bhara hai. Check karo, fir <b>Confirm</b> dabao.
        </p>
      )}
      {invite && (
        <p className="rounded-2xl bg-green-100 p-3 text-green-900">
          👷 Ye kaam seedha <b>{invite.name}</b> ko jaayega
        </p>
      )}

      <h2 className="text-xl font-bold">1. Kaunsa kaam?</h2>
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`flex flex-col items-center rounded-2xl border-2 p-2 ${
              category === c.id ? "border-orange-600 bg-orange-100" : "border-orange-200 bg-white"
            }`}>
            <span className="text-4xl">{c.icon}</span>
            <span className="text-sm font-semibold">{c.label}</span>
            <span className="text-xs text-gray-600">{c.hi}</span>
          </button>
        ))}
      </div>

      <h2 className="text-xl font-bold">2. Kis din?</h2>
      <div className="grid grid-cols-3 gap-2">
        {DAYS.map((d) => (
          <button key={d} className={chip(workDate === todayPlus(d))} onClick={() => setWorkDate(todayPlus(d))}>
            {dayLabel(todayPlus(d))}
          </button>
        ))}
      </div>
      <input type="date" min={todayPlus(0)} value={workDate} onChange={(e) => setWorkDate(e.target.value)}
        className="rounded-2xl border-2 border-orange-200 bg-white p-3 text-lg" />

      <h2 className="text-xl font-bold">3. Kitne baje?</h2>
      <div className="grid grid-cols-2 gap-2">
        {TIMES.map((t) => (
          <button key={t} className={chip(startTime === t)} onClick={() => setStartTime(t)}>
            {timeLabel(t)}
          </button>
        ))}
      </div>
      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
        className="rounded-2xl border-2 border-orange-200 bg-white p-3 text-lg" />

      <h2 className="text-xl font-bold">4. Kitne ghante ka kaam?</h2>
      <div className="grid grid-cols-4 gap-2">
        {HOURS.map((h) => (
          <button key={h} className={chip(hours === h)} onClick={() => setHours(h)}>
            {h} ghanta
          </button>
        ))}
      </div>

      <h2 className="text-xl font-bold">5. Kuch aur batana hai? (chahe to)</h2>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} rows={2}
        placeholder="Jaise: do kamre paint karne hain"
        className="rounded-2xl border-2 border-orange-200 bg-white p-3 text-lg" />

      {category && (
        <div className="rounded-2xl bg-white p-4 text-lg shadow">
          {catInfo(category).icon} <b>{catInfo(category).label}</b> · {dayLabel(workDate)} · {timeLabel(startTime)} · {hours} ghante
          <br />
          <span className="text-gray-600">📍 {me.area_name} (sirf area dikhega, pura pata nahi)</span>
        </div>
      )}

      {error && <p className="rounded-2xl bg-red-100 p-4 text-lg text-red-700">{error}</p>}

      <button onClick={submit} disabled={busy || !category}
        className="rounded-3xl bg-orange-600 p-5 text-2xl font-bold text-white shadow disabled:opacity-50">
        ✅ Confirm, kaam post karo
      </button>
    </main>
  );
}