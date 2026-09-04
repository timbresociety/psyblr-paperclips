# AGENTS.md
## Canonical Build Guide for Coding Agents

This file tells coding agents how to implement the product defined in `product_final.md`.

`product_final.md` is the product truth.

If this file conflicts with `product_final.md`, stop and follow `product_final.md`. Do not silently reinterpret product rules.

---

# 1. Change protocol

Only the user's latest explicit prompt authorizes product changes.

For every task:

1. Read `product_final.md` sections relevant to the change.
2. Read this file.
3. Read `README.md` engineering rules.
4. Inspect the existing implementation before editing.
5. Preserve working design language and progressive onboarding unless the prompt explicitly changes them.
6. Implement the smallest coherent change.
7. Add or update deterministic tests.
8. Run validation.
9. Do not commit or push unless explicitly requested.

Do not update `product_final.md` unless the user explicitly asks to change canonical product rules.

If implementation reveals a product contradiction, report it and suggest a canonical change. Do not invent a resolution in code.

---

# 2. Architecture rule

The simulation must not depend on rendering.

Required conceptual layers:

```text
DETERMINISTIC SIMULATION CORE
        |
        +-- CONTENT DEFINITIONS
        |
        +-- ACTION COMMANDS
        |
        +-- EVENT LOG
        |
        +-- STATE SNAPSHOTS
        |
        v
REACT / UI SHELL
        |
        +-- CANVAS ROOM PRESENTATIONS
        +-- HUD
        +-- INTERMISSIONS
        +-- HOLDING COMPANY
        +-- AUDIO / VFX
```

Canvas animation may interpolate state but may never own economic truth.

A missed animation frame must not change ARR.

---

# 3. Determinism

All gameplay economics must be deterministic for a given:

```text
seed
+ initial state
+ ordered player action log
```

Never use `Math.random()` inside economic simulation code.

Use a seeded PRNG service.

Every random draw should be tagged with a stable stream or domain when practical:

```text
market_opportunities
situations
upgrade_shop
agent_choices
account_needs
incident_causes
```

Rendering-only randomness may use a separate visual RNG and must not alter simulation state.

---

# 4. Money and precision

Never store canonical money in floating-point dollars.

Use integer cents.

Recommended TypeScript representation:

```ts
type MoneyCents = bigint;
```

If the current stack cannot serialize BigInt directly, build an explicit codec. Do not fall back to unbounded float arithmetic.

Percentages, ownership, reliability, and probabilities should use basis points or fixed integer scales.

Examples:

```text
100.00% = 10,000 bps
72.00%  = 7,200 bps
0.25 GU = 250 milli-GU
```

---

# 5. Canonical tick order

The exact implementation may use smaller simulation ticks, but economic resolution order must remain stable.

Recommended tick order:

1. Read queued player commands.
2. Resolve room interactions.
3. Resolve automated agent actions.
4. Move generated work between queues.
5. Resolve Retention threat movement and damage.
6. Resolve Operations incident timers and leaks.
7. Resolve expiring opportunities.
8. Resolve situation timers.
9. Resolve monthly close if boundary crossed.
10. Recompute derived state.
11. Append economic event log entries.
12. Emit render snapshot.

Quarter close occurs after the 150-second economic tick completes.

At quarter close:

1. Freeze room actions.
2. Calculate ARR bridge.
3. Assert ARR invariant.
4. Calculate quarterly growth.
5. Determine new valuation multiple.
6. Recalculate valuation.
7. Resolve Growth Commitment.
8. Record quarter result.
9. Enter upgrade / capital intermission.

---

# 6. Required invariants

These must be executable assertions in development and automated tests.

## ARR

```text
ending ARR
=
starting ARR
+ new customer ARR
+ expansion ARR
- churned ARR
```

`new ARR` is a reporting subtotal only:

```text
new ARR
=
new customer ARR
+ expansion ARR
```

Never add both `newARR` and `expansionARR` to ending ARR.

