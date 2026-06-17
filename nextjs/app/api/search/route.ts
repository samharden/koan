import { search } from "@kg/core";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  if (!q.trim()) return Response.json({ hits: [] });
  const hits = await search(q, 5);
  return Response.json({ hits });
}
