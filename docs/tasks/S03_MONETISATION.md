# S03 — Monetisation price-fit interaction

**Preferred model:** GPT-5.6 Sol, medium
**Write paths:** `src/features/monetisation/**` only. Create local CSS/assets inside this folder.
**Read:** `AGENTS.md`, `context/PRODUCT.md`, `context/VISUAL_BRAND.md`, `context/INTERACTIONS.md`, `context/TASTE_AND_GAME_SENSE.md`, `context/REVIEW_RUBRIC.md`.
**Do not edit:** contracts, reducer, global shell, other rooms.

## Hypothesis

Timing can work for pricing if the visual model clearly represents a customer's willingness-to-pay rather than random jackpot timing.

## Build

Improve the existing price-fit track using the same `monetisation.commit` normalized 0..1 action. Make low price / fit / overpriced meanings obvious before the player acts. Commitment should feel precise and consequential. On success, preserve the explicit distinction: contract/ARR changes now; cash collection occurs later.

## Failure condition

Fail if a tester calls it a slot-machine bar, thinks higher/right is always better, or expects the ARR increase to immediately become cash.

## Acceptance

- commitment works by pointer and keyboard;
- band/cursor remain responsive across mobile/desktop;
- reduced-motion mode remains playable;
- success/miss feedback is causal, not celebratory noise;
- component does not calculate ARR or cash itself;
- `npm run check` passes.
- running-product review has no 0 in Causality, Decision, Interaction Legibility or Mobile Composition.

Do not build pricing models, cohorts or billing schedules in this task.
