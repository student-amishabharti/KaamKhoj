"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Toggle from "@/components/Toggle";
import Icon from "@/components/Icon";
import { CATEGORIES } from "@/lib/categories";
import { useMe } from "@/lib/client";
import { catInfo } from "@/lib/format";

type Profile = {
  name: string; area: string; city: string; skills: string[]; available: boolean;
  work_note: string | null; is_learner: boolean;
  rating_avg: number; review_count: number; jobs_completed: number;
  recent_reviews: { stars: number; comment: string | null }[];
};
type Change = { skills?: string[]; available?: boolean; workNote?: string; isLearner?: boolean };

export default function WorkerPage() {
  const me = useMe();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [note, setNote] = useState("");
  const [editSkills, setEditSkills] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    const load = () =>
      fetch("/api/worker/profile").then((r) => r.json()).then((p) => {
        setProfile(p.profile);
        setNote(p.profile?.work_note ?? "");
        if (!p.profile?.skills?.length) setEditSkills(true);
      }).catch(() => {});
    load();
    // Voice se skills/available badle to page taaza ho jaaye
    window.addEventListener("kk:data-changed", load);
    return () => window.removeEventListener("kk:data-changed", load);
  }, [me]);

  // Har badlaav server par save hota hai; screen tabhi badalti hai jab save sach mein ho jaaye
  async function update(change: Change, okText: string) {
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const res = await fetch("/api/worker/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.profile);
      setSaved(okText);
    } catch (err) {
      setError((err as Error).message || "Save nahi hua. Internet check karo");
    } finally {
      setSaving(false);
    }
  }

  function toggleSkill(id: string) {
    if (!profile) return;
    const has = profile.skills.includes(id);
    const next = has ? profile.skills.filter((s) => s !== id) : [...profile.skills, id];
    update({ skills: next }, has ? `${catInfo(id).label} hata diya` : `${catInfo(id).label} jod diya`);
  }

  if (me === undefined) return <p className="p-6 text-center text-xl text-fg">Load ho raha hai...</p>;
  if (!me) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-bg p-6 text-center text-fg">
        <p className="text-xl">Pehle login karo</p>
        <Link href="/login?next=/worker" className="rounded-xl bg-brand px-8 py-4 text-xl font-bold text-bg">Login</Link>
      </main>
    );
  }
  if (!profile) return <p className="p-6 text-center text-xl text-fg">Profile load ho rahi hai...</p>;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 bg-bg p-4 pb-28 text-fg">
      <TopBar title="Kaam ki settings" />

      <Toggle
        label="Main aaj available hoon"
        sub={profile.available ? "Malik aapko list mein Available dekhenge" : "Abhi aap list mein Available nahi dikhoge"}
        checked={profile.available}
        disabled={saving}
        onChange={(v) => update({ available: v }, v ? "Ab aap Available ho" : "Ab aap Available nahi ho")}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          {profile.review_count ? (
            <p className="text-3xl font-extrabold"><span className="text-brand">★</span> {Number(profile.rating_avg).toFixed(1)}</p>
          ) : (
            <p className="text-xl font-extrabold">Naya kaarigar</p>
          )}
          <p className="text-sm text-muted">{profile.review_count ? `${profile.review_count} reviews se` : "Abhi koi review nahi"}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-3xl font-extrabold">{profile.jobs_completed}</p>
          <p className="text-sm text-muted">kaam poore kiye</p>
        </div>
      </div>

      {/* Mera kaam (skills) */}
      <section className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Main ye kaam karta hoon</h2>
          {profile.skills.length > 0 && (
            <button onClick={() => setEditSkills((e) => !e)} className="rounded-full border border-line px-4 py-1.5 text-sm font-bold text-brand hover:border-brand">
              {editSkills ? "Ho gaya" : "Badlo"}
            </button>
          )}
        </div>

        {!editSkills ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.skills.map((id) => (
              <li key={id} className="flex items-center gap-2 rounded-full bg-brand-soft px-3 py-2 font-semibold text-brand">
                <Icon name={catInfo(id).label.toLowerCase() as "painter"} className="h-5 w-5" />
                {catInfo(id).label}
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">Jo kaam aap karte ho, unhe dabao. Hare wale chune hue hain.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const on = profile.skills.includes(c.id);
                return (
                  <button key={c.id} disabled={saving} onClick={() => toggleSkill(c.id)} aria-pressed={on}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center transition ${
                      on ? "border-ok bg-ok/15" : "border-line bg-bg hover:border-brand"
                    }`}>
                    <Icon name={c.id} className={`h-6 w-6 ${on ? "text-ok" : "text-brand"}`} />
                    <span className="text-sm font-semibold">{c.label}</span>
                    <span className="text-xs text-muted">{on ? "Chuna hua" : "Jodo"}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Kaam chahiye message */}
      <section className="rounded-2xl border border-line bg-surface p-4">
        <label htmlFor="note" className="text-lg font-bold">Malik ke liye ek line (chahe to)</label>
        <p className="text-sm text-muted">Ye &quot;Kaarigar dekho&quot; mein aapke naam ke saath dikhegi.</p>
        <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={150} rows={2}
          placeholder="Jaise: Painting ka kaam chahiye, Supela ke paas"
          className="mt-2 w-full rounded-xl border-2 border-line bg-bg p-3 text-lg text-fg outline-none focus:border-brand" />
        <button disabled={saving || note === (profile.work_note ?? "")} onClick={() => update({ workNote: note }, "Line save ho gayi")}
          className="mt-2 rounded-xl bg-brand px-5 py-2.5 font-bold text-bg disabled:opacity-40">
          Save karo
        </button>
      </section>

      <Toggle
        label="Main kaam seekh raha hoon (helper)"
        sub="ON karne par malik ko aapke naam ke saath 'Helper' dikhega. Seekhte hue kaam aur paisa dono milenge."
        checked={profile.is_learner}
        disabled={saving}
        onChange={(v) => update({ isLearner: v }, v ? "Helper ON" : "Helper OFF")}
      />

      {saved && <p role="status" className="rounded-xl bg-ok/15 p-3 text-green-300">{saved}</p>}
      {error && <p role="alert" className="rounded-xl bg-danger/15 p-3 text-red-300">{error}</p>}

      <section>
        <h2 className="text-lg font-bold">Haal ke reviews</h2>
        {profile.recent_reviews.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-dashed border-line p-4 text-muted">
            Abhi koi review nahi. Pehla kaam poora hone ke baad malik ki rating yahan dikhegi.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {profile.recent_reviews.map((r, i) => (
              <li key={i} className="rounded-2xl border border-line bg-surface p-3">
                <span className="font-bold text-brand">{"★".repeat(r.stars)}</span>
                <span className="text-muted">{"★".repeat(5 - r.stars)}</span>
                {r.comment && <span className="ml-2 text-fg-2">{r.comment}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
