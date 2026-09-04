# ONE-PERSON COMPANY ROGUELITE
## Canonical V1 Product Specification

Status: LOCKED FOR V1 BUILD

This file is the product truth. If another document conflicts with this file, this file wins. Numerical values marked as V1 Balance are locked for implementation but remain eligible for later tuning after human playtests. Product concepts, equations, interaction contracts, and state relationships are canonical unless deliberately revised here.

---

# 1. Product thesis

A roguelite active-incremental game about building a one-person AI company.

Every important company function is represented by a simple tactile game based on the real activity. The founder can only actively work one room at a time. Work creates useful output and new workload elsewhere. Capital buys tools and agents. Agents perform the same work automatically but create recurring cost and organizational complexity. Growth changes the valuation multiple. The primary score is company valuation. The first major checkpoint is $1B.

The core fantasy is not clicking a number upward.

The core fantasy is:

```text
DO WORK
  -> CREATE OUTPUT
  -> GROW
  -> CREATE MORE WORK
  -> FALL BEHIND
  -> BUY TOOLS AND AGENTS
  -> CREATE COMPLEXITY
  -> BUILD SYSTEMS
  -> GROW FASTER
  -> SURVIVE THE MACHINE YOU BUILT
```

A strong action should usually create a useful consequence and a new problem.

---

# 2. Non-negotiable accounting

## 2.1 ARR identity

The canonical ARR equation is:

```text
ARR_END
=
ARR_START
+ NEW_ARR
- CHURNED_ARR
```

Where:

```text
NEW_ARR
=
NEW_CUSTOMER_ARR
+ EXPANSION_ARR
```

Expanded:

```text
ARR_END
=
ARR_START
+ NEW_CUSTOMER_ARR
+ EXPANSION_ARR
- CHURNED_ARR
```

This expanded equation is only a decomposition of NEW_ARR. Expansion must never be added twice.

## 2.2 Six functions and the ARR bridge

```text
MARKETING
  -> Demand opportunities

PRODUCT
  -> Activation opportunities

MONETIZATION
  -> New Customer ARR

EXPANSION
  -> Expansion ARR

RETENTION
  -> Prevents Churned ARR

OPERATIONS
  -> Cash cost, capacity, reliability, incidents
```

Marketing and Product do not directly mint ARR.

Retention cannot create positive ARR.

Operations costs never subtract from ARR. Operations failures can create lost conversion, churn threats, downtime, or cash loss, which can then affect ARR indirectly.

## 2.3 Valuation

```text
VALUATION
=
CURRENT_ARR
x
CURRENT_GROWTH_MULTIPLE
```

Growth is the only direct input to the valuation multiple in V1.

No upgrade, investor, debt draw, relic, agent, cash balance, or button may directly increase valuation.

## 2.4 Founder stake value

V1 defines Valuation as the game's equity valuation.

```text
FOUNDER_STAKE_VALUE
=
FOUNDER_OWNERSHIP
x
VALUATION
```

Do not add Cash or subtract Debt again inside this formula. Debt matters through liquidity and survival. The game does not separately model enterprise value in V1.

---

# 3. Primary run objective

The main goal is:

```text
REACH $1,000,000,000 VALUATION
```

The unicorn event is a checkpoint, not a forced ending.

On crossing $1B:

1. Pause the timer.
2. Fire the Unicorn achievement.
3. Record the speedrun time and quarter.
4. Show founder ownership and founder stake value.
5. Offer CONTINUE COMPANY.

Post-unicorn labels include:

- Hype Cycle Miracle: reached $1B and fell below $500M within two quarters.
- Zombie Unicorn: valuation remains $1B+ while ARR shrinks for two consecutive quarters.
- Actually Autonomous: four consecutive post-unicorn quarters with less than 10% manual founder actions.
- Money Printer: four consecutive positive-growth quarters at 95%+ automated work.
- One-Person Decacorn: $10B valuation without employees.

---

# 4. Starting state

Standard Fresh Founder run:

```text
ARR                    $100,000
MRR                      $8,333.33
Cash                    $25,000
Debt                         $0
Founder Ownership          100%
Growth Multiple             10x
Valuation                 $1.0M
Agents                        0
Complexity                    0
Ops Capacity                  4
Quarter                       1
```

Money values must be stored internally in integer cents.

Ownership must be stored in basis points or a fixed-point integer representation. Do not use floating point ownership as canonical state.

---

# 5. Time structure

## 5.1 Quarter

One quarter is 150 seconds of active simulation.

Intermission target: 15 to 25 seconds.

A quarter contains three monthly cash closes:

```text
50 seconds
100 seconds
150 seconds
```

At each monthly close:

```text
Cash += Current ARR / 12
Cash -= scheduled monthly costs
Cash -= agent monthly costs
Cash -= debt interest for the month
Cash -= unresolved operating leaks
```

The engine uses the ARR value at the instant of the monthly close.

The balance simulator may use average ARR divided by four as an approximation. The shipped simulation must use exact monthly ticks.

## 5.2 Quarter-end growth

```text
QUARTERLY_GROWTH
=
(ARR_END - ARR_START)
/
ARR_START
```

Use exact fixed-point arithmetic before display rounding.

## 5.3 Growth multiple table

| Quarterly ARR growth | Multiple |
|---:|---:|
| Negative | 2x |
| 0% to <10% | 4x |
| 10% to <25% | 6x |
| 25% to <50% | 10x |
| 50% to <75% | 14x |
| 75% to <100% | 20x |
| 100% to <150% | 28x |
| 150%+ | 40x |

The current quarter uses the previously locked multiple for live valuation display. At quarter close, calculate growth, reveal the new multiple, and re-rate the company.

This allows the player to grow ARR while valuation falls if growth decelerates enough to cross a multiple band.

---

# 6. Growth commitment

Growth commitment is the self-selected risk mechanic.

At the start of each normal quarter the player chooses:

```text
10%
25%
50%
75%
100%
```

The game displays a Projected Growth Range based on:

- current backlogs
- installed automation capacity
- recent founder accuracy
- known recurring costs
- known scheduled work

The forecast never includes unrevealed future situations.

If actual quarterly ARR growth finishes below the selected commitment, the ranked run ends as:

```text
GROWTH MANDATE MISSED
```

The first-run tutorial is protected through Q4. A missed commitment during Q1 to Q4 shows the consequence and warning but does not terminate the tutorial run. Standard rules begin in Q5.

Higher commitments improve quarter-end upgrade rarity weighting.

Base upgrade weights at 10% commitment:

```text
Common       55%
Uncommon     30%
Rare         12%
Legendary     3%
```

At 25%:

```text
Common       50%
Uncommon     31%
Rare         15%
Legendary     4%
```

At 50%:

```text
Common       40%
Uncommon     32%
Rare         21%
Legendary     7%
```

At 75%:

```text
Common       30%
Uncommon     30%
Rare         28%
Legendary    12%
```

At 100%:

```text
Common       20%
Uncommon     28%
Rare         34%
Legendary    18%
```

A Cursed card may replace one normal offer from Q5 onward. Base Cursed replacement chance is 8%. At 75% commitment it is 12%. At 100% it is 16%.

The simulator shows that a sustained 50%+ commitment is not a baseline strategy. It becomes viable only after a strong engine exists. Therefore commitment is chosen each quarter, not once for the whole run.

