# Coverage baselines

Reference checklists of procedures a law practice *typically* has, so
`landscape` can report gaps against a named yardstick even when the corpus is
too small to point at its own holes. These are prompts, not mandates — plenty
of sound firms run without some of these, and no baseline knows a particular
firm's practice.

## How landscape uses this file

- **Diff only against baselines that apply.** Every firm gets **Firm
  operations**; apply a practice-area baseline only if the firm actually works
  in it — infer from the units' `practice_area` values, or ask. Never report a
  transactional gap to a pure litigation shop.
- **Name the source.** A baseline finding is always attributed: "compared
  against the litigation baseline: no procedure captured for legal holds" —
  never presented as something the corpus itself implied.
- **Rank below real evidence.** Demand-side gaps (`gaps.md`), friction entries,
  and dangling references from actual units always outrank baseline misses —
  someone asked for those. Baseline misses are the "worth considering" tier,
  most useful when the store is young.
- **Coverage can be partial.** If a unit covers half a baseline item (intake
  but not engagement letters), say which half is missing rather than counting
  the item covered or absent.

## Firm operations (every firm)

- New-client intake and screening
- Conflict checking — and conflict waivers when one is found
- Engagement letters (and declining representation / non-engagement letters)
- Matter opening — file setup, staffing, calendaring key dates
- Matter closing — final billing, client file return, retention schedule
- Billing — time entry conventions, invoicing, fee disputes, collections
- Deadline and limitations-period calendaring (and the double-check that backs it)
- Escalation and supervision — when an associate must loop in a partner
- Lateral hires and departures — screening, ethical walls, file transfer
- Client communication standards — status updates, who speaks to the client
- Missed-deadline / error response (who gets told, malpractice carrier notice)
- Data incident response — lost device, phishing, unauthorized access
- Template and precedent management — where they live, who updates them

## Litigation

- Case intake and merits evaluation (including declinations)
- Legal hold issuance, tracking, and release
- Pleadings — drafting conventions, review chain, e-filing mechanics
- Service of process — effecting it and responding to it
- Discovery — propounding, responding, objections, meet-and-confer
- Document production — collection, review, privilege log, Bates numbering
- Depositions — noticing, preparation (witness and taker), transcript handling
- Expert witnesses — selection, engagement, disclosure deadlines
- Motion practice — which motions the firm brings, briefing conventions
- Settlement — authority, documentation, releases
- Trial preparation — exhibits, witness lists, pretrial filings
- Post-trial and appeals — deadlines, notice of appeal, record designation
- Subpoenas and demands received by the firm or its clients

## Transactional

- Deal intake and engagement scoping (fee structure, timeline, team)
- Due diligence — checklist, data room conventions, red-flag reporting
- Term sheets and letters of intent
- Document assembly — starting points, precedent selection, house style
- Negotiation conventions — what the firm concedes, what it never does
- Signing mechanics — signature collection, authority verification
- Closing — checklist, funds flow, escrow handling
- Post-closing — closing binders, filings, follow-up obligations
- Entity formation and maintenance (if the firm does ongoing corporate work)
- Contract lifecycle for repeat clients — renewals, amendments, terminations
