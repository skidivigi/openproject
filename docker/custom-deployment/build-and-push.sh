#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

repository="${1:-}"
tag="${2:-18.0.0-custom.1}"
platforms="${PLATFORMS:-linux/amd64}"
builder="${BUILDX_BUILDER:-openproject-custom-builder}"

if [[ -z "$repository" ]]; then
  echo "Usage: $0 <dockerhub-user/repository> [tag]" >&2
  echo "Optional: PLATFORMS=linux/amd64,linux/arm64 PUBLISH_LATEST=true $0 ..." >&2
  exit 1
fi

if [[ "$repository" != */* ]]; then
  echo "Repository must include the Docker Hub namespace, for example: user/openproject-custom" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker Engine with the Compose and Buildx plugins is required." >&2
  exit 1
fi

docker info >/dev/null
docker buildx version >/dev/null

if ! docker buildx inspect "$builder" >/dev/null 2>&1; then
  docker buildx create --name "$builder" --driver docker-container --use
else
  docker buildx use "$builder"
fi

docker buildx inspect --bootstrap >/dev/null

image="$repository:$tag"
if [[ "$repository" != *.*/* && "$repository" != localhost/* ]]; then
  image="docker.io/$image"
fi

tags=(--tag "$image")
if [[ "${PUBLISH_LATEST:-false}" == "true" ]]; then
  latest_repository="${image%:*}"
  tags+=(--tag "$latest_repository:latest")
fi

cd "$REPOSITORY_ROOT"
docker buildx build \
  --file docker/prod/Dockerfile \
  --target slim \
  --platform "$platforms" \
  --pull \
  --provenance=true \
  --sbom=true \
  "${tags[@]}" \
  # --push \
  .

printf '\nPublished image: %s\n' "$image"
printf 'Use in .env: OPENPROJECT_IMAGE=%s\n' "$image"
