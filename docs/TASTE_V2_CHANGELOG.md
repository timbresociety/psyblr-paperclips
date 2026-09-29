# Taste / interaction / game-sense update

This update changes the agent handoff, not the product mechanics.

Added:

- `context/TASTE_AND_GAME_SENSE.md` — MACHINE + SKY visual judgment, restraint, object/icon taste, interaction grammar, founder-attention pressure, anticipation-before-punishment, roguelike/build heuristics, business-simulation truth, mobile composition, anti-patterns and reference lenses.
- `context/DISCOVERY_PROTOCOL.md` — exploratory prompts remain read-only until there is an explicit execution request / approved build contract.
- `context/REVIEW_RUBRIC.md` — running-product evaluation with hard failure dimensions.
- `tasks/BUILD_CONTRACT_TEMPLATE.md` — bounded handoff from product discovery to code.
- `tasks/R01_TASTE_GAMEPLAY_REVIEW.md` — independent read-only critic after integration.

Updated:

- root `AGENTS.md` read order and discovery/execution boundary;
- S01/S02/S03/I01 acceptance gates to include running-product taste review;
- orchestration to add one independent review pass rather than multiplying builder agents;
- context validator to require the new compact judgment layer.

The archived exhaustive context is still excluded from the normal read path.

## 2026-09-27 — Taste rework: MACHINE flip, HQ scene, generated 2.5D assets

- MACHINE-plane graphite token system replaces the light theme; tier theme layers (`data-theme`) climb charcoal → gunmetal → gold → liquid glass → Ethereal per ASSET_CATALOG §2.
- New isometric Company HQ scene (default view): tier backdrops, per-function desks with generated contextual objects, founder sprite at the active desk, agent drones on automated desks, live queue badges; one authored tier-up beat per ascension.
- Demand triage is now a resisted swipe (pointer-captured, commit thresholds, intent stamps, up-swipe Hyper 2×) — accessible buttons unchanged underneath.
- Image-gen asset pipeline (`scripts/asset_pipeline/`): catalog → prompt → ChatGPT share link → local headless pull → verified intake. 10 hero assets generated and installed this pass; remaining families tracked in `asset_requests/pending/`.
- SFX mute persists; global reduced-motion guard; residual light-surface leaks fixed across modals/rooms.
