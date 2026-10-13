"use client";

// KaamKhoj Voice Assistant: har page par neeche beech mein ek hi mic.
// Bolo (ya likho) -> server par AI samajhta hai -> page khulta / form bharta hai.
// Data badalne wale kaam (Available, skills) "Haan, karo" dabane ke baad hi hote hain.
// AI kabhi khud kaam post, kaarigar chunna, cancel nahi karta, na kisi ka number deta hai.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { LANG_OPTIONS, UI, type UiLang } from "@/components/voiceText";
import {
  SAY, chipsFor, draftText, fillDraft, isNo, isStop, isYes, jobText, nextMissing, parseAvail, parseMode,
  parsePick, parseWho, postUrl, wantsJobsList, type Dlg, type Draft, type OpenJob,
} from "@/components/voiceDialog";
import { findCategories } from "@/lib/agent/words";
import { forgetMe, getMe } from "@/lib/client";

type Pending = { tool: string; args: Record<string, unknown> };
type Result = {
  source: string;
  intent: string;
  reply: string;
  navigateTo?: string;
  changedData?: boolean;
  steps: string[];
  pending?: Pending;
};

// Mic ki haalat. Har haalat screen par saaf dikhti hai.
type Status = "idle" | "starting" | "listening" | "processing" | "error";

// Browser ki SpeechRecognition (Chrome/Edge mein webkit naam se)
type Rec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function makeRecognition(): Rec | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return C ? new C() : null;
}


// Ye shabd bole to pichhla jawab dobara sunao (server tak jaane ki zaroorat nahi)
const REPEAT_RE = /(dobara batao|dobara bolo|phir se bolo|fir se bolo|repeat|samajh nahi aaya|samjh nahi aaya|फिर से|दोबारा)/i;

const LISTEN_LIMIT_MS = 12000;
const PAST: Record<UiLang, string> = {
  hinglish: "Ye samay beet chuka hai.",
  hi: "ये समय बीत चुका है।",
  en: "That time has already passed.",
};
const HIDE_ON = ["/login"];

function Waves({ active }: { active: boolean }) {
  return (
    <div className="flex h-8 items-end justify-center gap-1" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span key={i}
          className={`kk-wave w-1.5 rounded-full bg-brand ${active ? "" : "kk-wave-off"}`}
          style={{ animationDelay: `${(i % 4) * 0.12}s` }} />
      ))}
    </div>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[0, 1, 2].map((i) => <span key={i} className="kk-dot h-2 w-2 rounded-full bg-brand" style={{ animationDelay: `${i * 0.15}s` }} />)}
    </span>
  );
}

