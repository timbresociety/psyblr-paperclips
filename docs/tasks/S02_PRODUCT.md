# S02 — Product tactile assembly

**Preferred model:** GPT-5.6 Sol, medium/high
**Write paths:** `src/features/product/**` only. Create local CSS/assets inside this folder.
**Read:** `AGENTS.md`, `context/PRODUCT.md`, `context/VISUAL_BRAND.md`, `context/INTERACTIONS.md`, `context/TASTE_AND_GAME_SENSE.md`, `context/REVIEW_RUBRIC.md`.
**Do not edit:** contracts, reducer, global shell, other rooms.

## Hypothesis

The Product step becomes understandable and satisfying when the player physically assembles three meaningful components into semantic slots, verifies them, and sees the build transfer into activation.

## Build

Replace the starter `<select>` controls with an original tactile one-pointer assembly interaction. Use the existing `product.place`, `product.verify`, and `product.ship` actions. The component identities and slot meanings must remain legible. Implement snap/fit feedback, a visible verification state and a decisive ship transition. Pointer coordinates remain local presentation state.

## Failure condition

Fail if the interaction could be relabeled as a generic inventory puzzle, if a player cannot explain why a component belongs in a slot, or if verification is just an unexplained green glow.

## Acceptance

- click/tap and drag both work where practical;
- semantic slot/component IDs are emitted, never pixels;
- assembly fits on 390×844 without miniature targets;
- desktop center remains visually dominant;
- verification failure explains the missing/duplicate condition;
- ship is impossible before verification;
- `npm run check` passes.
- running-product review has no 0 in Causality, Decision, Interaction Legibility or Mobile Composition.

Do not invent defects, skill trees or a full recipe system yet.
