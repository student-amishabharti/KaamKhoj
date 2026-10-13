import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export const COOKIE = "kk_session";
// Live website par SESSION_SECRET zaroori hai; laptop par na ho to sirf demo ke liye ek line
const SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-only-secret");

function sign(value: string) {
  if (!SECRET) throw new Error("SESSION_SECRET set nahi hai (Render > Environment mein jodo)");
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function makeToken(userId: number) {
  const value = String(userId);
  return `${value}.${sign(value)}`;
}

function readToken(token?: string): number | null {
  if (!token) return null;
  const [value, sig] = token.split(".");
  if (!value || !sig) return null;
  const good = sign(value);
  if (good.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  return Number(value);
}

export type CurrentUser = {
  id: number;
  name: string;
  phone: string;
  role: "worker" | "customer" | "business";
  area_id: number | null;
  area_name: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const id = readToken(store.get(COOKIE)?.value);
  if (!id) return null;
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.phone, u.role, u.area_id, a.name AS area_name
     FROM users u LEFT JOIN areas a ON a.id = u.area_id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}