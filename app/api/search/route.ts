import { isCategory } from "@/lib/categories";
import { searchWorkers, WEIGHTS } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || null;
  const q = (url.searchParams.get("q") ?? "").trim();
  if (category !== null && !isCategory(category)) {
    return Response.json({ error: "Ye kaam ki category nahi hai" }, { status: 400 });
  }
  if (!category && q.length < 2) {
    return Response.json({ error: "Kaam chuno, ya kam se kam 2 akshar ka naam likho" }, { status: 400 });
  }

  const me = await getCurrentUser();
  const areaId = Number(url.searchParams.get("areaId") ?? me?.area_id);
  if (!Number.isInteger(areaId) || areaId <= 0) {
    return Response.json({ error: "Pehle login karo ya area chuno" }, { status: 400 });
  }

  const workers = await searchWorkers({
    category, q, areaId, viewerId: me?.id,
    onlyAvailable: url.searchParams.get("available") === "1",
  });
  return Response.json({ category, areaId, formula: WEIGHTS, workers });
}