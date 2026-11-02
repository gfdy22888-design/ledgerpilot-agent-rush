# Submission draft - LedgerPilot

**Title:** LedgerPilot: Procurement Reconciled

**Short description (under 255 characters):**

LedgerPilot matches purchase orders, receipts and invoices, explains exceptions with source evidence, and prepares supplier follow-ups. Every export requires human review. Built for procurement teams on Vultr.

**Track:** Challenge 2 - Powering the Future of Work

**Categories:** Procurement; Finance operations; Workflow automation; AI assistants

**Technology:** JavaScript; Node.js; Vultr Cloud Compute (deployment pending); optional Vultr Serverless Inference; Docker; Caddy

## Long description

Procurement reviewers need to know whether an invoice agrees with the purchase order and the goods actually received. A plausible explanation is insufficient: the reviewer needs the quantities, prices and source document references behind it.

LedgerPilot executes a complete reconciliation workflow. It validates structured source documents, checks supplier and item identity, allocates available receipt quantities across clean invoices, and flags missing orders, price differences and possible duplicates. All financial calculations use integer cents. Each exception links back to a purchase order and receipt references. Optional Vultr Serverless Inference turns the verified findings into advisory explanations and supplier clarification drafts. The model cannot change the numeric result or approve an invoice.

Reviewers inspect the evidence before approving a clean invoice for CSV export. Held invoices cannot enter the export, even through direct backend requests. Supplier messages remain unsent drafts. An evidence packet includes the findings and a hash-linked sequence of review events. The hash chain can be checked within the packet; it is not independent notarization.

The target deployment places the web frontend, actual orchestration backend and session storage on a Vultr VM behind an HTTPS reverse proxy. This architecture makes Vultr the workflow's operating backend. At the time of this preparation draft, the local application and automated core tests pass; cloud deployment and live inference are still pending.

The synthetic sample contains eight invoices worth $11,050. Three match the available source documents; five, worth $6,270 in total invoice face value, require clarification. That held value is not a claim of savings, recovered funds or fraud detection performance. Customer demand, reviewer time savings and commercial viability remain hypotheses to test with procurement teams.

## Business hypothesis

Initial users would be small procurement teams that work from structured exports and lack a configurable reconciliation workflow. A possible subscription would charge per workspace and batch volume. Neither pricing nor willingness to pay has been validated. The next validation step is to measure review completion time, false-positive exceptions and evidence usefulness against the same batches reviewed manually.

## Originality and preparation disclosure

The differentiation is an inspectable workflow: receipt allocation, deterministic verdicts, optional AI explanations and an export gate live in one small application. This is a fixed workflow, not unrestricted autonomous financial action. Initial preparation and code creation began on 2 November 2026, before the event's advertised build period. Confirm event eligibility and disclose this history in the actual submission.

## Fields to complete only after verification

- Public GitHub repository URL: https://github.com/gfdy22888-design/ledgerpilot-agent-rush
- Vultr-hosted public application URL: pending
- Verified deployed commit and model ID: pending
- Recorded MP4/MOV walkthrough: pending
- PDF pitch: prepared locally; refresh after deployment verification
- Team registration: screening form submitted per account owner; approval unverified. Discord connection unverified.
- Final submission receipt: pending
