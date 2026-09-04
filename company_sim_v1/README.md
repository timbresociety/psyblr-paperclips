# One-Person Company Roguelite

V1 engineering rulebook.

The product is a deterministic company simulation wrapped in six tactile one-pointer games. The player manually performs company work, spends company cash on tools and agents, survives automation complexity, chooses financing, and races to a $1B valuation.

Read in this order:

1. `product_final.md` for product truth.
2. `AGENTS.md` for implementation instructions.
3. `BALANCE_REPORT.md` for quantitative validation and known balance risks.
4. `simulate_v1.py` for the reproducible balance harness.

---

# Core equations

```text
ARR_END
=
ARR_START
+ NEW_CUSTOMER_ARR
+ EXPANSION_ARR
- CHURNED_ARR
```

```text
NEW_ARR
=
NEW_CUSTOMER_ARR
+ EXPANSION_ARR
```

```text
VALUATION
=
ARR x GROWTH_MULTIPLE
```

```text
FOUNDER_STAKE_VALUE
=
FOUNDER_OWNERSHIP x VALUATION
```

Never double-count Expansion.

Operations costs hit Cash, not ARR.

Debt and venture financing create Cash, not score.

---

# Six rooms

| Room | Gesture | Economic role |
|---|---|---|
| Marketing | Swipe | Creates Demand GU |
| Product | Merge | Converts Demand into Activation GU |
| Monetization | Tap | Converts Activation into New Customer ARR |
| Retention | Aim / auto-fire | Prevents Churned ARR |
| Expansion | Drag / pack | Creates Expansion ARR |
| Operations | Scratch / reveal | Protects Cash, capacity, and reliability |

The founder can actively control one room at a time.

Agents perform the same room interactions automatically.

---

# Architecture

Keep four layers separate.

## 1. Simulation

Owns:

- money
- ARR bridge
- work queues
- threats
- agents
- Complexity
- Ops Capacity
- debt
- equity
- valuation
- quarter timing
- seeded randomness

The simulation must run without React, Canvas, audio, or GenAI.

## 2. Content

Owns:

- room opportunity archetypes
- upgrades
- situations
- customer archetypes
- incident archetypes
- founder histories
- relics

Content declares deterministic effect IDs. Content never executes arbitrary code.

## 3. Presentation

Owns:

- HUD
- Canvas rooms
- animation
- sound
- transitions
- tooltips
- quarter close
- capital screens
- Holding Company

Presentation sends commands to Simulation and renders returned state.

## 4. Personalization

Owns optional generated surface text only.

It must have authored fallbacks and may be completely disabled.

---

# Recommended module boundaries

Adapt paths to the existing repo rather than forcing a rewrite.

Conceptual structure:

```text
src/
  sim/
    company/
    rooms/
    finance/
    upgrades/
    situations/
    rng/
    replay/

  content/
    upgrades/
    situations/
    histories/
    customers/

  game/
    marketing/
    product/
    monetization/
    retention/
    expansion/
    operations/

  ui/
    hud/
    intermission/
    finance/
    onboarding/
    holding-company/

  personalization/
    prompts/
    fallback/
```

Do not reorganize a working repo only to match these exact folder names.

The boundary matters more than the directory spelling.

---

# Simulation precision

Use integer cents for money.

Use basis points for percentages.

Use integer milli-GU / milli-CU for normalized work where fractions are required.

Examples:

```text
$100,000.00 = 10,000,000 cents
72.00% = 7,200 basis points
0.25 GU = 250 milli-GU
```

Do not make finance logic depend on JS floating-point rounding.

---

# Responsive and PWA contract

V1 is a responsive Canvas web game and an installable PWA on desktop and mobile.

Do not shrink a fixed desktop layout onto phones.

Presentation reflows by available space while the deterministic simulation remains identical.

Compact mobile composition:

```text
compact economic HUD
active room canvas
context UI
bottom room navigation
```

Desktop may expose richer surrounding room, automation, backlog, and company information.

Core rules:

