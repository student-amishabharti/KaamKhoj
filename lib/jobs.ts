import { pool } from "@/lib/db";
import { isCategory } from "@/lib/categories";
import type { CurrentUser } from "@/lib/session";

// Do areas ke beech doori (km), haversine formula se. a aur b = SQL mein areas ke alias.
const dist = (a: string, b: string) => `ROUND((6371 * 2 * ASIN(SQRT(
  POWER(SIN(RADIANS(${a}.lat - ${b}.lat) / 2), 2) +
  COS(RADIANS(${b}.lat)) * COS(RADIANS(${a}.lat)) *
  POWER(SIN(RADIANS(${a}.lng - ${b}.lng) / 2), 2)
)))::numeric, 1)::float`;

export type JobInput = {
  category: string;
  workDate: string;
  startTime: string;
  hours: number;
  note?: string;
  inviteWorkerId?: number;
};

// Kaam ki details sahi hain ya nahi. AI agent bhi isi se check karega.
export function checkJobInput(i: Partial<JobInput>): string | null {
  if (!i.category || !isCategory(i.category)) return "Kaunsa kaam? Category chuno";
  if (!i.workDate || !/^\d{4}-\d{2}-\d{2}$/.test(i.workDate)) return "Kis din? Din chuno";
  if (!i.startTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(i.startTime)) return "Kitne baje? Time chuno";
  const h = Number(i.hours);
  if (!Number.isInteger(h) || h < 1 || h > 12) return "Kitne ghante ka kaam? 1 se 12";
  return null;
}

