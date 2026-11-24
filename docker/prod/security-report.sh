#!/usr/bin/env bash
set -euo pipefail

image="${1:?Usage: $0 IMAGE [OUTPUT_DIR]}"
output_dir="${2:-security-reports}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required." >&2
  exit 1
fi

if ! command -v trivy >/dev/null 2>&1; then
  echo "Trivy is required." >&2
  exit 1
fi

docker image inspect "$image" >/dev/null
mkdir -p "$output_dir"

docker run --rm --entrypoint /bin/sh "$image" -c '
  cat /usr/share/openproject/security-packages.tsv
  printf "\nRuby gems\n"
  bundle exec ruby -e '\''require "bundler/setup"; %w[rails activestorage rack nokogiri json carrierwave image_processing mini_magick ruby-vips].each { |name| spec = Gem.loaded_specs[name]; puts "#{name}\t#{spec&.version || "not installed"}" }'\''
  printf "\nOpenSSL\n"
  openssl version -a
  printf "\nImageMagick\n"
  if command -v magick >/dev/null 2>&1; then magick -version; else convert -version; fi
  printf "\nlibvips\n"
  if command -v vips >/dev/null 2>&1; then vips --version; else echo "not installed in runtime image"; fi
  printf "\ncurl\n"
  if command -v curl >/dev/null 2>&1; then curl --version; else echo "not installed in runtime image"; fi
' > "$output_dir/runtime-components.txt"

trivy image \
  --scanners vuln \
  --list-all-pkgs \
  --format json \
  --output "$output_dir/vulnerabilities.json" \
  "$image"

trivy image \
  --scanners vuln \
  --format table \
  --output "$output_dir/vulnerabilities.txt" \
  "$image"

trivy image \
  --format cyclonedx \
  --output "$output_dir/sbom.cdx.json" \
  "$image"

printf 'Security report written to %s\n' "$output_dir"
