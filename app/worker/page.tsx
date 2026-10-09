"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { CATEGORIES } from "@/lib/categories";
import { useMe } from "@/lib/client";

type Profile = {
  name: string; area: string; city: string; skills: string[]; available: boolean;
  work_note: string | null; is_learner: boolean;
  rating_avg: number; review_count: number; jobs_completed: number;
  recent_reviews: { stars: number; comment: string | null }[];
};

export default function WorkerPage() {
  const me = useMe();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me && me.role !== "customer") {
      fetch("/api/worker/profile").then((r) => r.json()).then((p) => {
        setProfile(p.profile);
        setNote(p.profile?.work_note ?? "");
      });
    }
  }, [me]);

  async function update(change: { skills?: string[]; available?: boolean; workNote?: string; isLearner?: boolean }) {
    setSaving(true);
    setError("");
    setSaved("");
    const res = await fetch("/api/worker/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setProfile(data.profile);
    setSaved("✅ Save ho gaya");
  }

  function toggleSkill(id: string) {
    if (!profile) return;
    const has = profile.skills.includes(id);
    update({ skills: has ? profile.skills.filter((s) => s !== id) : [...profile.skills, id] });
  }

  if (me === undefined) return <p className="p-6 text-center text-xl">Load ho raha hai...</p>;
  if (!me || me.role === "customer") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-xl">Ye screen kaarigar ke liye hai</p>
        <Link href="/" className="rounded-2xl bg-orange-600 px-8 py-4 text-2xl font-bold text-white">🏠 Home</Link>
      </main>
    );
  }
  if (!profile) return <p className="p-6 text-center text-xl">Profile load ho rahi hai...</p>;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-32">
      <TopBar title="Meri profile" />
      <p className="text-lg">🙂 <b>{profile.name}</b> · 📍 {profile.area}, {profile.city}</p>

      <button disabled={saving} onClick={() => update({ available: !profile.available })}
        className={`rounded-3xl p-6 text-2xl font-bold text-white shadow disabled:opacity-60 ${
          profile.available ? "bg-green-600" : "bg-red-600"
        }`}>
        {profile.available ? "🟢 Main aaj available hoon" : "🔴 Abhi available nahi"}
        <span className="block text-base font-normal">Badalne ke liye dabao</span>
      </button>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-3xl font-bold">⭐ {profile.rating_avg}</p>
          <p className="text-gray-600">{profile.review_count} reviews</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-3xl font-bold">🧰 {profile.jobs_completed}</p>
          <p className="text-gray-600">kaam poore</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold">Main kya kaam karta hoon?</h2>
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((c) => {
          const on = profile.skills.includes(c.id);
          return (
            <button key={c.id} disabled={saving} onClick={() => toggleSkill(c.id)}
              className={`flex flex-col items-center rounded-2xl border-2 p-2 ${
                on ? "border-green-600 bg-green-100" : "border-orange-200 bg-white"
              }`}>
              <span className="text-4xl">{c.icon}</span>
              <span className="text-sm font-semibold">{c.label}</span>
              <span className="text-xs">{on ? "✅ Haan" : "➕ Jodo"}</span>
            </button>
          );
        })}
      </div>

      <h2 className="text-2xl font-bold">💬 Kaam chahiye? Malik ko batao</h2>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={150} rows={2}
        placeholder="Jaise: Painting ka kaam chahiye, Supela ke paas"
        className="rounded-2xl border-2 border-orange-200 bg-white p-3 text-lg" />
      <button disabled={saving} onClick={() => update({ workNote: note })}
        className="rounded-2xl bg-orange-600 p-3 text-xl font-bold text-white">
        Save karo
      </button>

      <button disabled={saving} onClick={() => update({ isLearner: !profile.is_learner })}
        className={`rounded-2xl border-2 p-4 text-left text-lg ${
          profile.is_learner ? "border-blue-600 bg-blue-100" : "border-orange-200 bg-white"
        }`}>
        🎓 Main kaam seekh raha hoon (helper ban ke jaunga)
        <span className="block font-bold">{profile.is_learner ? "✅ Haan" : "➕ Nahi"}</span>
      </button>

      {saved && <p className="rounded-2xl bg-green-100 p-3 text-green-800">{saved}</p>}
      {error && <p className="rounded-2xl bg-red-100 p-4 text-red-700">{error}</p>}

      <h2 className="text-2xl font-bold">Haal ke reviews</h2>
      {profile.recent_reviews.length === 0 && <p className="text-gray-600">Abhi koi review nahi</p>}
      <ul className="flex flex-col gap-2">
        {profile.recent_reviews.map((r, i) => (
          <li key={i} className="rounded-2xl bg-white p-3 shadow">
            {"⭐".repeat(r.stars)} <span className="text-gray-700">{r.comment}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}