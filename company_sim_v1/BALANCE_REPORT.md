# V1 Balance Report

Status: quantitative baseline for implementation and playtesting.

This report summarizes the deterministic accounting checks and Monte Carlo balance harness that support `product_final.md`.

The simulation is a regression and calibration tool. It does not prove that a tactile interaction is fun, readable, or satisfying. Human playtests remain a release gate.

---

# 1. Canonical accounting checked by the harness

```text
ARR_END
=
ARR_START
+ NEW_CUSTOMER_ARR
+ EXPANSION_ARR
- CHURNED_ARR
```

Reporting subtotal:

```text
NEW_ARR
=
NEW_CUSTOMER_ARR
+ EXPANSION_ARR
```

Expansion is never added twice.

```text
VALUATION
=
ARR
x
LOCKED_GROWTH_MULTIPLE
```

```text
FOUNDER_STAKE_VALUE
=
FOUNDER_OWNERSHIP
x
VALUATION
```

Operations costs hit Cash rather than ARR. Debt and venture financing add liquidity rather than score.

---

# 2. Simulation scope

The provided baseline was generated with 1,000 runs per tested cell.

The batch covers approximately 37,000 simulated company runs across:

- seven build strategies across three founder-execution skill assumptions: 21,000 runs
- Growth Commitment feasibility across seven strategies: 7,000 runs, with five commitment thresholds evaluated against each run
- nine Founder History sensitivity cases: 9,000 runs
- independent constant-growth valuation crossing checks
- one deterministic first-run economic trace

The exact batch metadata is stored in `simulation_output/simulation_manifest.json`.

---

# 3. Standard-skill strategy results

At modeled founder skill `1.00`, before enforcing a player-selected Growth Commitment as a failure condition:

| Strategy | Unicorn by Q16 | Median unicorn quarter when successful | Median founder ownership | Median peak debt |
|---|---:|---:|---:|---:|
| Balanced generalist | 15.2% | Q16 | 100% | $0 |
| Product-led | 93.1% | Q16 | 100% | $0 |
| Ragebait | 36.7% | Q16 | 100% | $0 |
| NRR machine | 51.3% | Q16 | 100% | $0 |
| Autonomous | 69.1% | Q16 | 100% | $0 |
| Debt growth | 97.3% | Q15 | 100% | about $2.59M |
| VC blitz | 100% | Q14 | about 54.9% | $0 |

Interpretation:

- specialization is materially stronger than unfocused play
- Product-led is the strongest modeled bootstrap path
- Ragebait has meaningful downside
- NRR and automation-focused companies are viable alternate paths
- debt accelerates a build while preserving ownership
- VC is fastest in this calibration but gives up substantial founder ownership
- capital accelerates operating engines rather than directly creating ARR or valuation

These are not final difficulty promises. They are the starting calibration for interactive playtesting.

---

# 4. Growth Commitment result

Growth Commitment is a quarterly risk choice, not a constant campaign difficulty.

At standard modeled skill:

- 10% is broadly survivable for specialized builds
- 25% is sustainable for several specialized paths
- 50% is not a sensible baseline for bootstrap builds in this calibration
- VC Blitz can sustain 50% after Q4 in roughly 63% of modeled runs
- 75% and 100% sustained commitments are not baseline strategies

V1 therefore protects the curated onboarding period and lets players choose commitments quarter by quarter once the underlying engine is visible.

A high commitment should feel like a wager on the company the player has already built.

---

# 5. Founder History sensitivity

The baseline history tests show that founder backgrounds can alter viable paths without directly minting ARR.

Examples from the current harness:

| Founder History | Tested strategy | Unicorn rate | Median successful quarter |
|---|---|---:|---:|
| Fresh | Product-led | 93.4% | Q16 |
| Vibe Coder | Product-led | 96.5% | Q15 |
| Systems Operator | Autonomous | 76.8% | Q16 |
| Bootstrapper | Balanced | 29.7% | Q16 |
| Repeat Founder | VC Blitz | 100% | Q14 |

Founder Histories should primarily change:

- starting relic access
- pre-seed / Seed fundraising terms
- selected operating affordances
- upgrade-pool weighting
- incentives to try builds outside the obvious history meta

They must not directly add free ARR or valuation.

---

# 6. Valuation math check

Starting from $100K ARR and applying one constant quarterly growth rate, the independent crossing check gives:

| Constant quarterly growth | Locked multiple | First modeled unicorn quarter |
|---:|---:|---:|
| 10% | 6x | does not cross by Q24 |
| 25% | 10x | does not cross by Q24 |
| 50% | 14x | Q17 |
| 75% | 20x | Q12 |
| 100% | 28x | Q9 |
| 150% | 40x | Q7 |

This check validates the intended broad run pacing: exceptional engines can finish very early, strong growth can finish around Q9 to Q12, and slower companies may still be alive deep into the run without reaching unicorn status.

---

# 7. Known balance risks

## Bankruptcy is underrepresented in rational Monte Carlo policies

The current policy simulator records effectively no bankruptcies across the baseline cells because modeled strategies manage capital rationally.

The actual game must stress bankruptcy through:

- player over-borrowing
- cursed leverage upgrades
- uncontrolled agent cost growth
- over-limit LOC states after rerating
- unresolved Operations leaks
- poor timing of capital investments

Human and adversarial bot playtests should specifically target insolvency.

## Product-led is currently very strong

Product-led is intentionally viable, but it should not remain the only obvious non-financing solution after motor-skill and room-pressure tuning.

If human players discover Product dominance, adjust downstream workload and opportunity bottlenecks before simply reducing Product output.

## Financing must not become mandatory

Debt and VC are acceleration tools. At least five non-identical operating builds must retain plausible bootstrap or low-financing paths in the final balance.

## Viewport must never affect balance

The responsive/PWA implementation must preserve identical economic rules across mobile, tablet, desktop, and installed windows. Smaller screens may change composition, never opportunity timing, hit windows in logical game space, throughput, or agent behavior.

---

# 8. Required balance workflow during implementation

After any material change to:

- GU or CU scaling
- room throughput
- churn generation
- agent throughput or reliability
- Complexity or Ops Capacity
- upgrade costs
- debt limits or APR
- funding terms
- valuation multiple bands
- Expansion cap

run:

```bash
python simulate_v1.py --runs 1000 --out simulation_output
```

Then inspect:

```text
simulation_summary.csv
growth_commitment_feasibility.csv
history_sensitivity.csv
valuation_math.csv
first_run_economic_trace.csv
simulation_manifest.json
```

Do not tune solely toward equal win rates. Distinct strategies should have different risk, speed, ownership, debt, manual-skill, and automation profiles.

---

# 9. Human playtest questions the simulator cannot answer

Test directly:

- Is every room understandable in under 20 seconds?
- Does the user understand why an ARR movement happened?
- Does neglecting another room create readable pressure rather than random punishment?
- Does the player want automation before it is introduced?
- Are upgrade choices meaningfully different?
- Does financing feel tempting rather than mandatory?
- Does losing founder ownership feel consequential?
- Can a first-time player explain ARR, Cash, and Valuation after one run?
- Does mobile portrait feel like a first-class game rather than a compressed desktop version?
- Can every gesture be performed comfortably with one thumb or pointer?
- Does the installed PWA resume quickly and reliably?
- Does the player immediately want another seeded run after understanding why the previous run failed?