export default function VoiceAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState<"mic" | "send">("mic");
  const [toast, setToast] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const [micSupported, setMicSupported] = useState(true);
  const [lang, setLang] = useState<UiLang>("hinglish");
  const T = UI[lang];
  const langOpt = LANG_OPTIONS.find((l) => l.id === lang) ?? LANG_OPTIONS[1];

  const recRef = useRef<Rec | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const lastReply = useRef("");
  const lastInput = useRef("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const keepAlive = useRef<ReturnType<typeof setInterval> | null>(null);

  // Baat-cheet (dialog) ki haalat: kaunsa sawaal chal raha hai
  const [dlg, setDlgState] = useState<Dlg | null>(null);
  const dlgRef = useRef<Dlg | null>(null);
  const setDlg = (d: Dlg | null) => { dlgRef.current = d; setDlgState(d); };
  const meRef = useRef<{ name: string; role: string } | null>(null);
  const viaVoice = useRef(false); // pichhla jawab bolkar diya tha? to agle sawaal ke baad mic khud chalu

  // Login hai ya nahi (har page badalne par), taaki login ke baad mic dikhe
  useEffect(() => {
    let alive = true;
    const load = () => getMe()
      .then((u) => {
        if (!alive) return;
        setLoggedIn(Boolean(u));
        meRef.current = u ? { name: u.name, role: u.role } : null;
      })
      .catch(() => alive && setLoggedIn(false));
    load();
    window.addEventListener("kk:me-changed", load);
    return () => { alive = false; window.removeEventListener("kk:me-changed", load); };
  }, [pathname]);

  useEffect(() => {
    setMicSupported(Boolean(makeRecognition()));
    try {
      if (localStorage.getItem("kk_voice_speak") === "off") setVoiceOn(false);
      const saved = localStorage.getItem("kk_lang");
      if (saved === "hi" || saved === "hinglish" || saved === "en") setLang(saved);
    } catch { /* storage band ho to bhi chalega */ }
    // Page chhodte waqt mic aur awaaz band
    return () => {
      recRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
      try { window.speechSynthesis?.cancel(); } catch { /* */ }
    };
  }, []);

  // Login ke baad Home par pehli baar: assistant khud "Namaste ..." bole (har session mein ek baar)
  useEffect(() => {
    if (!loggedIn || pathname !== "/") return;
    try {
      if (sessionStorage.getItem("kk_greeted")) return;
      sessionStorage.setItem("kk_greeted", "1");
    } catch { /* storage band: har baar greet karna theek hai */ }
    const t = setTimeout(() => { setOpen(true); startDialog(); }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, pathname]);

  // Toast kuch der baad apne aap hat jaaye (bolte waqt nahi)
  useEffect(() => {
    if (!toast || speaking) return;
    const t = setTimeout(() => setToast(""), 9000);
    return () => clearTimeout(t);
  }, [toast, speaking]);

  // ---------- Bolna (jawab sunana) ----------
  const stopSpeaking = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch { /* */ }
    if (keepAlive.current) clearInterval(keepAlive.current);
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, onDone?: () => void) => {
    lastReply.current = text;
    if (!voiceOn || typeof window === "undefined" || !("speechSynthesis" in window)) { onDone?.(); return; }
    try {
      const synth = window.speechSynthesis;
      synth.cancel(); // pichhla jawab beech mein ho to roko
      if (keepAlive.current) clearInterval(keepAlive.current);
      // Lamba jawab Chrome beech mein rok deta hai, isliye chhote vaakya mein tod kar ek ke baad ek bolo
      const parts = text.match(/[^.?!।]+[.?!।]?/g)?.map((x) => x.trim()).filter(Boolean) ?? [text];
      const voices = synth.getVoices();
      const want = langOpt.voice;
      const voice =
        voices.find((v) => v.lang === want && /google/i.test(v.name)) ??
        voices.find((v) => v.lang === want) ??
        voices.find((v) => v.lang.startsWith(want.slice(0, 2)));
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        u.lang = want;
        u.rate = 0.95;
        if (voice) u.voice = voice;
        if (i === 0) u.onstart = () => setSpeaking(true);
        if (i === parts.length - 1) {
          u.onend = () => { setSpeaking(false); if (keepAlive.current) clearInterval(keepAlive.current); onDone?.(); };
        }
        u.onerror = () => { setSpeaking(false); if (keepAlive.current) clearInterval(keepAlive.current); };
        synth.speak(u);
      });
      // Chrome ki purani dikkat: 15 second baad awaaz atak jaati hai. Beech-beech mein "resume" karte raho.
      keepAlive.current = setInterval(() => {
        if (!synth.speaking) { if (keepAlive.current) clearInterval(keepAlive.current); return; }
        synth.pause();
        synth.resume();
      }, 10000);
    } catch {
      setSpeaking(false); // awaaz na chale to bhi text dikhta rahega
      onDone?.();
    }
  }, [voiceOn, langOpt.voice]);

  // ---------- Server ko bhejna ----------
  const handle = useCallback((r: Result) => {
    setResult(r);
    setStatus("idle");
    speak(r.reply);

    if (r.changedData) window.dispatchEvent(new Event("kk:data-changed"));
    if (r.pending) return; // "Haan, karo" ka intezaar, panel khula rahe

    const target = r.navigateTo;
    if (!target) {
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    // Page khulna hai: panel band, chhota sandesh neeche dikhe, taaki form/page dikhe
    setOpen(false);
    setToast(r.reply);
    if (target.split("?")[0] === window.location.pathname) {
      router.replace(target, { scroll: false });
      window.dispatchEvent(new CustomEvent("kk:voice-nav", { detail: target }));
    } else {
      router.push(target);
    }
  }, [router, speak]);

  const post = useCallback(async (body: object) => {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, lang }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Kuch gadbad hui");
    return data.result as Result;
  }, [lang]);

  const send = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || busy.current) return; // ek baar mein ek hi
    // "dobara batao" = pichhla jawab phir se
    if (REPEAT_RE.test(clean) && lastReply.current && clean.split(/\s+/).length <= 5) {
      setTyped("");
      speak(lastReply.current);
      return;
    }
    busy.current = true;
    lastInput.current = clean;
    setHeard(clean);
    setTyped("");
    setError("");
    setStatus("processing");
    stopSpeaking();
    try {
      if (dlgRef.current) {
        const consumed = await dialogStep(clean);
        if (consumed) return;
      }
      setResult(null);
      handle(await post({ text: clean }));
    } catch (e) {
      setStatus("error");
      setErrorKind("send");
      setError((e as Error).message || T.micErrors.net);
      setTyped(clean); // jo likha/bola tha wo wapas, sudhaar kar dobara bhej sakein
    } finally {
      busy.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, post, speak, stopSpeaking, T, lang]);

  // ---------- Baat-cheet wala assistant ----------
  // AI bolta hai (aur screen par likha aata hai). Bolkar jawab diya tha to bolne ke baad mic khud sunne lagta hai.
  function aiSays(text: string, keepListening = true) {
    setResult({ source: "dialog", intent: "dialog", reply: text, steps: [] });
    setStatus("idle");
    const auto = keepListening && viaVoice.current && dlgRef.current !== null;
    speak(text, auto ? () => setTimeout(() => { if (dlgRef.current) startListening(); }, 250) : undefined);
  }

  function goTo(url: string) {
    if (url.split("?")[0] === window.location.pathname) {
      router.replace(url, { scroll: false });
      window.dispatchEvent(new CustomEvent("kk:voice-nav", { detail: url }));
    } else {
      router.push(url);
    }
  }

  async function api(url: string, method: string, body?: object) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error ?? "Kuch gadbad hui");
    return d;
  }

  // Mode badalna (Kaam karwana hai / Kaam chahiye). User ne khud bola hai, isliye seedha.
  async function ensureMode(mode: "hire" | "work") {
    const role = meRef.current?.role;
    const now = role === "customer" ? "hire" : "work";
    if (now === mode) return;
    const d = await api("/api/me", "PATCH", { mode });
    meRef.current = { name: d.user.name, role: d.user.role };
    forgetMe(d.user);
    window.dispatchEvent(new CustomEvent("kk:mode-changed", { detail: d.user }));
  }

  function startDialog() {
    const S = SAY[lang];
    const first = (meRef.current?.name ?? "").split(" ")[0];
    setDlg({ step: "choose_mode" });
    aiSays(S.greet(first));
  }

  function askSlot(draft: Draft, prefix = "") {
    const S = SAY[lang];
    const miss = nextMissing(draft);
    if (miss) {
      setDlg({ step: "hire_slot", draft, asked: miss, tries: 0 });
      aiSays(prefix + S.ask[miss]);
    } else {
      setDlg({ step: "hire_confirm", draft });
      aiSays(prefix + S.confirmPost(draftText(draft, lang)));
    }
  }

  async function readJobs() {
    const S = SAY[lang];
    const d = await api("/api/jobs?scope=open", "GET");
    const jobs: OpenJob[] = (d.jobs ?? []).filter((j: OpenJob) => !j.my_status).slice(0, 3);
    goTo("/explore?tab=jobs");
    if (!jobs.length) {
      setDlg(null);
      aiSays(S.noJobs, false);
      return;
    }
    setDlg({ step: "work_pick", jobs });
    aiSays(S.jobsList(jobs.length, jobs.map((j, i) => `${i + 1}: ${jobText(j, lang)}`).join(". ")));
  }

  // true = jawab baat-cheet ne sambhaal liya; false = ye aam command hai, AI agent ko bhejo
  async function dialogStep(text: string): Promise<boolean> {
    const S = SAY[lang];
    const d = dlgRef.current;
    if (!d) return false;
    if (isStop(text)) {
      setDlg(null);
      aiSays(S.stopped, false);
      return true;
    }
    try {
      switch (d.step) {
        case "choose_mode": {
          const m = parseMode(text);
          if (m) {
            await ensureMode(m);
            setDlg({ step: "who", mode: m });
            aiSays(S.who(m));
            return true;
          }
          // Seedha "kal plumber chahiye" bol diya: kaam karwana hai, aur sawaal wahi se aage
          if (findCategories(text.toLowerCase()).length) {
            await ensureMode("hire");
            const draft = fillDraft({}, text);
            goTo(postUrl(draft));
            askSlot(draft);
            return true;
          }
          setDlg(null);
          return false; // "profile kholo" jaisi aam baat: agent sambhalega
        }

        case "who": {
          const w = parseWho(text);
          if (!w) { aiSays(`${S.askAgain} ${S.who(d.mode)}`); return true; }
          if (w === "self") {
            setDlg(null);
            goTo(d.mode === "hire" ? "/post" : "/explore?tab=jobs");
            aiSays(d.mode === "hire" ? S.guideHire : S.guideWork, false);
            return true;
          }
          if (d.mode === "hire") {
            goTo("/post?from=ai");
            askSlot({});
          } else {
            goTo("/explore?tab=jobs");
            setDlg({ step: "work_menu" });
            aiSays(S.workMenu);
          }
          return true;
        }

        case "hire_slot": {
          const draft = fillDraft(d.draft, text, d.asked);
          const changed = JSON.stringify(draft) !== JSON.stringify(d.draft);
          if (!changed) {
            setDlg({ ...d, tries: d.tries + 1 });
            aiSays(`${S.askAgain} ${S.ask[d.asked]}`);
            return true;
          }
          // Beeta hua samay?
          if (draft.date && draft.time && new Date(`${draft.date}T${draft.time}:00`).getTime() < Date.now()) {
            const fixed = { ...draft, time: undefined };
            goTo(postUrl(fixed));
            setDlg({ step: "hire_slot", draft: fixed, asked: "time", tries: 0 });
            aiSays(`${PAST[lang]} ${S.ask.time}`);
            return true;
          }
          goTo(postUrl(draft)); // form screen par saath-saath bharta dikhe
          askSlot(draft);
          return true;
        }

        case "hire_confirm": {
          if (isYes(text)) {
            const r = await api("/api/jobs", "POST", {
              category: d.draft.category, workDate: d.draft.date, startTime: d.draft.time, hours: d.draft.hours,
              note: d.draft.note ?? "",
            });
            setDlg(null);
            router.push(`/jobs?posted=${r.id}`);
            aiSays(S.posted, false);
            return true;
          }
          if (isNo(text)) {
            setDlg(null);
            aiSays(S.stopped, false);
            return true;
          }
          // "time 11 baje kar do" jaisa badlaav
          const draft = fillDraft(d.draft, text);
          if (JSON.stringify(draft) !== JSON.stringify(d.draft)) {
            goTo(postUrl(draft));
            askSlot(draft);
          } else {
            aiSays(`${S.notUnderstood} ${S.confirmPost(draftText(d.draft, lang))}`);
          }
          return true;
        }

        case "work_menu": {
          const a = parseAvail(text);
          if (a !== null) {
            await api("/api/worker/profile", "PATCH", { available: a });
            window.dispatchEvent(new Event("kk:data-changed"));
            setDlg(null);
            aiSays(S.availDone(a), false);
            return true;
          }
          if (wantsJobsList(text) || isYes(text)) { await readJobs(); return true; }
          aiSays(`${S.notUnderstood} ${S.workMenu}`);
          return true;
        }

        case "work_pick": {
          const n = parsePick(text);
          if (!n || n > d.jobs.length) { aiSays(`${S.notUnderstood}`); return true; }
          const job = d.jobs[n - 1];
          setDlg({ step: "work_confirm", job });
          aiSays(S.confirmApply(jobText(job, lang)));
          return true;
        }

        case "work_confirm": {
          if (isYes(text)) {
            await api(`/api/jobs/${d.job.id}`, "POST", { action: "apply" });
            setDlg(null);
            window.dispatchEvent(new Event("kk:data-changed"));
            router.push("/jobs");
            aiSays(S.applied, false);
            return true;
          }
          setDlg(null);
          aiSays(S.stopped, false);
          return true;
        }
      }
    } catch (e) {
      setDlg(null);
      aiSays(S.failed((e as Error).message), false);
      return true;
    }
    return false;
  }

  async function confirmPending(yes: boolean) {
    const p = result?.pending;
    if (!p || busy.current) return;
    if (!yes) {
      setResult({ ...result!, pending: undefined, reply: T.noChange });
      speak(T.noChange);
      return;
    }
    busy.current = true;
    setStatus("processing");
    try {
      handle(await post({ confirm: p }));
    } catch (e) {
      setStatus("error");
      setErrorKind("send");
      setError((e as Error).message);
    } finally {
      busy.current = false;
    }
  }

  // ---------- Sunna (mic) ----------
  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function startListening() {
    if (recRef.current || busy.current) return; // do baar shuru na ho
    const rec = makeRecognition();
    if (!rec) {
      setMicSupported(false);
      setStatus("error");
      setErrorKind("mic");
      setError(T.micErrors.unsupported);
      return;
    }
    stopSpeaking();
    setError("");
    if (!dlgRef.current) setResult(null); // baat-cheet mein sawaal dikhta rahe
    setHeard("");
    rec.lang = langOpt.rec; // hi-IN: Hindi + Hinglish, en-IN: Indian English
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalText = "";
    let interimText = "";
    let failed = false;

    rec.onstart = () => {
      setStatus("listening");
      clearTimer();
      timerRef.current = setTimeout(() => {
        failed = !finalText && !interimText;
        if (failed) { setErrorKind("mic"); setError(T.micErrors.timeout); }
        rec.stop();
      }, LISTEN_LIMIT_MS);
    };
    rec.onresult = (e) => {
      interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setHeard((finalText + " " + interimText).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      failed = true;
      setErrorKind("mic");
      setError(T.micErrors[e.error] ?? T.micErrors.other);
    };
    rec.onend = () => {
      clearTimer();
      recRef.current = null;
      const text = (finalText || interimText).trim();
      if (text) {
        viaVoice.current = true;
        send(text);
      } else {
        setStatus(failed ? "error" : "idle"); // sunna sach mein band: kabhi "sun raha hoon" na dikhe
      }
    };

    recRef.current = rec;
    setStatus("starting");
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setStatus("error");
      setErrorKind("mic");
      setError(T.micErrors.start);
    }
  }

  function stopListening() {
    clearTimer();
    recRef.current?.stop(); // jo suna wo bhej diya jaayega (onend mein)
  }

  function toggleMic() {
    if (status === "listening" || status === "starting") stopListening();
    else startListening();
  }

  function retry() {
    if (errorKind === "send" && lastInput.current) send(lastInput.current);
    else startListening();
  }

  function chooseLang(l: UiLang) {
    if (l === lang) return;
    recRef.current?.abort();
    recRef.current = null;
    stopSpeaking();
    setStatus("idle");
    setError("");
    setDlg(null);
    setResult(null);
    setLang(l);
    try { localStorage.setItem("kk_lang", l); } catch { /* */ }
  }

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    try { localStorage.setItem("kk_voice_speak", next ? "on" : "off"); } catch { /* */ }
    if (!next) stopSpeaking();
  }

  // Panel khula hai: computer par page thoda baayein khisak jaaye taaki form panel ke neeche na chhupe
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("kk:voice-panel", { detail: open }));
  }, [open]);

  // Computer par sidebar ka "Bolkar batao" button yahi kholta hai
  useEffect(() => {
    const on = () => openPanel();
    window.addEventListener("kk:voice-open", on);
    return () => window.removeEventListener("kk:voice-open", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  function openPanel() {
    setToast("");
    setOpen(true);
    // Khaali panel khula: "Namaste ..., kya karna hai?" se shuru
    if (!dlgRef.current && !result) startDialog();
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function closePanel() {
    setDlg(null);
    setResult(null); // agli baar kholne par "Namaste" se naya shuru
    setHeard("");
    recRef.current?.abort();
    recRef.current = null;
    clearTimer();
    stopSpeaking();
    setOpen(false);
    setStatus("idle");
    setError("");
  }

  // Esc se band
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePanel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!loggedIn || HIDE_ON.includes(pathname)) return null;

  const listening = status === "listening";
  const statusText =
    status === "starting" ? T.starting :
    listening ? T.listening :
    status === "processing" ? T.thinking :
    speaking ? T.speaking :
    status === "error" ? T.error :
    result?.pending ? T.waiting :
    micSupported ? T.tapToSpeak : T.typeBelow;

  // Phone par neeche menu hai: mic usi ke beech mein, panel menu ke upar. Computer par neeche beech mein.
  const sa = { "--sa": "env(safe-area-inset-bottom, 0px)" } as React.CSSProperties;

  return (
    <>
      <style>{`
        @keyframes kk-wave { 0%,100% { height: 6px } 50% { height: 28px } }
        .kk-wave { height: 6px; animation: kk-wave 0.9s ease-in-out infinite; }
        .kk-wave-off { animation: none; opacity: .35; }
        @keyframes kk-dot { 0%,80%,100% { transform: scale(.5); opacity:.4 } 40% { transform: scale(1); opacity:1 } }
        .kk-dot { animation: kk-dot 1s ease-in-out infinite; }
        @keyframes kk-rise { from { opacity: 0; transform: translateY(16px) scale(.98) } to { opacity: 1; transform: none } }
        .kk-rise { animation: kk-rise .18s ease-out; }
        @keyframes kk-ring { 0% { box-shadow: 0 0 0 0 rgb(255 101 0 / .55) } 100% { box-shadow: 0 0 0 22px rgb(255 101 0 / 0) } }
        .kk-ring { animation: kk-ring 1.2s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) { .kk-wave,.kk-dot,.kk-rise,.kk-ring { animation: none !important } }
      `}</style>

      {/* ---------- Band haalat: chhota launcher, neeche beech mein ---------- */}
      {!open && (
        <div className="fixed bottom-[calc(var(--sa)+6px)] left-1/2 z-40 flex w-[min(92vw,22rem)] -translate-x-1/2 flex-col items-center gap-2 md:bottom-6 md:left-auto md:right-6 md:translate-x-0 md:items-end" style={sa}>
          {toast && (
            <div role="status" className="w-full rounded-2xl border border-line bg-surface/95 p-3 text-sm text-fg shadow-xl shadow-black/50 backdrop-blur">
              <p className="font-semibold leading-snug">{toast}</p>
              <div className="mt-2 flex gap-2 text-xs">
                {speaking ? (
                  <button onClick={stopSpeaking} className="rounded-full border border-line px-3 py-1.5">{T.stop}</button>
                ) : (
                  <button onClick={() => speak(toast)} className="rounded-full border border-line px-3 py-1.5">{T.repeat}</button>
                )}
                <button onClick={() => setToast("")} className="ml-auto rounded-full px-3 py-1.5 text-muted">{T.okay}</button>
              </div>
            </div>
          )}
          <button
            onClick={openPanel}
            aria-label={T.openLabel}
            className="flex items-center gap-3 rounded-full border border-line bg-surface p-1 text-left shadow-xl shadow-black/50 transition hover:border-brand md:hidden"
          >
            <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand text-bg">
              <Icon name="mic" className="h-7 w-7" />
              <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-ok" title="Taiyaar" />
            </span>
            <span className="hidden md:block">
              <span className="block whitespace-nowrap text-base font-extrabold text-fg">{T.launch}</span>
              <span className="block whitespace-nowrap text-xs text-muted">{T.launchSub}</span>
            </span>
          </button>
        </div>
      )}

      {/* ---------- Khuli haalat: assistant panel ---------- */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="kk-va-title"
          className="kk-rise fixed bottom-[calc(var(--sa)+76px)] left-1/2 z-50 max-h-[calc(100dvh-var(--sa)-96px)] w-[calc(100vw-1.5rem)] max-w-[26rem] -translate-x-1/2 overflow-y-auto rounded-3xl border border-line bg-surface p-4 text-fg shadow-2xl shadow-black/60 md:bottom-6 md:left-auto md:right-6 md:max-h-[calc(100dvh-3rem)] md:w-[24rem] md:translate-x-0"
          style={sa}
        >
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand"><Icon name="mic" className="h-4 w-4" /></span>
            <p id="kk-va-title" className="flex-1 font-extrabold">{T.title}</p>
            <button onClick={toggleVoice} aria-pressed={voiceOn} className="rounded-full border border-line px-3 py-1 text-xs text-fg-2">
              {T.voice} {voiceOn ? "ON" : "OFF"}
            </button>
            <button onClick={closePanel} aria-label={T.close} className="grid h-9 w-9 place-items-center rounded-full border border-line text-lg hover:border-brand">✕</button>
          </div>

          {/* Bhasha chuno */}
          <div className="mt-3 flex items-center gap-2" role="radiogroup" aria-label={T.language}>
            <span className="text-xs text-muted">{T.language}:</span>
            {LANG_OPTIONS.map((l) => (
              <button key={l.id} role="radio" aria-checked={lang === l.id} onClick={() => chooseLang(l.id)}
                className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                  lang === l.id ? "border-brand bg-brand-soft text-fg" : "border-line text-fg-2 hover:border-brand"
                }`}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Mic + haalat */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              onClick={toggleMic}
              disabled={status === "processing" || !micSupported}
              aria-pressed={listening}
              aria-label={listening ? T.stopListening : T.startSpeaking}
              className={`grid h-20 w-20 place-items-center rounded-full transition disabled:opacity-40 ${
                listening ? "kk-ring bg-brand text-bg" : status === "starting" ? "bg-brand/70 text-bg" : "bg-brand text-bg hover:brightness-110"
              }`}
            >
              {listening ? <span className="h-6 w-6 rounded-md bg-bg" aria-hidden /> : <Icon name="mic" className="h-10 w-10" />}
            </button>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{listening ? T.micOn : T.micOff}</span>

            <div className="flex h-8 items-center justify-center">
              {listening && <Waves active />}
              {status === "processing" && <Dots />}
              {status !== "processing" && !listening && speaking && <Waves active />}
            </div>
            <p className="text-center font-semibold text-fg-2" aria-live="polite">{statusText}</p>

            {heard && (
              <p className="w-full rounded-xl bg-bg p-3 text-center text-lg text-fg">
                <span className="block text-xs text-muted">{T.youSaid}</span>
                “{heard}”
              </p>
            )}
          </div>

          {/* Galti + dobara koshish */}
          {status === "error" && error && (
            <div role="alert" className="mt-3 rounded-xl bg-danger/15 p-3 text-sm text-red-300">
              <p>{error}</p>
              <button onClick={retry} className="mt-2 rounded-full bg-danger/25 px-4 py-1.5 font-bold text-red-100">{T.retry}</button>
            </div>
          )}

          {/* Jawab */}
          {result && status !== "processing" && (
            <div className="mt-3 rounded-xl border border-line bg-bg p-3">
              <p className="text-lg font-bold leading-snug">{result.reply}</p>

              {result.pending ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => confirmPending(true)} className="rounded-xl bg-brand p-3 text-lg font-extrabold text-bg">{T.yes}</button>
                  <button onClick={() => confirmPending(false)} className="rounded-xl border border-line p-3 text-lg font-bold">{T.no}</button>
                </div>
              ) : null}

              {dlg && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chipsFor(dlg, lang).map((c) => (
                    <button key={c.label} onClick={() => { viaVoice.current = false; send(c.say); }}
                      className="rounded-xl border-2 border-brand/60 bg-brand-soft px-3 py-2 text-base font-bold text-fg hover:border-brand">
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {speaking ? (
                  <button onClick={stopSpeaking} className="rounded-full border border-line px-3 py-1.5">{T.stop}</button>
                ) : (
                  <button onClick={() => speak(result.reply)} className="rounded-full border border-line px-3 py-1.5">{T.repeat}</button>
                )}
                {result.source !== "dialog" && <details className="text-muted">
                  <summary className="cursor-pointer select-none">{T.whatAiDid} ({result.source})</summary>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                    {result.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </details>}
              </div>
            </div>
          )}

          {/* Likhkar bhejna */}
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); viaVoice.current = false; send(typed); }}>
            <label htmlFor="kk-va-input" className="sr-only">{T.placeholder}</label>
            <input
              id="kk-va-input"
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              maxLength={300}
              autoComplete="off"
              placeholder={T.placeholder}
              className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-3 text-fg placeholder:text-muted focus:border-brand focus:outline-none"
            />
            <button type="submit" disabled={!typed.trim() || status === "processing"}
              className="rounded-xl bg-brand px-5 font-extrabold text-bg disabled:opacity-40">
              {T.send}
            </button>
          </form>
          <p className="mt-2 text-xs text-muted">
            {T.example} <button type="button" className="underline decoration-dotted" onClick={() => setTyped(T.exampleText)}>&quot;{T.exampleText}&quot;</button>
          </p>
          <p className="mt-2 border-t border-line pt-2 text-center text-[11px] text-muted">
            {T.footer} ·{" "}
            <Link href="/activity" onClick={() => setOpen(false)} className="underline">{T.activity}</Link>
          </p>
        </div>
      )}
    </>
  );
}
