#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

image_name="${1:-openproject-custom}"
tag="${2:-18.0.0-custom.1}"
image="$image_name:$tag"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker Engine with the Buildx plugin is required." >&2
  exit 1
fi

docker info >/dev/null
docker buildx version >/dev/null

# Optional: PLATFORM=linux/arm64 $0 ... (only one platform can be loaded locally)
platform_args=()
if [[ -n "${PLATFORM:-}" ]]; then
  platform_args=(--platform "$PLATFORM")
fi

cd "$REPOSITORY_ROOT"
docker buildx build \
  --file docker/prod/Dockerfile \
  --target slim \
  --pull \
  --load \
  "${platform_args[@]}" \
  --tag "$image" \
  .

printf '\nBuilt image: %s\n' "$image"
printf 'Use in .env: OPENPROJECT_IMAGE=%s\n' "$image"