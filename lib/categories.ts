export const CATEGORIES = [
  { id: "electrician", label: "Electrician", hi: "बिजली मिस्त्री", icon: "💡" },
  { id: "plumber", label: "Plumber", hi: "नल मिस्त्री", icon: "🚰" },
  { id: "painter", label: "Painter", hi: "पेंटर", icon: "🎨" },
  { id: "carpenter", label: "Carpenter", hi: "बढ़ई", icon: "🪚" },
  { id: "mason", label: "Mason", hi: "राजमिस्त्री", icon: "🧱" },
  { id: "cleaner", label: "Cleaner", hi: "सफ़ाई", icon: "🧹" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function isCategory(x: string): x is CategoryId {
  return CATEGORIES.some((c) => c.id === x);
}