# S04 — Deterministic golden-loop engine

**Preferred model:** GPT-6 Astra, high
**Write paths:** `src/game/**` only.
**Read first:** `AGENTS.md`, `context/PRODUCT.md`, `context/ARCHITECTURE.md`, `src/contracts/game.ts`, `src/state/fixture.ts`, `src/state/reducer.ts`.
**Then, only if needed:** archived `engine/METRICS.md`, `engine/IMPLEMENTATION.md`, `BALANCE.md`.

## Hypothesis

We can replace the teaching reducer with a deterministic headless implementation without forcing interaction workers to know the full accounting model.

## Build

Create a pure TypeScript engine behind an adapter-compatible boundary. Implement only the starter golden loop: time, one Demand opportunity, acquisition cash spend, Product activation, pricing contract, contractual/eligible ARR and a later collection. Use fixture values explicitly. No React/DOM/browser globals in `src/game/**`.

Do not port the entire archived metric registry. Import only concepts needed for this loop.

## Required properties

- same starting state + action sequence => same result;
- no `Math.random()`;
- pointer/layout values never enter engine state;
- ARR and cash are separate;
- collection cannot occur before due time;
- invalid/repeated actions are deterministic no-ops or typed rejections;
- provide focused tests inside `src/game/**` or a task-local test path if the existing toolchain supports them.

## Failure condition

Fail if implementing the first customer requires broad relic/agent/VC/skill-tree abstractions, or if the engine exposes UI concepts.

Do not edit the starter reducer. Integration is I01's job.
