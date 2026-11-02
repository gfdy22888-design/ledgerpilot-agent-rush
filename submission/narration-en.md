# Ready-to-read narration - local preparation version

Approximately 3-4 minutes at a measured pace. All organizations and transactions shown are synthetic. Record actual app interactions, and retain the visible rules-mode label. Replace the opening and deployment statements only after a live Vultr URL is verified. This script is not a claim that a hosted recording already exists.

## 0:00-0:25 | Problem and scope

LedgerPilot helps procurement reviewers answer a concrete question: does this invoice agree with the purchase order and the goods that actually arrived?

A plausible explanation is not enough. The reviewer needs the quantities, prices and source references behind the decision.

This is the local prototype in rules mode. Every organization and document in this walkthrough is synthetic. Cloud deployment is still pending.

## 0:25-1:00 | Run and explain the batch

We start a reconciliation with five purchase orders, five receipts and eight invoices. The backend validates the structured records and compares suppliers, agreed prices and available quantities. Clean invoices reserve receipt quantities, so multiple invoices cannot collectively consume the same goods.

The sample totals eleven thousand and fifty dollars. Three invoices match the available source documents. Five require clarification. Their six thousand two hundred and seventy dollar total is held invoice face value, not recovered savings or a fraud finding.

## 1:00-1:45 | Trace an actual exception

Open invoice INV-1002. It bills one hundred units, but receipt GR-402 supports only eighty. The table keeps the invoice, purchase order and receipt evidence visible together.

The application prepares a supplier clarification draft. Marking this case for follow-up records a review action; it does not send the email. Because the invoice is on hold, it cannot be approved for export.

Invoice INV-1003 illustrates a different exception: eighty-two dollars invoiced per unit against an agreed price of seventy-five dollars.

## 1:45-2:30 | Human review and the actual artifact

Now open INV-1001 and inspect its matching quantities and price. Approve this clean invoice, then open the export confirmation.

Downloading requires a separate acknowledgement that the evidence was reviewed. The resulting CSV should contain INV-1001 and no held invoices. Open the actual downloaded file on screen and verify that result.

The evidence download also includes source hashes and a review event chain. That chain can be checked within the packet; it is not independent notarization. No payment is executed.

## 2:30-3:05 | Architecture and verification

The intended Vultr deployment runs the frontend and real Node backend together on a VM behind HTTPS. The container image and its reconciliation, review and export workflow have already passed GitHub Actions checks.

Vultr Serverless Inference is optional for this track. When configured, it can explain verified findings and draft clarification text. It cannot change amounts, verdicts or approval decisions. This local run uses the deterministic engine and template text; a live model call has not been verified.

## 3:05-3:35 | Audience, value and next step

The intended audience is a small procurement team working from structured exports. The product proposition is one review queue that connects matching, source evidence, follow-up drafts and a human export gate.

The next pilot should compare manual and assisted review on the same batches: completion time, false-positive holds and evidence usefulness. Customer demand and pricing remain hypotheses.

Preparation began on November second, before the advertised build window. The final entry must disclose that history, confirm eligibility and include a verified public Vultr deployment.

## Replacement after deployment, only when verified

- Opening: “This is LedgerPilot running at [actual verified Vultr URL]. All documents are synthetic. The badge shows the engine used in this run.”
- Deployment section: state the real deployed commit and services, and only name a model if its live request succeeded.
- Replace “cloud deployment is still pending” only after checking the public application and deployment record.
- Do not read bracketed instructions aloud or leave placeholders in the submitted video.
