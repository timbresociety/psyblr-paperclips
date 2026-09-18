# SoloUnicorn — quantitative engine contract v1

Candidate specification · 7 September 2026

**Successful repeat founders are supposed to have an easier game.** Successful runs may award permanent mechanical advantages; failed runs award no new relic power. This contract does not normalize away earned advantages or introduce a cap to preserve first-run difficulty. Relic achievement criteria, individual effects and quarter-shop content remain separate work.

The package defines **244 metrics: 128 executable expressions and 116 state, control or aggregate inputs**, with units, numeric types, defaults, bounds, writers, update phases, persistence and L0–L3 roles. It also defines entity schemas, state transitions, cash settlement order and seeded outcome resolution. These are candidate numbers, not a claim of achieved game balance.

This is a specification and reference calculation package. It does not implement the complete production game loop, dashboards, customer scheduler or full-run policy simulator. In particular, executable formula coverage does not prove a 30–45 minute win is attainable or that builds are equally competitive.

## 1. How to read the metric system

Level answers “how close is this to the win condition?” Metric type answers “how does the engine handle this value?” These are different classifications.

| Level | Meaning | Examples |
|---|---|---|
| L0 | Outcome | Valuation, first valid $1B timestamp |
| L1 | Direct score drivers and their combinations | Eligible ARR; scoring growth and its multiple; burn ratio; forecast shortfall fraction; capital quality |
| L2 | Business results feeding those drivers | New/churned/expanded ARR, earned revenue, collections, gross margin, obligations, retained cohort revenue |
| L3 | Operational causes and controls | Work clocks, skill ranks, queues, quality, strain, rot, customer health, prices, probabilities, financing terms |

| Engine treatment | Rule | Examples |
|---|---|---|
| Stored resource or stock | Changed only by a validated event; never recompute by rounding a HUD | Cash, debt principal, receivables, active customer counts |
| Capacity | Limits admissible work or inventory | Online units, queue slots, Ops coordination capacity, expansion slots |
| Rate | Integrate over time; carry fractional remainder | Work/second, service cost/month, earned revenue accrual |
| Probability/distribution | Sample once against a stable event ID; preserve seed | Technical error, conversion, churn, collection, Luck |
| Accumulated condition | Preserve history; explicit gain/recovery transitions | Strain backlog, context rot, rework, defects, incidents |
| Control | Validate player changes, then apply from a declared phase | Focus, price, throttle, maintenance allocation, risk exposure |
| Derived result | Compute from authoritative inputs; cannot be directly purchased | ARR, valuation, margin, runway, growth |
| Founder history | Persist across runs under success/failure rules | Successful runs, owned relics, earned starting effects |

There are not 244 numbers on the main HUD. The engine tracks them; the dashboard reveals explanations and capabilities progressively.

## 2. Complete metric sets

The full row-by-row list, including every formula and writer, is in **METRIC_CATALOGUE.md**. The JSON registry is authoritative when integrating the engine.

| Scope | Definitions | Contents |
|---|---:|---|
| Run and attention | 13 | Active clock, elapsed time, quarter index/deadline, work/inspection/finance/shop/idle time, first win, attention reconciliation |
| Founder history | 6 | Successes, failures, relic count, current success, award eligibility, starting cash bonus |
| Market | 11 | Three product capabilities, finite channel pool, competition, demand/WTP adjustments, reach and channel cost |
| Function template | 73 | Four skill ranks, units, focus, controls, queues, credits, attempt sequence, throughput, actual output/cost/loss counters, strain effects, rot, rework, Luck, deployment and HUD signature |
| Shared Operations | 12 | Load, capacity, present overload, accumulated strain, effective strain, repair budget and recovery |
| Customer/cohort | 37 | Count, contract price/addons, fit, WTP, conversion, health, churn/save, collection, eligibility, contribution and expansion |
| Company/accounting | 64 | ARR bridge, growth, earned revenue, cost categories, cash movements, receivables, burn, forecast, valuation, concentration, acquisition and retention reports |
| Loan template | 9 | Principal, APR, months remaining, carried interest, scheduled repayment/service, remaining borrowing capacity |
| VC mandate | 10 | Accepted terms, baseline, target, deadline, ownership, headroom and terminal breach |
| Work outcome | 9 | Eligible inputs, attempts, technical/domain successes, useful outputs, rework, cost and deadlines |
| **Total** | **244** | The 73 function definitions repeat for each of six functions; entity templates also repeat. |

