# Product canon for implementation

## Thesis

SoloUnicorn is a roguelike business simulator about the one-person founder building an AI-assisted company. The joke is that AI makes scale possible but does not remove operational reality: demand, product quality, pricing, retention, expansion, cash timing, agent coordination and context rot still compete for one founder's attention.

The game starts as tactile personal execution and becomes strategic machine operation.

## North star

The primary score is company valuation. The first major win is the first valid $1B valuation. ARR is the operating base and cash is the consumable resource used to buy capability. Never present ARR as immediately spendable cash.

The starter uses fixture numbers only so interactions can be tested before balance is proven.

## Core causal chain

```text
Demand signal
→ founder qualifies a finite opportunity
→ Product converts it into an activation
→ Monetisation converts activation into a contract
→ service/billing/collection turns economic activity into cash over time
→ Retention protects existing ARR
→ Expansion adds ARR to existing customers
→ Operations protects reliability/capacity and repairs strain/context rot
→ Finance manages liquidity, debt, equity and obligations
→ valuation reflects the operating company
```

Do not turn the six functions into disconnected coin generators.

### Lifecycle Gating & Zero-Phantom Invariant
1. **Retention & Expansion Standby**:
   - Retention and Expansion are strictly dependent on having active signed customer contracts (`accounts.length > 0`).
   - When no paying accounts exist, these functions remain in clear Standby mode directing the founder back to the Revenue Pipeline (`01 Demand ➔ 02 Product ➔ 03 Monetise`).
   - Inbound expansion supply demands and retention churn threats must ONLY emerge from genuine signed customer accounts. They must never be hardcoded fixtures or synthesized from thin air.
   - Fulfilling an expansion order expands contractual ARR on an existing customer; it must never fabricate a new customer.
2. **Operations Production Footprint**:
   - System outages and emergency operational drills (`operationsEvent`) require an actual production footprint (shipped product builds, live customer fleet, or accumulated strain/rot). An idle garage startup with no product or customers does not suffer spontaneous production outages.
3. **No Phantom Fixtures in Runtime Gameplay**:
   - Mock test fixtures belong exclusively in isolated unit test harnesses. Runtime gameplay state begins with empty merge grids and zero orders until real customer contracts trigger them.

## Founder attention

The founder actively works one function at a time. Valuable queues continue to exist elsewhere. Pressure should come from choosing what deserves attention, deadlines, liquidity and overextension, not from modal spam or unreadable UI.

The player should repeatedly be able to explain:

```text
I did X → Y changed → that caused Z → now I need to decide A.
```

## Progression

Experiential progression:

```text
Manual → Assisted → Swarm → Executive → Autonomous
```

Early: founder does work directly.
Mid: founder buys tools/agents and chooses bottlenecks.
Late: founder configures an autonomous machine and intervenes in exceptions.

Automation arc:

```text
Relief → throughput → dependency → coordination → exceptions → context rot → operator decisions
```

## Failure and financing

Cash reaching zero alone is not failure. Failure occurs when a mandatory obligation cannot be paid when due. A VC growth deadline exists only after the player accepts a VC mandate. Bootstrap and debt-only companies do not receive an arbitrary universal growth deadline.

## First playable proof

Before building the full simulation, prove this experience:

1. A founder sees a finite Demand signal.
2. They physically qualify it and spend acquisition cash.
3. The qualified opportunity visibly becomes Product work.
4. They assemble and verify something that answers the opportunity.
5. Shipping creates an activation.
6. They make a price-fit decision.
7. A customer signs and ARR changes.
8. Cash does not change immediately.
9. A later collection changes cash.
10. The player understands every causal step without reading documentation.

Anything not required to prove this should remain disabled until its slice begins.
