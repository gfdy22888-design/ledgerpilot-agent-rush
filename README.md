# LedgerPilot

Procurement reconciliation with a source reference behind every exception and a human decision before export.

Built for [Vultr Agent Rush](https://lablab.ai/ai-hackathons/vultr-hackathon), **Challenge 2: Powering the Future of Work**. This is a functional prototype, not an accounting system or payment service.

## Run locally

Node.js 22 or newer. No package installation is required.

```sh
npm start
```

Open `http://127.0.0.1:4173`. Click **Run reconciliation**, open an invoice's evidence, approve a clean match, then export the reviewed CSV. Download the evidence packet to inspect the findings and hash-linked review trail.

```sh
npm run check
npm test
```

## What actually runs

The backend validates structured purchase orders, goods receipts and invoices. Integer-cent arithmetic checks supplier identity, agreed price, missing purchase orders, duplicate line-item fingerprints, ordered quantities and receipt quantities. Clean invoices reserve receipt quantities so split invoices cannot collectively exceed available receipts. Held invoices cannot enter the export, including through direct API calls.

When `VULTR_INFERENCE_KEY` and `VULTR_INFERENCE_MODEL` are configured on the server, Vultr Serverless Inference explains verified findings and drafts clarification emails. JSON output is validated before applying text; the model cannot overwrite amounts, verdicts or evidence. Invalid output and service failures retain the deterministic results and display a fallback notice. Without credentials the interface explicitly displays rules mode. Drafts never send themselves.

This is a fixed, tool-oriented workflow, not an open-ended autonomous agent. It does not run model-generated code, browse vendor portals, extract PDFs, connect an ERP or make payments. Challenge 2 permits rule-based workflows and does not require the Challenge 1 sandbox pattern.

## Reproducible sample

All sample organizations and records are synthetic. The batch contains 5 purchase orders, 5 receipts and 8 invoices.

| Outcome | Invoice count | USD |
| --- | ---: | ---: |
| Source documents match; human review pending | 3 | 4,780.00 |
| Held for clarification | 5 | 6,270.00 |
| Total invoice value | 8 | 11,050.00 |

Held value is the full face value of invoices requiring review. It is not an estimate of overcharging, prevented losses, fraud or recovered savings. Duplicate detection is a flag for review, not a fraud finding. The matching heuristic is conservative: legitimate identical installments may be flagged and must be clarified outside the prototype.

## Data and review boundaries

- Public demo defaults to synthetic batches only. Custom JSON uploads require `ALLOW_CUSTOM_DATA=true` on a private deployment. Use `GET /api/sample` as the schema template.
- Each browser gets an opaque, HttpOnly, SameSite cookie. No cross-session batch listing is exposed. Session files persist across app restarts and are removed after 24 hours of inactivity by an hourly cleanup (up to 25 hours of retention).
- This prototype has no enterprise identity, shared workspaces, reviewer attribution or role-based access. A review records a browser-session action, not a verified person's signature. Do not enable real financial uploads on an unauthenticated public deployment.
- API mutations require the configured exact origin and JSON content type. HTML output escapes document and model strings. CSV output neutralizes formula prefixes.
- A hash chain makes packet modification detectable relative to that packet. It is not an independent timestamp, immutable audit ledger or evidence against a server administrator.
- AI receives only verified findings and line evidence, not credentials or complete document files. In custom mode those facts can still be private: use only data authorized for transmission to Vultr. AI explanation text is advisory and may be wrong; inspect the evidence table.
- Each session has one active job, at most three jobs run concurrently, and new runs have a ten-second cooldown. A public production service still needs an external rate limiter and organization authentication.

## Intended Vultr deployment

The VM runs the actual HTTP backend, reconciliation engine, session persistence and AI orchestration. The frontend uses this same backend; Vultr is not just a static asset host. Caddy terminates HTTPS and proxies to the app. Docker runs the app as a non-root user with a read-only root filesystem, writable data volume and resource limits.

This checkout has **not yet been deployed to Vultr**. Docker is unavailable on the development host, so the container path is prepared but unverified. A local preview is not evidence of meeting the event's Vultr-hosting requirement.

See [deployment instructions](deploy/README.md). Set the model to an ID returned by the authenticated live Vultr model list rather than assuming a model name. Keep keys in the VM's untracked `.env` file; they never go into frontend code.

## Submission materials

`submission/entry.md` contains the English submission draft. `submission/demo-script.md` contains the planned 3-4 minute walkthrough. `submission/status.json` distinguishes prepared, verified and outstanding items. The PDF pitch is a preparation draft until hosting and a live model run are verified. No contest submission or registration success is claimed.

Preparation began on **2 November 2026, Asia/Singapore**, before the event's advertised 3-8 November build period. Disclose this history and check the final event-specific eligibility rules; do not represent all work as created during the event. The browser event schedule currently shows kickoff at **4 November 00:00** and submission close at **9 November 07:00**, Asia/Singapore. Recheck the live event schedule before submitting.

## Architecture

Browser UI → Node HTTP backend on Vultr VM → structured validator → deterministic matching/allocation → optional Vultr inference → review queue → confirmed CSV and JSON evidence exports. The inference service has no action tools. A separate human action controls the export. No external communication or payment adapters exist.

## License

MIT. Third-party runtime/container images retain their own licenses.