IDs, invoice rows, account lineage, queue entries, event IDs and modifiers have separate schemas. They are necessary state structures, not independent valuation bonuses.

## 3. The score has four primitive drivers

The game score is a deliberately simplified company valuation in cents:

\[
V=\left\lfloor A\times M(g)\times Q(b,f)\right\rfloor
\]

**A — eligible ARR.** Sum 12 × active contractual MRR for accounts no more than 1,200 ticks past the oldest unpaid invoice due date. Addons count; unsigned leads and funding do not. Contractual ARR remains separately visible when a delinquent account is excluded from the score.

**g — scoring growth.** Over the trailing 1,800 ticks, or elapsed active time if shorter:

\[
g=\frac{A_{now}-A_{open}}{\max(1{,}200{,}000,A_{open})}
\times\min\left(1,\frac{windowTicks}{1800}\right)
\]

The denominator floor is $12,000 ARR, expressed in cents. This avoids infinite percentage growth from zero and discounts very short evidence windows. Observed percentage growth is a separate diagnostic and is `null` when opening ARR is zero.

| g | −100% | −50% | 0% | +25% | +50% | +100% | +200% | +400% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| M(g) | 1× | 2× | 4× | 6× | 8× | 12× | 18× | 26× |

Interpolate linearly between knots and clamp outside them. This is a candidate game curve, not a real-world valuation model or a borrowed Balatro formula.

**b — ongoing economic burn ratio.**

\[
b=\frac{\max(0,COGS+Opex+Interest-EarnedRevenue)/windowMonths}
{\max(10{,}000,EarnedRevenue/windowMonths)}
\]

The denominator floor is $100/month. Installation purchases and principal repayment are not operating expenses; their cash pressure appears in the cash ledger and dated forecast. Work/retry costs belong to one cost category each.

**f — unfunded payment exposure.** Project dated obligations and expected collections for 1,800 ticks at current contracts and deployment. Use 80% × collection probability for customer receipts; include committed capital only. No speculative future customers, unsigned funding or future upgrade choices. Let S be the largest negative cash prefix and D the sum of mandatory obligations:

\[
f=\operatorname{clamp}\left(\frac{S}{\max(1,D)},0,1\right),\qquad
Q=\operatorname{clamp}\left(\frac{1}{1+0.4b+1.5f},0.05,1\right)
\]

Limited runway and financing dependence enter through dated shortfall. There is no additional arbitrary “VC penalty,” “agent penalty,” or direct Ops score bonus. Debt interest affects b; debt repayments affect f. Cash raised can improve coverage without manufacturing ARR.

**Example:** $1.2M ARR, +50% growth, a 25% economic burn ratio and no forecast shortfall produces an 8× growth multiple, Q=1/1.1 and **$8,727,272.72 valuation**. Stronger growth can outweigh a burn discount. Positive earnings alone do not guarantee enough cash to pay a bill.

## 4. Each function has a numerical path to valuation

All probabilities below are clamped to their registry bounds. All successful outputs consume eligible inputs; they cannot be created by updating a progress bar alone.

| Function | L3 work and controls | L2 result | How it affects L1 |
|---|---|---|---|
| Demand | Channel pool/reach/cost, segment mix, qualification probability, Craft/Scale/Automate/Luck | Qualified opportunities and attributed acquisition cost | More possible new ARR; spend raises burn before conversion |
| Product | Three capabilities, weighted segment fit, activation probability, defects, fix/develop allocation | Activated trials; better conversion, health and service quality | More collectible ARR/growth; development and failures cost cash |
| Monetisation | Posted price, price/WTP, paid conversion, accepted renewal price | New contracts, base MRR, price contraction/expansion | Sets recurring revenue per payer; aggressive prices reduce conversion and health |
| Retention | Health, dated churn threats, care coverage, save probability and discount | Churn ARR, saved ARR at risk, GRR/NRR, concession losses | Preserves ARR/growth; care costs money and discounts reduce price |
| Expansion | Customer maturity, health, two eligible addon slots, attach probability | Expansion ARR, addon service cost and contribution | Raises ARR within actual account demand; cannot expand delinquent or ineligible customers |
| Operations | Coordination load/capacity, accumulated strain, per-function rot/rework, finite repair allocation | Useful throughput, fewer defects/incidents, lower waste | Improves actual delivery and economics through the other functions; its own upkeep consumes cash |
| Finance | Billing schedule, collection attempts, reserves, dated bills, debt amortization, accepted VC targets | Cash, receivables, interest, principal, runway, ownership | Changes burn/coverage and survival; no Craft/Scale/Automate/Luck tree for money creation |

