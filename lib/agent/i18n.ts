// AI ke jawab teen bhashaon mein: Hindi (देवनागरी), Hinglish, English.
// Jawab code se bante hain (model se nahi), isliye AI jhooth ya galat baat nahi bol sakta.
import { CATEGORIES } from "@/lib/categories";

export const LANGS = ["hi", "hinglish", "en"] as const;
export type Lang = (typeof LANGS)[number];

export function toLang(x: unknown): Lang {
  return LANGS.includes(x as Lang) ? (x as Lang) : "hinglish";
}

type Pack = {
  pages: Record<string, string>;
  opening: (page: string) => string;
  mustPress: string;
  formFilled: string;
  youChoose: (list: string) => string;
  pressPost: string;
  missing: { kaam: string; din: string; time: string; ghante: string };
  days: { today: string; tomorrow: string; dayAfter: string };
  hours: (n: number) => string;
  time: (h: number, m: number) => string;
  availAsk: (on: boolean) => string;
  availDone: (on: boolean) => string;
  skillsAsk: (add: boolean, list: string) => string;
  skillsDone: (add: boolean, list: string) => string;
  showing: (cat: string) => string;
  found: (cat: string, list: string) => string;
  noneFound: (cat: string) => string;
  dist: (km: number | null) => string;
  needWork: string;
  needHire: string;
  business: string;
  confirmFailed: string;
  refuse: Record<string, string>;
  questions: Record<string, string>;
};

const HINGLISH: Pack = {
  pages: {
    home: "Home", post: "Kaam post karo", jobs: "Mere kaam", open: "Naye kaam",
    search: "Kaarigar dekho", worker: "Kaam ki settings", profile: "Profile", activity: "AI activity", explore: "Explore",
  },
  opening: (p) => `${p} khul raha hai.`,
  mustPress: "Ye faisla aapko khud button dabakar lena hoga. 'Mere kaam' khul raha hai.",
  formFilled: "Form bhar diya.",
  youChoose: (l) => `${l} aap chun lijiye.`,
  pressPost: "Check karke 'Kaam post karo' khud dabaiye.",
  missing: { kaam: "kaam", din: "din", time: "time", ghante: "ghante" },
  days: { today: "aaj", tomorrow: "kal", dayAfter: "parso" },
  hours: (n) => `${n} ghante`,
  time: (h, m) => `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""} baje ${h < 12 ? "subah" : h < 16 ? "dopahar" : "shaam"}`,
  availAsk: (on) => `Aapko Available ${on ? "ON" : "OFF"} karna hai? 'Haan, karo' dabaiye.`,
  availDone: (on) => (on ? "Aap ab Available ho. Naye kaam milenge." : "Aapko Available se hata diya. Naye kaam nahi dikhenge."),
  skillsAsk: (add, l) => `${add ? "Jodna hai" : "Aapke kaam ye set karne hain"}: ${l}? 'Haan, karo' dabaiye.`,
  skillsDone: (add, l) => `${add ? "Jod diya. " : ""}Ab aapke kaam: ${l}.`,
  showing: (c) => `Paas ke ${c} dikh rahe hain.`,
  found: (c, l) => `${c}: ${l}. Poori list khul rahi hai.`,
  noneFound: (c) => `Abhi koi ${c} nahi mila. Kaam post karenge to naye kaarigar bhi dekh lenge.`,
  dist: (km) => (km == null ? "doori pata nahi" : km < 0.5 ? "aapke area mein" : `${km.toFixed(1)} km door`),
  needWork: "Ye kaarigar wala kaam hai. Home par 'Kaam chahiye' mode chuniye, fir boliye.",
  needHire: "Kaam post karne ke liye Home par 'Kaam karwana hai' mode chuniye.",
  business: "Business account se kaam post nahi hota.",
  confirmFailed: "Ye kaam pakka nahi ho saka. Dobara boliye.",
  refuse: {
    phone: "Number nahi diya ja sakta. Malik jab kaarigar ko chunta hai, tabhi dono ko number dikhta hai.",
    privacy: "Dusron ki jaankari nahi di ja sakti.",
    security: "Ye kaam nahi ho sakta. OTP ya password kabhi kisi ko mat batana.",
    payment: "KaamKhoj mein paise ka len-den nahi hota. Daam phone par tay hota hai.",
    injection: "Main sirf KaamKhoj ke kaam mein madad karta hoon.",
    other: "Ye nahi ho sakta. Main kaam post karne, kaarigar dhoondhne aur page kholne mein madad karta hoon.",
  },
  questions: {
    which_worker: "Kaunsa kaarigar chahiye? Bijli, nal, painter, badhai, rajmistri ya safai?",
    not_understood: "Samajh nahi aaya. Aise boliye: 'kal 10 baje plumber chahiye' ya 'naye kaam dikhao'.",
    which_search: "Kaunse kaam ke kaarigar dekhne hain?",
    more: "Thoda aur bataiye, kya karna hai?",
  },
};

