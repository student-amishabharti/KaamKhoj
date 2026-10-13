// Google AI Studio se baat. Pehle Gemma, wo na chale to Gemini. Dono na chalein to null (fir rules chalenge).
// Key sirf server par: process.env.GEMINI_API_KEY (.env.local / Render Environment). Browser tak kabhi nahi jaati.
import type { RawPlan } from "./types";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 12000;

export type LlmEngine = "gemma" | "gemini";

export function aiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function models(): { engine: LlmEngine; model: string }[] {
  return [
    { engine: "gemma", model: process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it" },
    { engine: "gemini", model: process.env.GEMINI_MODEL || "gemini-flash-latest" },
  ];
}

// Model kabhi ```json ... ``` ya extra baat likh deta hai: usme se pehla {...} nikaalo
export function extractJson(text: string): RawPlan | null {
  const cleaned = text.replace(/```(json)?/gi, "");
  const start = cleaned.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inStr) {
      if (ch === "\\") i++;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      try {
        const obj = JSON.parse(cleaned.slice(start, i + 1));
        return obj && typeof obj === "object" ? (obj as RawPlan) : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Galti ka seedha matlab (key kabhi nahi dikhate)
function why(status: number) {
  if (status === 400) return "request ya key galat";
  if (status === 401 || status === 403) return "key ko permission nahi";
  if (status === 404) return "model ka naam nahi mila";
  if (status === 429) return "free limit khatam, thodi der baad";
  if (status >= 500) return "Google ki taraf dikkat";
  return "dikkat";
}

async function callModel(model: string, engine: LlmEngine, system: string, user: string) {
  const isGemini = engine === "gemini";
  // Gemma kuch jagah "system instruction" nahi leta, isliye uske liye niyam user ke sandesh mein hi jod dete hain
  const body = {
    ...(isGemini ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents: [{ role: "user", parts: [{ text: isGemini ? user : `${system}\n\nUser: "${user}"\nJSON:` }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 2048, // naye model pehle "sochte" hain; kam rakha to jawab adhoora reh jaata hai
      ...(isGemini ? { responseMimeType: "application/json" } : {}),
    },
  };
  const key = (process.env.GEMINI_API_KEY ?? "").trim().replace(/^["']|["']$/g, "");
  const res = await fetch(`${BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const msg = String(err?.error?.message ?? "").slice(0, 90);
    console.error(`[AI] ${engine} (${model}) ${res.status}: ${msg}`);
    throw new Error(`${engine} ${res.status}: ${why(res.status)}`);
  }
  const data = await res.json();
  const parts: { text?: string; thought?: boolean }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => !p.thought).map((p) => p.text ?? "").join("");
  return text;
}

// Plan maango. Jo model chala uska naam bhi lautao. Galti ho to agla model try.
// errors = network/key ki dikkat. badOutput = model ne JSON hi nahi diya (ye galat output mein ginta hai).
export type ModelAnswer = { engine: LlmEngine | null; plan: RawPlan | null; errors: string[]; badOutput: string[] };

export async function askModel(system: string, userText: string, only?: LlmEngine): Promise<ModelAnswer> {
  const out: ModelAnswer = { engine: null, plan: null, errors: [], badOutput: [] };
  if (!aiConfigured()) {
    out.errors.push("GEMINI_API_KEY nahi hai");
    return out;
  }
  for (const m of models()) {
    if (only && m.engine !== only) continue;
    try {
      const raw = await callModel(m.model, m.engine, system, userText);
      const plan = extractJson(raw);
      if (plan) {
        out.engine = m.engine;
        out.plan = plan;
        return out;
      }
      out.badOutput.push(`${m.engine}: JSON nahi diya`);
    } catch (err) {
      const e = err as Error;
      out.errors.push(e.name === "TimeoutError" ? `${m.engine}: der ho gayi` : e.message);
    }
  }
  return out;
}
