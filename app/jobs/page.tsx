"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import SafetyBar from "@/components/SafetyBar";
import { postJson, useMe } from "@/lib/client";
import { catInfo, dayLabel, JOB_STATUS, timeLabel } from "@/lib/format";

type Applicant = {
  worker_id: number; name: string; status: string; phone: string | null; is_learner: boolean;
  rating_avg: number; review_count: number; jobs_completed: number; distance_km: number;
  my_stars: number | null; recent_comments: string[];
};
type Post = {
  id: number; category: string; work_date: string; start_time: string; hours: number;
  note: string | null; status: string; area: string; applicants: Applicant[];
};
type WorkerJob = {
  id: number; category: string; work_date: string; start_time: string; hours: number; note: string | null;
  job_status: string; my_status: string; area: string; city: string; customer_id: number;
  customer_name: string; customer_phone: string | null; distance_km: number;
};
type Data = { role: "customer"; posts: Post[] } | { role: "worker"; jobs: WorkerJob[] };

const btn = "rounded-2xl px-4 py-3 text-lg font-bold";

function Pill({ status }: { status: string }) {
  const s = JOB_STATUS[status] ?? { text: status, cls: "bg-gray-100" };
  return <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${s.cls}`}>{s.text}</span>;
}

function When({ j }: { j: { category: string; work_date: string; start_time: string; hours: number } }) {
  const c = catInfo(j.category);
  return (
    <p className="text-xl font-bold">
      {c.icon} {c.label} · {dayLabel(j.work_date)}, {timeLabel(j.start_time)} · {j.hours} ghante
    </p>
  );
}

function Phone({ phone, label }: { phone: string; label: string }) {
  return (
    <a href={`tel:${phone}`} className="mt-2 block rounded-2xl bg-green-600 p-3 text-center text-xl font-bold text-white">
      📞 {label}: {phone}
    </a>
  );
}

export default function MyJobsPage() {
  const me = useMe();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/jobs");
    const d = await res.json();
    if (!res.ok) setError(d.error);
    else setData(d);
  }, []);

  useEffect(() => {
    if (me) load();
  }, [me, load]);

  async function act(jobId: number, body: object, ask?: string) {
    if (ask && !window.confirm(ask)) return;
    setError("");
    setBusy(true);
    try {
      await postJson(`/api/jobs/${jobId}`, body);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function report(userId: number, jobId: number) {
    const reason = window.prompt("Kya galat hua? (likho, fir OK)");
    if (reason === null) return;
    try {
      await postJson("/api/report", { userId, jobId, reason, block: true });
      window.alert("Shikayat darj ho gayi. Ye vyakti ab aapko nahi dikhega.");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (me === undefined) return <p className="p-6 text-center text-xl">Load ho raha hai...</p>;
  if (me === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6">
        <p className="text-xl">Pehle login karo</p>
        <Link href="/login" className="rounded-2xl bg-orange-600 px-8 py-4 text-2xl font-bold text-white">📱 Login</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-32">
      <TopBar title="Mere kaam" />
      {error && <p className="rounded-2xl bg-red-100 p-4 text-lg text-red-700">{error}</p>}
      {!data && !error && <p className="text-center text-xl">Load ho raha hai...</p>}

      {/* ---------- Malik ki taraf ---------- */}
      {data?.role === "customer" && (
        <>
          <Link href="/post" className="rounded-3xl bg-orange-600 p-4 text-center text-2xl font-bold text-white shadow">
            ➕ Naya kaam post karo
          </Link>
          {data.posts.length === 0 && <p className="text-center text-lg">Abhi koi kaam post nahi kiya</p>}

          {data.posts.map((p) => {
            const live = p.status === "open" || p.status === "assigned";
            const chosen = p.applicants.filter((a) => a.status === "selected");
            return (
              <section key={p.id} className="rounded-3xl bg-white p-4 shadow">
                <div className="flex items-start justify-between gap-2">
                  <When j={p} />
                  <Pill status={p.status} />
                </div>
                <p className="text-gray-600">📍 {p.area}</p>
                {p.note && <p className="mt-1 text-gray-800">📝 {p.note}</p>}

                {live && p.applicants.length === 0 && (
                  <p className="mt-3 rounded-2xl bg-yellow-50 p-3">⏳ Abhi kisi kaarigar ne haan nahi kaha. Thoda intezaar karo.</p>
                )}

                {p.applicants.length > 0 && (
                  <h3 className="mt-3 text-lg font-bold">
                    {p.status === "open" ? "Ye kaarigar aane ko taiyaar hain:" : "Kaarigar:"}
                  </h3>
                )}

                <ul className="flex flex-col gap-3">
                  {p.applicants.map((a) => (
                    <li key={a.worker_id} className="rounded-2xl border-2 border-orange-100 p-3">
                      <p className="text-xl font-bold">
                        {a.name}
                        {a.is_learner && <span className="ml-2 rounded-full bg-blue-100 px-2 text-sm text-blue-800">🎓 Seekhne wala (helper)</span>}
                      </p>
                      <p className="text-lg">
                        ⭐ {a.rating_avg} ({a.review_count} reviews) · 🧰 {a.jobs_completed} kaam · 📍 {a.distance_km} km
                      </p>
                      {a.recent_comments.map((c, i) => (
                        <p key={i} className="text-gray-600 italic">“{c}”</p>
                      ))}

                      {a.status === "invited" && live && <p className="mt-2 text-gray-700">📨 Bulaya gaya, jawab ka intezaar</p>}

                      {a.status === "applied" && live && (
                        <button disabled={busy} onClick={() => act(p.id, { action: "select", workerId: a.worker_id })}
                          className={`${btn} mt-2 w-full bg-orange-600 text-white`}>
                          ✅ Isko bulao
                        </button>
                      )}

                      {a.status === "selected" && a.phone && <Phone phone={a.phone} label="Call karo" />}

                      {a.status === "selected" && p.status === "assigned" && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button disabled={busy} className={`${btn} bg-gray-100`}
                            onClick={() => act(p.id, { action: "unselect", workerId: a.worker_id }, `${a.name} ko hatana hai?`)}>
                            ↩️ Hatao
                          </button>
                          <button className={`${btn} bg-gray-100`} onClick={() => report(a.worker_id, p.id)}>
                            🚩 Report
                          </button>
                        </div>
                      )}

                      {a.status === "selected" && p.status === "completed" && (
                        a.my_stars ? (
                          <p className="mt-2 text-lg">Aapne {"⭐".repeat(a.my_stars)} diye</p>
                        ) : (
                          <div className="mt-2">
                            <p className="font-semibold">Kaam kaisa tha? Star dabao:</p>
                            <div className="mt-1 flex gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} disabled={busy} className="rounded-xl bg-yellow-100 px-3 py-2 text-2xl"
                                  onClick={() => {
                                    const comment = window.prompt("Ek line mein kuch likhna hai? (chahe to khaali chhodo)") ?? "";
                                    act(p.id, { action: "review", workerId: a.worker_id, stars: s, comment });
                                  }}>
                                  {s}⭐
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </li>
                  ))}
                </ul>

                {p.status === "assigned" && chosen.length > 0 && (
                  <SafetyBar summary={`${catInfo(p.category).label}, ${dayLabel(p.work_date)} ${timeLabel(p.start_time)}, ${p.area}. Kaarigar: ${chosen.map((c) => c.name).join(", ")}`} />
                )}

                {live && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {p.status === "assigned" ? (
                      <button disabled={busy} className={`${btn} bg-green-100 text-green-900`}
                        onClick={() => act(p.id, { action: "complete" }, "Kaam poora ho gaya?")}>
                        ✔️ Kaam poora
                      </button>
                    ) : <span />}
                    <button disabled={busy} className={`${btn} bg-red-100 text-red-800`}
                      onClick={() => act(p.id, { action: "cancel" }, "Pakka poora kaam cancel karna hai?")}>
                      ❌ Cancel
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}

      {/* ---------- Kaarigar ki taraf ---------- */}
      {data?.role === "worker" && (
        <>
          <Link href="/open" className="rounded-3xl bg-orange-600 p-4 text-center text-2xl font-bold text-white shadow">
            🔔 Khule kaam dekho
          </Link>
          {data.jobs.length === 0 && <p className="text-center text-lg">Abhi koi kaam nahi. Khule kaam dekho.</p>}

          {data.jobs.map((j) => {
            const live = j.job_status === "open" || j.job_status === "assigned";
            return (
              <section key={j.id} className="rounded-3xl bg-white p-4 shadow">
                <div className="flex items-start justify-between gap-2">
                  <When j={j} />
                  <Pill status={j.job_status} />
                </div>
                <p className="text-gray-700">🙂 {j.customer_name} · 📍 {j.area}, {j.city} · {j.distance_km} km</p>
                {j.note && <p className="mt-1 text-gray-800">📝 {j.note}</p>}

                {j.my_status === "invited" && live && (
                  <div className="mt-3">
                    <p className="font-semibold">📨 Malik ne aapko seedha bulaya hai</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button disabled={busy} className={`${btn} bg-orange-600 text-white`}
                        onClick={() => act(j.id, { action: "accept_invite" })}>✅ Aaunga</button>
                      <button disabled={busy} className={`${btn} bg-gray-100`}
                        onClick={() => act(j.id, { action: "withdraw" }, "Mana karna hai?")}>🙅 Mana</button>
                    </div>
                  </div>
                )}

                {j.my_status === "applied" && live && (
                  <div className="mt-3">
                    <p className="rounded-2xl bg-yellow-50 p-3">⏳ Aapne haan kaha. Malik ke jawab ka intezaar.</p>
                    <button disabled={busy} className={`${btn} mt-2 w-full bg-gray-100`}
                      onClick={() => act(j.id, { action: "withdraw" }, "Wapas lena hai?")}>↩️ Wapas lo</button>
                  </div>
                )}

                {j.my_status === "selected" && j.customer_phone && (
                  <Phone phone={j.customer_phone} label="Malik ko call karo" />
                )}

                {j.my_status === "selected" && j.job_status === "assigned" && (
                  <>
                    <p className="mt-2 text-gray-700">Paise aur pata phone par tay karo.</p>
                    <SafetyBar summary={`${catInfo(j.category).label}, ${dayLabel(j.work_date)} ${timeLabel(j.start_time)}, ${j.area}. Malik: ${j.customer_name}`} />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button disabled={busy} className={`${btn} bg-red-100 text-red-800`}
                        onClick={() => act(j.id, { action: "withdraw" }, "Emergency mein cancel karna hai? Malik doosra kaarigar chun sakega.")}>
                        ❌ Cancel
                      </button>
                      <button className={`${btn} bg-gray-100`} onClick={() => report(j.customer_id, j.id)}>🚩 Report</button>
                    </div>
                  </>
                )}

                {j.job_status === "cancelled" && <p className="mt-2 text-red-700">Malik ne kaam cancel kar diya</p>}
                {j.my_status === "rejected" && <p className="mt-2 text-gray-600">Malik ne kisi aur ko chuna</p>}
                {j.my_status === "withdrawn" && <p className="mt-2 text-gray-600">Aapne mana / cancel kiya</p>}
                {j.my_status === "selected" && j.job_status === "completed" && <p className="mt-2 text-green-700">✔️ Kaam poora hua</p>}
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}