"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Area = { id: number; name: string; city: string };

const ROLES = [
  { id: "worker", icon: "🛠️", label: "Main kaam karta hoon" },
  { id: "customer", icon: "🏠", label: "Mujhe kaam karwana hai" },
  { id: "business", icon: "🏢", label: "Meri service company hai" },
];

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [areaId, setAreaId] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/areas").then((r) => r.json()).then((d) => setAreas(d.areas));
  }, []);

  async function post(url: string, body: object) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kuch gadbad hui");
        return null;
      }
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    const data = await post("/api/auth/send-otp", { phone });
    if (!data) return;
    setDemoCode(data.demoCode);
    setIsNewUser(data.isNewUser);
    setStep("otp");
  }

  async function verify() {
    const data = await post("/api/auth/verify-otp", {
      phone, code, name, role, areaId: Number(areaId),
    });
    if (!data) return;
    router.push( "/");
    router.refresh();
  }

  const input = "w-full rounded-2xl border-2 border-orange-200 bg-white p-4 text-2xl";
  const bigButton = "w-full rounded-2xl bg-orange-600 p-4 text-2xl font-bold text-white disabled:opacity-50";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-6">
      <h1 className="text-center text-3xl font-bold text-orange-700">KaamKhoj</h1>

      {step === "phone" && (
        <>
          <label className="text-xl font-semibold">📱 Mobile number</label>
          <input className={input} inputMode="numeric" maxLength={10} placeholder="98xxxxxxxx"
            value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className={bigButton} disabled={busy} onClick={sendOtp}>OTP bhejo</button>
        </>
      )}

      {step === "otp" && (
        <>
          <p className="rounded-2xl bg-yellow-100 p-4 text-center text-lg">
            Demo OTP: <span className="text-3xl font-bold tracking-widest">{demoCode}</span>
            <br />
            <span className="text-sm text-gray-600">(Asli app mein ye SMS se aayega)</span>
          </p>
          <label className="text-xl font-semibold">🔢 OTP daalo</label>
          <input className={input} inputMode="numeric" maxLength={4}
            value={code} onChange={(e) => setCode(e.target.value)} />

          {isNewUser && (
            <>
              <label className="text-xl font-semibold">🙂 Aapka naam</label>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} />

              <p className="text-xl font-semibold">Aap kaun hain?</p>
              <div className="grid gap-3">
                {ROLES.map((r) => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    className={`rounded-2xl border-2 p-4 text-left text-xl ${
                      role === r.id ? "border-orange-600 bg-orange-100" : "border-orange-200 bg-white"
                    }`}>
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>

              <label className="text-xl font-semibold">📍 Aapka area</label>
              <select className={input} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                <option value="">Area chuno</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}, {a.city}</option>
                ))}
              </select>
            </>
          )}

          <button className={bigButton} disabled={busy} onClick={verify}>Aage badho</button>
          <button className="text-orange-700 underline" onClick={() => setStep("phone")}>
            Number badlo
          </button>
        </>
      )}

      {error && (
        <p className="rounded-2xl bg-red-100 p-4 text-center text-lg text-red-700">{error}</p>
      )}
    </main>
  );
}