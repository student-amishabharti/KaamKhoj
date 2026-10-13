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
  note: string | null; status: string; area: string; area_id: number; applicants: Applicant[];
  withdrawn: string[];
};

// Haalat ke hisaab se hisse (asli status se: open / assigned / completed / cancelled + har kaarigar ka jawab)
type Tab = "booked" | "responses" | "open" | "invited" | "sent" | "done" | "closed";
type View = "customer" | "worker";
function postTab(p: Post): Tab {
  if (p.status === "assigned") return "booked";
  if (p.status === "completed") return "done";
  if (p.status === "cancelled") return "closed";
  return p.applicants.some((a) => a.status === "applied" || a.status === "invited") ? "responses" : "open";
}
function workerTab(j: WorkerJob): Tab {
  const live = j.job_status === "open" || j.job_status === "assigned";
  if (live && j.my_status === "selected") return "booked";
  if (live && j.my_status === "invited") return "invited";
  if (live && j.my_status === "applied") return "sent";
  if (j.job_status === "completed" && j.my_status === "selected") return "done";
  return "closed";
}
const TABS: Record<View, { id: Tab; label: string; empty: string }[]> = {
  customer: [
    { id: "booked", label: "Pakki booking", empty: "Abhi koi pakki booking nahi. Jab aap kisi kaarigar ko chunoge, wo yahan dikhega." },
    { id: "responses", label: "Jawab aaye", empty: "Abhi kisi kaam par kaarigar ka jawab nahi aaya." },
    { id: "open", label: "Khule", empty: "Koi khula kaam nahi. Naya kaam post karo." },
    { id: "done", label: "Poore", empty: "Abhi koi kaam poora nahi hua." },
    { id: "closed", label: "Cancel", empty: "Koi cancel kaam nahi." },
  ],
  worker: [
    { id: "booked", label: "Chune gaye", empty: "Abhi aap kisi kaam ke liye chune nahi gaye. Malik chunega to yahan number ke saath dikhega." },
    { id: "invited", label: "Bulaya gaya", empty: "Abhi kisi malik ne aapko seedha nahi bulaya." },
    { id: "sent", label: "Request bheji", empty: "Aapne abhi kisi kaam par 'Main aaunga' nahi kaha." },
    { id: "done", label: "Poore", empty: "Abhi koi kaam poora nahi hua." },
    { id: "closed", label: "Band", empty: "Koi band kaam nahi." },
  ],
};
type Nearby = {
  id: number; name: string; available: boolean; is_learner: boolean; rating_avg: number;
  review_count: number; jobs_completed: number; distance_km: number;
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

// Post ke baad: is kaam ke paas wale kaarigar, "Isko bulao" ke saath
function NearbyWorkers({ post, busy, startOpen, onInvite }: {
  post: Post; busy: boolean; startOpen: boolean; onInvite: (w: Nearby) => void;
}) {
  const [show, setShow] = useState(startOpen);
  const [list, setList] = useState<Nearby[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!show || list) return;
    fetch(`/api/search?category=${post.category}&areaId=${post.area_id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setList(d.workers);
      })
      .catch((e) => setErr(e.message || "Load nahi hua"));
  }, [show, list, post.category, post.area_id]);

  const already = new Set(post.applicants.map((a) => a.worker_id));
  const rest = (list ?? []).filter((w) => !already.has(w.id)).slice(0, 5);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className={`${btn} mt-3 w-full border border-line text-fg-2`}>
        Paas ke {catInfo(post.category).label} dekho aur bulao
      </button>
    );
  }
  return (
    <div className="mt-3 rounded-xl border border-line bg-bg p-3">
      <p className="font-bold">Paas ke {catInfo(post.category).label} ({post.area} se)</p>
      <p className="text-xs text-muted">Inko bulaoge to inhe ye kaam dikhega. Haan kahenge tab booking pakki.</p>
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
      {!list && !err && <p className="mt-2 text-sm text-muted">Dhoondh rahe hain...</p>}
      {list && rest.length === 0 && <p className="mt-2 text-sm text-muted">Aur koi kaarigar nahi mila. Jo haan kahenge wo upar dikhenge.</p>}
      <ul className="mt-2 flex flex-col gap-2">
        {rest.map((w) => (
          <li key={w.id} className="flex items-center justify-between gap-2 rounded-lg border border-line p-2">
            <div className="min-w-0">
              <p className="font-bold">
                {w.name}
                {!w.available && <span className="ml-2 text-xs font-normal text-muted">abhi busy</span>}
                {w.is_learner && <span className="ml-2 text-xs font-normal text-muted">Helper</span>}
              </p>
              <p className="text-xs text-fg-2">{ratingText(w.rating_avg, w.review_count)} · {distLabel(w.distance_km)}</p>
            </div>
            <button disabled={busy} onClick={() => onInvite(w)} className={`${btn} shrink-0 bg-brand text-bg`}>
              Isko bulao
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MyJobsPage() {
  const me = useMe();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [postedId, setPostedId] = useState(0);
  const [tab, setTab] = useState<Tab | null>(null);
  const [view, setView] = useState<View | null>(null);
  const acting = useRef(false); // ek action chal raha ho to doosra nahi

  const load = useCallback(async () => {
    if (!view) return;
    try {
      const res = await fetch(`/api/jobs?as=${view}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch (err) {
      setError((err as Error).message || "Load nahi hua. Internet check karo");
    }
  }, [view]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("view");
    // Ek account dono: malik wala hissa ya kaarigar wala. Na bataya ho to abhi ke iraade se.
    if (v === "customer" || v === "worker") setView(v);
    else if (q.get("posted")) setView("customer");
    const focusJob = Number(q.get("job"));
    if (focusJob) { setView("customer"); setPostedId(focusJob); }
    const posted = Number(q.get("posted"));
    if (posted) {
      setPostedId(posted);
      setNotice("Kaam post ho gaya. Kaarigar haan kahenge to yahan dikhenge. Neeche paas ke kaarigar ko khud bhi bula sakte ho.");
    }
  }, []);

  useEffect(() => {
    if (me && !view) setView(me.role === "customer" ? "customer" : "worker");
  }, [me, view]);

  useEffect(() => {
    if (!me || !view) return;
    load();
    const on = () => { load(); };
    window.addEventListener("kk:data-changed", on);
    return () => window.removeEventListener("kk:data-changed", on);
  }, [me, view, load]);

  // Pehli baar: jahan kuch ho wahi hissa kholo
  useEffect(() => {
    if (!data || tab) return;
    const tabs = data.role === "customer" ? data.posts.map(postTab) : data.jobs.map(workerTab);
    if (postedId && data.role === "customer") {
      const p = data.posts.find((x) => x.id === postedId);
      if (p) { setTab(postTab(p)); return; }
    }
    const order = TABS[data.role].map((t) => t.id);
    setTab(order.find((t) => tabs.includes(t)) ?? order[0]);
  }, [data, tab, postedId]);

  function switchView(v: View) {
    if (v === view) return;
    setData(null);
    setTab(null);
    setView(v);
    window.history.replaceState(null, "", `/jobs?view=${v}`);
  }

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-3 bg-bg p-4 pb-28 text-fg">
      <TopBar title="Mera kaam" />
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
        {(["customer", "worker"] as View[]).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => switchView(v)}
            className={`rounded-xl py-3 text-sm font-extrabold transition sm:text-base ${view === v ? "bg-brand text-bg" : "text-fg-2 hover:bg-surface-2"}`}>
            {v === "customer" ? "Meri bookings (malik)" : "Mere kaam (kaarigar)"}
          </button>
        ))}
      </div>
      {notice && <p role="status" className="rounded-xl bg-ok/15 p-3 text-green-300">{notice}</p>}
      {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{error}</p>}
      {!data && !error && <p className="py-6 text-center text-lg text-muted">Load ho raha hai...</p>}

      {data && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Haalat">
          {TABS[data.role].map(({ id: t, label }) => {
            const n = data.role === "customer"
              ? data.posts.filter((p) => postTab(p) === t).length
              : data.jobs.filter((j) => workerTab(j) === t).length;
            return (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${tab === t ? "border-brand bg-brand text-bg" : "border-line text-fg-2 hover:border-brand"}`}>
                {label} <span className="opacity-80">({n})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ---------- Malik ki taraf ---------- */}
      {data?.role === "customer" && (
        <>
          <Link href="/post" className="rounded-xl bg-brand p-3 text-center text-lg font-extrabold text-bg">
            + Naya kaam post karo
          </Link>
          {tab && data.posts.filter((p) => postTab(p) === tab).length === 0 && (
            <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">{TABS.customer.find((x) => x.id === tab)?.empty}</p>
          )}

          {data.posts.filter((p) => postTab(p) === tab).map((p) => {
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
                {p.status === "cancelled" && <p className="mt-2 font-semibold text-red-300">Aapne ye kaam cancel kiya</p>}
                {p.withdrawn?.length > 0 && (
                  <p className="mt-2 rounded-lg bg-warn/10 p-2 text-sm text-warn">
                    {p.withdrawn.join(", ")} ne mana / cancel kar diya{p.status === "open" ? ". Kaam phir khula hai, doosra kaarigar chun sakte ho." : "."}
                  </p>
                )}

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

                      {a.status === "invited" && live && <p className="mt-2 rounded-lg bg-brand-soft p-2 text-sm text-fg-2">Invitation bheja gaya. Kaarigar ke jawab ka intezaar.</p>}

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

                {p.status === "open" && (
                  <NearbyWorkers post={p} busy={busy} startOpen={p.id === postedId}
                    onInvite={(w) => act(p.id, { action: "invite", workerId: w.id }, `${w.name} ko bula liya. Wo haan kahenge to booking pakki.`)} />
                )}

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
          <Link href="/explore?tab=jobs" className="rounded-xl bg-brand p-3 text-center text-lg font-extrabold text-bg">
            Naye kaam dekho
          </Link>
          {tab && data.jobs.filter((j) => workerTab(j) === tab).length === 0 && (
            <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">{TABS.worker.find((x) => x.id === tab)?.empty}</p>
          )}

          {data.jobs.filter((j) => workerTab(j) === tab).map((j) => {
            const live = j.job_status === "open" || j.job_status === "assigned";
            return (
              <section key={j.id} className={`rounded-2xl border border-line bg-surface p-4 ${live && j.my_status !== "withdrawn" ? "" : "opacity-80"}`}>
                <div className="flex items-start justify-between gap-2">
                  <When j={j} />
                  <Pill status={j.job_status} />
                </div>
                <p className="text-sm text-muted">{j.customer_name} · {j.area}, {j.city} · {distLabel(j.distance_km)}</p>
                <Link href={`/kaam/${j.id}`} className="mt-1 inline-block text-sm font-bold text-brand underline">Poori jaankari</Link>
                {j.note && <p className="mt-2 rounded-lg bg-bg p-2 text-fg-2">{j.note}</p>}

                {j.my_status === "invited" && live && (
                  <div className="mt-3">
                    <p className="font-semibold">Malik ne aapko seedha bulaya hai</p>
                    <p className="text-sm text-muted">Haan kahoge to malik ko pata chalega. Malik chunega tab booking pakki hogi aur number dikhega.</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button disabled={busy} className={`${btn} bg-brand text-bg`}
                        onClick={() => act(j.id, { action: "accept_invite" }, "Aapne haan kaha. Malik chunega to number dikhega.")}>Haan, aaunga</button>
                      <button disabled={busy} className={`${btn} border border-line`}
                        onClick={() => act(j.id, { action: "withdraw" }, "Aapne mana kar diya", "Is kaam ke liye mana karna hai?")}>Mana</button>
                    </div>
                  </div>
                )}

                {j.my_status === "applied" && live && (
                  <div className="mt-3">
                    <p className="rounded-xl bg-bg p-3 text-fg-2"><b className="text-fg">Request bhej di gayi.</b> Malik chunega to yahan number dikhega.</p>
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