## Valuation

```text
valuation
=
ARR x locked valuation multiple
```

During a quarter the multiple is the previous quarter's locked multiple.

At quarter close the multiple changes only after quarterly growth is calculated.

## Founder stake

```text
founder stake value
=
founder ownership x valuation
```

## Operations

Operations cost changes Cash, not ARR.

## Financing

Raising financing:

```text
cash increases
ownership can decrease
ARR unchanged
valuation unchanged
```

## Debt

Drawing debt:

```text
cash increases
debt increases
ARR unchanged
valuation unchanged
ownership unchanged
```

---

# 7. Room implementation contract

Every room implementation must expose the same interface shape conceptually:

```ts
interface RoomEngine {
  getIncomingWork(state: CompanyState): WorkItem[];
  getManualActions(state: CompanyState): ActionDefinition[];
  resolveManualAction(command: PlayerCommand, state: CompanyState): ActionResolution;
  resolveAgentAction(agent: AgentInstance, state: CompanyState, rng: SeededRng): ActionResolution | null;
  update(dtMs: number, state: CompanyState): RoomTickResult;
}
```

Do not hard-code ARR mutation inside canvas components.

Canvas components emit commands such as:

```text
MARKETING_SWIPE_RIGHT
PRODUCT_MERGE
MONETIZATION_TAP
RETENTION_AIM
EXPANSION_DROP_MODULE
OPS_SCRATCH
OPS_DIAGNOSE
```

The simulation core returns the result.

---

# 8. Marketing implementation

Canonical card scoring:

```text
Q = relevance + audienceFit + trendVelocity - saturation - channelCost
```

All five properties are integers 0..2.

Base optimal actions:

```text
Q <= 0       LEFT
Q 1..3       RIGHT
Q >= 4       UP
```

RIGHT is permitted as a safe non-optimal action at Q >=4 but receives only the RIGHT output.

Marketing card generation must be seedable.

No live web request may determine card economic values during a run.

If live-cultural personalization exists, map it onto a pre-balanced opportunity archetype first.

---

# 9. Product implementation

Product request state machine:

```text
REQUEST
  -> IMPLEMENTATION
  -> VERIFIED
  -> SHIPPED
```

Valid recipes:

```text
PROMPT + DIFF -> IMPLEMENTATION
IMPLEMENTATION + TEST -> VERIFIED
VERIFIED + DEPLOY -> SHIPPED
```

Early deploy is an explicit command and deterministic consequence.

Never roll a hidden random bug when the player uses verified ship. Situations may still create unrelated bugs.

---

# 10. Monetization implementation

Pricing outcomes are deterministic from cursor position and opportunity band.

Do not use fuzzy pixel comparisons in economics.

Convert screen input to normalized fixed-point position first:

```text
0..10,000
```

Then compare to band boundaries.

Rendering may animate continuously. Economic position is sampled when the TAP command is recorded.

---

# 11. Retention implementation

Threat movement and damage are simulation-owned.

The canvas displays authoritative threat positions from simulation snapshots.

If the renderer interpolates, hit detection still uses simulation state.

Churn occurs only when the simulation threat crosses the churn line.

---

# 12. Expansion implementation

Account needs and module compatibility come from data definitions.

Do not ask an LLM whether a module is a good fit during gameplay.

Each module has deterministic tags.

Example:

```ts
{
  id: "analytics",
  tags: ["analytics", "reporting", "visibility"],
  conflicts: ["minimal_stack"]
}
```

Account archetypes use required, compatible, and conflicting tags.

The fit score is calculated locally.

---

# 13. Operations implementation

Scratch percentage is visual input converted to deterministic revealed-area percentage.

Do not require exact pixel-for-pixel scratching for the economic result.

Use a coarse reveal mask, for example 16 x 16 cells, to keep touch, mouse, and trackpad parity.

Diagnosis unlocks at 35% revealed cells.

