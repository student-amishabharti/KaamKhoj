// Baat-cheet wala assistant: "Namaste Ramlal, kya karna hai?" -> sawaal-jawab se kaam poora.
// Yahan sirf "dimaag" hai (kaunsa sawaal, jawab ka matlab). Screen aur API VoiceAssistant mein hain.
import { findCategories, findDateWord, findHours, findTime, resolveDate } from "@/lib/agent/words";
import { PACKS, catName, type Lang } from "@/lib/agent/i18n";

export type Draft = { category?: string; date?: string; time?: string; hours?: number; note?: string };
export type OpenJob = {
  id: number; category: string; work_date: string; start_time: string; hours: number;
  area: string; distance_km: number | null; my_status: string | null;
};

export type Dlg =
  | { step: "choose_mode" }
  | { step: "who"; mode: "hire" | "work" }
  | { step: "hire_slot"; draft: Draft; asked: keyof Draft; tries: number }
  | { step: "hire_confirm"; draft: Draft }
  | { step: "work_menu" }
  | { step: "work_pick"; jobs: OpenJob[] }
  | { step: "work_confirm"; job: OpenJob };

export type Chip = { label: string; say: string };

const norm = (t: string) => t.toLowerCase().replace(/[।|,!?.;"“”]/g, " ").replace(/\s+/g, " ").trim();

// ---------- Jawab samajhna ----------
export function isStop(t: string) {
  return /(^|\s)(ruko|ruk jao|band karo|cancel|chhodo|chodo|rehne do|stop|exit|रुको|बंद करो|छोड़ो|रहने दो)(\s|$)/u.test(norm(t));
}
export function isYes(t: string) {
  const s = norm(t);
  if (/(nahi|nahin|nhi|mat|no\b|नहीं|मत)/u.test(s)) return false;
  return /(^|\s)(haan|ha|han|haa|ji|ji haan|yes|yeah|ok|okay|theek|thik|sahi|kar do|kardo|karo|post karo|bilkul|हाँ|हां|जी|ठीक|सही|कर दो|करो)(\s|$)/u.test(s);
}
export function isNo(t: string) {
  return /(^|\s)(nahi|nahin|nhi|na|no|mat karo|नहीं|ना|मत)(\s|$)/u.test(norm(t));
}
export function parseMode(t: string): "hire" | "work" | null {
  const s = norm(t);
  if (/(karwana|karvana|karwani|karana|hire|bulana|kaarigar chahiye|karigar chahiye|mistri chahiye|करवाना|कराना|बुलाना)/u.test(s)) return "hire";
  if (/(kaam karna|kaam chahiye|kaam dhund|naye kaam|work|job chahiye|i want work|काम करना|काम चाहिए)/u.test(s)) return "work";
  return null;
}
export function parseWho(t: string): "self" | "ai" | null {
  const s = norm(t);
  if (/(aap|ap |tum|tu |aap hi|tum hi|kar do|kardo|kar dijiye|you do|you|आप|तुम|कर दो|कर दीजिए)/u.test(s)) return "ai";
  if (/(main|mai |khud|myself|i will|me karu|मैं|ख़ुद|खुद)/u.test(s)) return "self";
  return null;
}
export function parsePick(t: string): number | null {
  const s = norm(t);
  const table: [RegExp, number][] = [
    [/(^|\s)(1|ek|pehla|pahla|first|one|एक|पहला|पहले)(\s|$)/u, 1],
    [/(^|\s)(2|do|doosra|dusra|second|two|दो|दूसरा)(\s|$)/u, 2],
    [/(^|\s)(3|teen|teesra|tisra|third|three|तीन|तीसरा)(\s|$)/u, 3],
  ];
  // Ulta check: "second one" mein "second" ko maana jaaye, "one" ko nahi
  for (const [re, n] of [...table].reverse()) if (re.test(s)) return n;
  return null;
}
export function parseAvail(t: string): boolean | null {
  const s = norm(t);
  if (!/(available|avelebal|उपलब्ध|free|khali|खाली)/u.test(s)) return null;
  return !/(nahi|nhi|off|band|not|नहीं|बंद)/u.test(s);
}
export function wantsJobsList(t: string) {
  return /(naye kaam|kaam sunao|kaam batao|kaam dikhao|jobs|नए काम|काम सुनाओ|काम बताओ)/u.test(norm(t));
}

// Ek jawab mein jitni cheezein mil jaayein, sab bhar do ("kal 10 baje 2 ghante" = din + time + ghante)
export function fillDraft(d: Draft, text: string, asked?: keyof Draft): Draft {
  const s = norm(text);
  const out = { ...d };
  const cat = findCategories(s)[0];
  if (cat) out.category = cat;
  const dw = findDateWord(s);
  const date = resolveDate(dw);
  if (date) out.date = date;
  let time = findTime(s);
  // Sirf "10" bola aur time poocha tha
  if (!time && asked === "time") {
    const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(s);
    if (m && Number(m[1]) <= 23) {
      let h = Number(m[1]);
      if (h >= 1 && h <= 6) h += 12;
      time = `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
    }
  }
  if (time) out.time = time;
  let hours = findHours(s);
  if (!hours && asked === "hours") {
    const n = /^(\d{1,2})$/.exec(s);
    if (n && Number(n[1]) >= 1 && Number(n[1]) <= 12) hours = Number(n[1]);
    const w = parsePick(s); // "do" = 2, "teen" = 3
    if (!hours && w) hours = w;
  }
  if (hours) out.hours = hours;
  return out;
}

export function nextMissing(d: Draft): keyof Draft | null {
  if (!d.category) return "category";
  if (!d.date) return "date";
  if (!d.time) return "time";
  if (!d.hours) return "hours";
  return null;
}

export function postUrl(d: Draft) {
  const q = new URLSearchParams({ from: "ai" });
  if (d.category) q.set("category", d.category);
  if (d.date) q.set("date", d.date);
  if (d.time) q.set("time", d.time);
  if (d.hours) q.set("hours", String(d.hours));
  if (d.note) q.set("note", d.note);
  return `/post?${q.toString()}`;
}

// ---------- Bolne wale vaakya (3 bhasha) ----------
function dayText(date: string, lang: Lang) {
  const D = PACKS[lang].days;
  if (date === resolveDate("today")) return D.today;
  if (date === resolveDate("tomorrow")) return D.tomorrow;
  if (date === resolveDate("day_after")) return D.dayAfter;
  const [y, m, dd] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", timeZone: "UTC" });
}
function timeText(t: string, lang: Lang) {
  const [h, m] = t.split(":").map(Number);
  return PACKS[lang].time(h, m);
}
export function draftText(d: Draft, lang: Lang) {
  const L = PACKS[lang];
  return [d.category && catName(d.category, lang), d.date && dayText(d.date, lang), d.time && timeText(d.time, lang), d.hours && L.hours(d.hours)]
    .filter(Boolean).join(", ");
}
export function jobText(j: OpenJob, lang: Lang) {
  const L = PACKS[lang];
  return `${catName(j.category, lang)}, ${dayText(j.work_date, lang)} ${timeText(j.start_time, lang)}, ${j.area}, ${L.dist(j.distance_km)}`;
}

type Say = {
  greet: (name: string) => string;
  modeChips: Chip[];
  who: (mode: "hire" | "work") => string;
  whoChips: Chip[];
  guideHire: string;
  guideWork: string;
  ask: Record<keyof Draft, string>;
  askAgain: string;
  catChips: Chip[];
  dayChips: Chip[];
  timeChips: Chip[];
  hoursChips: Chip[];
  confirmPost: (summary: string) => string;
  confirmChips: Chip[];
  posted: string;
  workMenu: string;
  workChips: Chip[];
  noJobs: string;
  jobsList: (n: number, list: string) => string;
  pickChips: (n: number) => Chip[];
  confirmApply: (job: string) => string;
  applyChips: Chip[];
  applied: string;
  availDone: (on: boolean) => string;
  stopped: string;
  modeSwitched: (mode: "hire" | "work") => string;
  notUnderstood: string;
  failed: (msg: string) => string;
};

const HINGLISH: Say = {
  greet: (n) => `Namaste ${n}! Aaj kya karna hai? Kaam karwana hai, ya kaam karna hai?`,
  modeChips: [{ label: "Kaam karwana hai", say: "kaam karwana hai" }, { label: "Kaam karna hai", say: "kaam karna hai" }],
  who: (m) => (m === "hire" ? "Theek hai, kaam karwana hai. " : "Theek hai, kaam karna hai. ") + "Aap khud karoge, ya main kar doon?",
  whoChips: [{ label: "Aap kar do", say: "aap kar do" }, { label: "Main khud karunga", say: "main khud karunga" }],
  guideHire: "Ye kaam post karne ka page hai. Ek: upar se kaam chuniye. Do: din. Teen: time. Chaar: kitne ghante. Fir neeche 'Kaam post karo' dabaiye. Kahin atko to mic dabakar poochiye.",
  guideWork: "Ye naye kaam hain. Jo kaam pasand aaye, us par 'Main aaunga' dabaiye. Malik chunega to 'Mere kaam' mein number dikhega.",
  ask: {
    category: "Kaunsa kaam chahiye? Bijli, nal, painter, badhai, rajmistri ya safai?",
    date: "Kis din chahiye? Aaj, kal ya parso?",
    time: "Kitne baje? Jaise subah 10 baje, ya shaam 5 baje.",
    hours: "Kitne ghante ka kaam hai?",
    note: "Kuch aur batana hai?",
  },
  askAgain: "Maaf kijiye, samajh nahi aaya.",
  catChips: [
    { label: "Bijli", say: "bijli" }, { label: "Nal", say: "nal" }, { label: "Painter", say: "painter" },
    { label: "Badhai", say: "badhai" }, { label: "Rajmistri", say: "rajmistri" }, { label: "Safai", say: "safai" },
  ],
  dayChips: [{ label: "Aaj", say: "aaj" }, { label: "Kal", say: "kal" }, { label: "Parso", say: "parso" }],
  timeChips: [{ label: "Subah 9", say: "subah 9 baje" }, { label: "Subah 10", say: "subah 10 baje" }, { label: "Dopahar 2", say: "dopahar 2 baje" }, { label: "Shaam 5", say: "shaam 5 baje" }],
  hoursChips: [{ label: "1 ghanta", say: "1 ghante" }, { label: "2 ghante", say: "2 ghante" }, { label: "4 ghante", say: "4 ghante" }, { label: "8 ghante", say: "8 ghante" }],
  confirmPost: (s) => `${s}. Form bhar diya hai. Kaam post kar doon?`,
  confirmChips: [{ label: "Haan, post karo", say: "haan" }, { label: "Nahi", say: "nahi" }],
  posted: "Kaam post ho gaya! Kaarigar haan kahenge to 'Meri bookings' mein dikhenge. Paas ke kaarigar ko 'Isko bulao' se bula bhi sakte hain.",
  workMenu: "Naye kaam sunaun, ya Available on/off karna hai?",
  workChips: [{ label: "Naye kaam sunao", say: "naye kaam sunao" }, { label: "Available ON", say: "available on" }, { label: "Available OFF", say: "available nahi" }],
  noJobs: "Abhi aapke kaam ka koi naya kaam nahi hai. Available ON rakhiye, naya kaam aate hi dikhega.",
  jobsList: (n, l) => `${n} naye kaam hain. ${l}. Kaunsa kaam lena hai? Number boliye.`,
  pickChips: (n) => Array.from({ length: n }, (_, i) => ({ label: `${i + 1}`, say: `${i + 1}` })),
  confirmApply: (j) => `${j}. Is kaam ke liye 'Main aaunga' bol doon?`,
  applyChips: [{ label: "Haan, bol do", say: "haan" }, { label: "Nahi", say: "nahi" }],
  applied: "Ho gaya! Aapne haan kaha. Malik chunega to 'Mere kaam' mein uska number dikhega.",
  availDone: (on) => (on ? "Aap ab Available ho. Naye kaam milenge." : "Aapko Available se hata diya."),
  stopped: "Theek hai. Jab zaroorat ho, mic dabaiye.",
  modeSwitched: (m) => (m === "hire" ? "Mode badal diya: Kaam karwana hai." : "Mode badal diya: Kaam chahiye."),
  notUnderstood: "Samajh nahi aaya. Neeche ke button daba sakte hain, ya dobara boliye.",
  failed: (m) => `Ho nahi paaya: ${m}`,
};

const HINDI: Say = {
  greet: (n) => `नमस्ते ${n}! आज क्या करना है? काम करवाना है, या काम करना है?`,
  modeChips: [{ label: "काम करवाना है", say: "काम करवाना है" }, { label: "काम करना है", say: "काम करना है" }],
  who: (m) => (m === "hire" ? "ठीक है, काम करवाना है। " : "ठीक है, काम करना है। ") + "आप ख़ुद करेंगे, या मैं कर दूँ?",
  whoChips: [{ label: "आप कर दो", say: "आप कर दो" }, { label: "मैं ख़ुद करूँगा", say: "मैं खुद करूँगा" }],
  guideHire: "ये काम पोस्ट करने का पेज है। एक: ऊपर से काम चुनिए। दो: दिन। तीन: समय। चार: कितने घंटे। फिर नीचे 'काम पोस्ट करो' दबाइए। कहीं अटकें तो माइक दबाकर पूछिए।",
  guideWork: "ये नए काम हैं। जो काम पसंद आए, उस पर 'Main aaunga' दबाइए। मालिक चुनेगा तो 'मेरे काम' में नंबर दिखेगा।",
  ask: {
    category: "कौन सा काम चाहिए? बिजली, नल, पेंटर, बढ़ई, राजमिस्त्री या सफ़ाई?",
    date: "किस दिन चाहिए? आज, कल या परसों?",
    time: "कितने बजे? जैसे सुबह 10 बजे, या शाम 5 बजे।",
    hours: "कितने घंटे का काम है?",
    note: "कुछ और बताना है?",
  },
  askAgain: "माफ़ कीजिए, समझ नहीं आया।",
  catChips: [
    { label: "बिजली", say: "बिजली" }, { label: "नल", say: "नल" }, { label: "पेंटर", say: "पेंटर" },
    { label: "बढ़ई", say: "बढ़ई" }, { label: "राजमिस्त्री", say: "राजमिस्त्री" }, { label: "सफ़ाई", say: "सफाई" },
  ],
  dayChips: [{ label: "आज", say: "आज" }, { label: "कल", say: "कल" }, { label: "परसों", say: "परसों" }],
  timeChips: [{ label: "सुबह 9", say: "सुबह 9 बजे" }, { label: "सुबह 10", say: "सुबह 10 बजे" }, { label: "दोपहर 2", say: "दोपहर 2 बजे" }, { label: "शाम 5", say: "शाम 5 बजे" }],
  hoursChips: [{ label: "1 घंटा", say: "1 घंटा" }, { label: "2 घंटे", say: "2 घंटे" }, { label: "4 घंटे", say: "4 घंटे" }, { label: "8 घंटे", say: "8 घंटे" }],
  confirmPost: (s) => `${s}। फ़ॉर्म भर दिया है। काम पोस्ट कर दूँ?`,
  confirmChips: [{ label: "हाँ, पोस्ट करो", say: "हाँ" }, { label: "नहीं", say: "नहीं" }],
  posted: "काम पोस्ट हो गया! कारीगर हाँ कहेंगे तो 'मेरी बुकिंग' में दिखेंगे। पास के कारीगर को 'Isko bulao' से बुला भी सकते हैं।",
  workMenu: "नए काम सुनाऊँ, या उपलब्ध चालू/बंद करना है?",
  workChips: [{ label: "नए काम सुनाओ", say: "नए काम सुनाओ" }, { label: "उपलब्ध चालू", say: "available on" }, { label: "उपलब्ध बंद", say: "available nahi" }],
  noJobs: "अभी आपके काम का कोई नया काम नहीं है। उपलब्ध चालू रखिए, नया काम आते ही दिखेगा।",
  jobsList: (n, l) => `${n} नए काम हैं। ${l}। कौन सा काम लेना है? नंबर बोलिए।`,
  pickChips: (n) => Array.from({ length: n }, (_, i) => ({ label: `${i + 1}`, say: `${i + 1}` })),
  confirmApply: (j) => `${j}। इस काम के लिए 'मैं आऊँगा' बोल दूँ?`,
  applyChips: [{ label: "हाँ, बोल दो", say: "हाँ" }, { label: "नहीं", say: "नहीं" }],
  applied: "हो गया! आपने हाँ कहा। मालिक चुनेगा तो 'मेरे काम' में उसका नंबर दिखेगा।",
  availDone: (on) => (on ? "आप अब उपलब्ध हैं। नए काम मिलेंगे।" : "आपको उपलब्ध से हटा दिया।"),
  stopped: "ठीक है। जब ज़रूरत हो, माइक दबाइए।",
  modeSwitched: (m) => (m === "hire" ? "मोड बदल दिया: काम करवाना है।" : "मोड बदल दिया: काम चाहिए।"),
  notUnderstood: "समझ नहीं आया। नीचे के बटन दबा सकते हैं, या दोबारा बोलिए।",
  failed: (m) => `नहीं हो पाया: ${m}`,
};

const ENGLISH: Say = {
  greet: (n) => `Namaste ${n}! What would you like to do today? Hire someone, or find work?`,
  modeChips: [{ label: "Hire a worker", say: "hire" }, { label: "Find work", say: "i want work" }],
  who: (m) => (m === "hire" ? "Okay, you want to hire. " : "Okay, you want work. ") + "Will you do it yourself, or shall I do it for you?",
  whoChips: [{ label: "You do it", say: "you do it" }, { label: "I'll do it myself", say: "i will do it myself" }],
  guideHire: "This is the post-a-job page. One: choose the work at the top. Two: the day. Three: the time. Four: how many hours. Then press 'Post job' at the bottom. If you get stuck, tap the mic and ask.",
  guideWork: "These are new jobs. Press 'Main aaunga' on a job you like. When the customer selects you, their number appears in 'My jobs'.",
  ask: {
    category: "What work do you need? Electrician, plumber, painter, carpenter, mason or cleaner?",
    date: "Which day? Today, tomorrow or the day after?",
    time: "What time? For example 10 AM or 5 PM.",
    hours: "How many hours of work?",
    note: "Anything else to add?",
  },
  askAgain: "Sorry, I didn't get that.",
  catChips: [
    { label: "Electrician", say: "electrician" }, { label: "Plumber", say: "plumber" }, { label: "Painter", say: "painter" },
    { label: "Carpenter", say: "carpenter" }, { label: "Mason", say: "mason" }, { label: "Cleaner", say: "cleaner" },
  ],
  dayChips: [{ label: "Today", say: "today" }, { label: "Tomorrow", say: "tomorrow" }, { label: "Day after", say: "day after" }],
  timeChips: [{ label: "9 AM", say: "9 am" }, { label: "10 AM", say: "10 am" }, { label: "2 PM", say: "2 pm" }, { label: "5 PM", say: "5 pm" }],
  hoursChips: [{ label: "1 hour", say: "1 hours" }, { label: "2 hours", say: "2 hours" }, { label: "4 hours", say: "4 hours" }, { label: "8 hours", say: "8 hours" }],
  confirmPost: (s) => `${s}. I filled the form. Shall I post the job?`,
  confirmChips: [{ label: "Yes, post it", say: "yes" }, { label: "No", say: "no" }],
  posted: "Job posted! Workers who say yes will appear in 'My bookings'. You can also invite nearby workers with 'Isko bulao'.",
  workMenu: "Shall I read new jobs, or turn availability on/off?",
  workChips: [{ label: "Read new jobs", say: "naye kaam sunao" }, { label: "Available ON", say: "available on" }, { label: "Available OFF", say: "available not" }],
  noJobs: "There are no new jobs for your work right now. Keep availability ON and new jobs will appear.",
  jobsList: (n, l) => `There are ${n} new jobs. ${l}. Which one do you want? Say the number.`,
  pickChips: (n) => Array.from({ length: n }, (_, i) => ({ label: `${i + 1}`, say: `${i + 1}` })),
  confirmApply: (j) => `${j}. Shall I say 'I will come' for this job?`,
  applyChips: [{ label: "Yes, say it", say: "yes" }, { label: "No", say: "no" }],
  applied: "Done! You said yes. When the customer selects you, their number will appear in 'My jobs'.",
  availDone: (on) => (on ? "You are now available. You will get new jobs." : "You are no longer available."),
  stopped: "Okay. Tap the mic whenever you need me.",
  modeSwitched: (m) => (m === "hire" ? "Mode changed: hiring." : "Mode changed: finding work."),
  notUnderstood: "I didn't understand. You can press a button below, or say it again.",
  failed: (m) => `Couldn't do it: ${m}`,
};

export const SAY: Record<Lang, Say> = { hi: HINDI, hinglish: HINGLISH, en: ENGLISH };

export function chipsFor(d: Dlg | null, lang: Lang): Chip[] {
  const S = SAY[lang];
  if (!d) return [];
  switch (d.step) {
    case "choose_mode": return S.modeChips;
    case "who": return S.whoChips;
    case "hire_slot":
      return d.asked === "category" ? S.catChips : d.asked === "date" ? S.dayChips : d.asked === "time" ? S.timeChips : S.hoursChips;
    case "hire_confirm": return S.confirmChips;
    case "work_menu": return S.workChips;
    case "work_pick": return S.pickChips(d.jobs.length);
    case "work_confirm": return S.applyChips;
  }
}
