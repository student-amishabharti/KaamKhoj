// AI agent ke saare "types": agent kya samajh sakta hai aur kaunse tool chala sakta hai

export const INTENTS = [
  "post_job",         // kaam post karna (form bharna)
  "find_workers",     // kaarigar dhoondhna
  "set_availability", // available on/off
  "set_skills",       // apne kaam (skills) batana
  "navigate",         // koi page kholna
  "clarify",          // baat saaf nahi, sawaal poochhna
  "refuse",           // galat ya khatarnaak baat
] as const;
export type Intent = (typeof INTENTS)[number];

export const TOOLS = [
  "navigate", "draft_job", "set_availability", "set_skills", "search_workers", "ask", "refuse",
] as const;
export type ToolName = (typeof TOOLS)[number];

// Sirf ye page khul sakte hain. AI koi aur page "bana" nahi sakta.
export const PAGES: Record<string, string> = {
  home: "/",
  post: "/post",
  jobs: "/jobs",
  open: "/explore?tab=jobs",
  search: "/explore?tab=workers",
  explore: "/explore",
  worker: "/worker",
  profile: "/profile",
  activity: "/activity",
};

// Model jo JSON deta hai (check hone se pehle)
export type RawPlan = {
  intent?: unknown;
  tool?: unknown;
  args?: Record<string, unknown>;
  reply?: unknown;
};

// Check hone ke baad ka saaf plan
export type Plan = {
  intent: Intent;
  tool: ToolName;
  args: {
    page?: string;
    category?: string;
    date?: string;      // YYYY-MM-DD (code ne nikala, model ne nahi)
    dateWord?: string;  // model/rules ne kya kaha: today, tomorrow, monday...
    time?: string;      // HH:MM
    hours?: number;
    note?: string;
    available?: boolean;
    skills?: string[];
    skillMode?: "set" | "add";
    question?: string;
    reason?: string;
  };
  reply: string;
};

export type Source = "guard" | "gemma" | "gemini" | "rules";

export type AgentResult = {
  input: string;
  source: Source;
  intent: Intent;
  tool: ToolName;
  args: Plan["args"];
  reply: string;
  navigateTo?: string;
  changedData?: boolean;      // DB mein kuch badla (page refresh chahiye)
  steps: string[];            // AI activity mein dikhne wale kadam
  invalidFromModel: string[]; // model ne jo galat/banaya hua diya (hallucination)
  latencyMs: number;
  data?: unknown;
  pending?: { tool: "set_availability" | "set_skills"; args: Plan["args"] }; // "Haan, karo" ka intezaar
};
