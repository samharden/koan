# Knowledge Capture (Next.js)

Stage-1 capture/debrief agent as a Next.js App Router app. No Python. One
TypeScript codebase: chat UI + API routes. Writes draft knowledge units to
`knowledge/inbox/` (relative to where you run it).

## Run locally

```bash
cd nextjs
npm install
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                        # http://localhost:3000
```

Talk to the interviewer, then click **Generate draft**. A structured draft unit
lands in `knowledge/inbox/` for the review stage.

## How it works

- **`app/page.tsx`** — the chat UI (client). Holds the whole conversation in
  React state and sends the full history each turn, so the server is stateless.
- **`app/api/message/route.ts`** — streams one interviewer turn (Claude Opus 4.8,
  adaptive thinking).
- **`app/api/finish/route.ts`** — the structure pass: transcript → one knowledge
  unit via structured output, then `writeUnit`.
- **`lib/capture.ts`** — server-only: system prompt, extraction schema, transcript
  formatter, and the `writeUnit` KnowledgeStore boundary (v0 = markdown files).

## Deploying

Runs on any Node host. On Vercel, set `ANTHROPIC_API_KEY` as an env var.

> ⚠️ **Filesystem write caveat:** `writeUnit` writes to local disk. That works in
> `npm run dev` and on a normal Node server, but **Vercel's serverless filesystem
> is ephemeral** — files written there vanish after the request. Before deploying
> to serverless, swap the body of `writeUnit` for your real store (S3/R2, a DB,
> Drive, or a DMS). That's the one function the abstraction boundary exists to
> isolate; nothing else changes.

## Not hardened

Prototype: no auth, `owner` is a free-text field. Put login in front before real
users, and derive `owner` from the authenticated session.
