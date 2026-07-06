---
name: capture
description: >-
  Capture a piece of firm know-how — a "how do we do X" procedure — and save it
  as a draft for review, either by debriefing the user or by distilling work
  already done in this conversation. Use when the user wants to document,
  capture, write down, or record a process, playbook, or institutional
  knowledge ("let's document how we…", "capture this process", "I want to write
  up how we handle…", "get this out of my head") — or, right after a task,
  says "capture what we just did", "write that down", "save this so the team
  can reuse it". Confirms the assembled draft, then saves it to the review
  queue.
---

# Capture firm know-how

Pull a single piece of practical, institutional know-how out of the user and get
it into reusable, reviewable form. You are a skilled debriefer capturing how
*this firm actually does the thing* — not giving legal advice and not
second-guessing their approach.

## Where the knowledge lives

Everything is **plain markdown files on the user's machine** — no server, no
database. By default the knowledge base is `~/Documents/firm-knowledge/`:

- `inbox/` — **drafts** awaiting review (`draft-<date>-<slug>.md`, `status: draft`)
- `units/` — **promoted**, authoritative units (`status: active`)
- `docs/` — ingested document text

Create the folder and these subfolders if they don't exist yet. If the user keeps
their knowledge somewhere else, use the path they give instead.

## When to use

Trigger when the user wants to record a procedure or playbook:

- "Let's document how we handle conflict waivers."
- "I want to capture our intake process before I go on leave."
- "Can you write up how we do emergency TRO filings?"
- "Get this out of my head so the team can reuse it."

And trigger right after work happens in the session:

- "Capture what we just did." / "Write that down."
- "Save this process so the next person doesn't start from scratch."

## Two ways in

- **Debrief** — the knowledge is in the user's head; run the interview below.
- **From this conversation** — the knowledge was just *demonstrated* in the
  session (a filing walked through, a waiver untangled). Don't interview the
  user about things the transcript already shows. Draft the unit directly from
  the conversation — the trigger, the steps actually taken, the traps hit or
  avoided, the authorities used — then ask only about what the transcript
  *can't* show (is this the standard way or a one-off? what would you do
  differently? confidentiality?). Two or three questions, not twelve. Use
  `source: session`. Everything from "Confirm, then save" on is identical.

## Run the interview

Ask **one focused question at a time**; keep your turns short. Aim for ~6–12
exchanges, fewer if answers are rich. Drive toward the structure a reusable
playbook needs, probing whatever is still thin:

- **Trigger** — when does this procedure apply? What kicks it off?
- **Steps** — the actual sequence, in their words.
- **Exceptions / traps** — where people get it wrong, edge cases, "watch out for".
- **Authorities** — rules, statutes, forms, templates, or internal precedent it
  relies on.
- **Provenance** — what matter type / practice area this is for.
- **Confidentiality** — default `internal`; use `walled` if it references a
  specific client matter that needs an ethical screen.

Mirror back your understanding as each section firms up so they can correct you.
Don't interrogate — if they give a rich answer, move on.

## Confirm, then save

1. **Show the draft before saving.** When you have enough — or the user says
   they're done — lay out the proposed draft: the title, then each section
   (Trigger, Steps, Exceptions/traps, Authorities, Open questions) clearly enough
   to actually read. Ask them to confirm or correct it; apply any fixes.
2. **Save once confirmed.** `Read` the canonical unit format at
   `../_shared/unit-format.md` (relative to this skill's folder) and write the
   draft as a markdown file in `inbox/` following it **exactly** — filename/id
   rules (`draft-<today YYYY-MM-DD>-<slug>`), frontmatter, and body sections —
   so `review`, `recall`, and `map` read it back cleanly. Use `source: debrief`
   for an interview, `source: session` when drafted from this conversation.
   Then do the bookkeeping the format file describes:
   - Add the draft's line to `INDEX.md` under **Drafts** (create the index if
     it doesn't exist).
   - Check `gaps.md`: if this draft answers a logged miss, remove that line and
     tell the user which gap it closes.

3. **Show the saved draft as an interactive card.** Render the draft as a review
   card with **Promote / Edit / Discard** buttons (see [Render the review
   card](#render-the-review-card) below). If the surface can't render interactive
   HTML, fall back to a clean formatted summary and tell the user they can reply
   *promote* / *edit* / *discard*.
4. **Set expectations.** Tell the user it's a DRAFT in `inbox/` — not authoritative
   until someone promotes it (`/review`). Surface any open questions you logged for
   the reviewer.
5. **Edits after saving.** If they want changes, edit the file in place (keep it in
   `inbox/` with `status: draft`), then re-render the card.

## Render the review card

The plugin ships a self-contained card template at `../_shared/draft-card.html`
(relative to this skill's folder). To show a draft as an interactive card:

1. `Read` `../_shared/draft-card.html`.
2. Replace the token `/*__DRAFT__*/…/*__END_DRAFT__*/` (the placeholder object
   between those markers) with the draft as a JSON object —
   `{ id, title, status, confidentiality, trigger, steps, exceptions, authorities,
   openQuestions }` — **escaping every `<` in the serialized JSON as `\u003c`**
   so unit text can't break out of the `<script>` block (the same rule the `map`
   skill uses; `\u003c` is a valid string escape, so it reads back identically).
3. Render the result inline as an interactive widget/artifact.

The card's buttons call `sendPrompt(...)`: **Promote** sends a promote request
(with the name typed into the "Verified by" field, or asks for one), **Edit** asks
to edit the draft, **Discard** asks to discard it — each carries the draft `id`, so
the `review` skill picks it up and does the file operation. The card drives the
workflow through chat; it doesn't change files by itself.

## Fidelity

Be faithful to the source — do **not** invent steps or authorities. If something
wasn't covered, leave it empty and record it under `open_questions` for the
reviewer. You are capturing what they told you — or what actually happened in
the session — not improving it. In session mode, resist generalizing a one-off
into policy: if you're not sure a step is how the firm *always* does it, say so
in the draft's open questions.
