import { extractUnit, formatTranscript, writeUnit, type Msg } from "@kg/core";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, name } = (await req.json()) as { messages: Msg[]; name?: string };
  if (!Array.isArray(messages) || messages.length < 3) {
    return Response.json({ error: "Not enough conversation to capture yet." }, { status: 400 });
  }

  const owner = (name || "").trim() || "web-user";
  const transcript = formatTranscript(messages);
  const unit = await extractUnit(transcript);
  const { path } = await writeUnit(unit, { owner, transcript, source: "debrief" });

  return Response.json({
    path,
    title: unit.title,
    confidentiality: unit.confidentiality,
    open_questions: unit.open_questions,
  });
}
