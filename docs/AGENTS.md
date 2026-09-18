# SoloUnicorn executable starter — agent entrypoint

This repository is intentionally designed for execution, not exhaustive context loading.

## Required read order

Before changing code, read only:
1. `AGENTS.md`
2. `context/PRODUCT.md`
3. `context/VISUAL_BRAND.md` for visible work
4. `context/INTERACTIONS.md` for gameplay work
5. `context/TASTE_AND_GAME_SENSE.md` for visible/gameplay judgment
6. `context/DISCOVERY_PROTOCOL.md` when the user is exploring rather than explicitly implementing
7. the one task file you own under `tasks/`

Do **not** read `context/archive/master-context-v1/` unless the assigned task explicitly names a file in it. The archive preserves source detail; it is not the default prompt surface.

## Product truth

- Goal: reach the first valid $1B company valuation as fast as possible.
- ARR is the operating base. Cash is the spendable currency. ARR is not cash.
- Six manual operating functions: Demand, Product, Monetisation, Retention, Expansion, Operations.
- Finance is a management surface, not a seventh reflex minigame.
- The company runs continuously while the founder chooses where to spend attention.
- Growth-or-failure becomes binding only after accepting a VC mandate.
- Progression experience: Manual → Assisted → Swarm → Executive → Autonomous.
- Automation must create leverage and later coordination/Operations pressure; it is not free passive income.
- Valuation is the score. Balance values in this starter are explicit fixtures, not approved production balance.

## Discovery vs execution

Do not treat brainstorming as an implementation request. Follow `context/DISCOVERY_PROTOCOL.md` whenever the user is exploring, critiquing, comparing, clarifying or deciding a consequential direction.

Discussion creates hypotheses. Explicit approval creates a build contract. An explicit implementation request creates code.

## Execution rule

The approved current task/build contract owns the immediate outcome. Do not broaden scope because another system is described in product context.

For any visible task:
- apply `context/TASTE_AND_GAME_SENSE.md` as judgment guidance, not as a styling checklist;
- run the app;
- exercise the real pointer/keyboard interaction;
- inspect desktop and mobile portrait;
- repair obvious hierarchy, overflow and interaction failures;
- review the running artifact against `context/REVIEW_RUBRIC.md`;
- report evidence, not just a green build.

For coupled/shared code, one integration owner makes the change. Parallel workers must have non-overlapping write paths.

If work can be parallelized safely using collaboration tools, delegate it. Do not create agents merely because there are six work functions. Shared contracts, reducer semantics and integration remain single-owner.

## Frozen seams for parallel work

Until an integration task explicitly changes them, treat these as frozen:
- `src/contracts/game.ts`
- semantic action names and payload meanings
- `CompanyState` field meanings
- `src/state/reducer.ts`

Feature workers may create local presentation state, CSS and assets inside their owned feature folders. They may not hide economic state inside components.

## Completion

Run:

```bash
npm run check
```

Then perform the task-specific browser acceptance checks. Do not write planning documents instead of implementing the requested behavior.
