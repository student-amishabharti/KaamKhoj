import { getCurrentUser } from "@/lib/session";
import { getPublicWorker } from "@/lib/worker";

// GET /api/workers/12 -> kaarigar ki public profile (number / pata kabhi nahi)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Galat kaarigar" }, { status: 400 });
  const me = await getCurrentUser();
  const worker = await getPublicWorker(id, me?.id);
  if (!worker) return Response.json({ error: "Ye kaarigar nahi mila" }, { status: 404 });
  return Response.json({ worker, loggedIn: Boolean(me), canInvite: Boolean(me) && me!.role !== "business" && me!.id !== id });
}
