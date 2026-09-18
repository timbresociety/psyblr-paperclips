# SoloUnicorn executable starter

This is the original master context converted into an execution-first greenfield repository.

## Run

```bash
npm install
npm run dev
```

Production check:

```bash
npm run check
```

The starter already implements a deliberately crude but complete teaching fixture:

```text
Demand → Product → Monetisation → signed ARR → delayed cash collection
```

The point is not that this is the final game. The point is that every later agent starts from running software and improves a bounded observable slice.

## Give Codex this prompt

```text
Read AGENTS.md and tasks/ORCHESTRATE.md. Run the starter first. Execute Wave 1 using parallel subagents only where file ownership is non-overlapping. Integrate with I01. Do not load context/archive unless a task explicitly requires it. Stop after the first-customer loop passes browser acceptance and report evidence.
```

## Context layout

- `context/PRODUCT.md` — small stable product truth
- `context/VISUAL_BRAND.md` — composition, palette, references, motion
- `context/INTERACTIONS.md` — exact meaning of each work-function verb
- `context/ARCHITECTURE.md` — current execution seams
- `context/archive/master-context-v1/` — original exhaustive package, lookup only
- `tasks/` — bounded falsifiable work packets and integration gates

## Why this differs from the old pack

The old pack was excellent at describing the eventual system but poor as a greenfield executable handoff. This repo intentionally makes the next observable artifact higher resolution than the eventual ontology.

## Agent judgment layer

The default context now includes:

- `context/TASTE_AND_GAME_SENSE.md` — visual, interaction and game-design judgment;
- `context/DISCOVERY_PROTOCOL.md` — prevents exploratory prompts from becoming implementation;
- `context/REVIEW_RUBRIC.md` — evaluates the running artifact rather than code sophistication;
- `tasks/BUILD_CONTRACT_TEMPLATE.md` — converts approved discovery into a bounded execution unit;
- `tasks/R01_TASTE_GAMEPLAY_REVIEW.md` — independent read-only taste/gameplay critic after integration.

These files are deliberately compact. The archived master context remains lookup material, not required reading.