---

# 7. Normalized economic units

Two units keep the same mechanics readable from a garage startup to a large company.

## 7.1 Growth Unit

Locked at quarter start:

```text
GU
=
max(
  $25,000,
  1% x Starting ARR
)
```

A GU represents a cohort of economic activity.

Examples:

```text
Starting ARR $100K  -> GU $25K
Starting ARR $1M    -> GU $25K
Starting ARR $10M   -> GU $100K
Starting ARR $100M  -> GU $1M
```

## 7.2 Capital Unit

Locked at quarter start:

```text
CU
=
max(
  $5,000,
  0.75% x Starting ARR
)
```

CU prices tools, automation, incidents, and systems.

Examples:

```text
Starting ARR $100K  -> CU $5K
Starting ARR $1M    -> CU $7.5K
Starting ARR $10M   -> CU $75K
Starting ARR $100M  -> CU $750K
```

The unit is locked for the full quarter to prevent an upgrade price changing while the player is deciding.

---

# 8. Cash and operating costs

Cash is the survival and investment resource.

The game should never treat Cash as score.

Healthy-state scheduled operating costs target roughly 30% of cash collections before discretionary upgrade purchases. This is a gameplay abstraction representing infrastructure, model usage, software, payment fees, compliance reserve, and other company bills. It is not a claim that real software companies all spend 30% of revenue this way.

Operations cards make meaningful portions of this cost visible as bills and incidents.

Cash can be spent on:

- room tools
- automation installation
- automation upgrades
- cross-room systems
- incident resolution
- debt repayment
- selected situation choices

Cash can be sourced from:

- recurring collections
- prepayments created by specific monetization upgrades
- debt draws
- venture financing

---

# 9. The six tactile rooms

Every room obeys the same contract:

```text
Input
Gesture
Skill
Useful output
Mistake
Automation
Downstream pressure
```

All six interactions must work with one pointer on mouse, trackpad, or touch.

---

## 9.1 Marketing: SWIPE

### Input

A stream of market opportunities.

Each opportunity has five deterministic hidden properties:

```text
Relevance       0..2
Audience Fit    0..2
Trend Velocity  0..2
Saturation      0..2
Channel Cost    0..2
```

Opportunity score:

```text
Q
=
Relevance
+ Audience Fit
+ Trend Velocity
- Saturation
- Channel Cost
```

### Gesture

```text
Swipe left   Ignore
Swipe right  Pursue
Swipe up     Aggressively pursue
```

### Base pacing

- New card every 8 seconds while capacity exists.
- Maximum 3 queued cards.
- Card expires after 14 seconds.
- Three of the five signals are visible at base level.

### Correct action bands

```text
Q <= 0       LEFT
Q 1..3       RIGHT
Q >= 4       UP is optimal, RIGHT is safe
```

### Effects

Correct RIGHT:

```text
+1 Demand GU
```

Correct UP:

```text
+2 Demand GU
-0.10 CU Cash
```

Wrong RIGHT on Q <= 0:

```text
+1 Low-Quality Demand GU
```

Wrong UP on Q < 4:

```text
+2 Low-Quality Demand GU
-0.10 CU Cash
```

Correct LEFT creates no resource. It protects downstream capacity by refusing bad demand.

Every five correct decisions in a row grants a one-card Marketing Combo:

```text
next correct pursued opportunity +0.5 Demand GU
```

Wrong decision resets the combo.

### Downstream consequence

Low-quality demand that becomes paying ARR creates additional Retention pressure equal to 14% of that cohort's ARR value before Retention mitigation.

### Automation

Marketing Agents evaluate the same cards. Reliability determines how often the agent selects the seeded optimal action.

---

## 9.2 Product: MERGE

### Input

Demand GU becomes Product Requests.

### Gesture

Drag implementation pieces onto the current request state.

Canonical chain:

```text
PROMPT + DIFF
-> IMPLEMENTATION

IMPLEMENTATION + TEST
-> VERIFIED

VERIFIED + DEPLOY
-> SHIPPED
```

### Board

- 6 active request slots.
- Pieces enter every 2.5 seconds while a Product Request is available.
- Backlogged requests remain queued rather than disappearing.

### Skill

Fast recognition of the next valid piece and choosing whether to verify or ship early.

### Verified ship

```text
+1 Activation GU
```

### Early ship

The player may drag DEPLOY onto an unverified IMPLEMENTATION.

Effect:

```text
+1 Activation GU
+0.25 Churn Threat GU
+0.10 CU Operations leak token
```

This is deterministic. Shipping early is a deliberate risk, not a random bug roll.

### Wrong merge

Wrong pieces bounce and lock that request for 1 second. Wrong merges do not create ARR or permanent penalties by themselves.

### Automation

Code Agents perform the same state transitions. Agent mistakes can choose early deploy or wrong merge according to reliability.

---

## 9.3 Monetization: TAP

### Input

Each Activation GU creates one pricing opportunity.

### Gesture

Tap once on a moving pricing cursor.

### Base pacing

- Cursor sweeps across the band in 1.8 seconds.
- It reverses direction continuously.
- Opportunity expires after 5 seconds.

Base zone proportions before upgrades:

```text
Too Cheap      20%
Good           25%
Perfect        10%
Good           25%
Too Expensive  20%
```

The entire band shifts according to customer signals, so memorizing a fixed screen coordinate does not solve the game.

### Output

```text
Perfect         +1.5 New Customer ARR GU
Good            +1.0 New Customer ARR GU
Too Cheap       +0.5 New Customer ARR GU
Too Expensive    0.0 New Customer ARR GU
```

Monetization is positive-side ARR capture in the base game. Negative consequences come from optional aggressive upgrades and situations, not from ordinary overpricing.

### Automation

Pricing Agents tap the same opportunities with tier-specific capture quality.

---

## 9.4 Retention: AIM / AUTO-FIRE

### Input

Threats created by:

- baseline churn pressure
- low-quality demand
- Product early ships
- aggressive monetization
- bad Expansion fits
- Operations incidents
- situations

### Gesture

Move the pointer to prioritize a threat. The founder weapon fires automatically.

### Base weapon

```text
Founder fire interval: 0.45 seconds
Founder-present damage: 1
Founder-away fire rate: 35% of normal
```

### Threat classes

| Threat | HP | ARR value if it reaches churn line |
|---|---:|---:|
| S1 | 1 | 0.25 GU |
| S2 | 2 | 0.50 GU |
| S3 | 4 | 1.00 GU |

Base travel times are 8, 7, and 6 seconds respectively. Situations may alter them.

Anything reaching the churn line contributes directly to CHURNED_ARR.

### Automation

A Support Agent is another independent turret. Agents target according to their policy and reliability.

---

## 9.5 Expansion: DRAG / PACK

### Input

Existing customer accounts.

### Base pacing

- One normal account opportunity every 20 seconds if eligible cohorts exist.
- Maximum 2 queued accounts.
- Account expires after 30 seconds.
- Pack window is 15 seconds once opened.

### Board

4 x 4 account grid.

Modules use 1x1, 1x2, 2x1, or 2x2 shapes.

Each account contains three customer needs. One is visible by default. Upgrades reveal more.

### Fit score

```text
Exact need match          +2
Compatible adjacent need  +1
Neutral                     0
Conflicting module         -2
```

### Output

