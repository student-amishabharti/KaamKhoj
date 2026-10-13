// AI agent ka dil: sunna -> samajhna -> check -> sirf allowed kaam -> log
import { pool } from "@/lib/db";
import type { CategoryId } from "@/lib/categories";
import { searchWorkers } from "@/lib/search";
import { setAvailability, setSkills } from "@/lib/worker";
import { resolveDate } from "./words";
import { PACKS, catName, translateQuestion, type Lang } from "./i18n";
import type { AgentResult, Plan, Source } from "./types";
import { PAGES } from "./types";
import { guard, rulesPlan, type Mode } from "./rules";
import { askModel, type LlmEngine } from "./llm";
import { systemPrompt } from "./prompt";
import { validatePlan } from "./validate";

export type AgentUser = {
  id: number;
  role: "worker" | "customer" | "business";
  area_id: number | null;
  area_name: string | null;
};

export type RunOptions = {
  dryRun?: boolean;                       // true = DB mein kuch mat badlo, log mat karo (evaluation ke liye)
  engine?: "auto" | "rules" | LlmEngine;  // auto = Gemma -> Gemini -> rules
  lang?: Lang;                            // jawab kis bhasha mein (hi / hinglish / en)
};

// Kaunsa page / tool kis mode ka hai
const WORK_ONLY = new Set(["open", "worker"]);
const HIRE_ONLY = new Set(["post"]);


export function modeOf(u: AgentUser): Mode {
  return u.role === "customer" ? "hire" : "work";
}

export async function runAgent(user: AgentUser, input: string, opts: RunOptions = {}): Promise<AgentResult> {
  const t0 = Date.now();
  const text = input.trim().slice(0, 300);
  const mode = modeOf(user);
  const steps: string[] = [`Suna: "${text}"`];
  const invalidFromModel: string[] = [];
  let source: Source = "rules";
  let plan: Plan | null = null;

  // 1) Suraksha pehle (AI tak pahunchne se pehle hi)
  const g = guard(text);
  if (g) {
    plan = validatePlan(g).plan;
    source = "guard";
    steps.push("Suraksha check ne roka / seedha raasta diya");
  }

  // 2) AI model (Gemma, fir Gemini)
  const engine = opts.engine ?? "auto";
  if (!plan && engine !== "rules") {
    const ans = await askModel(systemPrompt(mode, user.area_name, opts.lang ?? "hinglish"), text, engine === "auto" ? undefined : engine);
    invalidFromModel.push(...ans.badOutput);
    if (ans.errors.length) steps.push(`AI nahi chala (${ans.errors.join(", ")})`);
    if (ans.plan && ans.engine) {
      const v = validatePlan(ans.plan);
      invalidFromModel.push(...v.invalid);
      if (v.plan) {
        plan = v.plan;
        source = ans.engine;
        steps.push(`${ans.engine === "gemma" ? "Gemma" : "Gemini"} ne samjha: ${plan.intent}`);
      } else {
        steps.push("AI ka jawab galat tha, rules se samjha");
      }
      if (v.invalid.length) steps.push(`Galat cheezein hatayi: ${v.invalid.join("; ")}`);
    }
  }

  // 3) Backup: shabdon ke rules
  if (!plan) {
    plan = validatePlan(rulesPlan(text, mode)).plan ?? {
      intent: "clarify", tool: "ask", args: { question: "Samajh nahi aaya, dobara boliye." }, reply: "",
    };
    source = source === "guard" ? "guard" : "rules";
    if (source === "rules") steps.push(`Rules ne samjha: ${plan.intent}`);
  }

  // 4) Permission: ye user (is mode mein) ye kar sakta hai?
  const result: AgentResult = {
    input: text, source, intent: plan.intent, tool: plan.tool, args: plan.args, reply: "",
    steps, invalidFromModel, latencyMs: 0,
  };
  const lang = opts.lang ?? "hinglish";
  if (modeAllows(user, plan, result, lang)) {
    await execute(user, plan, result, opts.dryRun ?? false, false, lang);
  }

  result.latencyMs = Date.now() - t0;
  if (!opts.dryRun) await saveLog(user.id, text, result);
  return result;
}

