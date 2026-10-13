import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/me -> kaun login hai
export async function GET() {
  return Response.json({ user: await getCurrentUser() });
}

// PATCH /api/me
//   { mode: "hire" | "work" } -> ek hi account se kaam karwana bhi aur kaam karna bhi
//   { name: "..." }           -> apna naam badlo
export async function PATCH(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (typeof body.name === "string") {
    const name = body.name.trim().replace(/\s+/g, " ");
    if (name.length < 2) return Response.json({ error: "Naam kam se kam 2 akshar ka ho" }, { status: 400 });
    if (name.length > 60) return Response.json({ error: "Naam 60 akshar se chhota rakho" }, { status: 400 });
    await pool.query("UPDATE users SET name = $2 WHERE id = $1", [me.id, name]);
  }

  // { areaId } -> apna area badlo
  if (body.areaId !== undefined) {
    const areaId = Number(body.areaId);
    const ok = Number.isInteger(areaId) ? await pool.query("SELECT 1 FROM areas WHERE id = $1", [areaId]) : null;
    if (!ok || ok.rowCount === 0) return Response.json({ error: "Ye area nahi mila" }, { status: 400 });
    await pool.query("UPDATE users SET area_id = $2 WHERE id = $1", [me.id, areaId]);
  }

  if (body.mode !== undefined) {
    if (me.role === "business") {
      return Response.json({ error: "Business account sirf kaam karta hai" }, { status: 400 });
    }
    if (body.mode !== "hire" && body.mode !== "work") {
      return Response.json({ error: "Galat mode" }, { status: 400 });
    }
    const role = body.mode === "hire" ? "customer" : "worker";
    await pool.query("UPDATE users SET role = $2 WHERE id = $1", [me.id, role]);
    // Kaarigar ki profile hamesha taiyaar rahe, taaki switch karte hi kaam dikhe
    await pool.query("INSERT INTO worker_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [me.id]);
  }

  return Response.json({ user: await getCurrentUser() });
}
