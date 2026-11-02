# Planned live walkthrough - 3 to 4 minutes

Record the deployed app, not a reconstruction of a successful run. Until deployment is verified, any local recording must clearly say "local prototype - rules mode". Never overlay a live AI badge or successful deployment state that did not occur.

## 0:00-0:30 - Problem and scope

"LedgerPilot helps a procurement reviewer determine whether an invoice agrees with the order and what actually arrived. Every exception carries source evidence. The reviewer controls the final export."

State that all organizations and documents in the demo are synthetic.

## 0:30-1:10 - Run a batch

Show the real deployment URL and current engine badge. Click Run reconciliation. Explain the workflow steps and resulting totals: eight invoices, $11,050 face value, three matches, five holds. Clarify that $6,270 held is not recovered savings.

## 1:10-2:00 - Inspect evidence

Open INV-1002: 100 units invoiced but only 80 units received under GR-402. Show the source table and unsent supplier draft. Mark for follow-up.

Open INV-1003: $82 invoiced per unit versus the agreed $75. The hold remains regardless of how the model explains it. If the run is rules-only, describe the explanation as a template. If live inference succeeded, describe it as advisory AI text.

## 2:00-2:40 - Human decision and actual artifact

Open INV-1001. Show the matching order and receipt. Approve for CSV export. Open the export confirmation and acknowledge review. Download and inspect the CSV: INV-1001 only. No held invoice should appear. No payment is initiated.

## 2:40-3:15 - Architecture and evidence

Download the JSON evidence packet. Explain source hashes and the review event chain without calling it immutable. Show the backend's Vultr deployment record when available. Explain that the model cannot call external action tools or change amounts.

## 3:15-3:45 - Business hypothesis and next steps

Explain the intended small-team procurement audience. Propose a measured pilot comparing manual review time, exception false positives and reviewer confidence on the same data. No customer, time-saving or revenue claim is made yet.

## Recording acceptance check

- Visible public URL is actually hosted on Vultr.
- The displayed engine badge matches the provider used in the run.
- The captured sequence includes a real review and exported artifact.
- Video is MP4 or MOV and the form's current size/duration limits are respected.
- No keys, account billing details or private inbox content appears.
