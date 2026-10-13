"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import ProfileButton from "@/components/ProfileButton";

// Har screen ke upar: baayein "Back" (pichhla page), beech mein screen ka naam, daayein Profile.
// Home par jaane ke liye neeche ka menu (ya sidebar) hai.
export default function TopBar({ title }: { title: string }) {
  const router = useRouter();

  function goBack() {
    // Seedha link se aaye ho (pichhla page nahi hai) to Home
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <header className="sticky top-0 z-10 -mx-4 mb-1 flex items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
      <button type="button" onClick={goBack} aria-label="Pichhle page par wapas"
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface pl-3 pr-4 text-sm font-bold text-fg hover:border-brand">
        <Icon name="back" className="h-5 w-5" />
        Back
      </button>
      <h1 className="flex-1 truncate text-xl font-extrabold text-fg">{title}</h1>
      <ProfileButton />
    </header>
  );
}