```text
Fit 5+       +1.5 Expansion ARR GU
Fit 3..4     +1.0 Expansion ARR GU
Fit 1..2     +0.5 Expansion ARR GU
Fit <= 0      0 ARR +0.25 Churn Threat GU
```

Base expansion is capped at 8% of Starting ARR per quarter. Specific Expansion systems may raise the cap to a maximum of 14% in V1.

### Automation

Account Agents pack modules using the same fit rules.

---

## 9.6 Operations: SCRATCH / REVEAL

### Input

Bills, reliability incidents, model usage leaks, agent failures, and infrastructure problems.

### Gesture

Scratch or scrub an obscured incident surface to reveal evidence, then select a diagnosis.

### Interaction

- At 35% revealed area, three diagnosis options become available.
- The player may continue scratching for more certainty while the incident continues costing time or money.
- Correct diagnosis resolves the incident.
- Wrong diagnosis locks the card for 6 seconds and adds 0.05 CU to the incident cost.

### Severity

S1 unresolved:

```text
+0.05 CU monthly leak
```

S2 unresolved:

```text
+0.10 CU monthly leak
+0.25 Churn Threat GU after 30 seconds unresolved
```

S3 unresolved:

```text
+0.25 CU monthly leak
-2 Ops Capacity while active
+0.50 Churn Threat GU every 30 seconds unresolved
```

Operations itself never subtracts from ARR.

### Automation

Ops Agents scratch, diagnose, and resolve incidents using the same evidence model.

---

# 10. Founder attention

There is no artificial stamina meter.

The founder limitation is literal attention:

```text
one actively controlled room at a time
```

Other rooms continue operating.

This is the core pressure mechanic.

Early company:

```text
Founder can keep up.
```

Scaling company:

```text
Founder physically cannot process all workload.
```

Late company:

```text
Founder designs automation and only intervenes in failures.
```

---

# 11. Automation economy

Automation is purchased with company Cash.

An agent must play the same game the founder used to play. It may not be represented as a hidden percentage bonus.

Each room has one automation line.

| Tier | Cumulative install cost | Monthly cost | Throughput vs full-time founder | Reliability | Complexity |
|---|---:|---:|---:|---:|---:|
| None | 0 CU | 0 | 0 | 0 | 0 |
| Worker | 1 CU | 0.15 CU | 0.60x | 72% | 1.0 |
| Specialist | 3 CU | 0.30 CU | 1.30x | 84% | 1.5 |
| Swarm | 7 CU | 0.60 CU | 2.60x | 90% | 3.0 |
| Closed Loop | 14 CU | 1.00 CU | 4.50x | 94% | 5.0 |

Cumulative install cost means upgrading Worker to Specialist costs 2 additional CU, not 3.

Agent monthly costs are paid at each monthly close.

---

# 12. Complexity and Operations capacity

Starting:

```text
Ops Capacity = 4
```

```text
STRAIN
=
COMPLEXITY
/
OPS_CAPACITY
```

V1 states:

| Strain | State | Agent reliability modifier | Extra operating pressure |
|---:|---|---:|---|
| <=1.00 | Stable | 100% | none |
| >1.00 to 1.25 | Strained | 95% | +3% cash leak pressure |
| >1.25 to 1.50 | Overloaded | 90% | +8% cash leak pressure and churn incidents |
| >1.50 | Critical | 75% | +18% cash leak pressure and major churn incidents |

Systems can increase Ops Capacity. More automation can therefore be bad if Operations architecture does not keep pace.

---

# 13. Debt and Line of Credit

Debt is a capital accelerator, not score.

## 13.1 Unlock

Base Line of Credit unlocks once:

```text
ARR >= $500,000
```

## 13.2 Credit limit

```text
LOC_LIMIT
=
min(
  15% x ARR,
  1% x Current Valuation
)
```

Examples:

At $1M ARR and 10x valuation:

```text
15% ARR = $150K
1% valuation = $100K
LOC = $100K
```

At $10M ARR and 20x valuation:

```text
15% ARR = $1.5M
1% valuation = $2.0M
LOC = $1.5M
```

If growth collapses and the valuation multiple falls, credit availability can shrink.

## 13.3 APR

```text
APR
=
10%
+ 10% x Utilization
+ Multiple Risk Premium
```

Risk premium:

| Valuation multiple | Risk premium |
|---:|---:|
| 2x | +10 percentage points |
| 4x | +8 pp |
| 6x | +6 pp |
| 10x | +3 pp |
| 14x | +1 pp |
| 20x+ | +0 pp |

Example at 10x and 50% utilization:

```text
10% base
+5% utilization
+3% risk
=18% APR
```

Interest per monthly close:

```text
Monthly Interest
=
Debt x APR / 12
```

## 13.4 Over-limit state

If recalculated LOC Limit falls below outstanding Debt:

```text
New borrowing = disabled
APR += 6 percentage points
```

The player is not forced into an immediate repayment. The expensive over-limit state creates pressure to recover or repay.

## 13.5 Bankruptcy

If Cash becomes negative:

1. Draw any available credit automatically only if Auto Liquidity is enabled.
2. Otherwise show PAYABLES OVERDUE.
3. Start a 20-second grace countdown.
4. The player may draw debt, resolve a cost leak, raise funding, or reach the next monthly collection.
5. If Cash remains negative when the grace expires and no available liquidity exists, the run ends BANKRUPT.

---

# 14. Venture financing

Financing gives Cash and costs founder ownership. It never directly changes ARR, growth, multiple, or Valuation.

V1 uses 2026 US software fundraising data only as a calibration anchor. The formulas below are deterministic game rules, not investment advice and not claims that real startups are valued by these equations.

## 14.1 Pre-seed

V1 represents pre-seed as a post-money SAFE-style offer because post-money SAFEs dominate current US pre-seed fundraising.

Base SAFE cap anchor:

```text
$15M
```

Offer cap:

```text
SAFE_CAP
=
max(
  $15M x Founder History Modifier,
  75% x Current Game Valuation
)
```

Cash choices:

```text
$0.75M
$1.50M
$2.25M
```

Gameplay reserved dilution at cap:

```text
Reserved Dilution
=
Cash Raised / SAFE Cap
```

This immediate reservation is a deliberate game simplification. Real SAFE conversion can differ depending on the later priced round and deal terms.

## 14.2 Seed

Base 2026 calibration:

```text
Reference pre-money: $20.2M
Reference raise:      $4.1M
Reference post-money: $24.3M
```

Offer pre-money:

```text
PRE_MONEY
=
max(
  $20.2M x Seed History Modifier,
  65% x Current Game Valuation
)
```

Raise choices:

```text
$2.05M
$4.10M
$6.15M
```

Dilution:

```text
Dilution
=
Raise
/
(Pre-money + Raise)
```

## 14.3 Series A

```text
Reference pre-money: $65.6M
Reference raise:      $14.4M
Reference post-money: $80.0M
```

History no longer changes the reference valuation in V1.

Offer pre-money:

```text
max($65.6M, 65% x Current Game Valuation)
```

Raise choices:

```text
$7.2M
$14.4M
$21.6M
```

## 14.4 Series B

```text
Reference pre-money: $166M
Reference raise:      $25M
Reference post-money: $191M
```

Raise choices:

```text
$12.5M
$25.0M
$37.5M
```

