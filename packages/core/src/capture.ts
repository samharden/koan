/**
 * Capture — the LLM structure pass and interview persona.
 *
 * `extractUnit` turns freeform notes / a transcript / document text into one
 * Unit via structured output. Shared by the web app (debrief) and the MCP
 * server (capture_knowledge), so the schema lives in exactly one place.
 */
import Anthropic from "@anthropic-ai/sdk";

import type { Msg, Unit } from "./types.js";

export const MODEL = process.env.CAPTURE_MODEL || "claude-sonnet-4-6";

export const KICKOFF = "Let's begin. Ask me what I want to capture.";

// Shared interviewer persona. Composed into SYSTEM (web app) and
// CAPTURE_INTERVIEW (MCP prompt) so the persona lives in exactly one place.
const INTERVIEWER_PERSONA = `You are a knowledge-capture interviewer for a law firm. Your one job is to pull a single piece of practical, institutional know-how — a "how do we do X" procedure — out of the lawyer you're talking to and get it into reusable form.

You are NOT giving legal advice and NOT second-guessing their approach. You are a skilled debriefer capturing how THIS firm actually does the thing.

How to run the interview:
- Open by asking what procedure or know-how they want to capture, in one sentence.
- Then ask ONE focused question at a time. Keep your turns short.
- Drive toward the structure a reusable playbook needs, probing for whatever is still thin:
    * Trigger — when does this procedure apply? What kicks it off?
    * Steps — the actual sequence, in their words.
    * Exceptions / traps — where people get it wrong, edge cases, "watch out for".
    * Authorities — rules, statutes, forms, templates, or internal precedent it relies on.
    * Provenance — what matter type / practice area this is for.
- Mirror back your understanding when a section firms up, so they can correct you.
- Don't interrogate. If they give a rich answer, move on. Aim for ~6-12 exchanges.`;

// Web app: the interview runs against the streaming API; a separate /finish
// step does the structure pass, so the model must NOT emit the draft itself.
export const SYSTEM = `${INTERVIEWER_PERSONA}
- When you judge you have enough to write a useful first draft — or the user says they're done — tell them you have what you need and to click "Generate draft". Do not produce the structured draft yourself in conversation; a separate step handles that.`;

// MCP prompt: Claude itself is the interviewer AND the structurer, so it closes
// the loop by calling the capture_knowledge tool.
export const CAPTURE_INTERVIEW = `${INTERVIEWER_PERSONA}
- When you have enough for a useful first draft — or the user says they're done — DO NOT save yet. First show the user the draft you intend to capture: the title, then each section (Trigger, Steps, Exceptions/traps, Authorities, Open questions) laid out clearly so they can actually read it. Ask them to confirm or correct it, and apply any fixes they request.
- Once they confirm, call \`capture_knowledge\` with the agreed fields (title, trigger, steps, plus exceptions, authorities, templates, practice_area, matter_type, confidentiality, and any open_questions). The tool returns the saved draft — present it to the user, point out it's a DRAFT in the review queue (not authoritative until someone promotes it), and surface any open questions you logged for the reviewer.
- If they want changes after saving, edit the returned markdown and call \`update_draft\` with the draft's id and the corrected markdown, then show them the result.

Begin now by asking your first question.`;

export const UNIT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Short imperative title" },
    practice_area: { type: "array", items: { type: "string" }, description: "e.g. ['ethics','hr']" },
    matter_type: { type: "string", description: "e.g. 'lateral-onboarding'; '' if not specific" },
    trigger: { type: "string", description: "When this procedure applies / what kicks it off" },
    steps: { type: "array", items: { type: "string" }, description: "Ordered steps in the firm's own approach" },
    exceptions: { type: "array", items: { type: "string" }, description: "Edge cases, traps, where people get it wrong" },
    authorities: { type: "array", items: { type: "string" }, description: "Rules, statutes, forms, templates, internal precedent" },
    templates: { type: "array", items: { type: "string" }, description: "Named templates/forms referenced; [] if none" },
    confidentiality: { type: "string", enum: ["internal", "walled", "client"], description: "Default 'internal'. 'walled' if it references a specific client matter needing an ethical screen." },
    open_questions: { type: "array", items: { type: "string" }, description: "Things not fully resolved, for the reviewer" },
  },
  required: ["title", "practice_area", "matter_type", "trigger", "steps", "exceptions", "authorities", "templates", "confidentiality", "open_questions"],
} as const;

const FIDELITY =
  "Be faithful to the source — do not invent steps or authorities. If something " +
  "wasn't covered, leave it empty and record it under open_questions.";

export async function extractUnit(source: string, opts?: { client?: Anthropic }): Promise<Unit> {
  const client = opts?.client ?? new Anthropic();
  const resp = (await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: { format: { type: "json_schema", schema: UNIT_JSON_SCHEMA } },
    messages: [
      {
        role: "user",
        content:
          "Extract a single reusable knowledge unit from the material below. " +
          FIDELITY +
          "\n\n--- MATERIAL ---\n" + source,
      },
    ],
  } as any)) as any;
  const textBlock = resp.content.find((b: any) => b.type === "text") as { text?: string } | undefined;
  return JSON.parse(textBlock?.text ?? "{}") as Unit;
}

export function formatTranscript(messages: Msg[]): string {
  return messages
    .filter((m) => typeof m.content === "string" && m.content !== KICKOFF)
    .map((m) => `${m.role === "assistant" ? "INTERVIEWER" : "LAWYER"}: ${m.content}`)
    .join("\n\n");
}
