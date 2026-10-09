import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone ?? "").replace(/\D/g, "");

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return Response.json({ error: "10 ankon ka sahi mobile number daalo" }, { status: 400 });
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));
  await pool.query(
    `INSERT INTO otp_codes (phone, code, expires_at)
     VALUES ($1, $2, now() + interval '5 minutes')
     ON CONFLICT (phone) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at`,
    [phone, code]
  );

  const { rows } = await pool.query("SELECT 1 FROM users WHERE phone = $1", [phone]);

  // DEMO MODE: asli app mein code SMS se jaayega, screen par nahi dikhega
  return Response.json({ ok: true, demoCode: code, isNewUser: rows.length === 0 });
}