Offer pre-money:

```text
max($166M, 65% x Current Game Valuation)
```

## 14.5 Ownership compounding

For a priced round:

```text
Ownership After
=
Ownership Before
x
(1 - Dilution)
```

Example:

```text
100% x 90% x 90%
= 81%
```

Never subtract dilution percentages directly across rounds.

---

# 15. Founder History

Founder History is a pre-run identity layer. It is chosen by the player. The game must never infer a real person's background from external data.

History does three things:

1. Unlocks an Origin Relic.
2. May alter pre-seed or seed financing terms where appropriate.
3. Weights complementary, off-meta upgrades more heavily so the player is encouraged to build beyond their obvious strength.

Fresh Founder ranked mode ignores all History bonuses.

## 15.1 History catalog

### Fresh Founder

Native room: none.

Origin relic: none.

Use for standardized ranked runs.

### Vibe Coder

Native room: Product.

Origin Relic: Ten-X Engineer.

Effect:

```text
First clean Product merge every 8 seconds advances its request one additional valid step if the required piece is already queued.
```

Complementary draft rooms:

```text
Marketing
Expansion
```

### Distribution Native

Native room: Marketing.

Origin Relic: Distribution Goblin.

Effect:

```text
Every third consecutive correct Marketing decision spawns one follow-up opportunity worth 0.5 GU.
```

Complementary draft rooms:

```text
Product
Retention
```

### Monetization Nerd

Native room: Monetization.

Origin Relic: Price Sense.

Effect:

```text
Perfect pricing zone is 20% wider for manual founder taps only.
```

Complementary draft rooms:

```text
Retention
Expansion
```

### Customer Obsessive

Native room: Retention.

Origin Relic: Inbox Zero.

Effect:

```text
First S1 Retention threat every 20 seconds is automatically resolved.
```

Complementary draft rooms:

```text
Marketing
Monetization
```

### Enterprise Operator

Native room: Expansion.

Origin Relic: Enterprise Whisperer.

Effect:

```text
First Exceptional Expansion fit on each account produces +0.25 GU additional Expansion ARR.
```

Complementary draft rooms:

```text
Product
Operations
```

### Systems Operator

Native room: Operations.

Origin Relic: Former SRE.

Effect:

```text
First Operations incident each quarter begins 75% revealed.
Starting Ops Capacity +1.
```

Complementary draft rooms:

```text
Marketing
Expansion
```

### Bootstrapper

Native room: capital efficiency.

Origin Relic: Default Alive.

Effect:

```text
Healthy-state scheduled operating costs -10%.
```

Complementary draft rooms:

```text
Marketing
Product
```

### Repeat Founder

Native room: cross-room systems.

Origin Relic: Raised Before.

Effect:

```text
First situation each quarter previews one downstream consequence before choice.
Pre-seed SAFE cap anchor +30%.
Seed pre-money anchor +15%.
```

Complementary draft:

```text
Cross-room System cards +20% appearance weight.
```

These fundraising modifiers are game mechanics. They should not be presented as universal real-world causal claims about founder backgrounds.

## 15.2 Contrarian drafting

For a History with complementary rooms:

```text
Complementary room card appearance weight +20%
Complementary room card cost -0.25 CU, minimum 0.5 CU
```

Buying three complementary upgrades in one run guarantees one Cross-Room System offer at the next quarter close.

This is the primary anti-meta incentive.

---

# 16. Run-upgrade shop

At quarter close:

- Show 3 cards.
- Player may buy 0, 1, or 2.
- First purchase costs listed price.
- Second purchase costs 1.5x listed price.
- One reroll per quarter costs 0.5 CU.
- Cursed upgrades cost 0 CU but are irreversible for the run.
- Base room automation tiers are purchased separately from the room automation panel and are never dependent on shop RNG after that room's automation line is unlocked.

V1 pool:

```text
30 room-specific upgrades
12 cross-room systems
6 cursed upgrades
= 48
```

---

# 17. Exact 30 room-specific upgrades

## Marketing

### Trend Radar
Rarity: Common
Cost: 1 CU

Reveal one additional hidden Marketing signal. Manual correct-choice combo grace +1 mistake before reset.

### Repurposer
Rarity: Uncommon
Cost: 2 CU

Each correct RIGHT or UP has a 25% seeded chance to create a follow-up card worth 0.5 Demand GU.

### Channel Router
Rarity: Uncommon
Cost: 2 CU
Complexity: +0.5

Marketing Agent throughput +30%. Does not affect founder throughput.

### Marketing Automation License
Rarity: Common
Cost: 1 CU

Installs Worker Marketing Agent if no Marketing Agent exists. If already installed, this card upgrades one tier for the incremental CU cost instead.

### Feedback Loop
Rarity: Rare
Cost: 3 CU
Complexity: +1

After five agent-correct Marketing choices, the next eligible card is automatically pursued. If the five-card set contained any Low-Quality Demand, the automatic pursuit is classified low-quality.

## Product

### Test Harness
Rarity: Common
Cost: 1 CU

TEST automatically attaches to every second IMPLEMENTATION, turning it VERIFIED without a manual drag.

### Worktrees
Rarity: Uncommon
Cost: 2 CU
Complexity: +0.5

Increase active Product request slots from 6 to 9 and allow two simultaneous piece spawns.

### Eval Gate
Rarity: Uncommon
Cost: 2 CU

First Product early-deploy mistake every 20 seconds is converted into a rework card instead of Churn Threat.

### Code Automation License
Rarity: Common
Cost: 1 CU

Installs or upgrades the Product Agent line.

### Auto Deploy
Rarity: Rare
Cost: 3 CU
Complexity: +1

VERIFIED requests deploy automatically after 1 second. No founder drag required.

## Monetization

### Pricing Research
Rarity: Common
Cost: 1 CU

Show the approximate center of the Perfect band before the cursor begins moving.

### Annual Plans
Rarity: Uncommon
Cost: 2 CU

A Perfect pricing result collects 75% of the resulting annualized ARR cohort immediately as Cash. That cohort does not contribute additional recurring Cash collections for the rest of the current quarter. ARR accounting is unchanged.

### Usage Metering
Rarity: Uncommon
Cost: 2 CU
Complexity: +0.5

Too Cheap result improves from 0.5 to 0.75 New Customer ARR GU. Each such result creates +0.05 CU Operations usage pressure.

### Pricing Automation License
Rarity: Common
Cost: 1 CU

Installs or upgrades the Pricing Agent line.

### Enterprise Packaging
Rarity: Rare
Cost: 3 CU

Perfect zone width -40%.
Perfect result becomes +2.5 New Customer ARR GU.
Too Expensive result creates +0.10 Churn Threat GU.

## Retention

### Knowledge Base
Rarity: Common
Cost: 1 CU
Complexity: +0.25

Automatically destroys every second S1 informational threat.

### Billing Retry
Rarity: Common
Cost: 1 CU

Failed-payment S1 threats automatically retry once after 2 seconds. Successful retry destroys the threat.

### Root Cause Fix
Rarity: Uncommon
Cost: 2 CU

Destroying three threats with the same cause suppresses that cause for 20 seconds.

### Support Automation License
Rarity: Common
Cost: 1 CU

Installs or upgrades the Support Agent turret line.

### Customer Health
Rarity: Rare
Cost: 3 CU