const HINDI: Pack = {
  pages: {
    home: "होम", post: "काम पोस्ट करो", jobs: "मेरे काम", open: "नए काम",
    search: "कारीगर देखो", worker: "काम की सेटिंग", profile: "प्रोफ़ाइल", activity: "AI गतिविधि", explore: "एक्सप्लोर",
  },
  opening: (p) => `${p} खुल रहा है।`,
  mustPress: "ये फ़ैसला आपको ख़ुद बटन दबाकर लेना होगा। 'मेरे काम' खुल रहा है।",
  formFilled: "फ़ॉर्म भर दिया।",
  youChoose: (l) => `${l} आप चुन लीजिए।`,
  pressPost: "जाँच कर 'काम पोस्ट करो' ख़ुद दबाइए।",
  missing: { kaam: "काम", din: "दिन", time: "समय", ghante: "घंटे" },
  days: { today: "आज", tomorrow: "कल", dayAfter: "परसों" },
  hours: (n) => `${n} घंटे`,
  time: (h, m) => `${h < 12 ? "सुबह" : h < 16 ? "दोपहर" : "शाम"} ${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""} बजे`,
  availAsk: (on) => `क्या आपको उपलब्ध ${on ? "चालू" : "बंद"} करना है? 'हाँ, करो' दबाइए।`,
  availDone: (on) => (on ? "आप अब उपलब्ध हैं। नए काम मिलेंगे।" : "आपको उपलब्ध से हटा दिया। नए काम नहीं दिखेंगे।"),
  skillsAsk: (add, l) => `${add ? "क्या ये जोड़ना है" : "क्या आपके काम ये रखने हैं"}: ${l}? 'हाँ, करो' दबाइए।`,
  skillsDone: (add, l) => `${add ? "जोड़ दिया। " : ""}अब आपके काम: ${l}।`,
  showing: (c) => `पास के ${c} दिख रहे हैं।`,
  found: (c, l) => `${c}: ${l}। पूरी सूची खुल रही है।`,
  noneFound: (c) => `अभी कोई ${c} नहीं मिला। काम पोस्ट करेंगे तो नए कारीगर भी देख लेंगे।`,
  dist: (km) => (km == null ? "दूरी पता नहीं" : km < 0.5 ? "आपके इलाक़े में" : `${km.toFixed(1)} किलोमीटर दूर`),
  needWork: "ये कारीगर वाला काम है। होम पर 'काम चाहिए' चुनिए, फिर बोलिए।",
  needHire: "काम पोस्ट करने के लिए होम पर 'काम करवाना है' चुनिए।",
  business: "बिज़नेस अकाउंट से काम पोस्ट नहीं होता।",
  confirmFailed: "ये काम पक्का नहीं हो सका। दोबारा बोलिए।",
  refuse: {
    phone: "नंबर नहीं दिया जा सकता। मालिक जब कारीगर को चुनता है, तभी दोनों को नंबर दिखता है।",
    privacy: "दूसरों की जानकारी नहीं दी जा सकती।",
    security: "ये काम नहीं हो सकता। OTP या पासवर्ड कभी किसी को मत बताना।",
    payment: "काम खोज में पैसों का लेन-देन नहीं होता। दाम फ़ोन पर तय होता है।",
    injection: "मैं सिर्फ़ काम खोज के काम में मदद करता हूँ।",
    other: "ये नहीं हो सकता। मैं काम पोस्ट करने, कारीगर ढूँढने और पेज खोलने में मदद करता हूँ।",
  },
  questions: {
    which_worker: "कौन सा कारीगर चाहिए? बिजली, नल, पेंटर, बढ़ई, राजमिस्त्री या सफ़ाई?",
    not_understood: "समझ नहीं आया। ऐसे बोलिए: 'कल 10 बजे प्लंबर चाहिए' या 'नए काम दिखाओ'।",
    which_search: "किस काम के कारीगर देखने हैं?",
    more: "थोड़ा और बताइए, क्या करना है?",
  },
};

