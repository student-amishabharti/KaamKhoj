import { pool } from "@/lib/db";

const RESEND_SECONDS = 10;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone ?? "").replace(/\D/g, "");

  if (phone.length !== 10) {
    return Response.json({ error: "10 ank ka mobile number daalo", field: "phone" }, { status: 400 });
  }
  if (!/^[6-9]/.test(phone)) {
    return Response.json({ error: "Sahi Indian mobile number daalo (6, 7, 8 ya 9 se shuru)", field: "phone" }, { status: 400 });
  }

  // Baar-baar OTP na mangwa sake: 30 second ka gap
  const recent = await pool.query(
    `SELECT CEIL(EXTRACT(EPOCH FROM (expires_at - interval '5 minutes' + interval '${RESEND_SECONDS} seconds' - now())))::int AS wait
     FROM otp_codes WHERE phone = $1`,
    [phone]
  );
  const wait = recent.rows[0]?.wait ?? 0;
  if (wait > 0) {
    return Response.json({ error: `${wait} second baad naya OTP mangao`, field: "otp", retryAfter: wait }, { status: 429 });
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));
  await pool.query(
    `INSERT INTO otp_codes (phone, code, expires_at, attempts)
     VALUES ($1, $2, now() + interval '5 minutes', 0)
     ON CONFLICT (phone) DO UPDATE
       SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, attempts = 0`,
    [phone, code]
  );

  const { rows } = await pool.query("SELECT 1 FROM users WHERE phone = $1", [phone]);

  // DEMO MODE: SMS provider (aur DLT registration) lagne tak OTP screen par dikhta hai.
  // Render par OTP_MODE=sms set karne par OTP screen par nahi aayega.
  const demo = process.env.OTP_MODE !== "sms";
  return Response.json({
    ok: true,
    demo,
    demoCode: demo ? code : undefined,
    isNewUser: rows.length === 0,
    resendAfter: RESEND_SECONDS,
  });
}
