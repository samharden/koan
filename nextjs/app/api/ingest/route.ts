import { ingestDocument } from "@kg/core";

import { extractText } from "@/lib/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

// Cap upload size: parsing happens in-process, so an unbounded file is a DoS
// vector. 25 MB is generous for the text-bearing docs this accepts.
const MAX_BYTES = 25 * 1024 * 1024;

// Accepts a multipart upload (PDF / DOCX / TXT / MD). The server extracts text,
// indexes it, and proposes a draft unit describing what the document captures.
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const name = ((form.get("name") as string) || "").trim();

  if (!(file instanceof File)) {
    return Response.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB).` }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    text = (await extractText(file.name, buffer)).trim();
  } catch (e: any) {
    return Response.json({ error: e?.message || "Could not read that file." }, { status: 400 });
  }
  if (!text) {
    return Response.json(
      { error: "No extractable text found — is it a scanned image? (OCR isn't supported yet.)" },
      { status: 400 }
    );
  }

  const owner = name || "web-user";
  const res = await ingestDocument(file.name, text, { owner, propose: true });

  return Response.json({
    chunks: res.chunks,
    draft: res.draft ? { id: res.draft.id, title: res.draft.unit.title, path: res.draft.path } : null,
  });
}
