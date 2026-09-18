#!/usr/bin/env bash
set -euo pipefail
for f in AGENTS.md context/PRODUCT.md context/VISUAL_BRAND.md context/INTERACTIONS.md context/TASTE_AND_GAME_SENSE.md context/DISCOVERY_PROTOCOL.md context/REVIEW_RUBRIC.md context/TASTE_AND_GAME_SENSE.md context/DISCOVERY_PROTOCOL.md context/REVIEW_RUBRIC.md tasks/README.md; do
  test -s "$f" || { echo "missing $f"; exit 1; }
done
if grep -R "context/archive" AGENTS.md context/PRODUCT.md context/VISUAL_BRAND.md context/INTERACTIONS.md context/TASTE_AND_GAME_SENSE.md context/DISCOVERY_PROTOCOL.md context/REVIEW_RUBRIC.md >/dev/null; then
  echo "archive is referenced only as optional source material; do not add it to required read order"
fi
echo "context surface OK"
