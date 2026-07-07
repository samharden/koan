---
name: improve
description: >-
  Critique a promoted knowledge unit and propose a better version — spot
  redundant or missing steps, unhandled failure modes, stale authorities, and
  steps Claude could absorb, then (on the user's say-so) write the revision as
  a new draft that supersedes the original through the normal review queue.
  Use when the user wants to make a captured process BETTER, not just record
  or retrieve it: "improve our X process", "critique this procedure", "can
  this be streamlined", "is there a better way to do this", "what's wrong with
  our intake process", or invokes /koan:improve. Works on promoted units only;
  the original stays untouched until a human promotes the proposal.
---

# Improve a captured process

`capture` records how the firm does something, faithfully — it never
second-guesses. `review` asks whether the firm stands behind the record. This
skill asks the third question: **is this a good process?** It critiques a
promoted unit, and — if the user wants — turns the critique into a **proposed
revision** that flows through the same draft → review → promote machinery as
everything else. The critique is opinion until a human promotes it; the
faithful record of how the firm *did* do it survives in `archive/` via the
normal supersession trail.

## Where the knowledge lives

Plain markdown files, by default under `~/Documents/firm-knowledge/`: promoted
units in `units/`, drafts in `inbox/`, and three root signal files this skill
draws on — `friction.md` (situations deployed workflows hit that the unit
didn't cover), `gaps.md` (questions recall couldn't answer), and `usage.md`
(which units get recalled). If the user keeps their knowledge elsewhere, use
that path.

## When to use

- "Improve our conflict-waiver process." / "Make this procedure better."
- "Critique the intake unit — can it be streamlined?"
- "Is there a better way to do this?" / "What's wrong with how we do X?"
- After `landscape` flags a unit with friction entries or unresolved open
  questions.

Not for *recording* a process (`capture`), *retrieving* one (`recall`), or
*vouching* for one (`review`). If the user wants to fix a **draft**, that's
just an edit in `review` — improvement targets knowledge the firm has already
promoted and stands behind.

## Workflow

1. **Pick the unit — promoted only.** Find the unit in `units/` (via `INDEX.md`
   or `Glob`). If the user points at a draft, redirect: drafts are edited in
   `/koan:review`, not superseded. `Read` the unit in full.
2. **Gather the evidence before opining.** The critique should be grounded in
   what the firm has actually experienced, not just general knowledge:
   - `friction.md` — entries naming this unit are field-tested holes; weigh
     them heaviest.
   - The unit's own `open_questions` — unresolved ones are admitted gaps.
   - `gaps.md` and `usage.md` — near-miss questions and how often the unit is
     actually used (a heavily-recalled unit deserves a more conservative
     revision; a never-recalled one may need a retitle or merge, not a rewrite).
   - Related units (`related`, shared authorities) — an improvement that breaks
     a hand-off to another unit isn't an improvement.
3. **Critique, clearly labeled as opinion.** Present findings in priority
   order, each tied to its evidence. Look for:
   - **Holes** — failure modes, exceptions, or hand-offs the steps don't cover
     (friction entries first).
   - **Redundancy** — steps that repeat work, approvals that gate nothing.
   - **Staleness** — authorities, forms, or thresholds that may have changed;
     flag for verification rather than assert.
   - **Automation candidates** — steps Claude could absorb if the unit were
     scaffolded (document comparison, first-draft generation, checklist
     checks), noted as such.
   - **Clarity** — ambiguous triggers or steps two readers would perform
     differently.
   Keep general-knowledge suggestions visibly separate from evidence-backed
   ones — "the friction log shows X" is not the same claim as "firms commonly
   also do Y".
4. **Offer the revision; write it only on the user's say-so.** Walk the user
   through what you'd change. When they approve a direction, assemble the
   proposed unit and **show it before saving** (like `capture` does). Then
   write it as a normal draft in `inbox/` following `../_shared/unit-format.md`
   exactly, with:
   - `source: improvement`
   - `supersedes: <the original unit's id>`
   - the same `confidentiality` as the original (or stricter)
   - an **Open questions** section that summarizes what changed and why, item
     by item, so the reviewer can judge the proposal against the original
     without diffing by hand — and lists anything the user should verify
     (stale authorities especially).
   Add the draft's `INDEX.md` line under **Drafts**, and render the review card
   the way `capture` does (`../_shared/draft-card.html`, same `<` escaping
   rule).
5. **Set expectations.** The original unit is untouched and still the firm's
   procedure. The proposal is a draft; when someone promotes it in
   `/koan:review`, review will offer to retire the original with
   `superseded_by` pointing at the new unit — that promotion, not this skill,
   is the moment the firm's procedure changes. If a scaffolded skill exists for
   the original unit, mention that promoting the proposal will make it show as
   stale in `/koan:scaffold --check` (retired source), which is intentional.

## Guardrails

- **Promoted units only.** Never propose a supersession of a draft, and never
  edit, move, retire, or delete the original unit — only `review` changes the
  store's promoted content.
- **Critique is not procedure.** Until the proposal is promoted by a human, it
  is Claude's suggestion. Never present a proposed revision as how the firm
  does things — `recall` will correctly report it as a draft.
- **Evidence over taste.** Lead with friction entries, open questions, and
  logged gaps. General best-practice suggestions are allowed but must be
  labeled as such, and legal judgments (what a rule requires, what a court
  expects) are flagged for the reviewing attorney, not asserted.
- **Don't churn.** If the evidence doesn't support a revision, say the unit
  looks sound — an honest "this holds up" beats a cosmetic rewrite that burns
  a reviewer's time and resets the vouching trail.
- **Respect confidentiality.** The proposal inherits the original's
  `confidentiality` (or stricter), and a critique of a `walled` / `client`
  unit doesn't quote its protected contents into chat beyond what the user
  already has open.