Candidate market: one monthly subscription with three customer segments. At perfect fit, pre-competition willingness to pay is **$40 creator, $150 team, $800 enterprise**. Monthly service costs are **$4, $18, $120** respectively. Different needs weight speed/collaboration/control; they do not create three billing models.

For a segment:

\[
fit=\sum_{j=1}^{3}needWeight_j\,capability_j
\]
\[
WTP=WTP_{base}(0.4+0.6fit)(1-0.3competition)
\]
\[
p_{paid}=\frac{0.85(0.3+0.7fit)}{1+(price/WTP)^4}
\]

Paid conversion is **zero if price/WTP > 2**. There is no positive conversion floor at arbitrary prices. This prevents “sell one impossibly expensive subscription” from replacing company building.

Capabilities start at **0.35 speed, 0.15 collaboration, 0.05 control**. One useful Product development output adds **0.02** to the selected capability, capped at 1. Every successful shipping attempt can also add **0.05** defect exposure under its declared escape probability. One fix output removes **0.02** from one cohort.

Customer health starts at 70/100. Its monthly change is:

\[
\Delta H=12(fit-.6)-15defects-10overpricing+8care-5incidents
\]

Monthly churn probability is:

\[
p_c=\operatorname{clamp}(.01+.12(1-H/100)+.04overpricing+.05defects+.02competition,.005,.35)
\]

For a tick, use **1−(1−p_c)^(1/600)**. Sample a new threat only for a customer without an existing one. A threat has a **12-second rescue window** and one save attempt. A save preserves the contract; it does not award its ARR again. Care covers a customer for one financial month and cannot stack beyond full coverage.

The event contract specifies the other probability equations, domain eligibility, actual cost ownership and state transitions. Expected work output is not guaranteed conversion, revenue or cash.

## 5. Four axes, four different mechanics

Ranks 0–4 use the following candidate vectors:

| Axis | Numerical change | Cost/constraint |
|---|---|---|
| Craft | Output batch = **1, 2, 4, 8, 16** per successful work attempt | Same eligible market/input constraints; larger batches cannot create nonexistent customers |
| Scale | Base unit capacity = **1, 2, 4, 8, 16** | More coordination load; each extra online unit costs $10/month before automation upkeep |
| Automate | Autonomous speed/unit = **0, .35, .8, 1.6, 3.2** × that function's base manual rate | Upkeep/unit/month = **$0, $30, $70, $180, $500**; actual automated work generates rot |
| Luck | Mean multiplier **1+.01r**, standard deviation **.16r**, with r=rank×chosen exposure | Wider tails; 40% of variance comes from a shared exposure shock |

Manual seconds/attempt: Demand **2**, Product **6**, Monetisation **3**, Retention **4**, Expansion **6**, Ops **5**. Founder work is hold-to-work with a measured engagement duty cycle. Only one function can receive founder execution at a time; Scale does not create extra founder hands. Before automation, additional lanes primarily provide buffers and routing capacity.

For each function, let n be online units, a automation rank and w its declared load weight:

\[
Load_f=nw(1+.15a)+.04n(n-1)
\]
\[
Capacity_{ops}=12+4n_{ops}(1+.25Craft_{ops})
\]
\[
x=\max(0,Load/Capacity_{ops}-1)+StrainBacklog/Capacity_{ops}
\]

Speed is multiplied by **1/(1+.35x²)**. Technical failure probability is **clamp(baseError+.08x²+.45rot²,0,.95)**. One failure adds **1.5 rework units**. Rework consumes capacity and paid resources without awarding production again.

At every 0.1-second tick:

\[
StrainBacklog'=\max(0,StrainBacklog+(Load-Capacity)/600-.5\times actualStrainRepairPoints)
\]

Thus small overload initially hurts a little, prolonged overload accumulates, and throttling does not instantly erase the backlog.

Per-function rot becomes:

\[
rot'=clamp(rot+AutoAttempts(.0008+.0004a)(1+.5x)+.025ConfigChanges-.008RepairPoints,0,1)
\]

