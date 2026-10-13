"use client";

import Link from "next/link";
import { useMe } from "@/lib/client";

// Upar daayein kone ka gol button: naam ka pehla akshar, dabane par Profile
export default function ProfileButton({ name }: { name?: string }) {
  const me = useMe();
  const shown = name ?? me?.name ?? "";
  if (me === null && name === undefined) return null; // login nahi hai
  const letter = shown.trim().charAt(0).toUpperCase() || "?";

  return (
    <Link
      href="/profile"
      aria-label="Meri profile"
      title="Meri profile"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-brand/60 bg-brand-soft text-lg font-extrabold text-brand transition hover:border-brand"
    >
      {letter}
    </Link>
  );
}
