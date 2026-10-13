import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createJob, listMyJobs, listOpenJobs } from "@/lib/jobs";

// GET /api/jobs                  -> mere kaam (abhi ke mode ke hisaab se)
// GET /api/jobs?as=customer      -> maine jo kaam post kiye (malik ki taraf)
// GET /api/jobs?as=worker        -> jin kaamon par maine haan kaha / mujhe bulaya (kaarigar ki taraf)
// GET /api/jobs?scope=open       -> meri skill ke khule kaam
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 401 });

  const url = new URL(req.url);
  if (url.searchParams.get("scope") === "open") {
    // Ek hi account kaarigar bhi hai: profile na ho to bana do (skills khaali)
    await pool.query("INSERT INTO worker_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [me.id]);
    return Response.json({ jobs: await listOpenJobs(me.id) });
  }
  const as = url.searchParams.get("as");
  return Response.json(await listMyJobs(me, as === "customer" || as === "worker" ? as : undefined));
}

// POST /api/jobs -> malik naya kaam post karta hai
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 401 });
  if (me.role === "business") {
    return Response.json({ error: "Business account se kaam post nahi hota" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  try {
    const { id, duplicate } = await createJob(me, {
      category: String(body.category ?? ""),
      workDate: String(body.workDate ?? ""),
      startTime: String(body.startTime ?? ""),
      hours: Number(body.hours),
      note: typeof body.note === "string" ? body.note : "",
      inviteWorkerId: body.inviteWorkerId ? Number(body.inviteWorkerId) : undefined,
      areaId: body.areaId ? Number(body.areaId) : undefined,
    });
    return Response.json({ ok: true, id, duplicate });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}