Ops spends one finite output budget across six rot targets and accumulated strain. Default allocation is **1/8 to each function and 1/4 to strain**. The seven shares must sum to at most 1. Incident-response output is a separate mode; it does not also repair rot for free.

For Luck, independently choose shared and local signs s,e ∈ {−1,+1} with probability 1/2 each:

\[
Z=1+.01r+.16r(\sqrt{.4}s+\sqrt{.6}e)
\]

At rank 4, raw mean is **1.04**, standard deviation **0.64**, and range approximately **0.1395–1.9405**. The shared sign persists for a **20-second epoch** across units/functions assigned to that exposure group. Adding agents cannot average away all this component.

Raw positive expectation does not guarantee positive realized benefit after finite-demand caps: upside may be wasted while downside still lands. The registry reports that difference. Luck exposure can be reduced to zero; an earned rank does not force every subsequent task to use maximum risk.

## 6. Revenue and cash are separate ledgers

| Event | ARR | Earned revenue | Cash | Other change |
|---|---:|---:|---:|---|
| Accept $100/month subscription | +$1,200 | 0 | 0 | Start active contract |
| Deliver one financial month | 0 | +$100 | 0 | +$100 unbilled service |
| Invoice delivered service | 0 | 0 | 0 | Unbilled −$100; receivable +$100 |
| Collect invoice | 0 | 0 | +$100 | Receivable −$100 |
| Borrow $300 | 0 | 0 | +$300 | Principal +$300 |
| Repay $50 principal | 0 | 0 | −$50 | Principal −$50; not an expense |
| Pay $4.50 interest | 0 | 0 | −$4.50 | Interest is recognized separately as expense |
| Raise equity | 0 | 0 | +accepted cash | Ownership falls; accepted growth mandate starts |

The candidate starts with **$1,500 cash** and **$100/month base overhead**. Subscription billing is monthly in arrears. First collection attempts occur **6, 12 or 24 real seconds after invoicing**, by segment, with success probabilities **95%, 98%, 90%**. There are at most three attempts, spaced **12 seconds** apart. Those probabilities and dates determine cash conversion; collected cash does not equal ARR/12 by assumption.

Debt is limited to **3× eligible MRR minus existing principal**, available from $100 eligible MRR. Candidate terms: **18% nominal APR, six monthly anniversary payments**, declining principal, no prepayment. Principal due is ceil(principal/months remaining); monthly interest carries fractional cents. There is no growth-failure rule attached to debt.

Candidate VC is available from **$12,000 eligible ARR**. A single priced round offers pre-money = **4× eligible ARR**, with raise size at most **25% of pre-money**. Accepting the maximum leaves the founder with 80% of their previous ownership. The mandate requires **50% ARR growth after each full three-month interval**; meeting it resets the baseline and clock, without awarding another cash injection. A missed accepted mandate is terminal. These are game terms, not a model of standard venture contracts.

The score measures company valuation, not the founder's equity value. Dilution is tracked as a company-simulation consequence; it is not a second win target silently added to the user's objective.

Bootstrap companies have no growth deadline. Competition increases **0.025 per quarter from 0.10 to a cap of 0.85**, affecting qualification, WTP and churn. A stable company can remain alive below $1B. A 45-minute wall-clock timeout is not an automatic loss.

## 7. What roguelike engines contribute

The useful parallel is explicit state, operation order, constrained resources, typed effects and readable failure. Similar vocabulary alone does not make the company game a roguelike.

| Reference | Evidence reviewed | Application to SoloUnicorn |
|---|---|---|
| Balatro ecosystem | Steamodded documents saved card-specific state, named Chips/Mult/XMult effects and distinct calculation contexts including scoring and end-of-round events. | Store local capability state separately from score; distinguish additive and multiplicative effects; activate effects only in their declared phase. This is modding-interface evidence, not access to Balatro's private source. |
| Shattered Pixel Dungeon | Its public character code separates health/capacity/speed and buff state. Hunger has numeric thresholds, carried fractional damage and serialized state. | Cash is a resource, capacity is a limit, rot/strain are accumulating conditions; small per-tick effects carry remainders and persist across saves. |
| Brogue | Developer documentation distinguishes survival resources, scoring and equipment changes. The 1.7.5 notes describe fixed-point arithmetic for save/replay portability. | Use different roles for cash, valuation and capability; make rounding and reproducibility deliberate. These older notes do not establish every current Brogue fork's behavior. |
| How Many Dudes | The official product description emphasizes unit families and combinations with relics/trinkets across escalating encounters. | Functions need complementary roles, and visible builds should change how pressure is handled. The public description does not disclose numerical engine formulas to copy. |