All Retention threats become visible 3 seconds before entering the battlefield. Founder-present turret range +20%.

## Expansion

### CRM Signals
Rarity: Common
Cost: 1 CU

Reveal one additional account need.

### Bundles
Rarity: Uncommon
Cost: 2 CU

Two compatible 1x1 modules may be packed into one grid cell. Conflicting modules cannot bundle.

### Seat Meter
Rarity: Uncommon
Cost: 2 CU

Accounts tagged Growing may accept one repeatable Seats module. Base Expansion cap +2 percentage points.

### Account Automation License
Rarity: Common
Cost: 1 CU

Installs or upgrades the Account Agent line.

### Partner Motion
Rarity: Rare
Cost: 3 CU
Complexity: +0.5

Exceptional Expansion fits create one qualified Marketing card worth 0.5 Demand GU.

## Operations

### Cost Explorer
Rarity: Common
Cost: 1 CU

Every Operations card begins 25% revealed.

### Observability
Rarity: Common
Cost: 1 CU
Complexity: +0.25

Incident category is visible before scratching begins.

### Queueing
Rarity: Uncommon
Cost: 2 CU
Complexity: +0.5

At Strain 1.00 to 1.25, agent reliability no longer falls. Excess work becomes visible backlog instead.

### Ops Automation License
Rarity: Common
Cost: 1 CU

Installs or upgrades the Ops Agent line.

### Orchestrator
Rarity: Rare
Cost: 3 CU
Complexity: +1

Ops Capacity +4.

---

# 18. Exact 12 cross-room systems

### Product-Led Growth
Rarity: Rare
Cost: 3 CU

Every third VERIFIED Product ship creates one Marketing card worth 0.5 Demand GU.

### Support to Roadmap
Rarity: Rare
Cost: 3 CU

Resolve three Retention threats with the same cause to create one prioritized Product Request. Completing it suppresses that cause for the rest of the quarter.

### Usage Signals
Rarity: Rare
Cost: 3 CU
Complexity: +0.5

Every five resolved Retention threats reveal one hidden need on the next Expansion account.

### Land and Expand
Rarity: Rare
Cost: 3 CU

Every third Perfect Monetization result guarantees one Expansion account within 15 seconds.

### Customer Advocacy
Rarity: Rare
Cost: 3 CU

Every second Exceptional Expansion fit creates +1 qualified Demand GU.

### Auto QA
Rarity: Rare
Cost: 3 CU
Complexity: +1

Product early-deploy consequences route first to Operations as S2 incidents. If resolved within 20 seconds, their Churn Threat is cancelled.

### FinOps Loop
Rarity: Rare
Cost: 3 CU
Complexity: +0.5

Resolve a runaway-agent Operations incident to permanently reduce that room's agent monthly cost by 10% for the run. Max 30% per room.

### Data Warehouse
Rarity: Legendary
Cost: 5 CU
Complexity: +2

Marketing and Monetization Agents share outcome signals. Both gain +8 percentage points reliability, capped at 98%.

### Capacity-Aware GTM
Rarity: Rare
Cost: 3 CU
Complexity: +1

Marketing Agents automatically stop pursuing cards if Product backlog exceeds 80% of Product capacity. They resume below 50%.

### Smart Router
Rarity: Legendary
Cost: 5 CU
Complexity: +2

Idle automated capacity contributes 25% of its throughput to one adjacent overloaded room using the adjacency order:

```text
Marketing -> Product -> Monetization -> Retention -> Expansion -> Operations -> Marketing
```

### Product Feedback Loop
Rarity: Rare
Cost: 3 CU

A failed Expansion fit creates a Product Request tagged Customer Need. Shipping that request removes the next identical Expansion conflict.

### Autonomous Revenue Loop
Rarity: Legendary
Cost: 5 CU
Complexity: +4

Completed automated Marketing output is automatically routed into Product, then Monetization, without waiting for founder room entry. Pipeline throughput +25% while all three connected agent lines are Stable or Strained. Effect disables automatically in Overloaded or Critical state.

---

# 19. Exact 6 cursed upgrades

Cursed cards cost 0 CU and cannot be removed during the run.

### Ragebait

```text
Marketing pursued output x2.5
35% of pursued Demand is Low-Quality
Monetized Low-Quality ARR creates +25% cohort value as Retention threat
```

### Ship on Red

```text
Product may skip TEST automatically
Product throughput +50%
Every unverified ship creates +0.50 Churn Threat GU and +0.10 CU Ops leak
```

### Dark Patterns

```text
Too Cheap and Too Expensive pricing results both produce at least +1.0 New Customer ARR GU
Every third converted activation creates +0.50 Churn Threat GU
```

### Oversell Enterprise

```text
Expansion ARR results x2
Fit <=0 creates +0.75 Churn Threat GU instead of +0.25
```

### YOLO Permissions

```text
All agent throughput x1.75
All agent Complexity x1.50
Wrong automated actions resolve immediately instead of waiting for review
```

### Leveraged Growth

```text
LOC Limit x2
APR +8 percentage points
Bankruptcy grace 20s -> 10s
```

---

# 20. Situation system

Base rate:

```text
1 to 2 meaningful situations per quarter
```

When a situation arrives:

- audible notification
- simulation slows to 0.25x
- player reads and chooses
- effects are deterministic
- return to full speed

GenAI may personalize nouns and wording but must never generate numerical effects.

## 20.1 V1 situation archetypes

1. Niche Community Mention: pursue for +2 qualified Demand GU and +0.10 CU spend, or ignore.
2. Search Ranking Shift: Marketing Agent reliability -15 pp this quarter, or spend 1 CU to restore.
3. Trend Saturation: UP marketing cost doubles for 30 seconds, RIGHT unchanged.
4. Community Backlash: apologize to remove 1 Low-Quality Demand GU at cost 0.25 CU, or exploit it for +2 Low-Quality Demand GU.
5. Competitor Clone Launch: +1 Retention Threat GU, but creates one Q>=4 Marketing card.
6. Launch Directory Feature: +3 Demand GU over 30 seconds and Product incoming workload x1.5.
7. Dependency Deprecation: Product piece spawn speed -30% until one S1 Ops incident is resolved.
8. Eval Regression: next three automated Product actions have reliability -20 pp, or pause Product Agent for 20 seconds.
9. Migration Against Wrong Schema: spawn one S3 Operations incident.
10. Security Report: spend 1 CU to resolve, or spawn +1 Retention Threat GU after 30 seconds.
11. Mobile Breakage: +2 Product Requests and +0.50 Retention Threat GU.
12. Top Customer Feature Request: ship tagged Product Request within 30 seconds to create an Exceptional Expansion opportunity.
13. Processor Fee Increase: monthly operating leak +0.10 CU until one Monetization opportunity is successfully completed.
14. High-Intent Pricing Window: one pricing opportunity with Perfect result +3.0 New Customer ARR GU and Perfect zone 50% narrower.
15. Annual Contract Request: successful pricing produces immediate Cash equal to 75% of resulting annualized ARR cohort.
16. Failed Payment Wave: spawn four S1 Retention threats.
17. Support Agent Hallucination: if Support Agent active, spawn one S3 and two S1 Retention threats.
18. Enterprise SSO Request: creates one Product Request and one locked Expansion opportunity that opens when shipped.
19. Procurement Discount Request: accept -25% ARR output for guaranteed Expansion success, or attempt normal packing with 5 seconds less time.
20. Account Champion Leaves: spawn one S2 Retention threat tied to highest-value Expansion cohort.
21. Recursive Agent Loop: +0.50 CU monthly leak until the associated S2 Ops incident is resolved.
22. Model Provider Price Cut: all agent monthly costs -15% for the rest of the quarter.
23. Rate Limit Incident: automated throughput -25% for 30 seconds unless resolved as S2 Ops.
24. Cloud Cost Spike: spawn one S3 Ops bill with +1.0 CU immediate cash exposure.

