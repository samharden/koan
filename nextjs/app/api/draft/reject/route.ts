import { rejectDraft } from "@kg/core";

import { isSafeId } from "@/lib/ids";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { id } = (await req.json()) as { id?: string };
  if (!isSafeId(id)) return Response.json({ error: "invalid id" }, { status: 400 });
  try {
    await rejectDraft(id);
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || "reject failed" }, { status: 400 });
  }
}
