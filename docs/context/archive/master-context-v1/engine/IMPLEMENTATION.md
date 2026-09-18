# Integration contract and limits

The registry and profile define one candidate ruleset. `kernel.py` executes formulas, seeded work proposals, modifiers, cash forecasts, and a small financial transaction reducer. `event_contract.json` specifies the remaining production scheduling and adapters. It is not executable pseudocode disguised as a finished game.

## Source of truth

Persist the run seed, profile hash, current tick, event cursor, every declared mutable state field, fractional credits/remainders, entity IDs, origin account lineage, contracts, receivables, obligations and accepted financing. Keep founder-owned effects separately. Recompute derived metrics after loading; never restore a rendered valuation as authoritative state.

The JSON Schema accepts partial snapshots to make isolated fixtures convenient. A production save must have an explicit versioned migration and complete required state. Do not silently load a missing cash field with its validation default.

Function output counts must be filtered by both function and mode. Product development points, trials activated and defects repaired are different output units; combining their conversion ratios would be meaningless. The function template is reusable for those filtered reports. Cumulative founder seconds by function must sum to the run's work_seconds.

`company.*` inputs are produced from the ledger, cohorts and window aggregator. Their binding rules are in `event_contract.json`. An ARR delta goes into exactly one bridge bucket. An ineligible account's contractual price increase is not eligible expansion ARR; later restoration contributes its entire then-eligible amount in the restoration bucket. Preserve the full event bridge even when more than one event lands in a tick.

For GRR/NRR, define each opening account's baseline B and closing contractual ARR R. Opening-cohort churn is B for R=0; contraction is max(0,B−R) for R>0; expansion is max(0,R−B). These are net endpoint amounts. Counting every temporary expansion followed by cancellation can otherwise make gross retention negative. Cohort splits retain origin IDs.

## Work eligibility and routing

One worker attempt is a clock completion. A domain input is a prospect, trial, customer, addon slot or repair/development point. These units must not be conflated.

| Mode | Eligible room, before finite queue reservations |
|---|---|
| Demand reach | Remaining persons in the selected channel's current monthly pool |
| Product develop | ceil((1−selected capability)/0.02), clipped >=0 |
| Product activate | Count of qualified, unexpired, unconsumed opportunities |
| Product fix | Sum ceil(defect_exposure/0.02) over targeted cohorts |
| Monetisation sell | Count of activated, unexpired trials without a previous offer attempt |
| Retention save | Count of open threats without a previous save attempt |
| Retention care | Count of active customers without current care coverage |
| Expansion | Sum candidate expansion_eligible_slots; one customer/slot cannot be reserved twice |
| Ops maintain | ceil(max positive-weight repair requirement), where a function requirement is rot/(.008×weight), strain requirement is backlog/(.5×strain weight); zero-weight targets are excluded, and empty maximum is zero |
| Ops incident | Sum ceil(incident_exposure/.02) over targeted cohorts |

Development/maintenance/fix modes generate virtual jobs only up to those deficits. They cannot store repair output or perfect-fit development for future use. Founder selects one mode/target policy per function; agents use that same declared routing policy until changed.

Queue capacity is measured in worker attempts. Estimate required queued work as ceil(eligible room/max(1,nominal batch)), limited to available queue capacity. Actual output reservations use the maximum allowed Luck batch before the attempt, then return unused reservations. Craft and Luck resolve actual domain attempts; a failed technical attempt consumes paid work and adds rework, while an unsuccessful conversion consumes its attempted prospect. Downstream capacity rejections are counted separately.

Demand's nominal batch is Craft batch × channel reach. Its channel cost replaces the generic Demand attempt cost. The generic function-rate snapshot describes work output before these domain transformations. When displaying cost forecasts for a non-community channel, pass that channel's attempt cost in the function context/profile copy. Do not charge both prices.

Track manual and autonomous work clocks separately so realized autonomous attempts, not a percentage of expected output, generate rot. Subtract the configured rework reservation from available service capacity, retain each clock's fractional remainder, and consume whole production attempts. If inputs disappear, discard unspendable whole credits and keep only the fractional remainder; idle time does not become banked production.

Rework servicing is continuous work, costs resources, and removes an existing backlog. It does not roll another production success or recursively create rework. Fractional rework cost accumulates to a cent charge; do not round every 0.1-second tick separately.

