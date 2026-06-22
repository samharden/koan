# Koan — Cowork plugin

Capture, recall, review, and map your firm's "how do we do X" know-how from inside
Claude. **Skills-only and fully local:** your knowledge lives as plain markdown
files on your own machine — no server, no database, no API key, nothing leaves
your computer.

## Install

In **Cowork / Claude Desktop**, upload this `plugin/` folder via the in-app plugin
manager, then restart the app. That's it — the seven skills below are ready to
use. (Claude Code CLI: `claude plugin marketplace add /ABSOLUTE/PATH/TO/koan` then
`claude plugin install koan@koan-local`, and `/reload-plugins`.)

Nothing else to configure — no connector, no `npm install`, no build step.

## Where your knowledge lives

The skills read and write plain markdown in one folder, by default
`~/Documents/firm-knowledge/` (created on your first capture):

```
~/Documents/firm-knowledge/
├── inbox/   drafts awaiting review     (status: draft)
├── units/   promoted, trusted units    (status: active)
└── docs/    ingested document text
```

It's just files — back them up, sync them, or put them in git like anything else.
Prefer a different location? Tell Claude where, and the skills will use it.

## Skills

| Skill | Triggers on | What it does |
|---|---|---|
| `intro` | "what is this", "how does this work", "give me a tour" | Orients a new user and runs a short guided demo of the capture → review → recall loop, then hands off to the real skills. Doesn't change any knowledge itself. |
| `recall` | "how do we …", "what's our process for …" | Searches your captured files **first**, answers from the firm's own units (never generic advice as firm policy), respects draft status + confidentiality. |
| `capture` | "document how we …", "capture this process" | Runs a short structured debrief, shows you the draft to confirm, then saves it to `inbox/` for review. |
| `review` | "review the queue", "what's pending" | Walks the drafts in `inbox/` — read each, then promote (with a human's name) to `units/`, edit, or discard. |
| `landscape` | "where are the gaps", "do any of these conflict", "audit the knowledge base" | Reads all units together and reports gaps, overlaps, contradictions, and disconnects. Read-only audit; recommends follow-ups but changes nothing. |
| `map` | "visualize the landscape", "map the knowledge", "show me the graph" | Renders the units as an interactive graph (inline + a standalone offline HTML file) — nodes by practice area, edges for related/overlap/contradiction, gaps and confidential units marked. Read-only. |
| `scaffold` | "turn this into a skill", "make this a workflow", "deploy this process", "are my skills up to date" | Turns a **promoted** unit into a runnable `SKILL.md` you can invoke as a workflow — the inverse of capture. Generates a skill file (doesn't change your units); `--check` finds scaffolded skills whose source unit was re-promoted and regenerates them. |

Skills trigger on natural phrasing, or invoke explicitly: `/koan:intro`,
`/koan:recall`, `/koan:capture`, `/koan:review`, `/koan:landscape`, `/koan:map`,
`/koan:scaffold`.

## The lifecycle

**Capture → review → recall**, plus an optional **deploy**:

1. **Capture** turns one "how we do X" into a **draft** in `inbox/`.
2. **Review** is where a human reads each draft and **promotes** it to `units/`
   (stamping who vouched for it and a next-review date), edits it, or discards it.
   Drafts are *not* authoritative until promoted.
3. **Recall** answers "how do we …" questions from the promoted units, attributed
   to the source, never invented.
4. **Scaffold** (optional) turns a promoted unit into a runnable workflow skill.

`confidentiality` is a first-class field on every unit — `internal` by default,
`walled` when a capture references a specific client matter that needs an ethical
screen, `client` for client-owned material. The skills surface and respect it.

## Note on search

Recall uses Claude reading and searching your files directly — fast and accurate
at a firm's scale (tens to hundreds of procedures). There's no separate semantic
index to build or maintain; the tradeoff is that matching is keyword/meaning-based
reading rather than vector similarity, which only matters at much larger scale.
