import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { aiConfigured } from "@/lib/agent/llm";
import { runEval, summarize, type CaseResult } from "@/lib/agent/evaluate";
import { EVAL_CASES } from "@/lib/agent/evalCases";

export const maxDuration = 120;

// Pichhle run (sirf summary) dikhao
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 401 });
  const { rows } = await pool.query(
    "SELECT id, summary, results, created_at FROM eval_runs ORDER BY id DESC LIMIT 10"
  );
  return Response.json({ runs: rows, aiReady: aiConfigured(), totalCases: EVAL_CASES.length });
}

// Naya run: saare test sawaal chalao (kuch bhi save/badla nahi jaata, sirf result save hota hai)
let running = false;
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 401 });
  if (running) return Response.json({ error: "Ek test pehle se chal raha hai, ruko" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const engine = body.engine === "rules" ? "rules" : "auto";
  if (engine === "auto" && !aiConfigured()) {
    return Response.json({ error: "AI key (GEMINI_API_KEY) set nahi hai. Pehle .env.local mein jodo" }, { status: 400 });
  }

  running = true;
  try {
    const results = await runEval(engine, me.area_name);
    const prev = await pool.query(
      "SELECT results FROM eval_runs WHERE summary->>'engine' = $1 ORDER BY id DESC LIMIT 1",
      [engine]
    );
    const summary = summarize(engine, results, prev.rows[0]?.results as CaseResult[] | undefined);
    const { rows } = await pool.query(
      "INSERT INTO eval_runs (summary, results) VALUES ($1, $2) RETURNING id, created_at",
      [JSON.stringify(summary), JSON.stringify(results)]
    );
    return Response.json({ run: { ...rows[0], summary, results } });
  } catch (err) {
    console.error("eval error", err);
    return Response.json({ error: "Test poora nahi hua: " + (err as Error).message }, { status: 500 });
  } finally {
    running = false;
  }
}