All base copy must be original. Third-party brand names, logos, slogans, or copied posts are not required for these archetypes.

---

# 21. First-run onboarding

The first run must teach every in-run system before normal failure rules can end the tutorial.

The first four quarters are curated but still interactive. Q5 becomes a normal seeded run.

## Q1: MAKE SOMETHING PEOPLE PAY FOR

Initially visible:

```text
Marketing
ARR
Valuation
```

First correct Marketing pursuit physically sends a Demand object toward Product.

Unlock Product.

First SHIPPED Product Request creates Activation.

Unlock Monetization.

First pricing success increases ARR.

At 50 seconds show first monthly close and reveal Cash.

Q1 end teaches:

```text
Demand -> Activation -> New ARR -> Cash -> Valuation
```

Guaranteed shop offers:

```text
Trend Radar
Test Harness
Pricing Research
```

The player pays with Cash. No free abstract upgrade currency is introduced.

## Q2: GROWTH CREATES PROBLEMS

Script one early Product mistake or bug consequence.

Unlock Retention by spawning a visible threat.

Script one operating bill.

Unlock Operations.

Force the player to leave a growth room to protect ARR or Cash.

Teach:

```text
successful growth creates downstream workload
```

## Q3: YOU CANNOT DO EVERYTHING

Increase workload enough that at least one room is clearly overloaded.

Guaranteed prompt inside the most neglected eligible room:

```text
AUTOMATE THIS?
```

Offer its Automation License.

On purchase:

- show the agent pointer playing the same interaction
- reveal Complexity
- reveal Ops Capacity
- show monthly agent cost

Do not explain automation before the player feels the workload problem.

## Q4: CAPITAL STRUCTURE

Unlock Expansion with an existing customer account.

Script ARR to be above the Line of Credit threshold if necessary for tutorial integrity.

Show one desirable upgrade the player cannot comfortably afford.

Reveal:

```text
Available Credit
APR
```

At quarter close, show the first pre-seed investor offer.

Display in one comparison surface:

```text
BOOTSTRAP
DRAW CREDIT
RAISE CAPITAL
```

If funding is selected, animate Founder Ownership changing immediately.

Teach Founder Stake Value.

## Q5: THE ROGUELIKE IS OPEN

Unlock:

- Growth Commitment choice
- Cross-Room System offers
- Cursed offers
- normal situation pool
- normal failure conditions

No more scripted tutorial behavior after the Q5 intermission.

## First-run ending

Whether the company wins or dies, the first result screen teaches the Holding Company meta layer and places this company into Slot 1 as run history.

---

# 22. Holding Company

The Holding Company is the meta-level equivalent of a room machine.

Hierarchy:

```text
HOLDING COMPANY
  -> COMPANIES
      -> SIX FUNCTIONS
          -> TACTILE WORK
```

Unlock after the first company run ends.

V1 starts with 2 company slots.

Slot 3 unlocks after two unicorn companies.

## 22.1 Parallel company rule

Only one company can receive direct founder interaction at a time.

Other active companies continue:

- agents
- recurring costs
- monthly collections
- incidents
- backlogs

The player may switch company tabs at any time.

## 22.2 No free synergy ARR

Holding Company synergies may create opportunities, visibility, or shared capacity. They may not directly add ARR.

V1 synergy examples:

### Shared Audience
Every five successful Marketing outputs in Company A create one qualified Marketing card in Company B.

### Shared Infrastructure
Resolving an Ops incident in Company A makes the next identical incident in Company B begin 50% revealed.

### Portfolio Cross-Sell
An Exceptional Expansion fit in Company A creates one Expansion opportunity for Company B if the account archetype is compatible.

### Shared Data
Company A may reveal one hidden signal on Company B's next Marketing or Expansion opportunity.

### Shared Vendor
A FinOps cost reduction earned in one company reduces the first identical agent cost in another company by 10%.

### Shared Reputation
Three consecutive high-quality quarters across the portfolio create one qualified Marketing card in every active company.

## 22.3 Portfolio score

Separate from run valuation:

```text
PORTFOLIO FOUNDER VALUE
=
SUM(
  company founder ownership x company valuation
)
```

Do not merge company ARR into one operating company ARR number.

---

# 23. Replayability

Replayability must come from system combinations, not content grinding.

V1 should support at least these emergent builds:

### Product-Led Singularity

```text
Test Harness
-> Worktrees
-> Auto Deploy
-> Product-Led Growth
-> Auto QA
```

### Ragebait Rocket

```text
Trend Radar
-> Repurposer
-> Ragebait
-> Feedback Loop
```

### High-ARPU Cult

```text
Pricing Research
-> Enterprise Packaging
-> Customer Health
-> Land and Expand
```

### NRR Machine

```text
Customer Health
-> Usage Signals
-> CRM Signals
-> Partner Motion
```

### Autonomous SlopCo

```text
Agents in every room
-> Orchestrator
-> Data Warehouse
-> Autonomous Revenue Loop
-> YOLO Permissions optional
```

### Leveraged Rocket

```text
Debt
-> automation acceleration
-> Leveraged Growth optional
-> survive credit re-rating
```

### VC Blitz

```text
fund every automation bottleneck early
-> faster scale
-> much lower founder ownership
```

A generalist build should be survivable but should not mathematically dominate specialized engines.

---

# 24. Founder Relic competitive rules

Fresh Founder leaderboard:

```text
No History
No Origin Relic
Standard unlock pool
```

Legacy Founder leaderboard:

```text
History allowed
Origin Relic allowed
```

Daily Seed leaderboard may specify either mode but must be identical for every participant.

Permanent progression should primarily unlock possibility space. It must not stack unbounded universal ARR multipliers.

---

# 25. Content and copyright rules

V1 base content must be original and brand-neutral.

Do not ship:

- copied social posts
- copied startup tweets
- copied ad copy
- recreated third-party product UI
- third-party logos as decorative content
- recognizable copyrighted characters
- copied game art or audio
- copied jokes or slogans

Acceptable factual startup concepts include generic terms such as:

- ARR
- MRR
- API
- SSO
- evals
- inference cost
- model provider
- rate limit
- cloud bill
- support bot
- security review
- annual contract
- usage pricing
- failed payment
- deployment
- database migration

Third-party company names may appear only when necessary for factual editorial content and must not be required for the base gameplay loop.

Zeitgeist content should be a later live-content layer with source verification, date stamping, and original paraphrase.

GenAI prompts must explicitly prohibit reproducing copyrighted passages, slogans, posts, song lyrics, character designs, logos, or trade dress.

---

# 26. GenAI role

GenAI is presentation and personalization, not balance authority.

Allowed generation:

- fictional company name
- fictional customer names
- fictional sender names
- product category flavor
- situation wording
- jokes
- room-specific nouns
- non-copyrighted visual motifs

