---
name: review
description: >-
  Walk the koan review queue — the maintain stage — promoting,
  editing, or discarding draft units so they become authoritative firm
  knowledge, and re-reviewing promoted units whose review_by date has passed.
  Use when the user says "review the queue", "what's pending review", "any
  drafts waiting", "let's clean up the inbox", "is anything overdue for
  re-review", or wants to approve/promote or reject captured knowledge. Drafts
  are NOT authoritative until a human promotes them; this skill is how that
  human review happens.
---

# Review the knowledge queue

Captured knowledge is written `status: draft` and sits in `inbox/` until a person
vouches for it. This skill walks that queue so drafts become trusted, active firm
knowledge — or get discarded. It also surfaces promoted units whose `review_by`
date has passed, so vouched knowledge gets re-checked instead of silently going
stale. **You do not decide what is correct; the user does.** Your job is to
surface each item clearly and act on their call.

## Where the knowledge lives

Plain markdown files, by default under `~/Documents/firm-knowledge/`: drafts in
`inbox/` (`status: draft`), promoted units in `units/` (`status: active`),
retired units in `archive/` (`status: retired`), and `INDEX.md` at the root as
the one-line-per-item table of contents this skill maintains. If the user keeps
their knowledge elsewhere, use that path.

## When to use

- "Review the queue." / "What's pending?"
- "Any drafts waiting on me?"
- "Let's clean up the review inbox."
- "Promote that conflict-waiver draft." / "Reject the duplicate one."

## Workflow

1. **List what's waiting.** `Glob` `inbox/*.md` to get the drafts. Also `Glob`
   `units/*.md` and check each unit's `review_by` against today's date — promoted
   units past their `review_by` are **due for re-review**; list them after the
   drafts (oldest overdue first). If there's nothing in either bucket (or no
   folder), say so and stop.
2. **Take them one at a time.** `Read` the draft file in full and present it as an
   interactive review card with **Promote / Edit / Discard** buttons — `Read` the
   template at `../_shared/draft-card.html` (relative to this skill's folder),
   replace the `/*__DRAFT__*/…/*__END_DRAFT__*/` token with the draft as JSON
   (`{ id, title, status, confidentiality, trigger, steps, exceptions, authorities,
   openQuestions }`, escaping every `<` in the serialized JSON as `\u003c` — the
   same rule the `map` skill uses), and render it inline. The
   buttons send promote/edit/discard requests back through chat (carrying the
   draft `id`). If the surface can't render interactive HTML, present the draft as
   a clean formatted summary instead — including any open questions logged for the
   reviewer — and let the user reply *promote* / *edit* / *discard*.
3. **Act on the user's decision:**
   - **Promote** → confirm the content with the user and get a **real name** for
     who is vouching for it (`verified_by`) — not a guess. Then turn the draft into
     a promoted unit (the full schema is `../_shared/unit-format.md`, relative to
     this skill's folder):
     1. Compute the new id = the draft's `id` with the leading `draft-` removed
        (e.g. `draft-2026-06-22-intake` → `2026-06-22-intake`). If
        `units/<new-id>.md` already exists, append `-2`, `-3`, …
     2. In the file's frontmatter set `status: active`, `verified_by: <name>`,
        `verified_on: <today YYYY-MM-DD>`, `review_by: <date>` (default today +180
        days unless the user gives one), and `id: <new-id>`.
     3. **Write** the updated content to `units/<new-id>.md` and **delete** the old
        `inbox/<draft>.md` (it has moved, not been copied).
     4. Move the unit's line in `INDEX.md` from **Drafts** to **Promoted** (with
        the new id).
   - **Edit first** → edit the draft file in `inbox/`, show the result, then promote
     once they approve.
   - **Discard** → **delete** the `inbox/<draft>.md` file for drafts that should not
     become firm knowledge, and remove its `INDEX.md` line. (Discarding an
     unpromoted draft is the only deletion in the system — promoted knowledge is
     retired to `archive/`, never deleted.)
4. **Move to the next draft** until the queue is clear or the user stops.
5. **Re-review overdue units.** For each promoted unit past its `review_by`,
   `Read` it and present it (the same card works — its `status` is `active`), then
   act on the user's call:
   - **Still right** → re-vouch in place: set `verified_by` (a real name, as with
     promotion), `verified_on: <today>`, and a new `review_by` (default today +180
     days). The file stays in `units/` with its id unchanged. Note for the user:
     re-vouching advances `verified_on`, so any skill scaffolded from this unit
     will show as stale in `/koan:scaffold --check` — that's intentional.
   - **Needs changes** → edit the unit with the user, then re-vouch as above.
   - **No longer how the firm does it** → **retire, don't delete.** With the
     user's confirmation, move the file to `archive/<id>.md`, set
     `status: retired`, add `retired_on: <today>` and `retired_by: <name>`, and
     remove its `INDEX.md` line. If a replacement exists (or you capture one
     first via `/koan:capture`), point the old unit at it with
     `superseded_by: <id>`. The archive is the firm's record of what the
     procedure used to be — "why did we do it that way in 2024" is a question
     someone will ask.
6. **Keep the index honest.** Review is the maintain stage, so it owns
   `INDEX.md` (format in `../_shared/unit-format.md`): if at any point the index
   disagrees with what's actually in `units/` and `inbox/` — missing lines,
   stale lines, or no index at all (common in a shared folder others write to) —
   rebuild it from the folders. The folders are the truth; the index is a copy.

## Guardrails

- Never promote on your own authority. Promotion records `verified_by` as a human
  vouching for the knowledge — that has to be a real person the user names.
- If a draft is thin, contradictory, or its open questions are unresolved, flag
  that and recommend editing or holding it rather than promoting as-is.
- Don't reject a draft without the user's say-so.
