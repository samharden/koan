---
name: review
description: >-
  Walk the koan review queue — the maintain stage — promoting,
  editing, or discarding draft units so they become authoritative firm
  knowledge. Use when the user says "review the queue", "what's pending review",
  "any drafts waiting", "let's clean up the inbox", or wants to approve/promote
  or reject captured knowledge. Drafts are NOT authoritative until a human
  promotes them; this skill is how that human review happens.
---

# Review the knowledge queue

Captured knowledge is written `status: draft` and sits in `inbox/` until a person
vouches for it. This skill walks that queue so drafts become trusted, active firm
knowledge — or get discarded. **You do not decide what is correct; the user
does.** Your job is to surface each draft clearly and act on their call.

## Where the knowledge lives

Plain markdown files, by default under `~/Documents/firm-knowledge/`: drafts in
`inbox/` (`status: draft`), promoted units in `units/` (`status: active`). If the
user keeps their knowledge elsewhere, use that path.

## When to use

- "Review the queue." / "What's pending?"
- "Any drafts waiting on me?"
- "Let's clean up the review inbox."
- "Promote that conflict-waiver draft." / "Reject the duplicate one."

## Workflow

1. **List what's waiting.** `Glob` `inbox/*.md` to get the drafts. If there are
   none (or no folder), say so and stop.
2. **Take them one at a time.** `Read` the draft file in full and present its
   content faithfully so the user can actually evaluate it — title, Trigger, Steps,
   Exceptions, Authorities, and any open questions logged for the reviewer.
3. **Act on the user's decision:**
   - **Promote** → confirm the content with the user and get a **real name** for
     who is vouching for it (`verified_by`) — not a guess. Then turn the draft into
     a promoted unit:
     1. Compute the new id = the draft's `id` with the leading `draft-` removed
        (e.g. `draft-2026-06-22-intake` → `2026-06-22-intake`). If
        `units/<new-id>.md` already exists, append `-2`, `-3`, …
     2. In the file's frontmatter set `status: active`, `verified_by: <name>`,
        `verified_on: <today YYYY-MM-DD>`, `review_by: <date>` (default today +180
        days unless the user gives one), and `id: <new-id>`.
     3. **Write** the updated content to `units/<new-id>.md` and **delete** the old
        `inbox/<draft>.md` (it has moved, not been copied).
   - **Edit first** → edit the draft file in `inbox/`, show the result, then promote
     once they approve.
   - **Discard** → **delete** the `inbox/<draft>.md` file for drafts that should not
     become firm knowledge.
4. **Move to the next draft** until the queue is clear or the user stops.

## Guardrails

- Never promote on your own authority. Promotion records `verified_by` as a human
  vouching for the knowledge — that has to be a real person the user names.
- If a draft is thin, contradictory, or its open questions are unresolved, flag
  that and recommend editing or holding it rather than promoting as-is.
- Don't reject a draft without the user's say-so.