Not generated:

- ARR deltas
- GU values
- CU costs
- probabilities
- upgrade effects
- situation effects
- agent reliability
- debt terms
- fundraising formulas
- valuation multiple

Every generated situation references a deterministic archetype ID.

If generation fails, the game uses authored fallback copy with identical mechanics.

---

# 27. Core schemas

```ts
type MoneyCents = bigint;
type BasisPoints = number;

type CompanyState = {
  quarter: number;
  quarterElapsedMs: number;

  arrCents: MoneyCents;
  quarterStartArrCents: MoneyCents;

  cashCents: MoneyCents;
  debtCents: MoneyCents;

  founderOwnershipBps: BasisPoints;

  valuationMultiple: 2 | 4 | 6 | 10 | 14 | 20 | 28 | 40;
  valuationCents: MoneyCents;

  growthUnitCents: MoneyCents;
  capitalUnitCents: MoneyCents;

  complexityMilli: number;
  opsCapacityMilli: number;

  rooms: Record<RoomId, RoomState>;
  agents: AgentInstance[];
  upgrades: string[];
  financingRounds: FinancingRound[];

  demandBacklogMilliGu: number;
  activationBacklogMilliGu: number;
  churnThreatMilliGu: number;
};
```

ARR bridge:

```ts
type ArrBridge = {
  startingArrCents: MoneyCents;
  newCustomerArrCents: MoneyCents;
  expansionArrCents: MoneyCents;
  churnedArrCents: MoneyCents;
  endingArrCents: MoneyCents;
};
```

Required invariant:

```text
ending
=
starting
+ newCustomer
+ expansion
- churned
```

Action resolution:

```ts
type ActionResolution = {
  room: RoomId;
  actionId: string;

  demandDeltaMilliGu: number;
  activationDeltaMilliGu: number;
  newCustomerArrDeltaCents: MoneyCents;
  expansionArrDeltaCents: MoneyCents;
  churnThreatDeltaMilliGu: number;

  cashDeltaCents: MoneyCents;
  complexityDeltaMilli: number;
  opsCapacityDeltaMilli: number;

  spawnedWork: WorkItem[];
};
```

Agent:

```ts
type AgentTier = 0 | 1 | 2 | 3 | 4;

type AgentInstance = {
  room: RoomId;
  tier: AgentTier;
  reliabilityBps: BasisPoints;
  throughputMilliFounder: number;
  complexityMilli: number;
  monthlyCostCents: MoneyCents;
};
```

Financing:

```ts
type FinancingRound = {
  stage: "preseed" | "seed" | "series_a" | "series_b";
  cashRaisedCents: MoneyCents;
  preMoneyCents?: MoneyCents;
  safeCapCents?: MoneyCents;
  dilutionBps: BasisPoints;
  ownershipBeforeBps: BasisPoints;
  ownershipAfterBps: BasisPoints;
};
```

Generated situation:

```ts
type SituationInstance = {
  archetypeId: string;
  generatedPresentation: {
    subject: string;
    sender: string;
    body: string;
  };
  choices: SituationChoice[];
};
```

The choice effects live in deterministic content data, not generated text.

---

# 28. Responsive canvas and installable PWA

V1 must be designed as a responsive web game and installable Progressive Web App from the first implementation pass.

This is a product requirement, not post-release polish.

## 28.1 Supported form factors

The same deterministic game must be fully playable across:

```text
mobile portrait
mobile landscape
tablet portrait
tablet landscape
desktop browser
desktop installed PWA
```

Minimum supported CSS viewport target for V1:

```text
320 x 568 CSS px
```

The layout must remain usable through large desktop displays. Do not assume a fixed maximum monitor size, but cap content width where needed so controls do not become excessively separated.

No core mechanic may require a specific orientation.

## 28.2 Do not scale the desktop game down

Responsive behavior means composition changes by available space.

Do not render a desktop six-room layout and shrink it until it fits a phone.

V1 presentation modes:

### Compact mobile portrait

```text
COMPACT ECONOMIC HUD
        ↓
ACTIVE ROOM CANVAS
        ↓
CONTEXT / OPPORTUNITY UI
        ↓
BOTTOM ROOM NAVIGATION
```

Only the active room needs to be visually dominant. Other rooms communicate urgency through badges, queue counts, alarms, and animation in navigation.

### Mobile landscape / tablet

Use the larger horizontal area for a persistent room rail or secondary company information while preserving a large active interaction area.

### Desktop

Use surrounding space for richer HUD, backlog visualization, automation state, cross-room flows, and room navigation. The active room still remains the primary interaction target.

Economic rules, spawn rates, timing, hit windows, and simulation difficulty must not change based on viewport.

## 28.3 Canvas coordinate contract

The simulation owns authoritative game state in logical coordinates.

The canvas owns only presentation and pointer-to-logical-coordinate projection.

Required flow:

```text
CSS container size
        ↓
responsive layout
        ↓
canvas backing store
        ↓
logical room coordinate transform
        ↓
pointer transform
        ↓
SIMULATION COMMAND
```

A resize, browser zoom, orientation change, PWA window resize, or device pixel ratio change must never:

- reset a room
- reroll an opportunity
- move an authoritative simulation object
- alter a timer
- change ARR
- change a replay result

Use a `ResizeObserver` or equivalent container observation. Never hard-code the canvas from `window.innerWidth` alone.

The canvas backing resolution should account for device pixel ratio for visual sharpness, with a performance-safe cap. V1 recommended cap:

```text
renderDpr = min(devicePixelRatio, 2)
```

The backing store may change resolution while logical room coordinates remain unchanged.

## 28.4 Pointer and touch interaction

Use Pointer Events as the common input layer for mouse, pen, trackpad-derived pointer input, and touch where supported.

Every gesture must work with one pointer:

```text
Swipe
Merge
Tap
Aim / Auto-fire
Drag / Pack
Scratch / Reveal
```

No V1 mechanic may require hover, right-click, keyboard shortcuts, multi-touch, or precision unavailable to a thumb.

Minimum interactive DOM target guideline:

```text
44 x 44 CSS px
```

Canvas hit targets must be tuned to achieve comparable practical touchability even when their visual bounds are smaller.

Prevent browser scrolling or text selection only inside active gesture surfaces where necessary. Do not globally break ordinary accessibility behavior without cause.

## 28.5 Safe areas and browser chrome

The shell must support notched and rounded-screen devices.

Use safe area insets where available:

```css
padding-top: env(safe-area-inset-top);
padding-right: env(safe-area-inset-right);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
```

Use an appropriate viewport configuration such as `viewport-fit=cover` when the implementation supports it.

Critical controls, bottom navigation, quarter timers, and financing actions must never sit underneath operating-system home indicators or browser chrome.

## 28.6 Responsive text and information hierarchy

Economic information must stay legible on small screens.

On compact layouts, prioritize:

```text
ARR
VALUATION
CASH
QUARTER / TIME
ACTIVE CRISIS STATE
```

Debt, ownership, multiple, Complexity, Ops Capacity, and detailed room metrics can expand from contextual panels rather than occupying permanent equal-width columns.

Use DOM UI for important readable text, buttons, menus, financing choices, tooltips, and accessibility labels whenever practical. Canvas text is acceptable for room-world presentation but must not be the only accessible representation of critical economic state.

