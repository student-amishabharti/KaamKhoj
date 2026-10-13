import { getCurrentUser } from "@/lib/session";
import { confirmAgent, runAgent } from "@/lib/agent/run";
import { toLang } from "@/lib/agent/i18n";

// Ek user 1 minute mein kitni baar AI chala sakta hai (free API ki limit bachane ke liye)
const LIMIT = 15;
const hits = new Map<number, number[]>();

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "Pehle login karo" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const lang = toLang(body.lang);

  // "Haan, karo" dabaya: AI dobara nahi chalta, server khud check karke kaam karta hai
  if (body.confirm && typeof body.confirm === "object") {
    try {
      return Response.json({ result: await confirmAgent(me, body.confirm.tool, body.confirm.args, lang) });
    } catch (err) {
      console.error("agent confirm error", err);
      return Response.json({ error: "Ho nahi paaya. Dobara koshish kariye" }, { status: 500 });
    }
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return Response.json({ error: "Kuch boliye ya likhiye" }, { status: 400 });
  if (text.length > 300) return Response.json({ error: "Thoda chhota boliye (300 akshar tak)" }, { status: 400 });

  const now = Date.now();
  const recent = (hits.get(me.id) ?? []).filter((t) => now - t < 60000);
  if (recent.length >= LIMIT) return Response.json({ error: "Bahut jaldi jaldi. 1 minute ruk kar boliye" }, { status: 429 });
  hits.set(me.id, [...recent, now]);

  try {
    const result = await runAgent(me, text, { lang });
    return Response.json({ result });
  } catch (err) {
    console.error("agent error", err);
    return Response.json({ error: "Abhi samajh nahi paayi. Dobara boliye ya button se kariye" }, { status: 500 });
  }
}
