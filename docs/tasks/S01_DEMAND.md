# S01 — Demand interaction proof

**Preferred model:** GPT-5.6 Sol, medium
**Write paths:** `src/features/demand/**` only. Create local CSS/assets inside this folder.
**Read:** `AGENTS.md`, `context/PRODUCT.md`, `context/VISUAL_BRAND.md`, `context/INTERACTIONS.md`, `context/TASTE_AND_GAME_SENSE.md`, `context/REVIEW_RUBRIC.md`.
**Do not edit:** contracts, reducer, global shell, other rooms.

## Hypothesis

A resisted swipe can make qualification feel like spending scarce founder attention/cash if the signal's evidence and cost are readable before commitment.

## Build

Replace the crude signal card with a polished, pointer-native interaction using the existing `demand.triage` action. Preserve keyboard/buttons as accessible equivalents. Show signal evidence, segment, acquisition cost and clear left/right consequence. Use motion/resistance to communicate commitment, not decorative card physics.

## Failure condition

Fail the slice if a tester describes it as “Tinder for leads,” cannot predict which direction qualifies, or does not notice that qualification spends cash and creates Product work.

## Acceptance

- real drag works with mouse/touch/pointer cancellation;
- keyboard/buttons produce the same semantic action;
- no economic state is stored in the component;
- no routine modal;
- usable at 390×844 and 1440×900;
- action consequence is readable within ~1 second;
- `npm run check` passes.
- running-product review has no 0 in Causality, Decision, Interaction Legibility or Mobile Composition.

Return changed paths, browser evidence and unresolved UX problems. Do not expand the signal economy in this task.