The hidden cause is selected from deterministic incident archetype data.

---

# 14. Automation

Base automation lines must not depend on random shop availability after onboarding.

Once a room's Automation License is unlocked, the room automation panel allows purchase of subsequent tiers whenever the player has Cash and intermission rules allow it.

Agents must produce visible interaction cues:

- Marketing cursor swipes cards.
- Product cursor moves pieces.
- Pricing cursor taps.
- Support turret fires.
- Expansion cursor packs modules.
- Ops cursor scratches and diagnoses.

Do not represent agent actions only as invisible production timers.

---

# 15. Complexity

Compute Complexity from explicit installed systems.

Do not derive it from ARR.

Every agent tier and upgrade declares its Complexity contribution in content data.

Derived Strain:

```text
complexity / ops capacity
```

The Strain state must be visible in the HUD and explain why agent reliability changed.

Never silently nerf agents.

---

# 16. Cash closes

At exactly 50s, 100s, and 150s of each quarter:

1. Add `currentARR / 12` to Cash.
2. Deduct baseline scheduled operating bills.
3. Deduct each agent's monthly cost.
4. Deduct monthly debt interest.
5. Deduct unresolved monthly leak costs.
6. Recompute liquidity state.
7. Trigger PAYABLES OVERDUE if Cash < 0.

Use remainder-safe integer accounting when ARR cents is not divisible by 12. Carry the remainder rather than losing cents.

---

# 17. LOC implementation

Canonical limit:

```text
min(15% ARR, 1% valuation)
```

Unlock at ARR >= $500K.

APR:

```text
10% + 10% x utilization + multiple risk premium
```

Use basis points.

Never display more precision than useful to the player, but preserve exact internal calculation.

When Debt > recalculated limit:

```text
available draw = 0
APR surcharge = +600 bps
```

Do not auto-liquidate the company.

---

# 18. Venture financing

Pre-seed uses a simplified SAFE-style cap.

Seed, A, and B use pre-money plus raise math.

For priced rounds:

```ts
postMoney = preMoney + raise;
dilutionBps = floor(raise * 10_000 / postMoney);
ownershipAfter = ownershipBefore * (10_000 - dilutionBps) / 10_000;
```

Use integer arithmetic and define rounding direction in one shared finance utility.

Tests must cover repeated rounds.

Never implement:

```text
ownership -= round1Dilution + round2Dilution
```

---

# 19. Founder History

History is player-selected input.

Do not query external accounts, resumes, social profiles, email, or browser data to infer history.

History effects must be explicit data.

Fresh Founder ranked mode must hard-disable all History modifiers.

Contrarian draft weighting must affect shop selection only, not hidden ARR multipliers.

---

# 20. Upgrade data

All 48 upgrades must live in structured content definitions.

Recommended shape:

```ts
type UpgradeDefinition = {
  id: string;
  name: string;
  category: "room" | "system" | "cursed";
  room?: RoomId;
  rarity: "common" | "uncommon" | "rare" | "legendary" | "cursed";
  costMilliCu: number;
  complexityMilli: number;
  prerequisites: string[];
  effectIds: string[];
  copy: {
    short: string;
    long: string;
  };
};
```

Economics should dispatch through known `effectIds`, not execute arbitrary expressions from content.

---

# 21. Situation data

Situation mechanics are authored and deterministic.

GenAI receives:

```text
archetypeId
fictional company context
fictional product category
fictional customer context
allowed tone
```

It returns presentation text only.

The numeric choices already exist before generation starts.

If generation fails or times out, use the authored fallback immediately.

A network failure may never pause the core game indefinitely.

---

# 22. Copyright and brand safety

Default generated prompts must instruct models:

- do not quote social posts
- do not copy slogans
- do not reproduce lyrics
- do not recreate branded UI
- do not use copyrighted characters
- do not imitate a named living artist's exact style
- do not include third-party logos unless an explicit licensed asset exists

Use generic startup culture archetypes and original wording.

