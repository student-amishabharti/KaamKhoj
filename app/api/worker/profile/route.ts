import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getWorkerProfile, setAvailability, setLearner, setSkills, setWorkNote } from "@/lib/worker";

// Har account kaarigar bhi ban sakta hai. Profile ki line na ho to bana do.
async function requireWorker() {
  const me = await getCurrentUser();
  if (!me) return null;
  await pool.query("INSERT INTO worker_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [me.id]);
  return me;
}

export async function GET() {
  const me = await requireWorker();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 403 });
  return Response.json({ profile: await getWorkerProfile(me.id) });
}

export async function PATCH(req: Request) {
  const me = await requireWorker();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  try {
    if (Array.isArray(body.skills)) await setSkills(me.id, body.skills.map(String));
    if (typeof body.available === "boolean") await setAvailability(me.id, body.available);
    if (typeof body.workNote === "string") await setWorkNote(me.id, body.workNote);
    if (typeof body.isLearner === "boolean") await setLearner(me.id, body.isLearner);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
  return Response.json({ profile: await getWorkerProfile(me.id) });
}
