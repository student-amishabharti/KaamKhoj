import { getCurrentUser } from "@/lib/session";

export async function GET() {
  return Response.json({ user: await getCurrentUser() });
}