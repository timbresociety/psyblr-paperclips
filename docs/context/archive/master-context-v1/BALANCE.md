# SoloUnicorn balance and accounting contract

**Authority:** score, accounting, causal metrics, candidate parameters and validation.  
**Executable source:** `engine/candidate_profile.json`, `engine/metric_registry.json`, `engine/event_contract.json`, `engine/kernel.py`.  
**Status:** numerically specified candidate; not play-balance validated.

## Balance status

The current profile is a coherent starting point for implementation. It has explicit units, bounds, formulas, event order, seeded outcome resolution and reference fixtures. It has not been validated through a complete player-policy simulation or human playtest. Do not call a value “balanced” because it passes arithmetic checks.

The engine registry contains 244 definitions: 128 formulas and 116 state/control/aggregate inputs across run, founder, market, function, Operations, customer, company, loan, VC and task scopes. The complete catalogue is in `engine/METRIC_CATALOGUE.md`.

## North-star valuation

The score is a company valuation in integer cents:

```text
VALUATION = floor(ELIGIBLE_ARR × GROWTH_MULTIPLE × CAPITAL_QUALITY_FACTOR)
```

`ELIGIBLE_ARR` is the score-eligible current annualized subscription base. `GROWTH_MULTIPLE` is a bounded piecewise function of trailing growth. `CAPITAL_QUALITY_FACTOR` incorporates economic burn and dated payment exposure. Founder ownership is tracked as a consequence of equity, not substituted for the player's valuation objective.

### Eligible ARR

For every active account or homogeneous cohort:

```text
CONTRACTUAL_MRR = BASE_MRR + ADDON_MRR
CONTRACTUAL_ARR = 12 × CONTRACTUAL_MRR
ELIGIBLE_ARR = CONTRACTUAL_ARR if oldest unpaid due age <= 1,200 ticks else 0
```

An account can remain contractually active while becoming temporarily ineligible because of delinquency. A later valid collection can restore eligibility under the declared event contract. A written-off default retains an unresolved default marker and does not restore score eligibility. Leads, trials, unsigned deals, cash rewards, debt proceeds and equity proceeds do not count.

### ARR bridge

The trailing bridge must reconcile exactly:

```text
ARR_END = ARR_OPEN
        + NEW_ARR
        + EXPANSION_ARR
        - CONTRACTION_ARR
        - CHURN_ARR
        - ELIGIBILITY_LOSS_ARR
        + ELIGIBILITY_RESTORE_ARR
```

New, expansion, contraction, churn, eligibility-loss and restoration deltas are each assigned once. A Retention save removes a pending churn outcome; it does not add the saved ARR as new ARR. A cancellation removes the account's base and addon value. Cohort splits preserve origin-account lineage.

For retention reports, use endpoint values for opening accounts: if baseline ARR is `B` and closing contractual ARR is `R`, opening-cohort churn is `B` when `R=0`, contraction is `max(0,B-R)` when `R>0`, and expansion is `max(0,R-B)`. This avoids counting a temporary expansion and later cancellation as unrelated duplicated flows.

### Growth multiple

For trailing window `W` of 1,800 ticks, with shorter early windows weighted by evidence:

```text
growth_evidence = min(1, window_ticks / 1,800)
scoring_growth = (ARR_NOW - ARR_OPEN)
                 / max(1,200,000 cents, ARR_OPEN)
                 × growth_evidence
```

The candidate multiple knots are:

| Scoring growth | −100% | −50% | 0% | +25% | +50% | +100% | +200% | +400% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Growth multiple | 1× | 2× | 4× | 6× | 8× | 12× | 18× | 26× |

Interpolate linearly and clamp outside the endpoints. A zero opening ARR has `observed_growth = null`; scoring uses the declared denominator floor and evidence weight, never infinite growth. Bootstrap companies do not fail for missing an arbitrary growth commitment.

## Burn and capital quality

Economic burn is measured separately from cash timing:

```text
economic_deficit_per_month =
  max(0, COGS + OPEX + INTEREST - EARNED_REVENUE) / window_months

ongoing_burn_ratio = economic_deficit_per_month /
  max(10,000 cents, earned_revenue_per_month)
```

