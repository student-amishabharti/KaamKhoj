"use client";

// On/Off switch: bada, saaf, aur screen-reader ke liye "switch" ki tarah padha jaata hai
export default function Toggle({
  label, sub, checked, disabled, onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-brand disabled:opacity-60"
    >
      <span className="flex-1">
        <span className="block text-lg font-bold text-fg">{label}</span>
        {sub && <span className="mt-0.5 block text-sm text-muted">{sub}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
          checked ? "bg-ok" : "border border-line bg-surface-2"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 rounded-full bg-fg shadow transition-transform ${
            checked ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </span>
      <span className={`w-9 text-sm font-bold ${checked ? "text-ok" : "text-muted"}`}>{checked ? "ON" : "OFF"}</span>
    </button>
  );
}
