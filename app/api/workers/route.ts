import { pool } from "@/lib/db";

export async function GET() {
  const { rows } = await pool.query(`
    SELECT u.id, u.name, u.role, a.name AS area, a.city,
           w.skills, w.available, w.business_name,
           s.rating_avg, s.review_count, s.jobs_completed
    FROM worker_profiles w
    JOIN users u ON u.id = w.user_id
    JOIN areas a ON a.id = u.area_id
    JOIN worker_stats s ON s.user_id = w.user_id
    ORDER BY u.id
  `);

  return Response.json({ workers: rows });
}