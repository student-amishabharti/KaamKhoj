"use client";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import ProfileButton from "@/components/ProfileButton";

// Har screen ke upar: baayein Home (logo), beech mein screen ka naam, daayein Profile
export default function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-1 flex items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
      <Link href="/" aria-label="Home" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface hover:border-brand">
        <LogoMark className="h-6 w-6" />
      </Link>
      <h1 className="flex-1 truncate text-xl font-extrabold text-fg">{title}</h1>
      <ProfileButton />
    </header>
  );
}
