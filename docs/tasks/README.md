# Execution waves

The root/integration agent owns shared contracts and merges. Workers own non-overlapping paths. Model names are recommendations based on current Codex guidance; use the closest available model if the client does not expose exact routing.

## Wave 0 — already present

The repository boots as a React/Vite PWA and contains a crude end-to-end teaching fixture:

```text
Demand → Product → Monetisation → ARR → delayed cash collection
```

Do not rebuild the scaffold. First run it and understand the seam.

## Wave 1 — parallel interaction proof

Start these simultaneously because they do not need to edit shared contracts:

| Task | Preferred model | Write ownership | Question it must answer |
|---|---|---|---|
| `S01_DEMAND.md` | GPT-5.6 Sol, medium | `src/features/demand/**` | Does qualifying a signal feel like a business triage decision rather than a card swipe toy? |
| `S02_PRODUCT.md` | GPT-5.6 Sol, medium/high | `src/features/product/**` | Can Product become tactile assembly with readable semantic fit? |
| `S03_MONETISATION.md` | GPT-5.6 Sol, medium | `src/features/monetisation/**` | Does price-fit timing communicate willingness-to-pay and ARR-vs-cash causality? |
| `S04_ENGINE_GOLDEN_LOOP.md` | GPT-6 Astra, high | `src/game/**` only | Can the starter fixture be represented by a deterministic headless engine without changing the player-facing action seam? |

Do not have four workers edit `src/contracts/game.ts`, `src/state/reducer.ts` or `src/styles.css` simultaneously.

## Wave 1 integration

After all workers return, run `I01_GOLDEN_LOOP_INTEGRATION.md` with GPT-6 Astra, high. It is the only owner allowed to alter shared contracts/reducer during integration. Reject work that requires semantic invention merely to merge it.

## Wave 2 — parallel system proof

Only after I01 passes:

| Task | Preferred model | Ownership |
|---|---|---|
| `S05_RETENTION.md` | GPT-5.6 Sol, medium/high | `src/features/retention/**` |
| `S06_EXPANSION.md` | GPT-5.6 Sol, medium/high | `src/features/expansion/**` |
| `S07_OPERATIONS.md` | GPT-6 Astra, high | `src/features/operations/**` plus task-approved engine adapter only |

The integration owner first publishes the exact action/state additions needed by these slices. Do not let three workers independently invent shared economics.

## Later, not now

Finance/debt/VC, agents, skill trees, relics, founder history, full content catalogs, leaderboards and broad balance simulation wait until the six-function causal loop is intelligible in play.

## Delegation instruction for the root agent

When collaboration/subagent tools are available, delegate independent task files concurrently because parallel execution can save time. Keep messages legible. The root agent remains accountable for integration, browser QA and rejection of incompatible worker assumptions.


## Review gate

After visible integration, run `R01_TASTE_GAMEPLAY_REVIEW.md` as an independent read-only critic. Builder agents should not self-certify taste.

Use `BUILD_CONTRACT_TEMPLATE.md` when a new visible/gameplay slice has been discussed but not yet made executable.
