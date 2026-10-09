import { isCategory } from "@/lib/categories";
import { searchWorkers, WEIGHTS } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "";
  if (!isCategory(category)) {
    return Response.json({ error: "Ye kaam ki category nahi hai" }, { status: 400 });
  }

  const me = await getCurrentUser();
  const areaId = Number(url.searchParams.get("areaId") ?? me?.area_id);
  if (!Number.isInteger(areaId) || areaId <= 0) {
    return Response.json({ error: "Pehle login karo ya area chuno" }, { status: 400 });
  }

  const workers = await searchWorkers({ category, areaId, viewerId: me?.id });
  return Response.json({ category, areaId, formula: WEIGHTS, workers });
}