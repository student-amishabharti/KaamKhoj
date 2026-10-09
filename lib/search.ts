import { pool } from "@/lib/db";
import type { CategoryId } from "@/lib/categories";

// Ranking formula: saaf aur fix. AI ise badal nahi sakta.
export const WEIGHTS = { available: 0.4, distance: 0.3, rating: 0.2, jobs: 0.1 };
const MAX_KM = 15;
const MAX_JOBS = 20;

// Kam reviews par poora bharosa nahi: rating ko 3.5 ki taraf kheencho (Bayesian average)
function adjustedRating(avg: number, count: number) {
  return (avg * count + 3.5 * 5) / (count + 5);
}

export async function searchWorkers(opts: {
  category: CategoryId;
  areaId: number;
  viewerId?: number;
  limit?: number;
}) {
  const { rows } = await pool.query(
    `WITH me AS (SELECT lat, lng FROM areas WHERE id = $2)
     SELECT u.id, u.name, u.role, a.name AS area, a.city,
            w.available, w.skills, w.work_note, w.is_learner,
            w.team_size, w.working_hours, w.starting_price,
            s.rating_avg, s.review_count, s.jobs_completed,
            ROUND((6371 * 2 * ASIN(SQRT(
              POWER(SIN(RADIANS(a.lat - me.lat) / 2), 2) +
              COS(RADIANS(me.lat)) * COS(RADIANS(a.lat)) *
              POWER(SIN(RADIANS(a.lng - me.lng) / 2), 2)
            )))::numeric, 1)::float AS distance_km
     FROM worker_profiles w
     JOIN users u ON u.id = w.user_id
     JOIN areas a ON a.id = u.area_id
     JOIN worker_stats s ON s.user_id = w.user_id
     CROSS JOIN me
     WHERE $1 = ANY(w.skills)
       AND ($3::int IS NULL OR u.id <> $3)
       AND ($3::int IS NULL OR NOT EXISTS (
         SELECT 1 FROM blocks b
         WHERE (b.blocker_id = $3 AND b.blocked_id = u.id)
            OR (b.blocker_id = u.id AND b.blocked_id = $3)))`,
    [opts.category, opts.areaId, opts.viewerId ?? null]
  );

  const ranked = rows.map((r) => {
    const parts = {
      available: r.available ? 1 : 0,
      distance: 1 - Math.min(r.distance_km, MAX_KM) / MAX_KM,
      rating: adjustedRating(r.rating_avg, r.review_count) / 5,
      jobs: Math.min(r.jobs_completed, MAX_JOBS) / MAX_JOBS,
    };
    const score =
      WEIGHTS.available * parts.available +
      WEIGHTS.distance * parts.distance +
      WEIGHTS.rating * parts.rating +
      WEIGHTS.jobs * parts.jobs;
    return { ...r, score: Math.round(score * 100) / 100 };
  });

  ranked.sort((a, b) => b.score - a.score || a.distance_km - b.distance_km || a.id - b.id);
  return ranked.slice(0, opts.limit ?? 20);
}