const ENGLISH: Pack = {
  pages: {
    home: "Home", post: "Post a job", jobs: "My jobs", open: "New jobs",
    search: "Find workers", worker: "Work settings", profile: "Profile", activity: "AI activity", explore: "Explore",
  },
  opening: (p) => `Opening ${p}.`,
  mustPress: "You need to make this decision yourself by pressing the button. Opening 'My jobs'.",
  formFilled: "I filled the form.",
  youChoose: (l) => `Please choose the ${l}.`,
  pressPost: "Check it and press 'Post job' yourself.",
  missing: { kaam: "work type", din: "day", time: "time", ghante: "hours" },
  days: { today: "today", tomorrow: "tomorrow", dayAfter: "day after tomorrow" },
  hours: (n) => `${n} hour${n === 1 ? "" : "s"}`,
  time: (h, m) => `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`,
  availAsk: (on) => `Turn availability ${on ? "ON" : "OFF"}? Press 'Yes, do it'.`,
  availDone: (on) => (on ? "You are now available. You will get new jobs." : "You are no longer available. New jobs will not show."),
  skillsAsk: (add, l) => `${add ? "Add" : "Set your work to"}: ${l}? Press 'Yes, do it'.`,
  skillsDone: (add, l) => `${add ? "Added. " : ""}Your work now: ${l}.`,
  showing: (c) => `Showing nearby ${c} workers.`,
  found: (c, l) => `${c}: ${l}. Opening the full list.`,
  noneFound: (c) => `No ${c} found right now. Post a job and new workers can see it.`,
  dist: (km) => (km == null ? "distance unknown" : km < 0.5 ? "in your area" : `${km.toFixed(1)} km away`),
  needWork: "This is for workers. On Home choose 'Kaam chahiye' (I want work), then speak again.",
  needHire: "To post a job, choose 'Kaam karwana hai' (I want to hire) on Home.",
  business: "Business accounts cannot post jobs.",
  confirmFailed: "That could not be completed. Please say it again.",
  refuse: {
    phone: "I can't share phone numbers. Numbers are shown only after the customer selects a worker.",
    privacy: "I can't share other people's information.",
    security: "I can't do that. Never share your OTP or password with anyone.",
    payment: "KaamKhoj does not handle payments. The price is agreed on the phone.",
    injection: "I can only help with KaamKhoj tasks.",
    other: "I can't do that. I can help post a job, find workers and open pages.",
  },
  questions: {
    which_worker: "Which worker do you need? Electrician, plumber, painter, carpenter, mason or cleaner?",
    not_understood: "I didn't understand. Try: 'I need a plumber tomorrow at 10' or 'show new jobs'.",
    which_search: "Which kind of workers do you want to see?",
    more: "Please tell me a little more. What do you want to do?",
  },
};

export const PACKS: Record<Lang, Pack> = { hi: HINDI, hinglish: HINGLISH, en: ENGLISH };

export function catName(id: string | undefined, lang: Lang) {
  const c = CATEGORIES.find((x) => x.id === id);
  if (!c) return id ?? "";
  return lang === "hi" ? c.hi : c.label;
}

// Rules/validate Hinglish mein sawaal likhte hain; unhe pehchaan kar sahi bhasha mein badlo
const QUESTION_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(HINGLISH.questions).map(([k, v]) => [v, k])
);
export function translateQuestion(q: string, lang: Lang) {
  const key = QUESTION_KEYS[q];
  return key ? PACKS[lang].questions[key] : q;
}

export const LANG_NAME: Record<Lang, string> = {
  hi: "Hindi in Devanagari script",
  hinglish: "Hinglish (Hindi words in Roman script)",
  en: "simple English",
};
