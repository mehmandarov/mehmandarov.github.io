#!/usr/bin/env bash
#
# refresh-world-borders.sh
# ------------------------
# Re-fetch country borders used by the "places I've been" map on /talks/
# and produce three resolution tiers for web delivery.
#
# Source:
#   geoBoundaries CGAZ ADM0 (Composite Global Administrative Zones, level 0)
#   https://www.geoboundaries.org/
#   License: CC-BY 4.0
#   Cite:   Runfola, D. et al. (2020) "geoBoundaries: A global database of
#           political administrative boundaries." PLoS ONE.
#
# Why geoBoundaries (vs. Natural Earth which we used before): geoBoundaries
# is actively maintained on a quarterly cadence, sources its boundaries from
# the most authoritative provider per country, and is the de-facto modern
# academic baseline. Natural Earth is great but releases slowly (last point
# release 2022, mostly cosmetic).
#
# Output (overwrites in place):
#   assets/data/world-110m.geo.json   - always loaded     (~70-150 KB)
#   assets/data/world-50m.geo.json    - loaded at zoom 4+ (~500 KB-1 MB)
#   assets/data/world-10m.geo.json    - loaded at zoom 7+ (~3-6 MB)
#
# Run from the repo root:
#   ./scripts/refresh-world-borders.sh
#
# Requires: bash, curl, python3, node + npx (mapshaper is fetched on demand).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/assets/data"
TMP_DIR="$(mktemp -d -t world-borders-XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

CGAZ_URL="https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM0.geojson"

mkdir -p "$OUT_DIR"

echo "==> Downloading geoBoundaries CGAZ ADM0 (~380 MB, cached across runs)"
# Cache the raw download in a stable per-user temp location so iterating on
# simplification params doesn't re-fetch 380 MB. Delete to force a refresh.
CACHE_DIR="${TMPDIR:-/tmp}/refresh-world-borders-cache"
mkdir -p "$CACHE_DIR"
RAW="$CACHE_DIR/cgaz-adm0.geojson"
if [[ -s "$RAW" ]]; then
    echo "    using cached $RAW"
else
    curl --fail --silent --show-error --location -o "$RAW" "$CGAZ_URL"
fi
echo "    raw size: $(du -h "$RAW" | cut -f1)"

# Three tiers: (name, simplification %, coord precision in degrees).
#   - weighted    = weighted Visvalingam (preserves convex corners)
#   - keep-shapes = never let a polygon collapse to nothing (small islands)
#   - precision   = grid snap, in degrees. 0.05 ~= 5km, 0.01 ~= 1km, etc.
#                   geoBoundaries CGAZ is *very* high-resolution (raw ~380 MB),
#                   so we need aggressive both-axes reduction.
TIERS=(
    "110m:0.2:0.1"
    "50m:1.5:0.02"
    "10m:7:0.005"
)

echo "==> Simplifying with mapshaper (topology-preserving)"
for spec in "${TIERS[@]}"; do
    IFS=':' read -r name pct prec <<< "$spec"
    out_simplified="$TMP_DIR/world-${name}.simplified.geo.json"
    echo "    tier ${name}: -simplify ${pct}% precision ${prec}"
    npx --yes mapshaper@latest "$RAW" \
        -simplify "${pct}%" weighted keep-shapes \
        -o force precision="${prec}" "$out_simplified" \
        > /dev/null
done

echo "==> Rewriting properties (shapeGroup -> ISO_A3 -> ISO_A2, drop the rest)"
python3 "$REPO_ROOT/scripts/_rewrite-geoboundaries-props.py" "$TMP_DIR" "$OUT_DIR"

echo "==> Done."
echo ""
echo "Next:"
echo "  - inspect a diff with: git diff --stat $OUT_DIR"
echo "  - eyeball the map at /talks/ in the dev server"
echo "  - commit the three world-*.geo.json files if borders changed"

