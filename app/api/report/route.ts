import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// POST /api/report { userId, jobId?, reason?, block? } -> shikayat darj, aur chahe to block
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userId = Number(body.userId);
  if (!Number.isInteger(userId) || userId <= 0 || userId === me.id) {
    return Response.json({ error: "Galat user" }, { status: 400 });
  }
  const jobId = Number(body.jobId);

  await pool.query(
    "INSERT INTO reports (reporter_id, reported_id, job_id, reason) VALUES ($1, $2, $3, $4)",
    [me.id, userId, Number.isInteger(jobId) && jobId > 0 ? jobId : null, String(body.reason ?? "").slice(0, 300) || null]
  );
  if (body.block === true) {
    await pool.query(
      "INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [me.id, userId]
    );
  }
  return Response.json({ ok: true });
}
