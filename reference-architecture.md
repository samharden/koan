# Institutional Knowledge Platform — Reference Architecture

**Goal:** Capture the "how do we do X" knowledge currently siloed in people's heads, and make it
reliably retrievable by both humans and AI agents.

**Design stance:** *Capture-first, platform-agnostic, files-as-database.* Start with plain markdown
files and a folder convention. Introduce heavier infrastructure (vector index, graph DB) only when
volume justifies it — and only *behind an abstraction* so it never becomes a lock-in.

---

## The core principle

> The hard part is getting knowledge **out of heads**, not storing it.
> Optimize the whole system around *capture* and *currency*, not around the database.

Everything below is organized as a four-stage loop. Each stage is loosely coupled — you can build,
replace, or upgrade one without touching the others.

```
            ┌──────────────────────────────────────────────────────────┐
            │                                                          ▼
   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
   │  1. CAPTURE    │──▶│  2. STRUCTURE  │──▶│   3. SERVE     │──▶│  4. MAINTAIN   │
   │  (elicit)      │   │  (refine)      │   │  (retrieve)    │   │  (currency)    │
   └────────────────┘   └────────────────┘   └────────────────┘   └────────────────┘
     out of heads          raw → playbook       answer + cite        verify / decay
            ▲                                                          │
            └──────────────── feedback: "this was stale / wrong" ──────┘
```

---

## Stage 1 — CAPTURE (build this yourself; it's the differentiator)

The only stage with no off-the-shelf shortcut. Goal: lower the friction of getting tacit knowledge
into *any* durable form.

- **AI debrief agent** — a structured interview triggered at natural moments (matter close, a novel
  issue, after a CLE). "Walk me through how you handled X. What's the trigger? The steps? The traps?"
- **Passive ingestion** — point it at internal Q&A that already happens: Teams/Slack threads, email
  chains, recorded training transcripts. Most know-how is already being typed; it's just not captured.
- **"Teach the system"** — a one-shot entry point for ad-hoc capture ("here's how we do conflict
  waivers for X").
- **Output is always raw + attributed.** Never throw away who said it, when, and for what matter type.

**Output of this stage:** a raw markdown file in `inbox/`, with minimal frontmatter.

---

## Stage 2 — STRUCTURE (an agent turns raw capture into a reusable unit)

A refine agent reads `inbox/` and produces a clean **knowledge unit** — one markdown file per
procedure/playbook, with structured frontmatter (see schema below). This is the one place the Google
repo's `enrichment` pattern is worth borrowing conceptually: auto-tagging and normalizing.

The human owner reviews/approves before it goes live. Cheap to do; high trust payoff.

---

## Stage 3 — SERVE (retrieval — start dumb, get smart later)

- **v0 (week 1):** plain-text / keyword search over the markdown files + an LLM that reads the
  matching files and answers, always citing the source file and its `verified` date.
- **v1:** add embeddings over the same files (local vector store) for semantic retrieval.
- **v2 (only if needed):** materialize a knowledge graph from the frontmatter links
  (`related`, `practice_area`, `templates`) for multi-hop "what connects to what" queries.

The files never change across v0→v2. Only the index does. **That's the whole point.**

---

## Stage 4 — MAINTAIN (what makes this an asset instead of a liability)

Legal know-how rots. Without this stage you're building a confidently-wrong machine.

- `verified_by` + `verified_on` on every unit; a **decay timer** per knowledge type.
- A review queue surfaces units past their freshness window.
- Supersession, not deletion — keep history.
- **Confidentiality / ethical walls:** access metadata on every unit; capture of "how we handled X for
  Client A" must not leak into contexts it shouldn't. Enforce at retrieval time.

---

## The data model (this is the actual platform)

Your "platform" is, to begin with, **a folder convention + a frontmatter schema.** Get this right and
the tooling becomes swappable.

```
/knowledge
  /inbox            # raw captures awaiting structuring
  /units            # approved knowledge units (one .md each)
  /superseded       # retired versions, kept for history
  index.md          # human-browsable table of contents (can be generated)
```

A knowledge unit:

```markdown
---
id: kn-0042
title: How we handle conflict waivers for lateral hires
practice_area: [ethics, hr]
matter_type: lateral-onboarding
status: active            # active | draft | superseded
owner: jdoe
source: debrief           # debrief | thread | training | manual
verified_by: jdoe
verified_on: 2026-06-10
review_by: 2026-12-10      # decay timer
confidentiality: internal  # internal | walled:<group> | client:<id>
related: [kn-0017, kn-0031]
templates: [waiver-template-v3]
---

## Trigger
When ...

## Steps
1. ...

## Exceptions / traps
- ...

## Authorities
- ...
```

Everything an agent needs to retrieve, cite, check currency, and respect confidentiality lives in that
frontmatter. The body is the knowledge; the frontmatter is the catalog and the graph — **for free.**

---

## The abstraction boundary (the one rule that keeps you platform-agnostic)

Define a thin internal interface and make *everything* go through it:

```
KnowledgeStore
  capture(raw, meta) -> id
  get(id) -> unit
  search(query, filters) -> [unit]      # filters: practice_area, confidentiality, status
  link(id, id, kind)
  due_for_review() -> [unit]
```

- **v0 implementation:** reads/writes the markdown folder. ~a day of work.
- **Later implementations:** Postgres+pgvector, Neo4j, a managed service, *or* GCP Knowledge Catalog —
  all behind the same interface.
- Capture (stage 1) and Structure (stage 2) — your valuable, differentiated work — never import a
  database SDK. They only know `KnowledgeStore`.

This is exactly why the Google repo shouldn't be your spine: it would drag a GCP dependency *across*
this boundary into the stages that should stay clean.

---

## Suggested build order

1. Lock the **frontmatter schema** + folder convention. (No code.)
2. Build the **capture/debrief agent** → writes to `inbox/`. (Highest value, do it first.)
3. Build the **structure agent** → `inbox/` → reviewed `units/`.
4. Build **v0 retrieval** (read files + cite). Now it's usable end-to-end.
5. Add the **maintenance loop** (review queue + decay) before you have enough content to rot.
6. *Only then* consider embeddings / graph / a real backing store — behind `KnowledgeStore`.

---

## What to take from the Google Knowledge Catalog repo

Reference only, not foundation:
- The **knowledge-graph-for-agents** mental model (stage 3 v2).
- The **enrichment agent** pattern (stage 2).
- Nothing from its GCP plumbing.
```
