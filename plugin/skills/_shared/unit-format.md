# Koan unit format (canonical)

The single source of truth for how a knowledge unit is written to disk. Skills
that **write** units (`capture`, `ingest`, `review`) follow this file exactly;
skills that **read** them (`recall`, `review`, `landscape`, `map`, `scaffold`)
can rely on it. Don't restate this schema inside a skill — reference this file.

## Filename and id

- A **draft** lives at `inbox/draft-<YYYY-MM-DD>-<slug>.md`; its `id` is the
  filename without `.md`. The date is the capture date.
- `<slug>` is the unit title lowercased with every run of non-alphanumeric
  characters turned into a single `-` (trim leading/trailing `-`).
- On filename collision, append `-2`, `-3`, …
- **Promotion** (the `review` skill) moves the file to `units/<new-id>.md`,
  where `<new-id>` is the draft id with the leading `draft-` removed (again
  appending `-2`, `-3`, … if taken). The old inbox file is deleted — moved,
  not copied.
- **Retirement** (the `review` skill) moves a promoted unit to
  `archive/<id>.md` (id unchanged) with `status: retired`. Retired units are
  never deleted — the record of what the procedure *used to be* is part of the
  firm's knowledge. Only unpromoted drafts are ever deleted (discard).

## Frontmatter

```markdown
---
id: draft-<YYYY-MM-DD>-<slug>   # must match the filename (sans .md)
title: <title>
practice_area: [<area>, …]      # [] if none
matter_type: <type or "">
status: draft                   # draft | active | retired — active only via promotion
owner: <who described/provided it, or "">
source: debrief                 # or session / "document: <doc-id>" — see below
captured_on: <YYYY-MM-DD>
verified_by: ""                 # set at promotion — a real human's name
verified_on: ""                 # set at promotion / re-vouch (YYYY-MM-DD)
review_by: ""                   # set at promotion — default +180 days
confidentiality: internal       # internal | walled | client
related: []                     # ids of related units
templates: [<template>, …]      # [] if none
---
```

## Body

```markdown
# <title>

## Trigger

<when this applies — or `_None captured._`>

## Steps

- <step 1>
- <step 2>

## Exceptions / traps

- <trap — or `_None captured._`>

## Authorities

- <rule / form / precedent — or `_None captured._`>

## Open questions (for reviewer)

- <anything thin or unconfirmed — or `_None captured._`>
```

## Lifecycle field semantics

- **`status`** is `draft` until a human promotes the unit; promotion sets it to
  `active`. Nothing else may set `active`.
- **Promotion** stamps `verified_by` (the human vouching, by name — never a
  guess), `verified_on` (that day), and `review_by` (default today +180 days),
  and rewrites `id` to the promoted form.
- **Re-vouching** (when `review_by` has passed) advances `verified_on` and
  `review_by` in place; the id and location don't change. `verified_on` is the
  drift fingerprint scaffolded skills key off, so re-vouching deliberately
  marks them stale.
- **Retirement** moves the unit to `archive/` with `status: retired`, adding
  `retired_on: <YYYY-MM-DD>` and `retired_by: <name>` to the frontmatter (and,
  when there is one, `superseded_by: <id>` pointing at the replacement unit).
  All other fields are preserved as the historical record.
- **`source`** records provenance: `debrief` for a captured interview,
  `session` for a unit distilled from work done in the current conversation,
  `document: <doc-id>` for a unit extracted by `ingest`.
- **`confidentiality`**: `internal` (default) · `walled` (references a specific
  client matter behind an ethical screen) · `client` (client-owned material).
  A unit extracted from a document is at least as restricted as its source.
  This field controls how *Claude* handles the unit — it is not access control;
  anyone with folder access can open the file.

## INDEX.md — the store's table of contents

`INDEX.md` at the knowledge-folder root gives one line per live item, so a
skill can learn what exists in a single read before deciding what to open:

```markdown
# Koan index

## Promoted
- <id> — <title> [<practice areas>] — <one-line trigger hook>

## Drafts
- <id> — <title> [<practice areas>] — <one-line trigger hook>

## Documents
- <doc-id> — <title> (<source filename>)
```

- **Writers maintain it.** `capture` and `ingest` add a line when they save;
  `review` moves a line from Drafts to Promoted on promotion, removes it on
  discard, and removes it on retirement (retired units are not indexed — they
  live in `archive/`, findable by browsing, not by recall).
- **Walled/client units** get an index line too (title + areas only — keep the
  trigger hook generic); the index itself is `internal`.
- **The folder wins.** The index is a convenience copy of the truth on disk.
  If it's missing or disagrees with the folders, fall back to globbing —
  `review` rebuilds it from the folders whenever drift is noticed.

## gaps.md — recall misses

When `recall` can't answer from the store, it logs the demand so the firm
knows what people needed and didn't get. `gaps.md` at the knowledge-folder
root, one line per miss, newest last:

```markdown
- <YYYY-MM-DD> — asked: "<the question, paraphrased>" — no matching unit
```

`capture` and `ingest` check it when saving and remove (or mark resolved) any
line the new unit answers; `landscape` reads it as the demand-side gap list.