Use the prior tick's strain and rot to calculate work outcomes. Commit repairs afterward; repair output cannot accelerate itself in the same tick. The expected-rate helper is a planning diagnostic; use sampled actual maintenance output when committing the next state. Incident-mode Ops output is excluded from maintenance allocation.

## Financial reducer boundary

`Ledger` demonstrates monetary and temporal invariants, including idempotency, overlapping-service rejection, old-price accrual before mutation, bounded addons, declining principal and mandatory failure. It assumes all supplied contracts have already passed market eligibility and are score-eligible. Its `arr()` method returns contractual ARR. A production scoring adapter must use `sum(customer.eligible_arr_cents)` instead.

`subscribe`, `expand`, `reprice` and `cancel` are validated domain outcome commits, not commands exposed directly to the player. The full scheduler must enforce willingness-to-pay, maturity, health, available slots and signed acceptance before emitting them. Partial outcomes require splitting homogeneous cohorts first. Invoice rows must link to the affected cohorts for delinquency and collections; the small reducer's company-wide invoicing example omits that linkage.

The reducer does not automatically generate a complete business cost ledger or service invoices. Those scheduled rules are in the event contract. In particular, a founder cannot avoid operating costs merely by omitting `bill` events in a production integration.

Use integer cents for every stored financial balance. For an integer monthly amount m over d ticks, accrue `divmod(m*d + remainder, 600)`. If a calculated cost rate has fractional cents, first represent it as an integer numerator over 10,000 cents precision and carry that remainder too; never round each tick independently. For debt, use `divmod(principal*APR_bps + remainder, 120000)` per complete loan month. The candidate has anniversary repayments and no prepayments, so no unspecified partial-month convention is needed.

Credit of an uncollectible invoice reduces its receivable and books a bad-debt expense once. It does not restore eligibility for the underlying delinquent contract. Retention concessions alter contract price prospectively; they are separate from invoice writeoffs and cash refunds. A refund liability is recognized once under its originating event; paying it changes cash and settles that liability without recognizing the same expense again.

Optional variable work and installations require enough cash before starting. Reject or throttle unaffordable optional work; do not turn a rejected purchase into bankruptcy. Scheduled, already-incurred mandatory bills are different: failure to pay one when due is terminal.

Generate the forecast from current signed contracts, deployed units/rates, already-accrued unpaid costs and dated financing. Scheduled future invoices must include both service already delivered and service to be delivered under current contracts. Forecast each invoice once, with the next collection date/probability and 0.8 haircut; do not count its AR and future receipt as two cash sources. Exclude forecast retries and unsigned growth. Booked bills and projected not-yet-booked costs share period IDs so they cannot be double counted. The forecast is a deterministic conservative scenario, not a probability of survival.

## Time, events and precision

The ten ordered phases are in `event_contract.json`. At an identical timestamp, already-due collections may fund a mandatory bill. A receipt from a later timestamp cannot rescue a bill already missed. Process bill/debt/VC timestamps without skipping; `Ledger` rejects advancement past unresolved dues.

Work completing at a deadline can rescue an expiring task or meet a VC target in its permitted phase. Optional choices entered after settlement cannot retroactively save it. Output from one function becomes eligible downstream at t+1, preventing the function iteration order from creating free same-tick execution chains.

The work resolver uses counter-based SHA-256 randomness. Persist a monotonically increasing attempt sequence per function. Use a stable attempt identifier for each call; batching, requeueing or opening a panel cannot create a fresh draw for the same attempt. Group shared shocks by an explicit exposure ID. The provided resolver's multi-attempt helper assumes stable job ID plus attempt offset; if splitting that call, preserve its IDs rather than resetting the offset.

The Python reference uses binary64 for rates/probabilities and integer money ledgers. Valuation uses Decimal precision 28 from serialized ratio values and floors to cents. This is not a claim of cross-language bit identity. A port must match the supplied fixtures or version the numerical contract when it deliberately changes arithmetic.

## What still requires implementation/calibration

The UI, full tick scheduler, customer and channel queues, cost/window adapters, achievement/relic catalogue and quarter-shop catalogue are not included. All candidate constants are explicit; none should be described as playtested equilibrium values. The seeds are synthetic scenarios, not a replay of actual company history.

Run-duration feasibility, dominant build searches, bankruptcy rates, market saturation, attention load, Luck tail outcomes and intended easier repeat-founder runs require policy simulations and player runs after integration. Keep the source-of-truth rules fixed during each comparison and record the profile hash. Test founder histories separately, preserving earned advantages.
