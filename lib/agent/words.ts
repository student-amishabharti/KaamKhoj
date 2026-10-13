// Hindi / Hinglish / English shabd -> matlab. Rules aur model ke jawab dono yahi use karte hain.
import type { CategoryId } from "@/lib/categories";

export const CATEGORY_WORDS: Record<CategoryId, string[]> = {
  electrician: ["electrician", "electric", "bijli", "bijlee", "wiring", "wireman", "pankha", "fan", "switchboard", "बिजली", "इलेक्ट्रीशियन", "इलेक्ट्रिशियन", "वायरिंग", "पंखा", "स्विच"],
  plumber: ["plumber", "plumbing", "nal", "nall", "pipe", "tanki", "leak", "tap", "प्लंबर", "प्लम्बर", "नल", "पाइप", "टंकी", "लीक"],
  painter: ["painter", "painting", "paint", "rang", "putai", "पेंटर", "पेंटिंग", "पेंट", "रंग", "पुताई"],
  carpenter: ["carpenter", "carpentry", "badhai", "barhai", "furniture", "darwaza", "darwaja", "lakdi", "कारपेंटर", "बढ़ई", "बढई", "फर्नीचर", "दरवाजा", "दरवाज़ा", "लकड़ी"],
  mason: ["mason", "masonry", "rajmistri", "raj mistri", "chinai", "plaster", "tile", "deewar", "मेसन", "राजमिस्त्री", "राज मिस्त्री", "चिनाई", "प्लास्टर", "टाइल", "दीवार"],
  cleaner: ["cleaner", "cleaning", "safai", "safaai", "jhadu", "pocha", "क्लीनर", "सफाई", "सफ़ाई", "झाड़ू", "पोछा"],
};

// Text mein aane wali saari categories (order mein)
export function findCategories(t: string): CategoryId[] {
  const found: { id: CategoryId; at: number }[] = [];
  for (const [id, words] of Object.entries(CATEGORY_WORDS) as [CategoryId, string[]][]) {
    let best = -1;
    for (const w of words) {
      const re = new RegExp(`(^|[^\\p{L}])${w.replace(/\s+/g, "\\s*")}`, "u");
      const m = re.exec(t);
      if (m && (best === -1 || m.index < best)) best = m.index;
    }
    if (best >= 0) found.push({ id, at: best });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.id);
}

// Model kabhi "bijli wala" ya "Plumber" likh de: use sahi category id mein badlo
export function toCategory(x: unknown): CategoryId | null {
  if (typeof x !== "string") return null;
  const t = x.toLowerCase().trim();
  const ids = findCategories(t);
  return ids[0] ?? null;
}

const NUM_WORDS: Record<string, number> = {
  ek: 1, एक: 1, one: 1, do: 2, दो: 2, two: 2, teen: 3, तीन: 3, three: 3, char: 4, chaar: 4, चार: 4, four: 4,
  paanch: 5, panch: 5, पांच: 5, पाँच: 5, five: 5, chhe: 6, che: 6, छह: 6, छः: 6, six: 6, saat: 7, सात: 7, seven: 7,
  aath: 8, आठ: 8, eight: 8, nau: 9, नौ: 9, nine: 9, das: 10, दस: 10, ten: 10, gyarah: 11, ग्यारह: 11, eleven: 11,
  barah: 12, बारह: 12, twelve: 12, dedh: 1, डेढ़: 1, dhai: 2, ढाई: 2,
};

function num(s: string): number | null {
  if (/^\d{1,2}$/.test(s)) return Number(s);
  return NUM_WORDS[s] ?? null;
}

// "2 ghante", "do ghante", "दो घंटे", "4 hours"
export function findHours(t: string): number | null {
  const m = /([\p{L}\d]+)\s*(ghante|ghanta|ghante ka|घंटे|घंटा|hours?|hrs?)/u.exec(t);
  if (!m) return null;
  const n = num(m[1]);
  return n && n >= 1 && n <= 12 ? n : null;
}

// "10 baje", "subah 10 baje", "शाम 5 बजे", "5 pm", "2:30"
export function findTime(t: string): string | null {
  let h: number | null = null;
  let min = 0;
  const colon = /(\d{1,2}):(\d{2})/.exec(t);
  const baje = /([\p{L}\d]+)\s*(baje|बजे|o'?clock)/u.exec(t);
  const ampm = /(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/i.exec(t);
  if (colon) { h = Number(colon[1]); min = Number(colon[2]); }
  else if (ampm) { h = Number(ampm[1]); if (/p/i.test(ampm[2]) && h < 12) h += 12; if (/a/i.test(ampm[2]) && h === 12) h = 0; }
  else if (baje) h = num(baje[1]);
  if (h === null || h > 23 || min > 59) return null;

  const evening = /(shaam|sham|शाम|raat|रात|evening|night)/u.test(t);
  const afternoon = /(dopahar|dophar|दोपहर|afternoon)/u.test(t);
  if (!ampm && h < 12 && (evening || (afternoon && h < 6))) h += 12;
  if (!ampm && !evening && !afternoon && h >= 1 && h <= 6) h += 12; // "3 baje" = dopahar
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export const WEEKDAYS: Record<string, number> = {
  sunday: 0, ravivar: 0, itwar: 0, रविवार: 0, इतवार: 0,
  monday: 1, somvar: 1, somwar: 1, सोमवार: 1,
  tuesday: 2, mangalvar: 2, mangalwar: 2, मंगलवार: 2,
  wednesday: 3, budhvar: 3, budhwar: 3, budh: 3, बुधवार: 3,
  thursday: 4, guruvar: 4, guruwar: 4, brihaspativar: 4, गुरुवार: 4,
  friday: 5, shukravar: 5, shukrawar: 5, शुक्रवार: 5,
  saturday: 6, shanivar: 6, shaniwar: 6, शनिवार: 6,
};

// Text se din ka shabd: today / tomorrow / day_after / monday...
export function findDateWord(t: string): string | null {
  if (/(parso|parson|परसों|परसो|day after)/u.test(t)) return "day_after";
  if (/(^|[^\p{L}])(aaj|aj|आज|today)([^\p{L}]|$)/u.test(t)) return "today";
  if (/(^|[^\p{L}])(kal|कल|tomorrow)([^\p{L}]|$)/u.test(t)) return "tomorrow";
  for (const [w] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`(^|[^\\p{L}])${w}`, "u").test(t)) return w;
  }
  const iso = /(\d{4}-\d{2}-\d{2})/.exec(t);
  return iso ? iso[1] : null;
}

// India ke hisaab se aaj ki tareekh
export function istToday(): Date {
  const now = new Date(Date.now() + 5.5 * 3600 * 1000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Din ka shabd -> asli tareekh. Ye kaam code karta hai, model nahi (model tareekh galat gin sakta hai).
export function resolveDate(word: string | null | undefined): string | null {
  if (!word) return null;
  const w = word.toLowerCase().trim();
  const today = istToday();
  const add = (n: number) => iso(new Date(today.getTime() + n * 86400000));
  if (/^\d{4}-\d{2}-\d{2}$/.test(w)) return w >= iso(today) ? w : null;
  if (w === "today") return add(0);
  if (w === "tomorrow") return add(1);
  if (w === "day_after") return add(2);
  const wd = WEEKDAYS[w];
  if (wd !== undefined) {
    let diff = (wd - today.getUTCDay() + 7) % 7;
    if (diff === 0) diff = 7; // "Wednesday" bola aur aaj Wednesday hai: agla Wednesday
    return add(diff);
  }
  return null;
}
