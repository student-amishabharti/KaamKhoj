// Bina AI ke, sirf shabd dekh kar samajhna. Ye do kaam aata hai:
// 1) Internet/AI key na ho to bhi voice chale (backup)
// 2) Evaluation mein AI se tulna (comparison) ke liye
import type { RawPlan } from "./types";
import { findCategories, findDateWord, findHours, findTime } from "./words";

export type Mode = "hire" | "work";

const has = (t: string, re: RegExp) => re.test(t);

export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[।|,!?.;"“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- Suraksha (guard): AI ko bhejne se PEHLE ----------
// Ye baatein kabhi nahi hongi, chahe user kuch bhi bole.
export function guard(text: string): RawPlan | null {
  const t = normalize(text);

  // 1) AI ke rules todne ki koshish (prompt injection)
  if (has(t, /(ignore|bhool ja|bhul ja|भूल जा).{0,30}(instruction|rule|niyam|नियम|pichhl|previous|above)|system prompt|developer mode|jailbreak|tum ab .{0,20} ho|you are now/u)) {
    return { intent: "refuse", tool: "refuse", args: { reason: "injection" }, reply: "Main sirf KaamKhoj ke kaam mein madad kar sakti hoon. Apne rules nahi badal sakti." };
  }

  // 2) Kisi ka phone number / dusron ka data maangna
  const numberAsk = /(phone|mobile|contact|number|nambar|नंबर|फोन|मोबाइल)/u;
  const giveAsk = /(^|\s)(do|de do|dedo|batao|bata do|bhejo|dikhao|chahiye|दो|बताओ|दिखाओ|चाहिए|give|show|send|tell)(\s|$)/u;
  if (has(t, numberAsk) && has(t, giveAsk) && !has(t, /(mera|apna|मेरा|अपना|my) (number|नंबर|phone)/u)) {
    return { intent: "refuse", tool: "refuse", args: { reason: "phone" }, reply: "Number main nahi de sakti. Malik jab kaarigar ko chunta hai, tabhi dono ko ek dusre ka number 'Mere kaam' mein dikhta hai." };
  }
  if (has(t, /(sab|saare|sabhi|सब|सारे|all).{0,20}(user|log|kaarigar|customer|data|details)/u) && has(t, giveAsk)) {
    return { intent: "refuse", tool: "refuse", args: { reason: "privacy" }, reply: "Dusron ki jaankari main nahi de sakti." };
  }
  if (has(t, /(otp|password|पासवर्ड|session|secret|api key|database|delete kar|मिटा)/u)) {
    return { intent: "refuse", tool: "refuse", args: { reason: "security" }, reply: "Ye kaam main nahi kar sakti. OTP ya password kabhi kisi ko mat batana." };
  }

  // 3) Paise / bhugtaan: app mein nahi hota
  if (has(t, /(payment|paise bhej|pay kar|upi|paisa transfer|पैसे भेज)/u)) {
    return { intent: "refuse", tool: "refuse", args: { reason: "payment" }, reply: "KaamKhoj mein paise ka len-den nahi hota. Daam phone par aapas mein tay hota hai." };
  }

  // 4) Wo kaam jo sirf user khud button se karega: chunna, cancel, poora, rating, post karna (bina dekhe)
  if (has(t, /(chuno|chun lo|select|cancel|radd|रद्द|hata do|complete|poora ho gaya|pura ho gaya|rating|star de|review de)/u)) {
    return { intent: "navigate", tool: "navigate", args: { page: "jobs" }, reply: "Ye faisla aapko khud button dabakar lena hoga. 'Mere kaam' khol rahi hoon." };
  }
  return null;
}

// ---------- Shabdon se samajhna ----------
export function rulesPlan(text: string, mode: Mode): RawPlan {
  const t = normalize(text);
  const cats = findCategories(t);
  const cat = cats[0];

  const negative = /(nahi|nahin|nhi|na |नहीं|नही|not|busy|chutti|छुट्टी|band|off|unavailable)/u;
  const want = /(chahiye|chaiye|chahie|चाहिए|need|bulao|bulana|बुलाओ|बुलाना|book|lagwana|theek kar|thik kar|ठीक|kharab|kharaab|खराब|kaam hai|karwana|करवाना|repair|bhejo|भेजो|nahi chal|नहीं चल)/u;
  const show = /(dikhao|dikha do|dekhna|dekho|dikhaao|दिखाओ|देखना|kaun kaun|list|show|dhundho|dhoondho|dhoondo|dhundo|dhundh|ढूंढो|ढूँढो|खोजो|search|find)/u;

  // 0) "Available kaarigar dikhao" / "plumber dhoondo": kaarigar dhoondhna hai (apna Available nahi badalna)
  if (has(t, show) && !has(t, /(kaam|काम|job)/u) && (cat || has(t, /(kaarigar|karigar|mistri|worker|कारीगर|मिस्त्री|wala|wale|वाले)/u))) {
    const avail = has(t, /(available|उपलब्ध|khali|free)/u) || undefined;
    if (cat) return { intent: "find_workers", tool: "search_workers", args: { category: cat, available: avail }, reply: "" };
    return { intent: "navigate", tool: "navigate", args: { page: "search" }, reply: "" };
  }

  // 1) Available on/off
  const availWord = /(available|avelebal|उपलब्ध)/u;
  if ((availWord.test(t) || !cat) && has(t, /(available|avelebal|free hoon|free hu|khali hoon|khaali hoon|kaam pe|kaam par aa|उपलब्ध|फ्री|खाली|chutti|छुट्टी|busy|kaam nahi kar|काम नहीं कर)/u)) {
    const available = !has(t, negative) || has(t, /(on kar|on karo|ऑन)/u);
    return { intent: "set_availability", tool: "set_availability", args: { available }, reply: "" };
  }

  // 2) Skills: "main plumber hoon", "main bijli ka kaam karta hoon", "painting bhi karta hoon"
  if (cats.length && has(t, /(karta|karti|करता|करती|hoon|hun|hu |हूं|हूँ|meri skill|mera kaam|i am|i do|aata hai|आता है)/u) && !has(t, want) && !has(t, show)) {
    const add = has(t, /(bhi|भी|also|aur bhi|add)/u);
    return { intent: "set_skills", tool: "set_skills", args: { skills: cats, skillMode: add ? "add" : "set" }, reply: "" };
  }

  // 3) Kaarigar dikhao
  if (cat && has(t, show) && !has(t, /(kaam|काम) (dikhao|दिखाओ)/u)) {
    return { intent: "find_workers", tool: "search_workers", args: { category: cat }, reply: "" };
  }

  // 4) Kaam chahiye
  if (cat && has(t, want)) {
    if (mode === "work" && has(t, /(mujhe|muje|मुझे).{0,30}kaam chahiye|kaam dhundh|kaam do/u)) {
      return { intent: "navigate", tool: "navigate", args: { page: "open" }, reply: "" };
    }
    return {
      intent: "post_job",
      tool: "draft_job",
      args: {
        category: cat,
        dateWord: findDateWord(t) ?? undefined,
        time: findTime(t) ?? undefined,
        hours: findHours(t) ?? undefined,
        note: text.trim().slice(0, 200),
      },
      reply: "",
    };
  }

  // 5) Sirf "mistri chahiye": kaunsa?
  if (!cat && has(t, /(mistri|मिस्त्री|kaarigar|karigar|कारीगर|aadmi|worker)/u) && has(t, want)) {
    return { intent: "clarify", tool: "ask", args: { question: "Kaunsa kaarigar chahiye? Bijli, nal, painter, badhai, rajmistri ya safai?" }, reply: "" };
  }

  // 6) Page kholna
  const nav: [RegExp, string][] = [
    [/(ai ne kya|activity|history|log dikhao|एक्टिविटी|गतिविधि)/u, "activity"],
    [/(naye kaam|naya kaam|nae kaam|khule kaam|नए काम|नया काम|kaam dhundh|kaam dikhao|mujhe kaam chahiye|kaam chahiye|new jobs?|find work|i want work|i need work|मुझे काम चाहिए)/u, "open"],
    [/(meri booking|mere booking|booking|mere kaam|mera kaam|मेरे काम|मेरी बुकिंग|my jobs?|my bookings?)/u, "jobs"],
    [/(kaam post|post karna|post karo|kaam dalna|kaam daalna|काम डालना|काम पोस्ट|post a job|post job)/u, "post"],
    [/(kaarigar dhundh|kaarigar dikhao|karigar dikhao|kaarigar dekh|karigar dekh|worker dekh|search|कारीगर|find workers?|show workers?)/u, "search"],
    [/(setting|reviews|meri rating|skill|kaam ki settings|सेटिंग|my rating)/u, "worker"],
    [/(profile|प्रोफाइल|प्रोफ़ाइल|naam badal|mera naam|logout|my account)/u, "profile"],
    [/(home|ghar wala page|shuru|main page|wapas|वापस|होम|go back)/u, "home"],
    [/(explore|एक्सप्लोर)/u, "explore"],
  ];

  for (const [re, page] of nav) {
    if (has(t, re)) {
      if (page === "post" && cat) break;
      return { intent: "navigate", tool: "navigate", args: { page }, reply: "" };
    }
  }

  // 7) Kuch samajh nahi aaya
  return {
    intent: "clarify",
    tool: "ask",
    args: { question: "Samajh nahi aaya. Aise boliye: 'kal 10 baje plumber chahiye' ya 'naye kaam dikhao'." },
    reply: "",
  };
}
