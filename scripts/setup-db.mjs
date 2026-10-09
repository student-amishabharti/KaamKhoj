import fs from "node:fs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query(fs.readFileSync("db/schema.sql", "utf8"));
  await client.query(fs.readFileSync("db/seed.sql", "utf8"));

  const { rows } = await client.query(`
    SELECT (SELECT COUNT(*) FROM areas) AS areas,
           (SELECT COUNT(*) FROM users) AS users,
           (SELECT COUNT(*) FROM job_posts) AS kaam,
           (SELECT COUNT(*) FROM job_posts WHERE status = 'open') AS khule_kaam,
           (SELECT COUNT(*) FROM reviews) AS reviews
  `);
  console.log("✅ Database taiyaar:", rows[0]);
} catch (err) {
  console.error("❌ Database setup fail:", err.message);
} finally {
  await client.end();
}