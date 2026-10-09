import { pool } from "@/lib/db";

export async function GET() {
  const { rows } = await pool.query(
    "SELECT id, name, city FROM areas ORDER BY city, name"
  );
  return Response.json({ areas: rows });
}