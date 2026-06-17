import { listDrafts } from "@kg/core";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ drafts: await listDrafts() });
}