- support mobile portrait, mobile landscape, tablet, desktop, and resizable installed windows
- minimum V1 viewport target: 320 x 568 CSS px
- no forced orientation
- use measured canvas containers rather than fixed pixel dimensions
- keep a stable logical room coordinate system independent of CSS pixels
- project Pointer Events into logical coordinates
- DPR-aware rendering, recommended visual cap of 2
- use DOM for critical text and controls, Canvas for tactile room presentation
- respect mobile safe-area insets
- resizing or rotation must not mutate simulation state
- all six gestures must work with one pointer
- no canonical mechanic may require hover or multi-touch

PWA requirements:

- valid web app manifest
- standalone presentation where supported
- application icons and theme metadata
- service worker or equivalent app-shell caching
- versioned durable run persistence, preferably IndexedDB
- active runs survive refresh / restart
- core authored game remains playable through temporary network loss after assets are cached
- GenAI personalization always has deterministic authored fallback
- application updates activate only at safe boundaries, never mid-quarter

Do not show an install prompt before the player has experienced meaningful value.

See `product_final.md` Section 28 and `AGENTS.md` Section 29 for the canonical details.

---

# Seeded runs

Every run has a seed.

The seed controls:

- opportunities
- situations
- upgrade shop
- account needs
- incident causes
- agent mistakes

The player's commands complete the deterministic input.

A run replay is:

```text
seed
+ balance version
+ content version
+ action log
```

This is required for:

- daily seeds
- leaderboards
- debugging
- balance regression
- shareable runs

---

# Time

Quarter:

```text
150 seconds
```

Monthly cash closes:

```text
50s
100s
150s
```

Intermission:

```text
15 to 25 second UX target
```

Simulation time must not be tied to render FPS.

Pausing for a situation slows gameplay to 0.25x rather than changing economic rules.

---

# Economy

Starting Fresh Founder state:

```text
ARR                  $100K
Cash                  $25K
Debt                    $0
Ownership              100%
Multiple                10x
Valuation              $1M
Ops Capacity              4
Complexity                0
```

Growth Unit:

```text
max($25K, 1% x quarter-start ARR)
```

Capital Unit:

```text
max($5K, 0.75% x quarter-start ARR)
```

Both lock at quarter start.

---

# Growth multiple

| Growth | Multiple |
|---:|---:|
| <0% | 2x |
| 0% to <10% | 4x |
| 10% to <25% | 6x |
| 25% to <50% | 10x |
| 50% to <75% | 14x |
| 75% to <100% | 20x |
| 100% to <150% | 28x |
| 150%+ | 40x |

The multiple re-rates only at quarter close.

---

# Capital

## Cash

Cash is where recurring collections accumulate and where upgrades, bills, agents, and financing consequences resolve.

## Debt

LOC unlock:

```text
ARR >= $500K
```

Limit:

```text
min(15% ARR, 1% Valuation)
```

APR:

```text
10% + 10% utilization + valuation-risk premium
```

## Venture funding

Pre-seed uses a simplified post-money SAFE-style cap.

Seed, Series A, and Series B use pre-money valuation plus raise.

Ownership compounds multiplicatively after each dilution event.

See `product_final.md` for exact stage values.

---

# Agents

Agent tiers:

| Tier | Install cost | Monthly | Throughput | Reliability | Complexity |
|---|---:|---:|---:|---:|---:|
| Worker | 1 CU | 0.15 CU | 0.60x | 72% | 1.0 |
| Specialist | 3 CU total | 0.30 CU | 1.30x | 84% | 1.5 |
| Swarm | 7 CU total | 0.60 CU | 2.60x | 90% | 3.0 |
| Closed Loop | 14 CU total | 1.00 CU | 4.50x | 94% | 5.0 |

Agents are visible gameplay objects, not hidden buffs.

---

# Complexity

```text
Strain = Complexity / Ops Capacity
```

The game must visually explain Strain consequences.

If an agent becomes worse because the organization is overloaded, the player should see why.

---

# Upgrade economy

V1 has 48 run upgrades:

```text
30 room upgrades
12 systems
6 cursed
```

Quarter close offers 3.

Player may buy 0 to 2.

Second purchase costs 1.5x.

One reroll costs 0.5 CU.

Cursed cards cost 0 CU and are irreversible.

Automation tiers remain directly purchasable once unlocked so core automation is never gated behind bad shop RNG.

---

# Founder History

