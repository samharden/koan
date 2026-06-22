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

Captured knowledge is written `status: draft` and sits in the review queue until
a person vouches for it. This skill walks that queue so drafts become trusted,
active firm knowledge — or get discarded. **You do not decide what is correct;
the user does.** Your job is to surface each draft clearly and act on their call.

## When to use

- "Review the queue." / "What's pending?"
- "Any drafts waiting on me?"
- "Let's clean up the review inbox."
- "Promote that conflict-waiver draft." / "Reject the duplicate one."

## Workflow

1. **List what's waiting.** Call `review_queue` to get the drafts. If it's empty,
   say so and stop.
2. **Take them one at a time.** For the draft under review, call `open_draft`
   with its id to render the interactive review card (edit / promote / discard),
   or `read_unit` if you just need the text. Present the content faithfully so the
   user can actually evaluate it — including any open questions logged for the
   reviewer.

   > Note: the user sees the rendered card, but you only receive the result's
   > text. Always include a faithful text summary of the draft so your
   > description matches what they're looking at.

3. **Act on the user's decision:**
   - **Promote** → call `promote_unit` with the draft `id` and `verified_by`
     (who is vouching for it). Optionally pass `review_by` (next-review date,
     YYYY-MM-DD; defaults to +180 days). Promoting moves it out of the inbox,
     drops the `draft-` id prefix, and marks it active. Confirm the content with
     the user before promoting — get a real name for `verified_by`, not a guess.
   - **Edit first** → read the unit, edit the full markdown, call `update_draft`
     with the id and corrected markdown, show the result, then promote once they
     approve.
   - **Discard** → call `reject_draft` with the id for drafts that should not
     become firm knowledge.
4. **Move to the next draft** until the queue is clear or the user stops.

## Guardrails

- Never promote on your own authority. Promotion records `verified_by` as a human
  vouching for the knowledge — that has to be a real person the user names.
- If a draft is thin, contradictory, or its open questions are unresolved, flag
  that and recommend editing or holding it rather than promoting as-is.
- Don't reject a draft without the user's say-so.