Do not scrape public posts into the game and display them verbatim.

---

# 23. First-run implementation

First-run sequencing is a state machine, not a collection of tooltip booleans.

Recommended phases:

```text
TUTORIAL_Q1_MARKETING
TUTORIAL_Q1_PRODUCT
TUTORIAL_Q1_MONETIZATION
TUTORIAL_Q1_CASH
TUTORIAL_Q2_RETENTION
TUTORIAL_Q2_OPERATIONS
TUTORIAL_Q3_AUTOMATION
TUTORIAL_Q3_COMPLEXITY
TUTORIAL_Q4_EXPANSION
TUTORIAL_Q4_DEBT
TUTORIAL_Q4_VC
TUTORIAL_Q5_FULL_RUN
COMPLETE
```

Each phase has:

- entry condition
- guaranteed content spawn if necessary
- completion event
- minimal one-line instruction

Do not show the next mechanic before the previous mechanic has been used once.

No modal should explain more than one new mechanic at a time.

---

# 24. Holding Company implementation

Each company owns its own deterministic simulation state.

The Holding Company orchestrator advances all active company simulations on the same wall-clock simulation time.

Only the foreground company accepts founder room commands.

Background companies still accept automated agent commands.

Cross-company synergies create explicit `WorkItem` events in destination companies.

Never mutate destination ARR directly.

---

# 25. Save and replay

Persist:

- seed
- company state
- holding company state
- purchased upgrades
- financing rounds
- founder history
- action log or replay checkpoints
- content version
- balance version

A replay must reference the exact balance version used for the original run.

Do not silently replay old seeds under new balance data and claim they are identical.

---

# 26. Analytics events

Minimum events:

```text
run_started
history_selected
room_unlocked
manual_action
agent_action
upgrade_offered
upgrade_bought
agent_installed
agent_upgraded
strain_state_changed
monthly_close
debt_drawn
debt_repaid
funding_offer_seen
funding_accepted
ownership_changed
growth_commitment_selected
growth_commitment_missed
quarter_closed
situation_seen
situation_choice
company_bankrupt
unicorn_reached
run_ended
holding_company_unlocked
company_switched
```

Do not log generated private text if analytics does not need it.

---

# 27. Performance rules

Target desktop and mobile browser.

The economic simulation should be cheap enough to run independent of render FPS.

Recommended:

```text
simulation tick: 10 Hz or lower if interpolation is clean
render: requestAnimationFrame
```

Do not run LLM calls inside a frame loop.

Do not allocate large objects on every simulation tick.

Retain bounded event logs in memory and flush archival data separately.

---

# 28. Accessibility and input parity

All room actions must support:

- mouse
- trackpad
- touch

No room may require multi-touch.

Provide reduced-motion mode for:

- camera shake
- valuation pulses
- rapid card travel
- impact flashes

Economic timing must remain identical in reduced-motion mode.

Do not make color the only carrier of Good vs Bad state.

---

# 29. Responsive canvas and PWA implementation contract

Responsive layout and installability are architectural requirements.

Do not implement V1 as a fixed-size desktop canvas and add mobile CSS afterward.

## 29.1 Presentation breakpoints are layout choices, not economic modes

At minimum support:

```text
compact mobile portrait
mobile landscape / tablet
desktop
installed PWA windows at arbitrary resizable dimensions
```

Never branch economic balance on viewport, pointer type, orientation, or installation mode.

The same seed and action log must resolve identically at every viewport size.

## 29.2 Canvas sizing

Canvas components must fill a measured container.

Preferred pattern:

```text
Responsive React layout
        ↓
measured room container
        ↓
ResizeObserver
        ↓
canvas CSS width / height
        ↓
DPR-aware backing store
        ↓
logical coordinate transform
```

Do not hard-code the economic simulation to canvas pixels.

Recommended DPR policy:

```ts
const renderDpr = Math.min(window.devicePixelRatio || 1, 2);
```

