"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import { forgetMe } from "@/lib/client";

type Area = { id: number; name: string; city: string };
type Errors = { phone?: string; otp?: string; name?: string; area?: string; form?: string };

// Fetch karke JSON; internet band ho to saaf sandesh
async function send(url: string, body: object) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, data: { error: "Internet check karo, fir koshish karo", field: "form" } };
  }
  const data = await res.json().catch(() => ({ error: "Kuch gadbad hui, fir koshish karo", field: "form" }));
  return { ok: res.ok, data };
}

export default function LoginPage() {
  const router = useRouter();
  const [intent, setIntent] = useState<"hire" | "work">("hire");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState("");
  const [areaId, setAreaId] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("intent") === "work") setIntent("work");
    fetch("/api/areas").then((r) => r.json()).then((d) => setAreas(d.areas)).catch(() => {});
  }, []);

  // "OTP dobara bhejo" ka timer
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  function checkPhone(p: string): string | undefined {
    if (p.length === 0) return "Mobile number daalo";
    if (p.length !== 10) return "10 ank ka mobile number daalo";
    if (!/^[6-9]/.test(p)) return "Sahi Indian mobile number daalo (6, 7, 8 ya 9 se shuru)";
  }

  async function sendOtp() {
    const phoneError = checkPhone(phone);
    if (phoneError) return setErrors({ phone: phoneError });
    setErrors({});
    setBusy(true);
    const { ok, data } = await send("/api/auth/send-otp", { phone });
    setBusy(false);
    if (!ok) {
      if (data.retryAfter) setWait(data.retryAfter);
      return setErrors({ [data.field === "otp" && step === "phone" ? "phone" : data.field ?? "form"]: data.error });
    }
    setDemoCode(data.demo ? data.demoCode : null);
    setIsNewUser(data.isNewUser);
    setWait(data.resendAfter ?? 10);
    setCode("");
    setStep("otp");
    setTimeout(() => otpRef.current?.focus(), 50);
  }

  async function verify() {
    const e: Errors = {};
    if (!/^\d{4}$/.test(code)) e.otp = "4 ank ka OTP daalo";
    if (isNewUser && !name.trim()) e.name = "Apna naam likho";
    if (isNewUser && !areaId) e.area = "Apna area chuno";
    if (Object.keys(e).length) return setErrors(e);

    setErrors({});
    setBusy(true);
    const { ok, data } = await send("/api/auth/verify-otp", {
      phone, code, name, areaId: Number(areaId), intent,
    });
    setBusy(false);
    if (!ok) return setErrors({ [data.field ?? "form"]: data.error });
    // Kisi page se login par aaye the (jaise ek kaam ki details) to wahin wapas. Sirf apni site ke andar.
    forgetMe(); // "login nahi" wala purana jawab bhool jao
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    router.push(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  // Number badlo: sab kuch saaf
  function changeNumber() {
    setStep("phone");
    setPhone("");
    setCode("");
    setName("");
    setAreaId("");
    setDemoCode(null);
    setIsNewUser(false);
    setErrors({});
    setWait(0);
  }

  const input = (bad?: string) =>
    `w-full rounded-xl border-2 bg-bg px-4 py-3.5 text-xl text-fg outline-none transition placeholder:text-muted/60 focus:border-brand ${
      bad ? "border-danger" : "border-line"
    }`;
  const errorText = (msg?: string) =>
    msg ? <p role="alert" className="mt-1.5 text-sm font-medium text-red-300">{msg}</p> : null;
  const primary =
    "w-full rounded-xl bg-brand py-4 text-xl font-extrabold text-bg transition hover:brightness-110 disabled:opacity-50";

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-4 py-6 text-fg">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block" aria-label="KaamKhoj home">
          <Logo />
        </Link>

        <section className="mt-8 rounded-3xl border border-line bg-surface p-6 sm:p-8">
          {step === "phone" ? (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight">Chaliye, shuru karte hain.</h1>
              <p className="mt-2 text-fg-2">
                {intent === "work" ? "Kaam paane ke liye apna mobile number daalo." : "Kaarigar bulane ke liye apna mobile number daalo."}
              </p>

              <label htmlFor="phone" className="mt-6 block font-semibold text-fg-2">Mobile number</label>
              <div className={`mt-2 flex items-center rounded-xl border-2 bg-bg transition focus-within:border-brand ${errors.phone ? "border-danger" : "border-line"}`}>
                <span className="border-r border-line px-4 py-3.5 text-xl font-semibold text-muted">+91</span>
                <input id="phone" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                  aria-invalid={!!errors.phone}
                  className="w-full bg-transparent px-4 py-3.5 text-xl tracking-wider text-fg outline-none placeholder:text-muted/60" />
              </div>
              {errorText(errors.phone)}

              <button className={`${primary} mt-6`} disabled={busy} onClick={sendOtp}>
                {busy ? "Bhej rahe hain..." : "OTP bhejo"}
              </button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight">OTP daalo</h1>
              <p className="mt-2 text-fg-2">
                +91 {phone} par 4 ank ka OTP bheja.{" "}
                <button onClick={changeNumber} className="font-semibold text-brand underline-offset-4 hover:underline">
                  Number badlo
                </button>
              </p>

              {demoCode && (
                <div className="mt-5 flex items-center justify-between rounded-xl border border-warn/40 bg-warn/10 px-4 py-3">
                  <span className="text-sm text-amber-200">
                    <b>Demo mode</b>
                    <br />
                    Asli app mein OTP SMS se aayega
                  </span>
                  <span className="text-2xl font-extrabold tracking-[0.3em] text-amber-100">{demoCode}</span>
                </div>
              )}

              <label htmlFor="otp" className="mt-6 block font-semibold text-fg-2">OTP</label>
              <input id="otp" ref={otpRef} inputMode="numeric" autoComplete="one-time-code" maxLength={4} placeholder="••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                onKeyDown={(e) => e.key === "Enter" && !isNewUser && verify()}
                aria-invalid={!!errors.otp}
                className={`${input(errors.otp)} mt-2 text-center text-3xl font-bold tracking-[0.6em]`} />
              {errorText(errors.otp)}

              <p className="mt-2 text-sm text-muted">
                OTP nahi aaya?{" "}
                {wait > 0 ? (
                  <span>{wait} second baad dobara bhej sakte ho</span>
                ) : (
                  <button onClick={sendOtp} disabled={busy} className="font-semibold text-brand underline-offset-4 hover:underline">
                    OTP dobara bhejo
                  </button>
                )}
              </p>

              {isNewUser && (
                <div className="mt-6 border-t border-line pt-6">
                  <p className="font-bold">Aap KaamKhoj par naye ho. Bas 2 cheezein batao:</p>

                  <label htmlFor="name" className="mt-4 block font-semibold text-fg-2">Aapka naam</label>
                  <input id="name" value={name} maxLength={60} placeholder="Jaise: Sunita Sahu"
                    onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name}
                    className={`${input(errors.name)} mt-2`} />
                  {errorText(errors.name)}

                  <label htmlFor="area" className="mt-4 block font-semibold text-fg-2">Aap kahan rehte ho?</label>
                  <select id="area" value={areaId} onChange={(e) => setAreaId(e.target.value)} aria-invalid={!!errors.area}
                    className={`${input(errors.area)} mt-2`}>
                    <option value="">Area chuno</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}, {a.city}</option>
                    ))}
                  </select>
                  {errorText(errors.area)}
                  <p className="mt-1.5 text-sm text-muted">Isse paas ke kaam aur kaarigar dikhte hain. Pura pata kabhi nahi poocha jaata.</p>
                </div>
              )}

              <button className={`${primary} mt-6`} disabled={busy} onClick={verify}>
                {busy ? "Check kar rahe hain..." : isNewUser ? "Account banao" : "Aage badho"}
              </button>
            </>
          )}

          {errors.form && <p role="alert" className="mt-4 rounded-xl bg-danger/15 p-3 text-red-300">{errors.form}</p>}
        </section>

        <p className="mt-5 flex items-start gap-2 px-2 text-sm text-muted">
          <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
          Aapka number kisi ko tab tak nahi dikhta jab tak aap khud kisi ko na chuno.
        </p>
      </div>
    </main>
  );
}
