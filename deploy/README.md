# Deploy on a Vultr VM

Status: prepared instructions; not yet executed or verified on a Vultr host.

1. Complete the lablab.ai event registration, connect Discord if required, and claim the event's Vultr credit code when released at kickoff. The event currently says to use an email not previously associated with a Vultr account for the credit offer. Do not assume an existing account is eligible.
2. Select a supported Ubuntu VM after checking live price and available credits. This project has not authorized a particular paid plan or spending cap. Keep any billable provisioning action pending until the user approves the concrete plan and cost.
3. Point a domain's DNS A record at the VM. Install Docker Engine and the Compose plugin using the official Docker installation instructions, or select a verified official Vultr Docker marketplace image. Verify `docker compose version`.
4. Copy this project directory to the VM. Create `.env` from `.env.example` and set:

```dotenv
APP_DOMAIN=your.actual.domain
PUBLIC_ORIGIN=https://your.actual.domain
HOST=0.0.0.0
PORT=4173
ALLOW_CUSTOM_DATA=false
VULTR_INFERENCE_KEY=SET_LOCALLY_ON_THE_VM
VULTR_INFERENCE_MODEL=AN_ID_FROM_THE_LIVE_MODEL_LIST
```

5. Protect `.env` with `chmod 600 .env`. Do not upload it to GitHub. Allow TCP 80/443 in the Vultr firewall; restrict SSH to the administrator's approved source. The app port binds only to the VM loopback interface.
6. Run `docker compose up -d --build`. The app and reverse proxy start together. The initial named data volume inherits the non-root app user's ownership from the image. Inspect errors before continuing if it does not.
7. Verify `docker compose ps`, the health endpoint `https://your.actual.domain/healthz`, and the browser workflow. Verify the AI badge says **Live Vultr AI** when the configured model succeeds. Rules-only fallback is functional but must be disclosed in the demo.
8. Run a fresh sample, inspect INV-1002 and INV-1003, approve INV-1001 and export the CSV. Confirm there is only one exported invoice. Download the evidence JSON. Record the VM, deployment commit, public URL, exact model ID and run evidence in `submission/status.json`, excluding secrets.
9. Publish the source to the user's intended public GitHub repository, record a video showing the deployed application and upload the required materials on lablab.ai. Check the rendered form and wait for explicit success state before marking submitted.

## Operational limits

This is a single-VM hackathon prototype with local session storage. Do not run multiple replicas against the same files. Back up only synthetic data or data authorized for backup. A real deployment would add organization login, reviewer identity, database transactions, external rate limiting, retention controls and ERP-specific reconciliation policies before accepting private business records.

Shutting down an application container does not necessarily stop Vultr billing. Review the cloud resource inventory and budget with the account owner after the event. Do not delete resources without authorization.

Official references checked 2 November 2026:

- https://lablab.ai/ai-hackathons/vultr-hackathon
- https://docs.vultr.com/products/compute/serverless-inference/provisioning
- https://api.vultrinference.com/v1/models
- https://docs.docker.com/engine/install/ubuntu/