COGS includes service delivery and attributable work/retry costs. Opex includes function work/upkeep, base overhead and explicit bad debt. Upgrade installation and principal repayment are cash pressure, not operating expense. Interest is an operating/economic cost and a cash obligation.

The payment forecast covers 1,800 ticks under current signed contracts, current deployments, already-incurred costs, scheduled debt and accepted financing. Customer receipts are `amount × collection probability × 0.80` for the conservative expected path. Unsigned sales, conditional funding and speculative growth are excluded. Let `S` be the largest negative cash prefix and `D` the total mandatory obligations:

```text
shortfall_fraction = clamp(S / max(1, D), 0, 1)
capital_quality = clamp(1 / (1 + 0.4 × burn_ratio
                               + 1.5 × shortfall_fraction), 0.05, 1)
```

This is one joint adjustment. Do not additionally subtract direct “complexity tax,” duplicate retry penalties, a second VC penalty or every manifestation of the same cash gap.

Example: $1.2M eligible ARR, +50% scoring growth, 25% burn ratio and no forecast shortfall gives `8× × 1/1.1`, or **$8,727,272.72 valuation**. Higher growth can outweigh burn. A profitable company can still fail a payment if collections arrive later.

## Cashflow and billing

The monthly subscription model has these separate transitions:

| Transition | ARR | Earned revenue | Cash |
|---|---:|---:|---:|
| Contract accepted | Increases | 0 | 0 |
| Service delivered | 0 | Increases | 0 |
| Invoice issued | 0 | 0 | 0; receivable increases |
| Invoice collected | 0 | 0 | Increases; receivable decreases |
| Refund paid | 0 | 0 | Decreases |

Service accrual uses integer cents and carried remainder:

```text
earned_cents, remainder = divmod(monthly_contract_cents × elapsed_ticks + remainder, 600)
```

Invoices are monthly in arrears. Segment collection delay is 60/120/240 ticks; collection probabilities are 0.95/0.98/0.90; attempts are at most three, 120 ticks apart. Delinquency grace is 1,200 ticks. No annual prepay is enabled until a complete non-overlapping billing schedule exists.

Starting cash is **150,000 cents ($1,500)** and base overhead is **10,000 cents/month ($100)**. Agent upkeep and function upkeep are charged from actual online units and deployed ranks, even when utilization is throttled. Taking a unit offline removes its upkeep only from the next declared boundary.

## Debt and VC pressure

Debt is available at eligible MRR of at least **10,000 cents ($100/month)** and is capped at **3× eligible MRR minus existing principal**. Candidate terms are **18% nominal APR**, six monthly anniversary payments, declining principal, no prepayment in this baseline. Interest accrual is:

```text
interest_cents, remainder = divmod(principal_cents × 1,800 + remainder, 120,000)
principal_due = ceil(principal / months_remaining)
```

Principal repayment is not an expense. Unpaid scheduled interest or principal is a mandatory cash obligation.

One priced VC mandate is available at eligible ARR of at least **1,200,000 cents ($12,000/year)**. Candidate terms: pre-money = 4× eligible ARR, raise ≤25% of pre-money, ownership updates by `old_ownership × pre_money / post_money`. The mandate requires 50% ARR growth after each full 1,800-tick interval, with the baseline reset on success. Missing an accepted mandate is terminal. There is no VC mandate before acceptance, no bootstrap growth deadline and no post-miss debt resurrection.

## Functions and candidate axis vectors

The six functions share these candidate rank vectors:

| Axis | Rank 0 | Rank 1 | Rank 2 | Rank 3 | Rank 4 |
|---|---:|---:|---:|---:|---:|
| Craft batch/output | 1 | 2 | 4 | 8 | 16 |
| Scale base units | 1 | 2 | 4 | 8 | 16 |
| Automate speed/unit | 0 | .35 | .8 | 1.6 | 3.2 |
| Automate upkeep/unit/month | $0 | $30 | $70 | $180 | $500 |
| Luck mean multiplier | 1.00 | 1.01 | 1.02 | 1.03 | 1.04 |
| Luck standard deviation | 0 | .16 | .32 | .48 | .64 |

