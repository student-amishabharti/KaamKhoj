"use client";

import { useEffect, useState } from "react";

export type Me = {
  id: number;
  name: string;
  role: "worker" | "customer" | "business";
  area_id: number | null;
  area_name: string | null;
} | null;

// Login kaun hai. undefined = abhi load ho raha, null = login nahi.
export function useMe() {
  const [me, setMe] = useState<Me | undefined>(undefined);
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => setMe(null));
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
  window.location.href = "/login";
}