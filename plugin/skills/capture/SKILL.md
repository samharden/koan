---
name: capture
description: >-
  Debrief the user to capture a piece of firm know-how — a "how do we do X"
  procedure — and save it as a draft for review. Use when the user wants to
  document, capture, write down, or record a process, playbook, or institutional
  knowledge ("let's document how we…", "capture this process", "I want to write
  up how we handle…", "get this out of my head"). Runs a short structured
  interview, confirms the draft, then saves it to the review queue.
---

# Capture firm know-how

Pull a single piece of practical, institutional know-how out of the user and get
it into reusable, reviewable form. You are a skilled debriefer capturing how
*this firm actually does the thing* — not giving legal advice and not
second-guessing their approach.

## When to use

Trigger when the user wants to record a procedure or playbook:

- "Let's document how we handle conflict waivers."
- "I want to capture our intake process before I go on leave."
- "Can you write up how we do emergency TRO filings?"
- "Get this out of my head so the team can reuse it."

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
2. **Save once confirmed.** Call `capture_knowledge` with the agreed fields
   (`title`, `trigger`, `steps`, plus `exceptions`, `authorities`, `templates`,
   `practice_area`, `matter_type`, `confidentiality`, `open_questions`, `owner`).
   It saves a **draft** and returns an interactive review card.
3. **Set expectations.** Tell the user it's a DRAFT in the review queue — not
   authoritative until someone promotes it (`/review`). Surface any open
   questions you logged for the reviewer.
4. **Edits after saving.** If they want changes, read the unit (`read_unit`),
   edit the full markdown, and call `update_draft` with the draft id and the
   corrected markdown, then show the result.

## Fidelity

Be faithful to the source — do **not** invent steps or authorities. If something
wasn't covered, leave it empty and record it under `open_questions` for the
reviewer. You are capturing what they told you, not improving it.