Upgrade installation costs are `$300 × 6^current_rank`: $300, $1,800, $10,800 and $64,800. Deployment takes five seconds. Extra online units cost $10/month each. Craft affects the useful output of a unit; Scale does not create additional founder hands. Automate buys execution speed and attention while producing rot and upkeep. Luck exposure is chosen between zero and the rank-equivalent value.

Manual seconds per attempt: Demand 2, Product 6, Monetisation 3, Retention 4, Expansion 6, Operations 5. The engine derives attempts, finite queue room, actual sampled outcomes, rework and costs. An expected rate is a planning diagnostic; it cannot directly credit ARR or cash.

## Strain, rot and rework

For a function with `n` online units, automation rank `a` and unit load `w`:

```text
coordination_load = n × w × (1 + 0.15a) + 0.04n(n−1)
ops_capacity = 12 + 4 × n_ops × (1 + 0.25 × craft_ops_rank)
instant_overload = max(0, total_load / ops_capacity − 1)
excess_strain = instant_overload + strain_backlog / ops_capacity
```

Speed factor is `1/(1+.35×excess_strain²)`. Technical error is `clamp(base_error+.08×excess_strain²+.45×rot²,0,.95)`. A technical failure adds 1.5 rework units and consumes the attempt's resource cost. Rework consumes capacity but awards no duplicate production.

```text
strain_backlog_next = max(0,
  strain_backlog + (total_load − ops_capacity)/600
  − 0.5 × actual_strain_repair_points)

rot_next = clamp(rot
  + auto_attempts × (.0008 + .0004a) × (1 + .5×excess_strain)
  + .025 × configuration_changes
  − .008 × actual_repair_points, 0, 1)
```

Default Operations allocation uses 1/8 of maintenance output for each function and 1/4 for strain. The seven allocations sum to at most 1. Incident response is a separate mode and does not repair rot in the same output.

## Customer model

There is one subscription model and three candidate segments:

| Segment | Base WTP/month | Service cost/month | Fit weights (speed, collaboration, control) | Collection probability / delay |
|---|---:|---:|---|---|
| Creator | $40 | $4 | .7/.2/.1 | .95 / 6 sec |
| Team | $150 | $18 | .2/.6/.2 | .98 / 12 sec |
| Enterprise | $800 | $120 | .1/.3/.6 | .90 / 24 sec |

```text
fit = need_speed×capability_speed
    + need_collaboration×capability_collaboration
    + need_control×capability_control

effective_wtp = base_wtp × (.4 + .6×fit) × (1 − .3×competition)
price_to_wtp = posted_price / max(1, effective_wtp)

paid_conversion = clamp(.85×(.3+.7×fit)
                         / (1 + price_to_wtp^4), 0, .95)
```

Paid conversion is zero when `price_to_wtp > 2`. Capability starts at .35/.15/.05 and one useful Product development output adds .02 to the selected capability, capped at 1. Successful shipping can add .05 defect exposure on an escaped-failure roll; a fix output removes .02 from one cohort.

Health starts at 70/100:

```text
health_change/month = 12×(fit−.6) − 15×defects − 10×overpricing
                     + 8×care − 5×incidents

churn/month = clamp(.01 + .12×(1−health/100)
                    + .04×overpricing + .05×defects + .02×competition,
                    .005, .35)
```

Convert monthly churn to a tick using `1−(1−p)^(dt_ticks/600)`. A threat has one save attempt and a 120-tick window. Expansion requires an active, score-eligible account aged at least 1,200 ticks, health ≥60 and an unused addon slot. Each customer has at most two slots; addon price is floor(base price×.25), and addon service cost rises by 30% of base service cost per addon.

## Validation requirements

The reference suite checks registry resolution, type/bound validation, deterministic RNG, modifier order, attention cardinality, finite queues, accumulated strain, Luck moments, ARR bridge, billing separation, duplicate events, collection timing, two-addon saturation, debt accounting, VC-only failure and mandatory payment precedence. `engine/verify.py` currently passes 51 checks.

Balance promotion requires actual policy simulations and human play sessions. Measure first-time and successful repeat-founder distributions separately. Record win/failure rate, active time, quarter, cash shortfall, debt/VC choice, build identity, neglected strain/rot, relic loadout and failure attribution. Do not call the 30–45 minute target, five build families or any relic effect validated until evidence exists.
