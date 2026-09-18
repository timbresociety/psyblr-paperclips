# R01 — Independent taste + gameplay review

**Preferred model:** GPT-6 Astra, high (or strongest available reasoning model).
**Write access:** none during review. Return findings to the integration owner.
**Read:** `AGENTS.md`, `context/PRODUCT.md`, `context/VISUAL_BRAND.md`, `context/INTERACTIONS.md`, `context/TASTE_AND_GAME_SENSE.md`, `context/REVIEW_RUBRIC.md`, and the approved slice contract(s).

## Purpose

Adversarially review the running first-customer loop. Do not reward implementation effort or architectural sophistication. Judge what the player sees, understands and decides.

## Procedure

1. Run from reset at desktop 1440×900.
2. Complete the full Demand → Product → Monetisation → ARR → collection loop.
3. Repeat at mobile portrait 390×844.
4. Trigger any failure/miss state that exists in the implemented scope.
5. Score the rubric in `context/REVIEW_RUBRIC.md`.
6. Identify at most five findings, ordered by player impact.

For each finding provide:

```text
OBSERVATION
WHY IT MATTERS
EVIDENCE FROM RUNNING PRODUCT
CHEAPEST FIX
FAILURE CONDITION AFTER FIX
```

## Guardrails

- Do not redesign the entire product.
- Do not propose later systems as a fix for a weak current interaction.
- Do not ask for more visual polish when the actual problem is causality or decision quality.
- Do not expand the context pack.
- Prefer deletion/simplification over adding UI when both solve the problem.
- A generic-but-pretty result is a failure.
