import { CATEGORIES } from "@/lib/categories";

export function catInfo(id: string) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? { label: c.label, hi: c.hi, icon: c.icon } : { label: id, hi: id, icon: "🛠️" };
}

// Date ko "YYYY-MM-DD" mein badalna (phone ke local time se)
export function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return ymd(d);
}

export function dayLabel(date: string) {
  if (date === todayPlus(0)) return "Aaj";
  if (date === todayPlus(1)) return "Kal";
  if (date === todayPlus(2)) return "Parso";
  return new Date(`${date}T00:00:00`).toLocaleDateString("hi-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function timeLabel(t: string) {
  const [h, m] = t.split(":").map(Number);
  const part = h < 12 ? "subah" : h < 16 ? "dopahar" : "shaam";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${part}`;
}

export const JOB_STATUS: Record<string, { text: string; cls: string }> = {
  open: { text: "🟡 Khula", cls: "bg-yellow-100 text-yellow-800" },
  assigned: { text: "🟢 Kaarigar tay", cls: "bg-green-100 text-green-800" },
  completed: { text: "✔️ Poora", cls: "bg-gray-200 text-gray-700" },
  cancelled: { text: "❌ Cancel", cls: "bg-red-100 text-red-700" },
};