import { getCurrentUser } from "@/lib/session";
import { jobAction } from "@/lib/jobs";

// POST /api/jobs/12  { action: "apply" | "accept_invite" | "withdraw" | "select" | "unselect" | "cancel" | "complete" | "review", ... }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 401 });

  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return Response.json({ error: "Galat kaam" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  try {
    await jobAction(me, jobId, {
      action: String(body.action ?? ""),
      workerId: body.workerId === undefined ? undefined : Number(body.workerId),
      stars: body.stars === undefined ? undefined : Number(body.stars),
      comment: typeof body.comment === "string" ? body.comment : undefined,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}