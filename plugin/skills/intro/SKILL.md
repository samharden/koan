---
name: intro
description: >-
  Orient a new user to Koan — what it's for and how the capture → review →
  recall loop works — and run a short guided demo of that loop. Use when the
  user is new to Koan, asks "what is this", "how does this work", "what can you
  do", "show me", "get me started", "give me a tour", or invokes /koan:intro.
  Onboarding and orientation only; it does not capture or change any knowledge
  on its own — it hands off to the real skills.
---

# Intro to Koan

Koan turns "how do we do X" know-how that lives in people's heads into a
searchable, local firm knowledge base. This skill orients a new user and walks
them through the loop once. It is **instructions, not a tool** — it explains and
demonstrates, then hands off to `capture`, `review`, and `recall` to do the
actual work.

## When to use

Trigger when someone is meeting Koan for the first time or wants a refresher:

- "What is this / what does Koan do?"
- "How does this work?" / "Give me a tour."
- "How do I get started?" / "Show me."

Do **not** use this once the user has a concrete task — if they're asking *how
the firm does* something, that's `recall`; if they want to *write something
down*, that's `capture`; if they want to clear the queue, that's `review`.

## What to tell them

Explain Koan in plain terms, then the loop. Keep it short — a few sentences,
not a wall of text.

- **What it's for.** A firm's real procedures — intake, conflict waivers, filing
  steps, escalation paths — usually live in a few people's heads. Koan captures
  them as small, searchable **units** so anyone can get the firm's actual answer
  instead of generic advice.
- **Local-first.** The knowledge base is just plain markdown files on the user's
  own machine (by default `~/Documents/firm-knowledge/`). No server, no database —
  nothing leaves their computer.
- **The loop — capture → review → recall:**
  1. **Capture** — one "how we do X" becomes a **draft** unit in the review
     queue. Three doors in, cheapest first: **ingest** (`/koan:ingest`) pulls
     drafts out of documents the firm already has — memos, checklists, old
     wiki pages; **session capture** ("capture what we just did") distills a
     draft from work just done with Claude, no interview; and the **debrief**
     (`/koan:capture`) interviews the knowledge out of someone's head.
  2. **Review** (`/koan:review`) — a human reads each draft and **promotes**,
     edits, or discards it. Drafts are *not* authoritative until promoted.
  3. **Recall** (`/koan:recall`) — later, "how do we …" questions are answered
     from promoted units, attributed to the source, never invented.
- **Beyond the loop** (mention, don't demo): `/koan:landscape` audits coverage
  and gaps — worth running even on day one, since it compares the store
  against practice-area baselines and returns a capture roadmap;
  `/koan:improve` critiques a promoted process and proposes a better version;
  `/koan:scaffold` turns a promoted unit into a runnable workflow skill the
  whole firm can install.

## Guided demo

Offer to walk the loop once, and let the user pick where to start. Don't force
the whole tour if they only want one piece.

1. **Check the lay of the land.** `Glob` `units/*.md` and `inbox/*.md` in the
   knowledge folder (default `~/Documents/firm-knowledge/`) to see whether anything
   has been captured yet. Tailor the demo to what you find:
   - **Empty store** → start where the knowledge already is, not with an
     interview. Ask first: "Do you have anything written down already — a
     checklist, a policy memo, an old wiki page?" If yes, hand off to
     `/koan:ingest`: one document can seed several drafts in a few minutes.
     If not, offer the debrief on something small ("how you open a new
     matter, say") via `/koan:capture` — and mention that after any real
     piece of work with Claude, "capture what we just did" saves the process
     as a byproduct, no interview needed.
   - **Drafts pending** → start at review: show what's waiting and hand off to
     `/koan:review`.
   - **Promoted units exist** → start at recall: ask a "how do we …" question
     against real content and hand off to `/koan:recall` so they see a grounded,
     attributed answer.
2. **Narrate the handoff.** Before invoking another skill, say which step of the
   loop it is and what they'll see, so the mental model sticks.
3. **Close the loop.** After the demo, point out the rest of the loop and how
   to trigger each skill — by natural phrasing or `/koan:capture`,
   `/koan:review`, `/koan:recall` — and suggest `/koan:landscape` as the
   natural next step: even a near-empty store gets a baseline-driven capture
   roadmap out of it.

## Guardrails

- This skill **orients and demonstrates**; it does not capture, promote, edit, or
  delete anything itself. All real changes go through `capture` and `review`.
- If the knowledge folder doesn't exist yet, that's fine — it just means nothing
  has been captured. Don't fake a tour over empty content; start the user at
  `/koan:capture` so the folder gets created with their first unit.
- Read the room. A user who clearly knows Koan and just wants to do a task should
  be sent straight to the right skill, not given the tour.
