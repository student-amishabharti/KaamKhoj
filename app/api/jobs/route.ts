import { getCurrentUser } from "@/lib/session";
import { createJob, listMyJobs, listOpenJobs } from "@/lib/jobs";

// GET /api/jobs            -> mere kaam
// GET /api/jobs?scope=open -> kaarigar ke liye khule kaam
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 401 });

  const scope = new URL(req.url).searchParams.get("scope");
  if (scope === "open") {
    if (me.role === "customer") {
      return Response.json({ error: "Khule kaam sirf kaarigar ke liye" }, { status: 403 });
    }
    return Response.json({ jobs: await listOpenJobs(me.id) });
  }
  return Response.json(await listMyJobs(me));
}

// POST /api/jobs -> malik naya kaam post karta hai
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "customer") {
    return Response.json({ error: "Kaam sirf malik post kar sakta hai" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  try {
    const id = await createJob(me, {
      category: String(body.category ?? ""),
      workDate: String(body.workDate ?? ""),
      startTime: String(body.startTime ?? ""),
      hours: Number(body.hours),
      note: typeof body.note === "string" ? body.note : "",
      inviteWorkerId: body.inviteWorkerId ? Number(body.inviteWorkerId) : undefined,
    });
    return Response.json({ ok: true, id });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}