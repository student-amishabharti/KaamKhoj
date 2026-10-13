import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { COOKIE, makeToken } from "@/lib/session";

const MAX_ATTEMPTS = 5;

function fail(error: string, field: string, status = 400, extra: object = {}) {
  return NextResponse.json({ error, field, ...extra }, { status });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone ?? "").replace(/\D/g, "");
  const code = String(body.code ?? "").trim();

  if (!/^\d{4}$/.test(code)) return fail("4 ank ka OTP daalo", "otp");

  const otp = (
    await pool.query("SELECT code, attempts FROM otp_codes WHERE phone = $1 AND expires_at > now()", [phone])
  ).rows[0];
  if (!otp) return fail("OTP purana ho gaya. Naya OTP mangao", "otp");
  if (otp.attempts >= MAX_ATTEMPTS) return fail("Bahut galat koshish. Naya OTP mangao", "otp", 429);

  if (otp.code !== code) {
    await pool.query("UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = $1", [phone]);
    const left = MAX_ATTEMPTS - otp.attempts - 1;
    return fail(left > 0 ? "OTP galat hai" : "Bahut galat koshish. Naya OTP mangao", "otp");
  }

  let user = (await pool.query("SELECT id, role FROM users WHERE phone = $1", [phone])).rows[0];

  if (!user) {
    // Naya user: sirf naam aur ghar ka area. Role tay nahi karte; app ke andar switch se badal sakte hain.
    const name = String(body.name ?? "").trim().slice(0, 60);
    const areaId = Number(body.areaId);
    if (!name) return fail("Apna naam likho", "name");
    if (!Number.isInteger(areaId) || areaId <= 0) return fail("Apna area chuno", "area");

    const role = body.intent === "work" ? "worker" : "customer";
    user = (
      await pool.query(
        "INSERT INTO users (phone, name, role, area_id) VALUES ($1, $2, $3, $4) RETURNING id, role",
        [phone, name, role, areaId]
      )
    ).rows[0];
    await pool.query("INSERT INTO worker_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [user.id]);
  }

  await pool.query("DELETE FROM otp_codes WHERE phone = $1", [phone]);

  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(COOKIE, makeToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
