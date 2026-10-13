"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import SafetyBar from "@/components/SafetyBar";
import { postJson, useMe } from "@/lib/client";
import { catInfo, dayLabel, distLabel, JOB_STATUS, ratingText, timeLabel } from "@/lib/format";

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

const btn = "rounded-xl px-4 py-2.5 text-base font-bold transition disabled:opacity-50";

function Pill({ status }: { status: string }) {
  const s = JOB_STATUS[status] ?? { text: status, cls: "bg-gray-100" };
  return <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${s.cls}`}>{s.text}</span>;
}

function When({ j }: { j: { category: string; work_date: string; start_time: string; hours: number } }) {
  return (
    <p className="text-lg font-bold">
      {catInfo(j.category).label} · {dayLabel(j.work_date)}, {timeLabel(j.start_time)} · {j.hours} ghante
    </p>
  );
}

function Phone({ phone, label }: { phone: string; label: string }) {
  return (
    <a href={`tel:${phone}`} className="mt-2 block rounded-xl bg-ok p-3 text-center text-lg font-extrabold text-bg">
      {label}: +91 {phone}
    </a>
  );
}

export default function MyJobsPage() {
  const me = useMe();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const acting = useRef(false); // ek action chal raha ho to doosra nahi

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch (err) {
      setError((err as Error).message || "Load nahi hua. Internet check karo");
    }
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("posted")) {
      setNotice("Kaam post ho gaya. Kaarigar haan kahenge to yahan dikhenge.");
    }
  }, []);

  useEffect(() => {
    if (me) load();
  }, [me, load]);

  async function act(jobId: number, body: object, okText: string, ask?: string) {
    if (acting.current) return;
    if (ask && !window.confirm(ask)) return;
    acting.current = true;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await postJson(`/api/jobs/${jobId}`, body);
      setNotice(okText);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      await load(); // jo bhi hua, screen par asli haal dikhao
      acting.current = false;
      setBusy(false);
    }
  }

  async function report(userId: number, jobId: number) {
    const reason = window.prompt("Kya galat hua? Likho, fir OK dabao.\n(Report ke baad ye vyakti aapko nahi dikhega)");
    if (reason === null) return;
    try {
      await postJson("/api/report", { userId, jobId, reason, block: true });
      setNotice("Shikayat darj ho gayi. Ye vyakti ab aapko nahi dikhega.");
      await load();
    } catch (err) {
      setError((err as Error).message);
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

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 bg-bg p-4 pb-16 text-fg">
      <TopBar title={me.role === "customer" ? "Meri bookings" : "Mere kaam"} />
      {notice && <p role="status" className="rounded-xl bg-ok/15 p-3 text-green-300">{notice}</p>}
      {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{error}</p>}
      {!data && !error && <p className="py-6 text-center text-lg text-muted">Load ho raha hai...</p>}

      {/* ---------- Malik ki taraf ---------- */}
      {data?.role === "customer" && (
        <>
          <Link href="/post" className="rounded-xl bg-brand p-3 text-center text-lg font-extrabold text-bg">
            + Naya kaam post karo
          </Link>
          {data.posts.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">Abhi koi kaam post nahi kiya</p>
          )}

          {data.posts.map((p) => {
            const live = p.status === "open" || p.status === "assigned";
            const chosen = p.applicants.filter((a) => a.status === "selected");
            return (
              <section key={p.id} className={`rounded-2xl border border-line bg-surface p-4 ${live ? "" : "opacity-80"}`}>
                <div className="flex items-start justify-between gap-2">
                  <When j={p} />
                  <Pill status={p.status} />
                </div>
                <p className="text-sm text-muted">{p.area}</p>
                {p.note && <p className="mt-2 rounded-lg bg-bg p-2 text-fg-2">{p.note}</p>}

                {p.status === "open" && p.applicants.length === 0 && (
                  <p className="mt-3 rounded-xl bg-bg p-3 text-fg-2">Abhi kisi kaarigar ne haan nahi kaha. Jaise hi koi haan kahega, yahan dikhega.</p>
                )}

                {p.applicants.length > 0 && (
                  <h3 className="mt-3 font-bold text-fg-2">
                    {p.status === "open" ? `${p.applicants.length} kaarigar aane ko taiyaar:` : "Kaarigar:"}
                  </h3>
                )}

                <ul className="mt-2 flex flex-col gap-2">
                  {p.applicants.map((a) => (
                    <li key={a.worker_id} className="rounded-xl border border-line bg-bg p-3">
                      <p className="text-lg font-bold">
                        {a.name}
                        {a.is_learner && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Helper</span>}
                      </p>
                      <p className="text-sm text-fg-2">
                        {ratingText(a.rating_avg, a.review_count)} · {a.jobs_completed} kaam poore · {distLabel(a.distance_km)}
                      </p>
                      {a.recent_comments.map((c, i) => (
                        <p key={i} className="text-sm italic text-muted">“{c}”</p>
                      ))}

                      {a.status === "invited" && live && <p className="mt-2 text-sm text-fg-2">Bulaya gaya hai. Kaarigar ke jawab ka intezaar.</p>}

                      {a.status === "applied" && live && (
                        <button disabled={busy} onClick={() => act(p.id, { action: "select", workerId: a.worker_id }, `${a.name} ko chun liya. Ab number dikh raha hai.`)}
                          className={`${btn} mt-2 w-full bg-brand text-bg`}>
                          Isko chuno
                        </button>
                      )}

                      {a.status === "selected" && a.phone && <Phone phone={a.phone} label="Call karo" />}

                      {a.status === "selected" && p.status === "assigned" && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button disabled={busy} className={`${btn} border border-line`}
                            onClick={() => act(p.id, { action: "unselect", workerId: a.worker_id }, `${a.name} hata diye gaye`,
                              `${a.name} ko is kaam se hatana hai? Agar koi aur chuna hua nahi bacha to kaam phir khula ho jaayega.`)}>
                            Hatao
                          </button>
                          <button className={`${btn} border border-line`} onClick={() => report(a.worker_id, p.id)}>
                            Report
                          </button>
                        </div>
                      )}

                      {a.status === "selected" && p.status === "completed" && (
                        a.my_stars ? (
                          <p className="mt-2 text-fg-2">Aapne <span className="text-brand">{"★".repeat(a.my_stars)}</span> diye</p>
                        ) : (
                          <div className="mt-2">
                            <p className="font-semibold">Kaam kaisa tha? Star chuno:</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} disabled={busy} className="rounded-lg border border-line px-3 py-2 text-lg font-bold text-brand hover:border-brand"
                                  onClick={() => {
                                    const comment = window.prompt("Ek line mein kuch likhna hai? (chahe to khaali chhodo)") ?? "";
                                    act(p.id, { action: "review", workerId: a.worker_id, stars: s, comment }, "Rating save ho gayi. Dhanyavaad!");
                                  }}>
                                  {s} ★
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
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {p.status === "assigned" && (
                      <button disabled={busy} className={`${btn} bg-ok/15 text-green-300`}
                        onClick={() => act(p.id, { action: "complete" }, "Kaam poora ho gaya. Ab rating do.", "Kya kaam sach mein poora ho gaya?")}>
                        Kaam poora hua
                      </button>
                    )}
                    <button disabled={busy} className={`${btn} bg-danger/15 text-red-300`}
                      onClick={() => act(p.id, { action: "cancel" }, "Kaam cancel ho gaya",
                        "Poora kaam cancel karna hai? Kaarigaron ko bataya jaayega aur ye kaam wapas nahi khulega.")}>
                      Kaam cancel karo
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
          <Link href="/open" className="rounded-xl bg-brand p-3 text-center text-lg font-extrabold text-bg">
            Naye kaam dekho
          </Link>
          {data.jobs.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">Abhi koi kaam nahi. Naye kaam dekho.</p>
          )}

          {data.jobs.map((j) => {
            const live = j.job_status === "open" || j.job_status === "assigned";
            return (
              <section key={j.id} className={`rounded-2xl border border-line bg-surface p-4 ${live && j.my_status !== "withdrawn" ? "" : "opacity-80"}`}>
                <div className="flex items-start justify-between gap-2">
                  <When j={j} />
                  <Pill status={j.job_status} />
                </div>
                <p className="text-sm text-muted">{j.customer_name} · {j.area}, {j.city} · {distLabel(j.distance_km)}</p>
                {j.note && <p className="mt-2 rounded-lg bg-bg p-2 text-fg-2">{j.note}</p>}

                {j.my_status === "invited" && live && (
                  <div className="mt-3">
                    <p className="font-semibold">Malik ne aapko seedha bulaya hai</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button disabled={busy} className={`${btn} bg-brand text-bg`}
                        onClick={() => act(j.id, { action: "accept_invite" }, "Aapne haan kaha. Malik ka number dikh raha hai.")}>Aaunga</button>
                      <button disabled={busy} className={`${btn} border border-line`}
                        onClick={() => act(j.id, { action: "withdraw" }, "Aapne mana kar diya", "Is kaam ke liye mana karna hai?")}>Mana</button>
                    </div>
                  </div>
                )}

                {j.my_status === "applied" && live && (
                  <div className="mt-3">
                    <p className="rounded-xl bg-bg p-3 text-fg-2">Aapne haan kaha. Malik ke jawab ka intezaar.</p>
                    <button disabled={busy} className={`${btn} mt-2 w-full border border-line`}
                      onClick={() => act(j.id, { action: "withdraw" }, "Aapne apna haan wapas liya", "Apna haan wapas lena hai?")}>Wapas lo</button>
                  </div>
                )}

                {j.my_status === "selected" && j.customer_phone && (
                  <Phone phone={j.customer_phone} label="Malik ko call karo" />
                )}

                {j.my_status === "selected" && j.job_status === "assigned" && (
                  <>
                    <p className="mt-2 text-sm text-muted">Paise aur pata phone par tay karo.</p>
                    <SafetyBar summary={`${catInfo(j.category).label}, ${dayLabel(j.work_date)} ${timeLabel(j.start_time)}, ${j.area}. Malik: ${j.customer_name}`} />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button disabled={busy} className={`${btn} bg-danger/15 text-red-300`}
                        onClick={() => act(j.id, { action: "withdraw" }, "Aapne kaam cancel kiya. Malik doosra kaarigar chun sakega.",
                          "Emergency mein cancel karna hai? Malik ko pata chalega aur wo doosra kaarigar chun sakega.")}>
                        Cancel
                      </button>
                      <button className={`${btn} border border-line`} onClick={() => report(j.customer_id, j.id)}>Report</button>
                    </div>
                  </>
                )}

                {j.job_status === "cancelled" && <p className="mt-2 text-red-300">Malik ne ye kaam cancel kar diya</p>}
                {j.my_status === "rejected" && <p className="mt-2 text-muted">Malik ne kisi aur ko chuna</p>}
                {j.my_status === "withdrawn" && <p className="mt-2 text-muted">Aapne mana / cancel kiya</p>}
                {j.my_status === "selected" && j.job_status === "completed" && <p className="mt-2 text-green-300">Kaam poora hua</p>}
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
