import { getCurrentUser } from "@/lib/session";
import { getWorkerProfile, setAvailability, setLearner, setSkills, setWorkNote } from "@/lib/worker";

async function requireWorker() {
  const me = await getCurrentUser();
  if (!me || me.role === "customer") return null;
  return me;
}

export async function GET() {
  const me = await requireWorker();
  if (!me) return Response.json({ error: "Ye page sirf kaarigar ke liye hai" }, { status: 403 });
  return Response.json({ profile: await getWorkerProfile(me.id) });
}

export async function PATCH(req: Request) {
  const me = await requireWorker();
  if (!me) return Response.json({ error: "Ye page sirf kaarigar ke liye hai" }, { status: 403 });

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