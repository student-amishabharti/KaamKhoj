"use client";

import { useEffect, useState } from "react";

export type Me = {
  id: number;
  name: string;
  phone: string;
  role: "worker" | "customer" | "business";
  area_id: number | null;
  area_name: string | null;
} | null;

// "Main kaun hoon" ek hi baar server se, fir yaad (har page par dobara na poochhna = page jaldi khulta hai).
// Naam / area / mode badle ya login-logout ho to forgetMe() se taaza.
let meCache: { value: Me; at: number } | null = null;
let meInFlight: Promise<Me> | null = null;
const ME_TTL = 60_000;

export function getMe(): Promise<Me> {
  if (meCache && Date.now() - meCache.at < ME_TTL) return Promise.resolve(meCache.value);
  if (!meInFlight) {
    meInFlight = fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        meCache = { value: d.user ?? null, at: Date.now() };
        return meCache.value;
      })
      .catch(() => null)
      .finally(() => { meInFlight = null; });
  }
  return meInFlight;
}

export function forgetMe(next?: Me) {
  meCache = next === undefined ? null : { value: next, at: Date.now() };
  if (typeof window !== "undefined") window.dispatchEvent(new Event("kk:me-changed"));
}

// Login kaun hai. undefined = abhi load ho raha, null = login nahi.
export function useMe() {
  const [me, setMe] = useState<Me | undefined>(() => (meCache ? meCache.value : undefined));
  useEffect(() => {
    let alive = true;
    const load = () => getMe().then((m) => alive && setMe(m));
    load();
    window.addEventListener("kk:me-changed", load);
    return () => { alive = false; window.removeEventListener("kk:me-changed", load); };
  }, []);
  return me;
}

// POST karke JSON lena; galti ho to error message ke saath throw
export async function postJson(url: string, body: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Kuch gadbad hui");
  return data;
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  forgetMe(null);
  window.location.href = "/login";
}