function modeAllows(user: AgentUser, plan: Plan, result: AgentResult, lang: Lang) {
  const L = PACKS[lang];
  const mode = modeOf(user);
  // Ek account dono kaam kar sakta hai; sirf business account kaam post nahi karta
  const needWork = false;
  const needHire = user.role === "business" &&
    (plan.tool === "draft_job" || (plan.tool === "navigate" && HIRE_ONLY.has(plan.args.page ?? "")));
  if (needWork && mode !== "work") {
    result.reply = L.needWork;
    result.navigateTo = "/";
    result.steps.push("Roka: abhi 'Kaam karwana hai' mode hai");
    return false;
  }
  if (needHire && mode !== "hire") {
    result.reply = user.role === "business" ? L.business : L.needHire;
    result.navigateTo = "/";
    result.steps.push("Roka: abhi 'Kaam chahiye' mode hai");
    return false;
  }
  return true;
}

async function saveLog(userId: number, input: string, result: AgentResult) {
  await pool
    .query("INSERT INTO agent_logs (user_id, input, result) VALUES ($1, $2, $3)", [userId, input, JSON.stringify(result)])
    .catch(() => result.steps.push("Log save nahi hua"));
}

// User ne "Haan, karo" dabaya: ab hi data badlo. Server dobara sab check karta hai (client par bharosa nahi).
export async function confirmAgent(user: AgentUser, tool: unknown, args: unknown, lang: Lang = "hinglish"): Promise<AgentResult> {
  const t0 = Date.now();
  const intent = tool === "set_availability" ? "set_availability" : tool === "set_skills" ? "set_skills" : null;
  const result: AgentResult = {
    input: "[Haan dabaya]", source: "rules", intent: "clarify", tool: "ask", args: {}, reply: "",
    steps: ["User ne 'Haan, karo' dabaya"], invalidFromModel: [], latencyMs: 0,
  };
  const v = intent ? validatePlan({ intent, tool, args: (args ?? {}) as Record<string, unknown> }).plan : null;
  if (!v) {
    result.reply = PACKS[lang].confirmFailed;
    return result;
  }
  result.intent = v.intent;
  result.tool = v.tool;
  result.args = v.args;
  if (modeAllows(user, v, result, lang)) await execute(user, v, result, false, true, lang);
  result.latencyMs = Date.now() - t0;
  await saveLog(user.id, result.input, result);
  return result;
}

function dayWord(date: string, lang: Lang) {
  const D = PACKS[lang].days;
  if (date === resolveDate("today")) return D.today;
  if (date === resolveDate("tomorrow")) return D.tomorrow;
  if (date === resolveDate("day_after")) return D.dayAfter;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", timeZone: "UTC" });
}

