#!/bin/sh
# Builds the specs wiki: the current checkout as "latest", plus one frozen
# snapshot per release tag whose tree already contains specs/.
#
# Env (all optional):
#   WIKI_BASE     site base path            (default /            CI: /illo3d/specs/)
#   WIKI_OUT_DIR  output directory          (default wiki/.vitepress/dist  CI: dist/specs)
#   WIKI_ORIGIN   origin for version links  (default http://localhost:5176)
set -eu
cd "$(dirname "$0")/.."

# The app container runs as root while /app belongs to the host user; git
# refuses such repos (tag listing, archive, last-updated dates) until the
# path is marked safe. No-op wherever git already works, e.g. in CI.
git rev-parse --git-dir >/dev/null 2>&1 || git config --global --add safe.directory "$(pwd)"

BASE="${WIKI_BASE:-/}"
OUT="${WIKI_OUT_DIR:-wiki/.vitepress/dist}"
ORIGIN="${WIKI_ORIGIN:-http://localhost:5176}"
case "$OUT" in /*) ;; *) OUT="$(pwd)/$OUT" ;; esac
rm -rf "$OUT"

tags=""
for tag in $(git tag --list 'v*' --sort=-v:refname); do
  if git rev-parse -q --verify "$tag:specs" >/dev/null 2>&1; then
    tags="$tags $tag"
  fi
done

versions="[{\"text\":\"latest\",\"link\":\"$ORIGIN$BASE\"}"
for tag in $tags; do
  versions="$versions,{\"text\":\"$tag\",\"link\":\"$ORIGIN$BASE$tag/\"}"
done
versions="$versions]"

echo "==> specs wiki: building latest"
WIKI_BASE="$BASE" WIKI_OUT_DIR="$OUT" \
  WIKI_VERSIONS="$versions" WIKI_VERSION_LABEL="latest" \
  pnpm exec vitepress build wiki

# Snapshot sources must live inside the project tree, or Vite cannot resolve
# the wiki's own modules (node_modules lookup walks up from srcDir).
snapdir="$(pwd)/wiki/.snapshots"
trap 'rm -rf "$snapdir"' EXIT
for tag in $tags; do
  echo "==> specs wiki: building snapshot $tag"
  rm -rf "$snapdir/$tag"
  mkdir -p "$snapdir/$tag"
  git archive "$tag" specs | tar -x -C "$snapdir/$tag"
  SPECS_DIR="$snapdir/$tag/specs" WIKI_GIT_REF="$tag" \
    WIKI_BASE="$BASE$tag/" WIKI_OUT_DIR="$OUT/$tag" WIKI_CACHE_DIR="$snapdir/$tag/cache" \
    WIKI_VERSIONS="$versions" WIKI_VERSION_LABEL="$tag" \
    pnpm exec vitepress build wiki
  rm -rf "$snapdir/$tag"
done

echo "==> specs wiki built at $OUT"