It may be lowered adaptively for rendering performance, but this must not change gameplay rules.

## 29.3 Coordinate transform

Each room should expose a stable logical coordinate space.

Pointer input must be transformed from client coordinates to logical room coordinates before commands are emitted.

Conceptual helper:

```ts
type RoomViewport = {
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

function clientToLogical(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  viewport: RoomViewport,
): { x: number; y: number };
```

Resize must update projection only. It must never rewrite authoritative simulation positions.

## 29.4 Mobile composition

Do not display six miniature room canvases simultaneously on a narrow phone.

Compact mobile should use:

```text
compact sticky HUD
active room
context panel / overlays
bottom room navigation
```

Urgency in inactive rooms must be visible through nav badges, alarm states, backlog counts, or other compact signals.

Room switching must be one tap.

Keep primary thumb interactions away from safe-area edges.

## 29.5 DOM versus Canvas

Prefer React DOM for:

- permanent HUD numbers
- upgrade descriptions
- financing choices
- menus
- install affordances
- tooltips
- settings
- accessible buttons
- textual situation content

Use Canvas for tactile room presentation and effects.

Do not draw all application UI into Canvas merely because the minigames use Canvas.

This keeps responsive reflow, accessibility, localization, and PWA shell behavior tractable.

## 29.6 Unified pointer input

Use Pointer Events where practical.

Support:

- mouse
- touch
- pen
- trackpad pointer interactions

No canonical room may require hover or multi-touch.

Call `setPointerCapture` for drags, merges, packing, scratches, and swipes where losing the pointer outside the original element would break the action.

Use `touch-action` narrowly on active interaction surfaces. Do not disable all browser gestures globally unless a full-screen installed mode has a justified requirement.

## 29.7 Safe-area handling

Respect:

```text
env(safe-area-inset-top)
env(safe-area-inset-right)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
```

Test bottom navigation and critical CTA placement on devices with a home indicator.

## 29.8 PWA shell

Use the repo's existing build system if it can satisfy the product requirements. Do not replace the stack solely to use a preferred PWA library.

Required capabilities:

- manifest generation or static manifest
- standalone display configuration
- icons
- service worker or equivalent
- app-shell and immutable static-asset caching
- versioned client update flow
- structured run persistence

If using Vite, a mature Vite-compatible PWA integration is acceptable. If the repository already has a working service worker, extend it rather than adding two competing workers.

## 29.9 Offline behavior

After required static assets have cached successfully:

```text
core simulation        must work
six rooms              must work
authored situations    must work
upgrades               must work
saved active run       must load
GenAI personalization  may fall back
analytics              may queue or fail safely
```

Never make a run depend on a network request for an economic decision.

## 29.10 Persistence

Persist versioned state with IndexedDB or an equivalent durable browser database.

At minimum persist on:

- meaningful player command batches
- monthly close
- quarter close
- financing action
- upgrade purchase
- agent purchase / upgrade
- visibility loss where feasible
- application backgrounding where feasible

Use debouncing and transactional writes. Do not synchronously serialize the entire run every animation frame.

## 29.11 Install and update UX

Do not show an install modal on first load.

Expose install only after value has been demonstrated or from a menu.

A service worker update must not force-reload an active quarter.

If an update is waiting, activate it at a safe state boundary after persistence succeeds.

## 29.12 Responsive test matrix

Automated and manual tests must include at least:

```text
320 x 568 portrait
360 x 800 portrait
390 x 844 portrait
768 x 1024 tablet portrait
1024 x 768 tablet / small landscape
1366 x 768 desktop
1440 x 900 desktop
1920 x 1080 desktop
resizable standalone PWA window
```

Exact device emulation names are not canonical. The viewport classes are.

For each class validate:

