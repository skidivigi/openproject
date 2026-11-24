#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Usage: ./build.sh [ghcr.io/user/image] [tag]
# Env:
#   GITHUB_USER   - GitHub login (used for docker login together with CR_PAT)
#   CR_PAT        - GitHub token with write:packages (optional if already logged in)
#   PUSH          - true (default) / false: skip push, build locally only
#   PUBLISH_LATEST- true / false (default): also tag and push :latest
#   PLATFORM      - e.g. linux/arm64 (default: host architecture)
#   SOURCE_REPO   - GitHub repo URL to link the package to

# если уже сделали docker login ghcr.io
# ./build.sh ghcr.io/mylogin/openproject-custom 18.0.0-custom.1

image_name="${1:-ghcr.io/your_login/openproject-custom}"
tag="${2:-18.0.0-custom.1}"
push="${PUSH:-true}"
source_repo="${SOURCE_REPO:-https://github.com/your_login/openproject}"

# GHCR requires lowercase names
image_name="$(echo "$image_name" | tr '[:upper:]' '[:lower:]')"
image="$image_name:$tag"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker Engine with the Buildx plugin is required." >&2
  exit 1
fi

docker info >/dev/null
docker buildx version >/dev/null

# Login to GHCR if credentials are provided
if [[ "$push" == "true" && -n "${CR_PAT:-}" ]]; then
  if [[ -z "${GITHUB_USER:-}" ]]; then
    echo "Set GITHUB_USER together with CR_PAT." >&2
    exit 1
  fi
  echo "$CR_PAT" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin
fi

platform_args=()
if [[ -n "${PLATFORM:-}" ]]; then
  platform_args=(--platform "$PLATFORM")
fi

tags=(--tag "$image")
if [[ "${PUBLISH_LATEST:-false}" == "true" ]]; then
  tags+=(--tag "$image_name:latest")
fi

cd "$REPOSITORY_ROOT"
docker buildx build \
  --file docker/prod/Dockerfile \
  --target slim \
  --pull \
  --load \
  --label "org.opencontainers.image.source=$source_repo" \
  ${platform_args[@]+"${platform_args[@]}"} \
  "${tags[@]}" \
  .

printf '\nBuilt image: %s\n' "$image"

# if [[ "$push" == "true" ]]; then
#   docker push "$image"
#   if [[ "${PUBLISH_LATEST:-false}" == "true" ]]; then
#     docker push "$image_name:latest"
#   fi
#   printf '\nPushed image: %s\n' "$image"
# else
#   echo "PUSH=false, skipping push."
# fi

printf 'Use in .env: OPENPROJECT_IMAGE=%s\n' "$image"