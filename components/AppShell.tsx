"use client";

// Login ke baad har page ka dhaancha: phone par neeche 4 button (beech mein mic), computer par baayein sidebar.
// Login nahi hai (landing / login page) to koi menu nahi.
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import Logo from "@/components/Logo";
import { getMe } from "@/lib/client";

type Item = { href: string; label: string; icon: IconName; match: string[] };

const ITEMS: Item[] = [
  { href: "/", label: "Home", icon: "home", match: ["/"] },
  { href: "/explore", label: "Explore", icon: "search", match: ["/explore", "/open", "/search", "/kaam", "/kaarigar"] },
  { href: "/jobs", label: "Mera kaam", icon: "briefcase", match: ["/jobs", "/post"] },
  { href: "/profile", label: "Profile", icon: "user", match: ["/profile", "/worker", "/activity", "/eval"] },
];

function isActive(item: Item, path: string) {
  return item.match.some((m) => (m === "/" ? path === "/" : path === m || path.startsWith(m + "/")));
}

const HIDE_ON = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const on = (e: Event) => setPanelOpen(Boolean((e as CustomEvent).detail));
    window.addEventListener("kk:voice-panel", on);
    return () => window.removeEventListener("kk:voice-panel", on);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = () => getMe().then((m) => alive && setLoggedIn(Boolean(m)));
    load();
    window.addEventListener("kk:me-changed", load);
    return () => { alive = false; window.removeEventListener("kk:me-changed", load); };
  }, [pathname]);

  const show = loggedIn && !HIDE_ON.includes(pathname);

  return (
    <>
      <div className={show ? `pb-20 transition-[padding] md:pb-0 md:pl-60 ${panelOpen ? "md:pr-[25.5rem]" : ""}` : ""}>{children}</div>

      {show && (
        <>
          {/* Computer: baayein sidebar */}
          <nav aria-label="Mukhya menu" className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-1 border-r border-line bg-surface px-3 py-5 md:flex">
            <Link href="/" className="mb-5 px-2"><Logo /></Link>
            {ITEMS.map((it) => {
              const on = isActive(it, pathname);
              return (
                <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-base font-bold transition ${
                    on ? "bg-brand-soft text-brand" : "text-fg-2 hover:bg-surface-2 hover:text-fg"
                  }`}>
                  <Icon name={it.icon} className="h-6 w-6" />
                  {it.label}
                </Link>
              );
            })}
            {/* Mic yahin: form ke upar nahi aata */}
            <button type="button" onClick={() => window.dispatchEvent(new Event("kk:voice-open"))}
              className="mt-4 flex items-center gap-3 rounded-2xl border border-brand/50 bg-brand-soft px-3 py-3 text-left transition hover:border-brand">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-bg">
                <Icon name="mic" className="h-6 w-6" />
                <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-surface bg-ok" />
              </span>
              <span>
                <span className="block font-extrabold text-fg">Bolkar batao</span>
                <span className="block text-xs text-muted">Hindi, Hinglish ya English</span>
              </span>
            </button>
            <p className="mt-auto px-3 text-xs leading-relaxed text-muted">
              Mic dabakar bolo, ya likhkar bhejo. AI form bharega ya page kholega.
            </p>
          </nav>

          {/* Phone: neeche 4 button, beech ki jagah mic ke liye */}
          <nav aria-label="Mukhya menu" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
              {ITEMS.map((it, i) => {
                const on = isActive(it, pathname);
                const link = (
                  <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
                    className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${on ? "text-brand" : "text-muted"}`}>
                    <Icon name={it.icon} className="h-6 w-6" />
                    {it.label}
                  </Link>
                );
                // Beech mein (2 ke baad) mic ki jagah khaali
                return i === 2 ? [<span key="mic-gap" aria-hidden />, link] : link;
              })}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
