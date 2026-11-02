#!/usr/bin/env bash
# Run only on the approved fresh Ubuntu Vultr VM, from a reviewed checkout.
set -euo pipefail
if [[ $# -ne 1 ]]; then echo 'Usage: sudo bash deploy/bootstrap-ubuntu.sh PUBLIC_HOSTNAME' >&2; exit 2; fi
domain="$1"
if [[ ! "$domain" =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$ ]] || [[ "$domain" != *.* ]]; then
  echo 'Pass a public DNS hostname without a scheme, port, path or whitespace.' >&2; exit 2
fi
if [[ $EUID -ne 0 ]]; then echo 'Run this script with sudo on the approved VM.' >&2; exit 2; fi
source /etc/os-release
if [[ "$ID" != ubuntu ]] || [[ "$VERSION_ID" != 24.04 && "$VERSION_ID" != 22.04 && "$VERSION_ID" != 26.04 ]]; then
  echo 'Use a supported Ubuntu LTS VM (22.04, 24.04 or 26.04).' >&2; exit 2
fi
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
if [[ -e .env ]]; then
  echo '.env already exists. Inspect the existing deployment before rerunning; no files changed.' >&2; exit 2
fi
for package in docker.io docker-compose docker-compose-v2 podman-docker containerd runc; do
  if dpkg-query -W -f='${Status}' "$package" 2>/dev/null | grep -q 'install ok installed'; then
    echo "Conflicting package $package detected. Inspect the host before changing its runtime." >&2; exit 2
  fi
done
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker
umask 077
cat > .env <<EOF
APP_DOMAIN=$domain
PUBLIC_ORIGIN=https://$domain
HOST=0.0.0.0
PORT=4173
DATA_DIR=/app/data
ALLOW_CUSTOM_DATA=false
VULTR_INFERENCE_KEY=
VULTR_INFERENCE_MODEL=
EOF
chmod 600 .env
docker compose config --quiet
docker compose up -d --build
healthy=0
for attempt in {1..60}; do
  if curl --fail --silent https://"$domain"/healthz; then healthy=1; break; fi
  sleep 2
done
if [[ "$healthy" != 1 ]]; then
  echo 'HTTPS readiness not verified. Inspect DNS, Vultr firewall and container logs.' >&2
  docker compose ps
  exit 1
fi
printf '\nHTTPS health verified: https://%s\nRules mode remains explicit. Perform the public browser acceptance flow next.\n' "$domain"
git rev-parse HEAD