1. No critical control is clipped.
2. HUD remains legible.
3. Room switching is reachable.
4. Every gesture resolves correctly.
5. Rotation / resize preserves active room and state.
6. Pointer coordinate projection remains accurate.
7. Quarter and situation timers remain deterministic.
8. Safe-area padding prevents overlap.
9. No accidental page scroll interrupts a canonical gesture.
10. Performance degradation changes presentation only.

## 29.13 PWA verification

Before V1 release verify:

- manifest parses and required fields are present
- installability works on supported Chromium desktop/mobile surfaces
- iOS/iPadOS Add to Home Screen experience is usable where supported
- standalone launch opens the correct route
- icons and theme metadata render correctly
- cached shell boots after temporary network loss
- authored fallback content allows continued play without GenAI
- saved run resumes after closing and reopening the installed app
- a waiting service-worker update does not destroy an active run

Browser support changes over time. Test actual target browsers near release rather than encoding assumptions from old installability checklists.

---

# 30. Test matrix

Required unit tests:

## Accounting

- ARR bridge exactness
- no expansion double count
- churn cannot push ARR below zero
- valuation multiple thresholds at every boundary
- founder stake value

## Cash

- monthly ARR collection
- remainder handling
- agent recurring cost
- Ops leak cost
- negative cash grace

## Debt

- limit formula
- limit shrink
- APR at each multiple
- utilization boundaries
- over-limit surcharge
- monthly interest

## Equity

- SAFE reserved dilution
- priced round dilution
- repeated dilution compounding
- founder history pre-seed modifier
- founder history seed modifier

## Rooms

- Marketing score mapping
- Product verified vs early ship
- Monetization zone outputs
- Retention threat crossing
- Expansion fit bands
- Ops diagnosis consequences

## Automation

- agent reliability
- tier incremental cost
- Complexity
- Strain penalties
- Operations capacity mitigation

## Replay

- same seed + same commands = same quarter result
- serialization round trip

---

# 31. Balance validation

Run `simulate_v1.py` after any change to:

- GU
- CU
- agent throughput
- agent cost
- Complexity
- Ops Capacity
- valuation multiples
- debt
- financing
- churn pressure
- Expansion cap
- room throughput

Simulation is a regression guard, not a design oracle.

Reject a balance change automatically if it breaks an invariant.

Flag for review if:

- fewer than five archetypes retain a plausible unicorn path by Q16
- Fresh Founder VC path becomes both fastest and highest-ownership
- debt becomes a free accelerator with negligible carrying cost
- Balanced generalist becomes the dominant strategy
- any single room can be ignored for an entire successful run without an explicit build that replaces its function

---

# 32. Human playtest gates

No amount of Monte Carlo replaces these tests.

Before declaring V1 fun, test at least:

- 10 first-time players
- 10 startup-literate players
- 5 players unfamiliar with startup terminology
- 5 repeated-run players with at least 5 runs each

Measure:

- time to understand each room
- first-run mechanic recall
- number of meaningful room switches
- quarter where automation is first desired before being explained
- upgrade choice time
- perceived cause of failure
- willingness to immediately replay
- whether users can explain ARR vs Cash vs Valuation

The build must show economic cause and effect clearly enough that failures feel attributable, not random.

---

# 33. Definition of done for an implementation task

A coding task is done only when:

1. The implementation matches `product_final.md`.
2. New state changes live in the deterministic simulation layer.
3. Tests pass.
4. Seeded replay remains deterministic.
5. Mobile pointer input still works.
6. No new copyrighted or third-party branded content was introduced without explicit direction.
7. No balance number was generated by an LLM.
8. The change does not add direct ARR or Valuation shortcuts outside canonical formulas.
9. The current UI design language is preserved unless the prompt requests a visual redesign.
10. The agent reports what changed, tests run, and any product-level conflict discovered.
11. Responsive tests pass for compact mobile, tablet, desktop, and resizable installed-window classes relevant to the change.
12. Canvas pointer projection remains correct after resize and orientation change.
13. PWA manifest, persistence, caching, or update-flow tests pass when the task touches the application shell.
