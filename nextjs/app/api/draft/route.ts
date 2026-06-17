import { readUnitFile, saveUnitFile } from "@kg/core";

export const runtime = "nodejs";

// Read one draft's raw markdown.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const markdown = await readUnitFile(id);
  if (markdown == null) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ id, markdown });
}

// Save a human-edited draft.
export async function POST(req: Request) {
  const { id, markdown } = (await req.json()) as { id?: string; markdown?: string };
  if (!id || typeof markdown !== "string") {
    return Response.json({ error: "id and markdown required" }, { status: 400 });
  }
  const path = await saveUnitFile(id, markdown);
  return Response.json({ ok: true, path });
}
