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

This firm runs a local koan store. When the user asks how *the firm*
does something, the answer should come from what the firm has actually captured —
not from generic legal or procedural knowledge. Search first, then answer.

## When to use

Trigger on questions about the firm's own way of doing things:

- "How do we handle conflict waivers for lateral hires?"
- "What's our process for new-client intake?"
- "Do we have a playbook for emergency TRO filings?"
- "How does our team usually onboard a new matter?"

Do **not** use this for general legal research, drafting, or questions that are
clearly not about an internal procedure.

## Workflow

1. **Search before answering.** Call `search_knowledge` with the user's question
   (or a tightened version of it). Default `k` is fine; raise it if the first
   pass is thin.
2. **Read the best hits.** For the most relevant result(s), call `read_unit` with
   the id or path to get the full procedure, not just the snippet.
3. **Answer from what you found, and attribute it.** Ground the response in the
   captured unit(s). Name the unit you're drawing from so the user can trust it.
4. **Respect status and confidentiality.**
   - If a hit is a **draft** (in the review queue, not yet promoted), say so —
     it is *not* authoritative. Offer to open it for review (`/review`) rather
     than presenting it as settled firm policy.
   - If a unit is marked `walled` or `client` confidentiality, treat it as tied
     to a specific matter / ethical screen — flag that rather than reusing it
     freely.
5. **Handle a miss honestly.** If `search_knowledge` returns nothing relevant,
   tell the user the firm hasn't captured this yet. Do **not** silently fall back
   to generic advice dressed up as firm policy. Offer to capture it now via
   `/capture` so the next person gets an answer.

## Guardrails

- Never invent firm procedure. If the store doesn't have it, say so.
- Keep general knowledge clearly separated from captured firm knowledge — if you
  supplement a captured answer with general context, label which is which.
