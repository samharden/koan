---
name: ingest
description: >-
  Bring an existing document — a memo, policy, checklist, closing binder note,
  or old wiki page — into the firm's knowledge base: save its text to the
  store and, if it describes procedures, propose draft units from it. Use when
  the user wants to ADD A DOCUMENT rather than be debriefed: "ingest this
  document", "add this PDF to the knowledge base", "index this memo", "pull the
  procedures out of this policy", "we already have this written down — get it
  in". For capturing knowledge from the user's head, use capture instead.
---

# Ingest a document

`capture` pulls know-how out of a person; this skill pulls it out of a
**document** the firm already has. It does two things, the second optional:

1. **Store the text** — save the document's text into the knowledge folder so
   `recall` can search it and cite it.
2. **Propose draft units** — if the document describes procedures, offer to
   extract them as draft units for the normal review queue.

## Where the knowledge lives

Plain markdown files, by default under `~/Documents/firm-knowledge/`:

- `docs/` — ingested document text (this skill writes here)
- `inbox/` — drafts awaiting review (extracted units go here, `status: draft`)
- `units/` — promoted units (this skill never writes here)

Create the folders if they don't exist. If the user keeps their knowledge
elsewhere, use that path.

## When to use

- "Ingest this document." / "Add this PDF to the knowledge base."
- "Index this memo so we can find it later."
- "This policy has our conflict process in it — pull it in."
- "We already wrote this down; get it into Koan."

If the user wants to *explain* a process rather than hand over a file, that's
`capture`. If they're asking what a document says, just read it — ingestion is
for keeping it.

## Workflow

1. **Read the document with file tools.** PDFs are read from the **text layer
   only** — a scanned-image PDF yields no text. If you get nothing (or garbage),
   tell the user plainly that the document has no extractable text and stop; OCR
   is not supported yet. Word/markdown/plain-text files read normally.
2. **Confirm provenance and confidentiality before saving.** Ask (briefly — one
   turn) what the document is, who owns it, and whether it references a specific
   client matter. Default `confidentiality: internal`; use `walled` or `client`
   when it's matter-specific. Don't skip this: documents carry client details
   more often than debriefs do.
3. **Save the text to `docs/`.** Write `docs/<slug>.md`, where `<slug>` is the
   document title lowercased with every run of non-alphanumeric characters
   turned into a single `-` (trim leading/trailing `-`; append `-2`, `-3`, … on
   collision). Format:

   ```markdown
   ---
   id: doc-<YYYY-MM-DD>-<slug>
   title: <document title>
   source: <original filename or path>
   ingested_on: <YYYY-MM-DD>
   owner: <who provided it, or "">
   confidentiality: internal       # or walled / client
   ---

   <the extracted text — cleaned of extraction artifacts, but not rewritten,
   summarized, or "improved">
   ```

   Add the document's line to `INDEX.md` under **Documents** (format in
   `../_shared/unit-format.md`; create the index if it doesn't exist).

4. **Offer to extract draft units.** If the document describes one or more
   procedures ("how we do X"), say which you spotted and offer to draft them.
   For each the user wants:
   - Build the unit in the canonical format — `Read` `../_shared/unit-format.md`
     (relative to this skill's folder) and follow it exactly — with
     `source: "document: doc-<YYYY-MM-DD>-<slug>"` instead of `source: debrief`,
     and the same `confidentiality` as the document (or stricter).
   - **Show it to the user before saving**, then write it to `inbox/` as a
     normal draft (`draft-<YYYY-MM-DD>-<slug>.md`, `status: draft`) and add its
     `INDEX.md` line under **Drafts**. It flows through `/koan:review` like any
     other draft. If the draft answers a miss logged in `gaps.md`, remove that
     line and say which gap it closes.
   - Note where in the document each section came from (page or heading) in the
     unit's Open questions or Authorities, so the reviewer can check it.
5. **Report what happened.** Name the saved doc file, list any drafts created,
   and remind the user drafts aren't authoritative until promoted in
   `/koan:review`.

## Guardrails

- **A document is not authority.** However official it looks, extracted units
  are `status: draft` like everything else — a human still promotes them. Never
  write to `units/`.
- **Faithful extraction.** Extracted units contain only what the document says.
  Don't fill gaps with general knowledge; log gaps as open questions for the
  reviewer.
- **Confidentiality flows downhill.** A unit extracted from a `walled` or
  `client` document is at least as restricted as its source.
- **Text layer only.** Say so when a scan yields nothing — don't guess at the
  contents of a document you couldn't read.
- **Don't hoard.** If the user just wants a question answered from a document,
  answer it — only ingest when they want it kept and searchable.
