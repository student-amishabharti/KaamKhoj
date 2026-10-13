// Model (ya rules) ka plan check karna. Jo galat ya bana-banaya ho, use hatao aur gin lo.
import { INTENTS, PAGES, TOOLS, type Intent, type Plan, type RawPlan, type ToolName } from "./types";
import { resolveDate, toCategory } from "./words";

// Kaunsa intent kaunse tool se hi chal sakta hai
const TOOL_FOR: Record<Intent, ToolName> = {
  post_job: "draft_job",
  find_workers: "search_workers",
  set_availability: "set_availability",
  set_skills: "set_skills",
  navigate: "navigate",
  clarify: "ask",
  refuse: "refuse",
};

const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");

// null = plan kaam ka hi nahi (intent/tool galat). invalid = jo cheezein hatani padi.
export function validatePlan(raw: RawPlan): { plan: Plan | null; invalid: string[] } {
  const invalid: string[] = [];
  const intent = str(raw.intent) as Intent;
  let tool = str(raw.tool) as ToolName;
  if (!INTENTS.includes(intent)) return { plan: null, invalid: [`intent "${str(raw.intent) || "?"}" maujood nahi`] };
  if (!TOOLS.includes(tool)) {
    invalid.push(`tool "${str(raw.tool) || "?"}" maujood nahi`);
    tool = TOOL_FOR[intent];
  }
  if (TOOL_FOR[intent] !== tool) {
    invalid.push(`intent ${intent} ke saath tool ${tool} galat`);
    tool = TOOL_FOR[intent];
  }

  const a = (raw.args && typeof raw.args === "object" ? raw.args : {}) as Record<string, unknown>;
  const args: Plan["args"] = {};

  if (tool === "navigate") {
    const page = str(a.page).toLowerCase();
    if (page in PAGES) args.page = page;
    else {
      invalid.push(`page "${page || "?"}" maujood nahi`);
      return { plan: null, invalid };
    }
  }

  if (tool === "draft_job" || tool === "search_workers") {
    if (a.category !== undefined && a.category !== null && a.category !== "") {
      const c = toCategory(a.category);
      if (c) args.category = c;
      else invalid.push(`category "${str(a.category)}" maujood nahi`);
    }
    if (tool === "search_workers" && (a.available === true || a.available === "true")) args.available = true;
    if (tool === "search_workers" && !args.category) {
      return { plan: { intent: "clarify", tool: "ask", args: { question: "Kaunse kaam ke kaarigar dekhne hain?" }, reply: "" }, invalid };
    }
  }

  if (tool === "draft_job") {
    const word = str(a.dateWord).toLowerCase() || str(a.date);
    if (word) {
      const d = resolveDate(word);
      if (d) { args.date = d; args.dateWord = word; }
      else invalid.push(`din "${word}" samajh nahi aaya ya beet chuka`);
    }
    const time = str(a.time);
    if (time) {
      if (/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) args.time = time;
      else if (/^\d:[0-5]\d$/.test(time)) args.time = `0${time}`;
      else invalid.push(`time "${time}" galat`);
    }
    if (a.hours !== undefined && a.hours !== null && a.hours !== "") {
      const h = Number(a.hours);
      if (Number.isInteger(h) && h >= 1 && h <= 12) args.hours = h;
      else invalid.push(`ghante "${String(a.hours)}" galat (1-12)`);
    }
    const note = str(a.note);
    if (note) args.note = note.slice(0, 200);
  }

  if (tool === "set_availability") {
    if (typeof a.available === "boolean") args.available = a.available;
    else if (a.available === "true" || a.available === "false") args.available = a.available === "true";
    else return { plan: null, invalid: [...invalid, "available true/false nahi diya"] };
  }

  if (tool === "set_skills") {
    const list = Array.isArray(a.skills) ? a.skills : a.skills ? [a.skills] : [];
    const skills: string[] = [];
    for (const s of list) {
      const c = toCategory(s);
      if (c) skills.push(c);
      else invalid.push(`skill "${String(s)}" maujood nahi`);
    }
    if (!skills.length) return { plan: null, invalid: [...invalid, "koi sahi skill nahi"] };
    args.skills = [...new Set(skills)];
    args.skillMode = a.skillMode === "add" ? "add" : "set";
  }

  if (tool === "ask") args.question = str(a.question) || "Thoda aur bataiye, kya karna hai?";
  if (tool === "refuse") args.reason = str(a.reason) || "other";

  const reply = str(raw.reply).slice(0, 200);
  return { plan: { intent, tool, args, reply }, invalid };
}