// 5) Sirf allowed tool chalana. Reply code banata hai (model ka reply nahi), taaki AI jhooth na bole.
async function execute(user: AgentUser, plan: Plan, r: AgentResult, dryRun: boolean, confirmed: boolean, lang: Lang) {
  const a = plan.args;
  const L = PACKS[lang];
  const cat = (id?: string) => catName(id, lang);
  switch (plan.tool) {
    case "navigate": {
      r.navigateTo = PAGES[a.page ?? "home"];
      r.reply = L.opening(L.pages[a.page ?? "home"]);
      r.steps.push(`Page khola: ${r.navigateTo}`);
      if (r.source === "guard") r.reply = L.mustPress;
      return;
    }

    case "draft_job": {
      const q = new URLSearchParams({ from: "ai" });
      if (a.category) q.set("category", a.category);
      if (a.date) q.set("date", a.date);
      if (a.time) q.set("time", a.time);
      if (a.hours) q.set("hours", String(a.hours));
      if (a.note) q.set("note", a.note);
      r.navigateTo = `/post?${q.toString()}`;
      const M = L.missing;
      const missing = [!a.category && M.kaam, !a.date && M.din, !a.time && M.time, !a.hours && M.ghante].filter(Boolean);
      const [hh, mm] = (a.time ?? "0:0").split(":").map(Number);
      const parts = [a.category && cat(a.category), a.date && dayWord(a.date, lang), a.time && L.time(hh, mm), a.hours && L.hours(a.hours)].filter(Boolean);
      const stop = lang === "hi" ? "। " : ". ";
      r.reply = (parts.length ? parts.join(", ") + stop : "") + L.formFilled +
        (missing.length ? " " + L.youChoose(missing.join(", ")) : "") + " " + L.pressPost;
      r.steps.push("Form bhara (post NAHI kiya, user khud dabayega)");
      return;
    }

    case "set_availability": {
      if (!confirmed) {
        r.pending = { tool: "set_availability", args: { available: a.available === true } };
        r.reply = L.availAsk(a.available === true);
        r.steps.push("Pakka karne ka intezaar (abhi kuch nahi badla)");
        return;
      }
      if (!dryRun) await setAvailability(user.id, a.available === true);
      r.changedData = !dryRun;
      r.reply = L.availDone(a.available === true);
      r.steps.push(`Available = ${a.available ? "ON" : "OFF"}${dryRun ? " (test, save nahi)" : ""}`);
      return;
    }

    case "set_skills": {
      if (!confirmed) {
        r.pending = { tool: "set_skills", args: { skills: a.skills, skillMode: a.skillMode } };
        r.reply = L.skillsAsk(a.skillMode === "add", (a.skills ?? []).map(cat).join(", "));
        r.steps.push("Pakka karne ka intezaar (abhi kuch nahi badla)");
        return;
      }
      let skills = a.skills ?? [];
      if (a.skillMode === "add" && !dryRun) {
        const cur = await pool.query("SELECT skills FROM worker_profiles WHERE user_id = $1", [user.id]);
        skills = [...new Set([...(cur.rows[0]?.skills ?? []), ...skills])];
      }
      if (!dryRun) skills = await setSkills(user.id, skills);
      r.changedData = !dryRun;
      r.reply = L.skillsDone(a.skillMode === "add", skills.map(cat).join(", "));
      r.steps.push(`Skills ${a.skillMode === "add" ? "jodi" : "set ki"}: ${skills.join(", ")}${dryRun ? " (test, save nahi)" : ""}`);
      return;
    }

    case "search_workers": {
      r.navigateTo = `/explore?tab=workers&category=${a.category}${a.available ? "&avail=1" : ""}`;
      if (dryRun || !user.area_id) {
        r.reply = L.showing(cat(a.category));
        return;
      }
      const list = await searchWorkers({ category: a.category as CategoryId, areaId: user.area_id, viewerId: user.id, limit: 3 });
      const top = list.slice(0, 3);
      r.data = top.map((w) => ({ id: w.id, name: w.name, distance_km: w.distance_km, available: w.available }));
      r.reply = top.length
        ? L.found(cat(a.category), top.map((w) => `${w.name} (${L.dist(w.distance_km)})`).join(", "))
        : L.noneFound(cat(a.category));
      r.steps.push(`Database se ${list.length} kaarigar mile (order: available, doori, rating, kaam)`);
      return;
    }

    case "ask":
      r.reply = translateQuestion(a.question ?? L.questions.more, lang);
      r.steps.push("Sawaal poocha (kuch kiya nahi)");
      return;

    case "refuse":
      r.reply = L.refuse[a.reason ?? "other"] ?? L.refuse.other;
      r.steps.push(`Mana kiya: ${a.reason}`);
      return;
  }
}