Founder History is player-selected.

Never infer it.

Fresh Founder is the standardized competitive baseline.

Histories unlock an Origin Relic and complementary draft weighting.

Some histories modify pre-seed or seed financing terms, but no history directly multiplies ARR or Valuation.

---

# First-run rule

The first run is a teaching run through Q4.

It must expose, in order:

```text
Marketing
Product
Monetization
Cash
Retention
Operations
Agents
Complexity
Expansion
Debt
Venture funding
Ownership
```

Q5 opens:

```text
Growth Commitment
Cross-room Systems
Cursed upgrades
Full situations
Normal failure rules
```

Do not dump all systems on the first screen.

---

# Holding Company

Unlock after the first company run ends.

Starts with two company slots.

Only the foreground company can receive founder input.

Background companies continue agent automation, bills, incidents, and collections.

Cross-company synergies create opportunities or capacity. They never mint free ARR.

---

# GenAI

The game must be fully playable with GenAI disabled.

GenAI can generate:

- names
- fictional senders
- fictional company flavor
- situation prose
- jokes

GenAI cannot generate:

- probabilities
- economic effects
- costs
- ARR
- debt terms
- valuation
- upgrade mechanics

Generated text always maps to an authored deterministic archetype.

---

# Copyright safety

Base V1 uses original, generic startup culture content.

Do not copy:

- tweets
- social posts
- slogans
- logos
- branded layouts
- game art
- characters
- music
- dialogue

Do not depend on real SaaS brands to make a joke understandable.

The mechanic should remain funny with fictional names.

---

# Balance harness

Run:

```bash
python simulate_v1.py --runs 1000 --out simulation_output
```

Outputs:

```text
simulation_summary.csv
growth_commitment_feasibility.csv
history_sensitivity.csv
valuation_math.csv
first_run_economic_trace.csv
simulation_manifest.json
```

The simulator validates economy and relative build paths.

It does not validate:

- fun
- visual clarity
- motor feel
- humor
- tutorial comprehension
- replay desire

Those require playtests.

---

# Build priorities

Implementation order:

## Phase 1: deterministic shell

1. State model.
2. Money / fixed-point utilities.
3. Quarter clock.
4. Monthly closes.
5. ARR bridge.
6. Growth multiple.
7. Seeded RNG.
8. Replay event log.

## Phase 2: six manual rooms

1. Marketing.
2. Product.
3. Monetization.
4. Retention.
5. Expansion.
6. Operations.

Do not add agents before each manual room is satisfying enough to understand what automation replaces.

## Phase 3: pressure and automation

1. Work queues.
2. Agent tiers.
3. Complexity.
4. Ops Capacity.
5. Visible strain.

## Phase 4: capital

1. Cash costs.
2. LOC.
3. Interest.
4. Bankruptcy grace.
5. Pre-seed.
6. Seed / A / B.
7. Founder ownership.

## Phase 5: roguelike

1. 48 upgrades.
2. Growth Commitment.
3. 24 situations.
4. Founder Histories.
5. Relics.

## Phase 6: first run

Implement the curated Q1 to Q5 state machine.

## Phase 7: Holding Company

Add parallel companies and opportunity-based synergies only after single-company V1 is stable.

---

# What not to build yet

Do not add:

- employees
- board governance
- IPO
- acquisitions
- token mechanics
- complex taxes
- detailed preferred equity
- multiplayer
- real-money wagering
- sponsor power
- paid boosts

Do not make the game broader before the six-room machine is fun.

---

# Release gates

Before V1 release:

- deterministic tests pass
- no ARR invariant failures
- same seed replay works
- all six rooms support touch, mouse, trackpad
- responsive layout passes compact mobile, tablet, desktop, and installed-window viewport classes
- rotating or resizing never changes deterministic state
- PWA installs on supported desktop/mobile surfaces and resumes an active saved run
- cached core game survives temporary network loss
- first-run users can explain ARR, Cash, Valuation
- at least five build families have plausible unicorn paths
- no paid power
- no third-party IP dependency
- GenAI failure cannot break a run
- Holding Company does not create free ARR
- human playtests show immediate replay intent from a meaningful share of players

See `product_final.md` for the complete acceptance list.
