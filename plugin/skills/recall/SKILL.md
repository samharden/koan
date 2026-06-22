---
name: recall
description: >-
  Answer "how do we…" / "what's our process for…" / "do we have a playbook for…"
  questions by searching the firm's captured knowledge FIRST, before answering
  from general knowledge. Use whenever the user asks how the firm handles,
  approaches, or does something procedural — conflict waivers, intake, filings,
  onboarding, escalation, etc. Grounds the answer in the firm's own captured
  units and ingested documents instead of generic best practices.
---

# Recall firm knowledge

When the user asks how *the firm* does something, the answer should come from what
the firm has actually captured — not from generic legal or procedural knowledge.
Search the firm's files first, then answer.

## Where the knowledge lives

Plain markdown files on the user's machine, by default in
`~/Documents/firm-knowledge/`: `units/` holds **promoted** (authoritative) units,
`inbox/` holds **drafts** (not yet authoritative), `docs/` holds ingested document
text. If the user keeps their knowledge elsewhere, use that path. If the folder
doesn't exist yet, nothing has been captured — treat it as an empty store.

## When to use

Trigger on questions about the firm's own way of doing things:

- "How do we handle conflict waivers for lateral hires?"
- "What's our process for new-client intake?"
- "Do we have a playbook for emergency TRO filings?"
- "How does our team usually onboard a new matter?"

Do **not** use this for general legal research, drafting, or questions that are
clearly not about an internal procedure.

## Workflow

1. **Search the files before answering.** Search the knowledge folder for the
   user's question. Start in `units/` (promoted, authoritative), then `inbox/`
   (drafts) if needed:
   - `Glob` `units/*.md` and `inbox/*.md` to see what exists (filenames carry the
     topic, e.g. `conflict-waivers-for-laterals.md`).
   - `Grep` across those folders for the key terms from the question — and for
     synonyms, since there's no fuzzy matching (e.g. for "lateral hire conflicts"
     also try "conflict", "waiver", "lateral", "screen"). Search titles and body.
   - There's no semantic ranking here, so cast a slightly wide net, then judge
     relevance yourself by reading.
2. **Read the best hits.** `Read` the most relevant file(s) in full to get the
   whole procedure (Trigger / Steps / Exceptions / Authorities), not just a grep
   line.
3. **Answer from what you found, and attribute it.** Ground the response in the
   captured unit(s). Name the unit (its title / filename) you're drawing from so
   the user can trust it.
4. **Respect status and confidentiality.**
   - A file in `inbox/` (or `status: draft`) is a **draft** — not authoritative.
     Say so, and offer to open it for review (`/review`) rather than presenting it
     as settled firm policy.
   - If a unit's `confidentiality` is `walled` or `client`, treat it as tied to a
     specific matter / ethical screen — flag that rather than reusing it freely.
5. **Handle a miss honestly.** If nothing in the folder is relevant (or the folder
   is empty / missing), tell the user the firm hasn't captured this yet. Do **not**
   silently fall back to generic advice dressed up as firm policy. Offer to capture
   it now via `/capture` so the next person gets an answer.

## Guardrails

- Never invent firm procedure. If the store doesn't have it, say so.
- Keep general knowledge clearly separated from captured firm knowledge — if you
  supplement a captured answer with general context, label which is which.
