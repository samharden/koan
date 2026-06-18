import { promoteUnit } from "@kg/core";

import { isSafeId } from "@/lib/ids";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { id, verified_by, review_by } = (await req.json()) as {
    id?: string;
    verified_by?: string;
    review_by?: string;
  };
  if (!isSafeId(id)) return Response.json({ error: "invalid id" }, { status: 400 });
  if (!verified_by || !verified_by.trim()) {
    return Response.json({ error: "Who is verifying this? (verified_by required)" }, { status: 400 });
  }
  try {
    const res = await promoteUnit(id, { verifiedBy: verified_by, reviewBy: review_by || undefined });
    return Response.json({ ok: true, ...res });
  } catch (e: any) {
    return Response.json({ error: e?.message || "promote failed" }, { status: 400 });
  }
}
