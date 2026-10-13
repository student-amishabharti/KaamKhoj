// KaamKhoj logo: location pin (paas mein) + checkmark (bharosa)
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M24 3C15.4 3 8.5 9.7 8.5 18.1c0 10.9 13.4 24.8 14.4 25.8a1.5 1.5 0 0 0 2.2 0c1-1 14.4-14.9 14.4-25.8C39.5 9.7 32.6 3 24 3Z"
        fill="var(--kk-brand)"
      />
      <path d="m17 18.5 5 5 9.5-10" fill="none" stroke="var(--kk-bg)" strokeWidth="4"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const mark = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";
  return (
    <span className="inline-flex items-center gap-2" aria-label="KaamKhoj">
      <LogoMark className={mark} />
      <span className={`${text} font-extrabold tracking-tight`}>
        <span className="text-fg">Kaam</span>
        <span className="text-brand">Khoj</span>
      </span>
    </span>
  );
}