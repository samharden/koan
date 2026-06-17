import { rejectDraft } from "@kg/core";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { id } = (await req.json()) as { id?: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  try {
    await rejectDraft(id);
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || "reject failed" }, { status: 400 });
  }
}
