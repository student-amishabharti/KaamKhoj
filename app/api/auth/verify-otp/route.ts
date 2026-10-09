import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { COOKIE, makeToken } from "@/lib/session";

const ROLES = ["worker", "customer", "business"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone ?? "").replace(/\D/g, "");
  const code = String(body.code ?? "").trim();

  const otp = await pool.query(
    "SELECT code FROM otp_codes WHERE phone = $1 AND expires_at > now()",
    [phone]
  );
  if (otp.rows.length === 0 || otp.rows[0].code !== code) {
    return NextResponse.json({ error: "OTP galat hai ya purana ho gaya" }, { status: 400 });
  }

  let user = (await pool.query("SELECT id, role FROM users WHERE phone = $1", [phone])).rows[0];

  if (!user) {
    const name = String(body.name ?? "").trim().slice(0, 60);
    const role = String(body.role ?? "");
    const areaId = Number(body.areaId);
    if (!name || !ROLES.includes(role) || !Number.isInteger(areaId) || areaId <= 0) {
      return NextResponse.json({ error: "Naam, aap kaun hain, aur area teeno chuno" }, { status: 400 });
    }
    user = (
      await pool.query(
        "INSERT INTO users (phone, name, role, area_id) VALUES ($1, $2, $3, $4) RETURNING id, role",
        [phone, name, role, areaId]
      )
    ).rows[0];
    if (role !== "customer") {
      await pool.query("INSERT INTO worker_profiles (user_id) VALUES ($1)", [user.id]);
    }
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