export async function createJob(me: CurrentUser, i: JobInput) {
  const err = checkJobInput(i);
  if (err) throw new Error(err);
  if (!me.area_id) throw new Error("Pehle apna area chuno");

  const past = await pool.query("SELECT $1::date < current_date AS past", [i.workDate]);
  if (past.rows[0].past) throw new Error("Beeta hua din nahi chun sakte");

  if (i.inviteWorkerId) {
    const ok = await pool.query(
      "SELECT 1 FROM worker_profiles WHERE user_id = $1 AND $2 = ANY(skills)",
      [i.inviteWorkerId, i.category]
    );
    if (ok.rowCount === 0) throw new Error("Ye kaarigar is kaam ka nahi hai");
  }

  const { rows } = await pool.query(
    `INSERT INTO job_posts (customer_id, category, area_id, work_date, start_time, hours, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [me.id, i.category, me.area_id, i.workDate, i.startTime, Number(i.hours), (i.note ?? "").slice(0, 200) || null]
  );
  const jobId: number = rows[0].id;

  if (i.inviteWorkerId) {
    await pool.query(
      "INSERT INTO job_applications (job_id, worker_id, status) VALUES ($1, $2, 'invited')",
      [jobId, i.inviteWorkerId]
    );
  }
  return jobId;
}

// Kaarigar ke liye: uski skill wale khule kaam, paas wale pehle
export async function listOpenJobs(workerId: number) {
  const { rows } = await pool.query(
    `SELECT j.id, j.category, to_char(j.work_date, 'YYYY-MM-DD') AS work_date, j.start_time, j.hours, j.note,
            a.name AS area, a.city, u.name AS customer_name,
            ${dist("a", "ma")} AS distance_km,
            ja.status AS my_status,
            (SELECT COUNT(*)::int FROM job_applications x
              WHERE x.job_id = j.id AND x.status IN ('applied', 'selected')) AS interested
     FROM job_posts j
     JOIN areas a ON a.id = j.area_id
     JOIN users u ON u.id = j.customer_id
     JOIN users me ON me.id = $1
     JOIN areas ma ON ma.id = me.area_id
     JOIN worker_profiles w ON w.user_id = $1
     LEFT JOIN job_applications ja ON ja.job_id = j.id AND ja.worker_id = $1
     WHERE j.status = 'open'
       AND j.category = ANY(w.skills)
       AND j.work_date >= current_date
       AND NOT EXISTS (SELECT 1 FROM blocks b
             WHERE (b.blocker_id = $1 AND b.blocked_id = j.customer_id)
                OR (b.blocker_id = j.customer_id AND b.blocked_id = $1))
     ORDER BY j.work_date, distance_km`,
    [workerId]
  );
  return rows;
}

// "Mere kaam": malik ko apne posts + aane wale kaarigar, kaarigar ko apne kaam
export async function listMyJobs(me: CurrentUser) {
  if (me.role === "customer") {
    const posts = await pool.query(
      `SELECT j.id, j.category, to_char(j.work_date, 'YYYY-MM-DD') AS work_date, j.start_time, j.hours,
              j.note, j.status, a.name AS area
       FROM job_posts j JOIN areas a ON a.id = j.area_id
       WHERE j.customer_id = $1
       ORDER BY (j.status IN ('open', 'assigned')) DESC, j.work_date DESC, j.id DESC
       LIMIT 30`,
      [me.id]
    );

    // Phone number sirf chune gaye kaarigar ka, aur sirf jab kaam tay ya poora ho
    const apps = await pool.query(
      `SELECT ja.job_id, ja.status, u.id AS worker_id, u.name,
              CASE WHEN ja.status = 'selected' AND j.status IN ('assigned', 'completed')
                   THEN u.phone END AS phone,
              w.is_learner, s.rating_avg, s.review_count, s.jobs_completed,
              ${dist("wa", "jarea")} AS distance_km,
              r.stars AS my_stars,
              COALESCE((SELECT array_agg(t.comment) FROM (
                 SELECT rv.comment FROM reviews rv
                 WHERE rv.worker_id = u.id AND rv.comment IS NOT NULL
                 ORDER BY rv.created_at DESC, rv.id DESC LIMIT 2) t), '{}') AS recent_comments
       FROM job_applications ja
       JOIN job_posts j ON j.id = ja.job_id
       JOIN areas jarea ON jarea.id = j.area_id
       JOIN users u ON u.id = ja.worker_id
       JOIN areas wa ON wa.id = u.area_id
       JOIN worker_profiles w ON w.user_id = u.id
       JOIN worker_stats s ON s.user_id = u.id
       LEFT JOIN reviews r ON r.job_id = j.id AND r.worker_id = u.id
       WHERE j.customer_id = $1 AND ja.status IN ('invited', 'applied', 'selected')
       ORDER BY (ja.status = 'selected') DESC, s.rating_avg DESC`,
      [me.id]
    );

    return {
      role: "customer" as const,
      posts: posts.rows.map((p) => ({
        ...p,
        applicants: apps.rows.filter((x) => x.job_id === p.id),
      })),
    };
  }

  const { rows } = await pool.query(
    `SELECT j.id, j.category, to_char(j.work_date, 'YYYY-MM-DD') AS work_date, j.start_time, j.hours, j.note,
            j.status AS job_status, ja.status AS my_status, a.name AS area, a.city,
            u.id AS customer_id, u.name AS customer_name,
            CASE WHEN ja.status = 'selected' AND j.status IN ('assigned', 'completed')
                 THEN u.phone END AS customer_phone,
            ${dist("a", "wa")} AS distance_km
     FROM job_applications ja
     JOIN job_posts j ON j.id = ja.job_id
     JOIN areas a ON a.id = j.area_id
     JOIN users u ON u.id = j.customer_id
     JOIN users me ON me.id = ja.worker_id
     JOIN areas wa ON wa.id = me.area_id
     WHERE ja.worker_id = $1
     ORDER BY (j.status IN ('open', 'assigned')) DESC, j.work_date DESC, j.id DESC
     LIMIT 30`,
    [me.id]
  );
  return { role: "worker" as const, jobs: rows };
}

// Agar koi chuna hua kaarigar nahi bacha, to kaam phir khula ho jaata hai
async function reopenIfNoneSelected(jobId: number) {
  await pool.query(
    `UPDATE job_posts SET status = 'open'
     WHERE id = $1 AND status = 'assigned'
       AND NOT EXISTS (SELECT 1 FROM job_applications WHERE job_id = $1 AND status = 'selected')`,
    [jobId]
  );
}

export type JobAction = {
  action: string;
  workerId?: number;
  stars?: number;
  comment?: string;
};

// Saare button yahin se chalte hain. Har action pehle check karta hai ki ye user ye kar sakta hai ya nahi.
export async function jobAction(me: CurrentUser, jobId: number, a: JobAction) {
  const job = (
    await pool.query("SELECT id, customer_id, category, status FROM job_posts WHERE id = $1", [jobId])
  ).rows[0];
  if (!job) throw new Error("Ye kaam nahi mila");
  const closed = job.status === "completed" || job.status === "cancelled";

  // ----- Kaarigar ke kaam -----
  if (me.role !== "customer") {
    if (a.action === "apply") {
      if (job.status !== "open") throw new Error("Ye kaam ab khula nahi hai");
      const skill = await pool.query(
        "SELECT 1 FROM worker_profiles WHERE user_id = $1 AND $2 = ANY(skills)",
        [me.id, job.category]
      );
      if (skill.rowCount === 0) throw new Error("Ye kaam aapki skill ka nahi hai");
      await pool.query(
        `INSERT INTO job_applications (job_id, worker_id, status) VALUES ($1, $2, 'applied')
         ON CONFLICT (job_id, worker_id) DO UPDATE SET status = 'applied'
         WHERE job_applications.status = 'withdrawn'`,
        [jobId, me.id]
      );
      return;
    }

    if (a.action === "accept_invite") {
      if (closed) throw new Error("Ye kaam band ho chuka hai");
      const r = await pool.query(
        `UPDATE job_applications SET status = 'selected'
         WHERE job_id = $1 AND worker_id = $2 AND status = 'invited'`,
        [jobId, me.id]
      );
      if (r.rowCount === 0) throw new Error("Aapko is kaam ke liye bulaya nahi gaya");
      await pool.query("UPDATE job_posts SET status = 'assigned' WHERE id = $1 AND status = 'open'", [jobId]);
      return;
    }

    if (a.action === "withdraw") {
      const app = (
        await pool.query("SELECT status FROM job_applications WHERE job_id = $1 AND worker_id = $2", [jobId, me.id])
      ).rows[0];
      if (!app || !["invited", "applied", "selected"].includes(app.status)) {
        throw new Error("Wapas lene ko kuch nahi hai");
      }
      if (job.status === "completed") throw new Error("Kaam poora ho chuka hai");
      await pool.query(
        "UPDATE job_applications SET status = 'withdrawn' WHERE job_id = $1 AND worker_id = $2",
        [jobId, me.id]
      );
      if (app.status === "selected") await reopenIfNoneSelected(jobId);
      return;
    }

    throw new Error("Ye kaam kaarigar nahi kar sakta");
  }

  // ----- Malik ke kaam -----
  if (job.customer_id !== me.id) throw new Error("Ye aapka kaam nahi hai");
  const workerId = Number(a.workerId);

  if (a.action === "select") {
    if (closed) throw new Error("Ye kaam band ho chuka hai");
    const r = await pool.query(
      `UPDATE job_applications SET status = 'selected'
       WHERE job_id = $1 AND worker_id = $2 AND status = 'applied'`,
      [jobId, workerId]
    );
    if (r.rowCount === 0) throw new Error("Is kaarigar ne haan nahi kaha");
    await pool.query("UPDATE job_posts SET status = 'assigned' WHERE id = $1 AND status = 'open'", [jobId]);
    return;
  }

  if (a.action === "unselect") {
    if (closed) throw new Error("Ye kaam band ho chuka hai");
    const r = await pool.query(
      `UPDATE job_applications SET status = 'rejected'
       WHERE job_id = $1 AND worker_id = $2 AND status IN ('selected', 'invited')`,
      [jobId, workerId]
    );
    if (r.rowCount === 0) throw new Error("Ye kaarigar chuna hua nahi hai");
    await reopenIfNoneSelected(jobId);
    return;
  }

  if (a.action === "cancel") {
    if (closed) throw new Error("Ye kaam pehle hi band hai");
    await pool.query("UPDATE job_posts SET status = 'cancelled' WHERE id = $1", [jobId]);
    return;
  }

  if (a.action === "complete") {
    if (job.status !== "assigned") throw new Error("Pehle kisi kaarigar ko chuno");
    await pool.query("UPDATE job_posts SET status = 'completed' WHERE id = $1", [jobId]);
    return;
  }

  if (a.action === "review") {
    if (job.status !== "completed") throw new Error("Rating kaam poora hone ke baad");
    const stars = Number(a.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error("1 se 5 star chuno");
    const sel = await pool.query(
      "SELECT 1 FROM job_applications WHERE job_id = $1 AND worker_id = $2 AND status = 'selected'",
      [jobId, workerId]
    );
    if (sel.rowCount === 0) throw new Error("Ye kaarigar is kaam par nahi tha");
    await pool.query(
      `INSERT INTO reviews (job_id, worker_id, customer_id, stars, comment)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (job_id, worker_id) DO NOTHING`,
      [jobId, workerId, me.id, stars, (a.comment ?? "").slice(0, 200) || null]
    );
    return;
  }

  throw new Error("Ye kaam malik nahi kar sakta");
}