Sources: [Steamodded calculation API](https://docs.smods.dev/API%20Documentation/Calculate-Functions/), [Shattered Pixel Dungeon character source](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/Char.java), [Hunger source](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/buffs/Hunger.java), [Brogue developer documentation](https://sites.google.com/site/broguegame/), [How Many Dudes official listing](https://store.steampowered.com/app/3934270/How_Many_Dudes/).

The resulting modifier order is **flat additions → summed percentage increases → multiplicative factors → ordered overrides → bounds → integer conversion**. Within a phase, sort by priority then stable source ID. Example: base 100, +20, +20%, ×2 resolves to **288**. A tooltip read never consumes randomness. Financing or an upgrade cannot directly overwrite valuation.

Run-specific opportunities and their combinations still need their later content pass. This package establishes the rules those effects must obey; it does not substitute random stat growth for build decisions.

## 8. Clock, progression and visibility

The candidate uses **10 ticks/second, 60 seconds/financial month, 180 seconds/quarter**. Fifteen quarters therefore occupy 45 active minutes; this is a pacing hypothesis, not evidence that successful roguelikes share an optimal duration.

The company runs during metrics inspection, finance and quarter-shop decisions. Those activities occupy founder attention. Application suspension saves the state and advances no simulated time; there is no offline income or hidden catch-up debt in this candidate.

Each axis purchase costs **$300×6^currentRank** and deploys after **5 seconds**. That gives $300, $1,800, $10,800 and $64,800 for the four purchases. A changed rank must reveal its operational result:

| Axis | Visible tier achievement |
|---|---|
| Craft | Work card shows the newly available batch: 2, 4, 8, 16 |
| Scale | Lane/capacity view exposes the newly available unit count and its load |
| Automate | Autonomous execution becomes visible with current speed, running cost and rot |
| Luck | Distribution preview shows the new mean, spread, exposure and shared-risk epoch |

Start with a plain workbench, cash, valuation, ARR and next-payment warning. Expose richer queues, routing, cost detail and automation controls when those capabilities exist. Founders need access to a lethal bill or accepted VC deadline from the moment it exists; such information is not a purchasable HUD reward.

## 9. Verification and remaining balance work

The reference suite passes **51 correctness checks**, covering formula coverage and bounds; monetary accrual; event idempotency; finite outputs; preserved attention; finite Ops allocation; accumulated strain; Luck moments and reproducibility; impossible-price rejection; debt accounting; VC-only growth failure; and mandatory cash failure before a win award. Exact results and candidate snapshots are in **evidence/validation.json** and **evidence/scenarios.json**.

The financial reference reducer intentionally assumes homogeneous, score-eligible cohorts. The production adapter must implement the declared cohort splitting, delinquency linkage, full cost ledger and tick scheduler. It must pass the fixtures; the reducer is not a replacement for those components.

Next calibration needs actual policy simulations and player runs. Record success rate, first-$1B time, failure reason, neglected strain/rot, cash shortfall, acquired ranks, financing choice and founder history. Report first-run and successful-repeat-founder distributions separately so intended easier reruns remain visible. Do not rebalance away that advantage by default.

No benchmark optimal duration, win-rate target or relic balance result has been invented here. The numerical contract makes those questions measurable.

## Package contents

| File | Purpose |
|---|---|
| METRICS.md | Readable engine specification and research parallels |
| METRIC_CATALOGUE.md | Every tracked metric, level, unit, bounds and equation/writer |
| candidate_profile.json | Concrete, versioned numerical values |
| metric_registry.json | Authoritative 244-definition registry |
| state_schema.json | Input/entity interchange schemas |
| event_contract.json | Ordered phases, exact transition rules and input bindings |
| IMPLEMENTATION.md | Integration boundary, eligibility, scheduler and precision requirements |
| kernel.py | Formula evaluator, seeded work resolution, modifiers, forecasts and financial reference |
| tests/test_contract.py | Meaningful correctness checks |
| verify.py | Reproducible validation and example generation |
| evidence/ | Actual check results, numerical scenarios and source provenance |

Run `python3 verify.py` from the package directory. Regenerate the catalogue and contract after a deliberate source change with `python3 emit_contract.py`, then verify again. The package uses Python's standard library.
