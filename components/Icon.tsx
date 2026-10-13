// KaamKhoj ke apne icons (SVG). Emoji ki jagah ye har phone par ek jaise dikhte hain.
type Name =
  | "electrician" | "plumber" | "painter" | "carpenter" | "mason" | "cleaner"
  | "mic" | "shield" | "star" | "phone" | "pin" | "check" | "sos" | "users" | "briefcase" | "arrow";

export const ICON_PATHS: Record<Name, React.ReactNode> = {
  electrician: <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" />,
  plumber: (
    <>
      <path d="M4 9h8a3 3 0 0 1 3 3v2" />
      <path d="M4 6v6" />
      <path d="M15 14h4" />
      <path d="M17 17.5c0 1.1-.9 2.5-1.5 3.5-.6-1-1.5-2.4-1.5-3.5a1.5 1.5 0 0 1 3 0Z" />
    </>
  ),
  painter: (
    <>
      <rect x="3" y="3" width="14" height="6" rx="1.5" />
      <path d="M17 6h3v5h-8v3" />
      <rect x="10" y="14" width="4" height="7" rx="1" />
    </>
  ),
  carpenter: (
    <>
      <path d="M11 4h8l1.5 3.5H11Z" />
      <path d="M15 7.5V21" />
      <path d="M11 4 8.5 6.5" />
    </>
  ),
  mason: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M12 9.7v4.6M7 14.3V19M17 14.3V19" />
    </>
  ),
  cleaner: (
    <>
      <path d="M15 3 11 12" />
      <path d="M6 12h9l2 9H4Z" />
      <path d="M9 16v5M13 16v5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 20 6v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
  phone: (
    <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  sos: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export default function Icon({ name, className = "h-6 w-6" }: { name: Name; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

export type IconName = Name;