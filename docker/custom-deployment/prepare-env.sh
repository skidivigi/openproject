#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

repository="${1:-}"
tag="${2:-18.0.0-custom.1}"
host_name="${3:-10.20.30.40:8080}"

if [[ -z "$repository" ]]; then
  echo "Usage: $0 <dockerhub-user/repository> [tag] [host:port]" >&2
  exit 1
fi

if [[ "$repository" != */* ]]; then
  echo "Repository must include the Docker Hub namespace, for example: user/openproject-custom" >&2
  exit 1
fi

if [[ -e "$ENV_FILE" ]]; then
  echo "$ENV_FILE already exists; refusing to overwrite secrets." >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required to generate deployment secrets." >&2
  exit 1
fi

image="$repository:$tag"
if [[ "$repository" != *.*/* && "$repository" != localhost/* ]]; then
  image="docker.io/$image"
fi

postgres_password="$(openssl rand -hex 24)"
secret_key_base="$(openssl rand -hex 64)"
collaborative_secret="$(openssl rand -hex 32)"

umask 077
{
  printf 'OPENPROJECT_IMAGE=%s\n\n' "$image"
  printf 'OPENPROJECT_HOST__NAME=%s\n' "$host_name"
  printf 'OPENPROJECT_HTTPS=false\n'
  printf 'OPENPROJECT_HSTS=false\n'
  printf 'OPENPROJECT_DEFAULT__LANGUAGE=ru\n'
  printf 'COLLABORATIVE_SERVER_URL=ws://%s/hocuspocus\n\n' "$host_name"
  printf 'BIND_ADDRESS=0.0.0.0\n'
  printf 'PORT=8080\n\n'
  printf 'POSTGRES_VERSION=17\n'
  printf 'POSTGRES_USER=openproject\n'
  printf 'POSTGRES_DB=openproject\n'
  printf 'POSTGRES_PASSWORD=%s\n' "$postgres_password"
  printf 'SECRET_KEY_BASE=%s\n' "$secret_key_base"
  printf 'COLLABORATIVE_SERVER_SECRET=%s\n\n' "$collaborative_secret"
  printf 'RAILS_MIN_THREADS=4\n'
  printf 'RAILS_MAX_THREADS=16\n'
  printf 'IMAP_ENABLED=false\n'
} > "$ENV_FILE"

chmod 600 "$ENV_FILE"
echo "Created $ENV_FILE with mode 600. Keep it private and back it up securely."
