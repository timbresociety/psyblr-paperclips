# SoloUnicorn engineering contract

**Stack:** existing React/TypeScript application, HTML Canvas for tactile gameplay and DOM for legible controls/Finance/accessibility. Responsive installable PWA for desktop, mobile portrait/landscape and tablet. Preserve the existing build and hosting integration unless the owner requests a change.

## Architecture

The economic engine is headless, deterministic and versioned. Presentation emits semantic actions and renders resolved snapshots. Economic logic never lives in click handlers, CSS, animation callbacks, asset scripts, generated copy, `requestAnimationFrame` counts, viewport dimensions, network responses or `Date.now()`.

The active source of truth is:

- `engine/candidate_profile.json` for candidate constants;
- `engine/metric_registry.json` for metric definitions and formulas;
- `engine/state_schema.json` for typed state/entity inputs;
- `engine/event_contract.json` for transitions and ordered phases;
- `engine/kernel.py` for reference calculations and financial/work invariants.

The Python kernel is a reference and test oracle, not a requirement to use Python in the shipped client. A TypeScript implementation must match its fixtures or increment the engine version with a deliberate numerical change.

## State model

Persist explicit run state, founder history, accounts/cohorts, origin lineage, function ranks, online units, agents/policies, queues, fractional work credits, rework, context rot, strain backlog, defects, incidents, invoices, bills, cash, debt, equity, VC mandates, pending offers, milestones, seed and event cursor. Derived metrics are recomputed from this state.

Every mutable field has a declared writer, unit, bounds and update phase. Every economic event has a stable ID and one resolver. Duplicate events are idempotent or rejected. Cohort splitting happens before a partial price, health, addon, churn or defect change; origin-account IDs remain stable after a split.

Do not restore a rendered abbreviation, valuation, ARR multiple or formatted cash string as authoritative state. Save integer cents and integer ticks. Carry fractional service, interest and work remainders. Use safe integer/bigint arithmetic for long post-unicorn runs.

## Clock and ordered phases

Candidate timing is 10 ticks/second, 600 ticks/month and 1,800 ticks/quarter. Simulation advances while active work, metric inspection, Finance, skill trees, agent routing and post-quarter choices are open. A deliberate explicit pause/settings/background can freeze the clock. Shop/Finance surfaces do not freeze it automatically. There is no offline earnings or hidden catch-up debt in this baseline.

Apply phases in `engine/event_contract.json`:

1. accrue service revenue, costs, ageing and queued time using prior state;
2. process external market refreshes, collection attempts and committed receipts;
3. snapshot six function rates and reserve finite eligible inputs;
4. resolve sampled work and commit actual output, failures, rework and downstream jobs;
5. update health, threats, strain, rot, incidents and expiries;
6. invoice earned service and generate operating/debt obligations;
7. settle mandatory obligations by `(due_tick, stable_id)` and check accepted VC mandate;
8. aggregate ARR bridge, cash forecast, valuation and milestone;
9. accept optional purchases, routing, financing and post-quarter decisions with effects beginning no earlier than the next allowed boundary;
10. publish one immutable snapshot with profile/content/schema versions and replay hash.

Work from one function becomes eligible to a downstream function at `t+1`; a loop cannot create free same-tick chains. At equal timestamps, only declared receipt-before-bill priority applies. A later receipt cannot rescue an earlier missed bill. A due cash failure is settled before a $1B award.

## Actions, input and accessibility

Normalize touch, mouse, trackpad, keyboard and accessible controls into semantic actions with an action ID, payload, simulation tick and sequence number. Use pointer capture for drags and handle `pointercancel`, lost capture, resize, orientation changes and backgrounding without completing or double-booking a gesture. No core rule may depend on hover, right-click, multi-touch, device DPI or frame rate.

The six tactile baselines are Demand swipe/triage, Product semantic assembly, Monetisation price-fit timing, Retention aim/prioritise, Expansion merge/package and Operations scratch/reveal/diagnose. Finance uses clear selection and confirmation, never a compulsory reflex timer. Accessible alternatives use the same resolver and declared timing accommodation, not a hidden higher-output path.

## Saves and replay

Include engine, schema, balance, content and UI versions; seed; RNG state or resolved outcomes; state; financial schedules; pending events/offers; action cursor; settlement ID; transaction IDs; founder history and run milestones. Save atomically with a last-known-good checkpoint. Reload, resize, reduced-motion mode, panel opening and app backgrounding cannot reroll work or repeat purchases/rewards.

If a save cannot be migrated, preserve a backup and give an explicit compatibility/recovery path. Never silently rebalance a running save or start a fresh run while presenting it as a resume. A service-worker update activates at a safe boundary.

## RNG and deterministic economy

Use counter-based versioned seeded streams. The reference resolver hashes compact JSON `[str(seed), str(stream), str(event_id)]`, uses the top 53 bits to produce a stable `[0,1)` uniform value and keeps technical, domain, local-Luck, shared-Luck, churn and collection streams distinct. Persist stable attempt sequence IDs. Tooltips and narrative reads never consume economic randomness. A model-generated sentence cannot alter an effect ID, probability, target, debt term, reward or state.

Expected rates are diagnostics. Real work samples finite attempts and eligible inputs, carries fractional output credit and commits actual results exactly once. A failed technical attempt costs its work resource and adds rework; rework consumes capacity but does not award production again.

## Finance and failure boundaries

Optional purchases require sufficient cash and are rejected/throttled without bankrupting the run. Mandatory accrued bills, interest and principal payments are different. At their due timestamp, settle valid earlier receipts and pay in stable order. If cash cannot cover the first mandatory bill, mark the run failed and stop normal actions. Cash may be zero when nothing is due.

Debt proceeds increase cash and principal only. Equity proceeds increase cash, reduce founder ownership and activate the accepted mandate only. Neither creates ARR. Service, invoice, collection, refund, writeoff, interest and principal events each appear once in the ledger and window aggregates.

## Responsive PWA

Recompose mobile portrait around the active work object with thumb-reachable controls and a compact edge/rail for queues and alerts. Desktop uses width for awareness without turning every function into an equal dashboard tile. Support mobile landscape, tablet, installed desktop resizing, safe areas and browser zoom.

Use the QA matrix 320×568, 390×844, 844×390, 768×1024 and 1440×900. These are visual QA fixtures, not economic breakpoints. Include manifest, scoped service worker, offline authored play after initial load, installation guidance where supported and atomic update recovery.

## Accessibility, audio, motion and performance

Use semantic labels, focus states, readable tabular numbers, non-color equivalents, reduced-motion mode, independent music/SFX/intensity controls and haptic fallbacks. Reduced motion changes presentation only. Coalesce repeated alerts, particles and sounds; unresolved state remains visible.

Target smooth manipulation and measure actual frame-time percentiles on representative devices. Do not reduce economic work, agent throughput or event probability on slower devices as a hidden performance fix. Keep simulation frequency separate from render frequency and bound queues/listeners/effects.

## Verification

Before calling an engine milestone complete, run `python3 engine/verify.py` and relevant repository tests. Required integration cases include first customer through payment, pending churn save/reload, duplicate purchase, pointer cancellation, resize/background during work, exact quarter boundary, simultaneous collection and bill, cash failure before milestone, debt settlement, VC target failure, save after settlement, and successful founder relic persistence. Capture gesture and responsive evidence where screenshots cannot prove feel.

The master package's checks establish arithmetic and structural contracts. They do not establish fun, comprehension, player fairness, full-run balance or owner acceptance.
