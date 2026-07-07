---
name: landscape
description: >-
  Step back and review the firm's captured knowledge as a whole — read all the
  units together and surface gaps, overlaps, contradictions, and disconnects
  between them. Use when the user wants a holistic or top-level look: "what's
  our knowledge looking like overall", "where are the gaps", "do any of these
  conflict", "audit the knowledge base", "what are we missing", "review
  everything together", or invokes /koan:landscape. This is a cross-unit
  read-only audit; it does NOT capture, edit, promote, or delete anything.
---

# Landscape review

`capture` and `review` work one unit at a time. This skill does the opposite: it
reads the captured knowledge **as a body** and reports on how the pieces fit
together — what's missing, what overlaps, what contradicts, what dangles. It is a
**read-only audit**. It changes nothing; it produces findings and recommends
follow-ups (which are themselves just `/koan:capture` / `/koan:review` runs).

## When to use

Trigger on holistic / portfolio-level requests, not single-unit ones:

- "How's our knowledge base looking overall?" / "Give me the landscape."
- "Where are the gaps?" / "What are we missing?"
- "Do any of these procedures conflict / overlap?"
- "Audit the captured knowledge." / "Review everything together."

Do **not** use this for a single procedure (`recall`), for writing one down
(`capture`), or for clearing the draft queue one-by-one (`review`).

## Workflow

1. **Gather the whole corpus.** `Glob` `units/*.md` (promoted/active) and
   `inbox/*.md` (drafts) in the knowledge folder (default
   `~/Documents/firm-knowledge/`). Note the split between promoted and draft up
   front. The folder of a file tells you its status: `units/` = active, `inbox/` =
   draft. Also `Read` four root files if present: `gaps.md` (recall misses — the
   demand side of the audit), `usage.md` (recall hits — which units actually get
   used), `friction.md` (situations deployed workflow skills hit that their
   source unit didn't cover), and `INDEX.md` (compare it against the folders; if
   it's missing entries or lists things that don't exist, flag the drift and
   point at `/koan:review`, which rebuilds it).
2. **Read enough to judge connections, not just titles.** `Read` the units that
   matter for the analysis — at minimum the promoted ones, plus any drafts the user
   wants included. Titles alone hide the disconnects; you need the `trigger`,
   `steps`, `authorities`, `exceptions`, and `open_questions` content to see how
   units relate. If the corpus is large, say how many you read and prioritize by
   relevance to what the user asked.
3. **Analyze across units**, looking for:
   - **Gaps** — procedures that are referenced but not captured (a unit's steps
     point to "our intake process" that doesn't exist as its own unit), obvious
     neighbors of existing units that are missing, or whole practice areas with
     no coverage. Weigh `gaps.md` heavily here: those are questions people
     *actually asked* and didn't get answered — demand-side evidence beats
     inference. If a logged gap has since been covered by a unit, note it as
     resolved and recommend cleaning the line up.
   - **Baseline coverage** — `Read` `baselines.md` (in this skill's folder) and
     diff the corpus against the checklists that apply to this firm (Firm
     operations always; a practice-area baseline only if the firm works in that
     area — infer from the units' `practice_area`, or ask). Follow that file's
     "How landscape uses this file" rules: attribute every finding to the named
     baseline, rank baseline misses below evidence-backed gaps, and report
     partial coverage as partial. This is what makes a young store's landscape
     useful — a firm with six units gets a capture roadmap, not "coverage looks
     coherent".
   - **Overlaps / duplicates** — two units describing the same procedure, or
     heavily overlapping scope that should be merged or disambiguated.
   - **Contradictions** — units that give conflicting steps, triggers, or
     authorities for the same situation. These are the highest-value findings.
   - **Disconnects** — units that *should* cross-reference each other but don't,
     or hand-offs where one procedure's output never connects to the next.
   - **Staleness / unfinished work** — promoted units past their `review_by`
     date (overdue for re-review — point these at `/koan:review`), unresolved
     `open_questions`, drafts that have sat unpromoted, or authorities that look
     outdated.
   - **Usage signals** — read `usage.md` and `friction.md` against the corpus:
     units with friction entries have field-tested holes (the strongest
     improvement candidates — point them at `/koan:improve`); heavily-recalled
     units are the best candidates to operationalize (`/koan:scaffold`) and the
     most costly to leave stale; promoted units never recalled may be
     mis-titled, redundant, or answering a question nobody asks — worth a look
     at re-review time rather than an automatic problem.
   - **Confidentiality mismatches** — a `walled` or `client` unit referenced by an
     `internal` one, or similar procedures classified inconsistently.
4. **Report a prioritized landscape.** Lead with a one-line health read (how many
   units, promoted vs. draft, rough coverage). Then list findings grouped by the
   categories above, **most actionable first**, each naming the specific unit(s)
   by title so the user can act on it. Don't bury a contradiction under a pile of
   minor nits.
5. **Recommend concrete follow-ups, don't perform them.** For each significant
   finding, suggest the next move and the skill that does it — "capture the intake
   procedure" (`/koan:capture`), "these two conflict, reconcile in review"
   (`/koan:review`), "this draft is ready, promote it." Offer to kick one off, but
   wait for the user.
6. **Offer the visual.** If the user would rather *see* the landscape than read
   it, point them at `/koan:map`, which renders the same units as an interactive
   graph with these gaps, overlaps, and contradictions marked.

## Guardrails

- **Read-only.** This skill only reads files — it never writes, moves, or deletes
  anything in the knowledge folder. It observes and recommends; the user decides
  and acts through the other skills.
- **Distinguish status in findings.** A contradiction between two promoted units is
  a real problem; a draft conflicting with a promoted unit is expected churn — say
  which is which so the user knows the severity.
- **Don't manufacture gaps.** Flag a missing procedure only when something in
  the corpus points to it, it's an obvious neighbor, or a named item in an
  applicable baseline isn't covered — never from free-floating speculation. A
  baseline miss is always attributed to its baseline so the user can judge the
  yardstick, and an honest "coverage looks coherent here" still beats a padded
  list.
- **Respect confidentiality.** Surface a `walled` / `client` unit's *existence and
  relationships* for the audit, but don't reproduce its protected contents when
  flagging it.
