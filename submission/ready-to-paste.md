# Form text - prepared, deployment pending

Source checked: https://lablab.ai/ai-hackathons/vultr-hackathon
Event-specific form limits take priority. Null URL/video fields must be completed after actual deployment.

## title (35 characters)

LedgerPilot: Procurement Reconciled

## shortDescription (201 characters)

LedgerPilot matches purchase orders, receipts and invoices, explains exceptions with source evidence, and prepares supplier follow-ups. Human review controls every export. Vultr deployment is prepared.

## longDescription (1660 characters)

Procurement reviewers need to know whether an invoice agrees with the order and what actually arrived. LedgerPilot turns structured purchase orders, goods receipts and invoices into an inspectable review queue.

The backend validates documents, checks supplier identity and agreed prices, flags missing orders and possible duplicates, and allocates receipt quantities across clean invoices. Integer-cent arithmetic determines the amounts. Every exception retains source references. Held invoices cannot enter the CSV export, even through direct API calls. Clean matches require a human approval and a separate export confirmation. Supplier follow-ups remain unsent drafts; the app never makes payments.

Optional Vultr Serverless Inference can explain verified findings and draft clarification messages. The model cannot alter amounts or verdicts. Without credentials, the interface explicitly uses rules mode. The evidence packet includes source hashes and a checkable review chain, not an independently notarized ledger.

The synthetic sample has eight invoices worth $11,050: three matches worth $4,780 and five holds worth $6,270. Held value is invoice face value, not claimed savings. Six automated tests pass; GitHub Actions also built the Docker image and exercised the container workflow.

The intended frontend and real backend run together on a Vultr VM behind HTTPS. Deployment and a live model call are still pending. Intended users are small procurement teams working from structured exports; demand, pricing and time savings remain unvalidated. Preparation began 2 November 2026, before the advertised build window; eligibility must be confirmed.

## track

Challenge 2 - Powering the Future of Work

## participationMode

Online

## githubRepository

https://github.com/gfdy22888-design/ledgerpilot-agent-rush

## demoApplicationPlatform

Vultr VM (planned; not yet deployed)

## Categories

Procurement, Finance operations, Workflow automation

## Technologies

JavaScript, Node.js, Docker, Caddy, Vultr Cloud Compute (deployment pending), Vultr Serverless Inference (optional; unverified)

## Remaining before final submission

- Organizer approval and eligibility confirmation
- Verified public Vultr application URL
- Actual hosted-app recording
- Refresh deployment statements after verification