## 28.7 Performance target

Target smooth interaction on mainstream modern mobile and desktop hardware.

Design target:

```text
simulation: deterministic 10 Hz or lower where safe
presentation: target 60 FPS
```

Rendering may degrade gracefully before economic simulation does.

Permitted adaptive presentation reductions include:

- fewer particles
- fewer decorative automation cursors
- reduced trails
- lower canvas DPR cap
- reduced camera effects

Never alter economic throughput, opportunity timing, agent reliability, or action windows as a performance adaptation.

## 28.8 PWA requirements

V1 ships as an installable Progressive Web App.

Required PWA surface:

- valid web app manifest
- app name and short name
- application icons suitable for supported install surfaces
- standalone display mode where supported
- theme and background colors consistent with the product shell
- service worker or framework-equivalent app-shell caching
- installable behavior on supported desktop browsers
- Add to Home Screen compatible mobile experience where supported
- deterministic fallback when network personalization is unavailable

The game must remain fully playable without GenAI or network-generated situation copy.

After the application shell and static game content have been successfully cached, a standard single-company run should be able to continue through a temporary network loss.

Network-only features may degrade separately.

## 28.9 Persistence

An installed PWA must feel like an application rather than a disposable web page.

Persist at minimum:

- active run snapshot
- seed
- action log / replay checkpoints
- unlocked Founder Histories and relic metadata
- settings
- reduced-motion choice
- audio choice
- Holding Company state once unlocked
- content and balance versions

Use a versioned persistence layer appropriate for structured game state, preferably IndexedDB or an equivalent abstraction.

Never depend only on React component state or an in-memory store for an active run.

A tab refresh, PWA restart, mobile app switch, or accidental browser close should not destroy a valid saved run.

## 28.10 PWA update safety

A new service worker or client bundle must not silently replace the running game during an active quarter.

If an update is available:

1. download it in the background where supported
2. keep the current compatible client running
3. offer activation at a safe boundary such as an intermission, main menu, or next launch
4. persist the run before activation
5. migrate versioned saved data deliberately

If an old replay requires a prior balance version, retain its version metadata. Never claim deterministic parity after silently changing balance data.

## 28.11 Install prompts

Do not interrupt initial onboarding with an install request.

An install affordance may appear after the player has experienced meaningful value, such as:

- after Q1 close
- after the first run
- from Settings / menu

Use browser-native install events when available and a lightweight platform-specific explanation when they are not.

Never block gameplay behind installation.

---

# 29. Simulation findings used to lock V1

The provided balance harness runs Monte Carlo quarter-level simulations across:

- seven build archetypes
- three founder execution skill assumptions
- financing paths
- automation and complexity
- random market, bug, churn, cost, and catastrophe situations
- founder-history sensitivity
- growth commitment feasibility

At standard modeled skill, the current calibration produces these directional unicorn rates by Q16 before enforcing a player-chosen Growth Commitment:

| Build | Unicorn rate | Median unicorn quarter when successful |
|---|---:|---:|
| Balanced generalist | about 15% | Q16 |
| Product-led | about 93% | Q16 |
| Ragebait | about 36% | Q16 |
| NRR machine | about 53% | Q16 |
| Autonomous | about 68% | Q16 |
| Debt growth | about 97% | Q15 |
| VC blitz | 100% in the model | Q14 |

Interpretation:

- specialization is required
- Product is currently the strongest bootstrap path
- Ragebait is genuinely risky
- NRR and autonomous paths are viable
- financing accelerates automation
- VC is the fastest modeled path but materially dilutes ownership
- generalist play is deliberately weak as an endgame strategy

This does not prove fun. Human playtesting must still tune tactile timing, comprehension, perceived fairness, and upgrade excitement.

The simulator intentionally treats rational debt use as safer than reckless player behavior. The Leveraged Growth curse and over-limit system create the high-risk debt fantasy in actual play.

---

# 30. Factual grounding notes

V1 financing calibration was checked against public 2026 US startup data.

Key anchors used:

- Carta, July 2026: software seed median around $24.3M valuation on $4.1M raised, with roughly 18% median dilution.
- Carta, July 2026: Series A median around $80M on $14.4M raised.
- Carta, July 2026: Series B around $191M on $25M raised.
- Carta, August 2026: post-money SAFEs dominate US pre-seed fundraising, and a $15M cap is a reasonable reference point for the $1M to $2.4M check-size band in recent data, while larger AI pre-seed rounds can be much higher.
- SVB and other startup lenders describe recurring-revenue lines and venture debt as products underwritten on company-specific recurring revenue, financing history, and risk. There is no universal real-world LOC formula, so the game's LOC equation is explicitly a stylized deterministic rule.

These numbers are calibration references, not promises of real financing terms.

---

# 31. V1 exclusions

Do not add before V1 core is fun:

- employees
- detailed boards
- preferred share classes
- liquidation preferences
- option pools
- acquisitions
- competitor simulation
- IPO mechanics
- token economies
- crypto mechanics
- real-money wagering
- multiplayer
- Twitch control
- paid power
- complex macroeconomics
- deep legal simulation
- real sponsors affecting balance

---

# 32. V1 acceptance criteria

V1 is not accepted until all are true:

1. All six rooms are individually understandable in under 20 seconds of interaction.
2. Every room action resolves to a deterministic economic consequence.
3. ARR bridge invariant passes automated tests on every tick and quarter close.
4. Expansion is never double-counted.
5. Operations costs never directly subtract ARR.
6. Valuation cannot change without ARR or the locked growth multiple changing.
7. Cash, Debt, Ownership, and Valuation are distinct visible systems.
8. Agents visibly perform the same interaction as founders.
9. Complexity can make over-automation harmful.
10. First run exposes Marketing, Product, Monetization, Retention, Operations, Expansion, Cash, upgrades, agents, Complexity, debt, venture funding, ownership, situations, commitment, cursed systems, and cross-room systems before normal failure rules begin.
11. At least five non-identical build families can reach unicorn in simulation and human test builds.
12. No single Fresh Founder build exceeds the next-best build by more than two median quarters after final playtest tuning.
13. Base content ships without dependence on third-party IP.
14. GenAI can be disabled without changing game mechanics.
15. Same seed plus same action log produces the same economic result.
16. Holding Company synergies create work or capacity, never free ARR.
17. Human playtests confirm at least one meaningful decision every 15 seconds on average after Q2.
18. Human playtests confirm that first-time users can explain how ARR, Cash, and Valuation differ after one run.
19. The full first run is playable at 320 x 568 CSS px without clipped critical controls or unreadable economic state.
20. All six rooms remain fully playable in mobile portrait, mobile landscape, and desktop layouts.
21. Resizing or rotating the viewport does not alter deterministic simulation state or replay output.
22. The app meets its PWA manifest, service-worker/app-shell, persistence, and standalone-install requirements on supported desktop and mobile install surfaces.
23. An active run survives refresh, application restart, and temporary network loss after required static assets have been cached.
24. PWA updates activate only at a safe boundary and never corrupt an active run.

---

# 33. Product sentence

A one-person-company roguelite where you manually play the work of building a startup, spend the cash it earns to automate yourself with agents, survive the complexity that automation creates, finance growth without giving away too much of the company, and race to a $1B valuation before the machine you built collapses.
