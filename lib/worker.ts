import { pool } from "@/lib/db";
import { isCategory } from "@/lib/categories";

export async function getWorkerProfile(userId: number) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.role, a.name AS area, a.city,
            w.skills, w.available, w.work_note, w.is_learner, w.business_name,
            s.rating_avg, s.review_count, s.jobs_completed
     FROM worker_profiles w
     JOIN users u ON u.id = w.user_id
     LEFT JOIN areas a ON a.id = u.area_id
     JOIN worker_stats s ON s.user_id = w.user_id
     WHERE w.user_id = $1`,
    [userId]
  );
  if (!rows[0]) return null;

  const reviews = await pool.query(
    `SELECT stars, comment FROM reviews
     WHERE worker_id = $1 ORDER BY created_at DESC, id DESC LIMIT 5`,
    [userId]
  );
  return { ...rows[0], recent_reviews: reviews.rows };
}

// AI agent ka "set skills" tool bhi yahi function chalayega
export async function setSkills(userId: number, skills: string[]) {
  const clean = [...new Set(skills)].filter(isCategory);
  if (clean.length === 0) throw new Error("Kam se kam ek kaam chuno");
  await pool.query("UPDATE worker_profiles SET skills = $2 WHERE user_id = $1", [userId, clean]);
  return clean;
}

// AI agent ka "set availability" tool bhi yahi function chalayega
export async function setAvailability(userId: number, available: boolean) {
  await pool.query("UPDATE worker_profiles SET available = $2 WHERE user_id = $1", [userId, available]);
  return available;
}

// "Kaam chahiye" message aur "seekh raha hoon"
export async function setWorkNote(userId: number, note: string) {
  await pool.query("UPDATE worker_profiles SET work_note = $2 WHERE user_id = $1", [
    userId,
    note.trim().slice(0, 150) || null,
  ]);
}

export async function setLearner(userId: number, isLearner: boolean) {
  await pool.query("UPDATE worker_profiles SET is_learner = $2 WHERE user_id = $1", [userId, isLearner]);
}

// Sabko dikhne wali kaarigar profile: naam, kaam, area, available, apna likha sandesh, asli rating/reviews.
// Phone number, pura pata, ya koi niji jaankari yahan kabhi nahi aati.
export async function getPublicWorker(workerId: number, viewerId?: number) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.role, a.name AS area, a.city,
            w.skills, w.available, w.work_note, w.is_learner,
            w.business_name, w.team_size, w.working_hours, w.service_areas,
            s.rating_avg, s.review_count, s.jobs_completed,
            to_char(u.created_at, 'YYYY-MM') AS joined
     FROM worker_profiles w
     JOIN users u ON u.id = w.user_id
     LEFT JOIN areas a ON a.id = u.area_id
     JOIN worker_stats s ON s.user_id = w.user_id
     WHERE w.user_id = $1 AND cardinality(w.skills) > 0
       AND ($2::int IS NULL OR NOT EXISTS (SELECT 1 FROM blocks b
             WHERE (b.blocker_id = $2 AND b.blocked_id = $1) OR (b.blocker_id = $1 AND b.blocked_id = $2)))`,
    [workerId, viewerId ?? null]
  );
  if (!rows[0]) return null;
  const reviews = await pool.query(
    `SELECT r.stars, r.comment, to_char(r.created_at, 'YYYY-MM-DD') AS date, j.category
     FROM reviews r JOIN job_posts j ON j.id = r.job_id
     WHERE r.worker_id = $1 ORDER BY r.created_at DESC, r.id DESC LIMIT 10`,
    [workerId]
  );
  return { ...rows[0], reviews: reviews.rows, self: viewerId === workerId };
}
