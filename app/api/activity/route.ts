import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// Sirf apni AI activity (kisi aur ki nahi)
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 401 });
  const { rows } = await pool.query(
    "SELECT id, input, result, created_at FROM agent_logs WHERE user_id = $1 ORDER BY id DESC LIMIT 30",
    [me.id]
  );
  return Response.json({ logs: rows });
}
