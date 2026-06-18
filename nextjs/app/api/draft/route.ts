import { readUnitFile, saveUnitFile } from "@kg/core";

import { isSafeId } from "@/lib/ids";

export const runtime = "nodejs";

// Read one draft's raw markdown.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!isSafeId(id)) return Response.json({ error: "invalid id" }, { status: 400 });
  const markdown = await readUnitFile(id);
  if (markdown == null) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ id, markdown });
}

// Save a human-edited draft.
export async function POST(req: Request) {
  const { id, markdown } = (await req.json()) as { id?: string; markdown?: string };
  if (!isSafeId(id) || typeof markdown !== "string") {
    return Response.json({ error: "valid id and markdown required" }, { status: 400 });
  }
  const path = await saveUnitFile(id, markdown);
  return Response.json({ ok: true, path });
}
