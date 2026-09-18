# SoloUnicorn product context

**Authority:** product premise, player fantasy, progression and scope.  
**Numerical authority:** `engine/metric_registry.json`, `engine/candidate_profile.json`, `engine/event_contract.json`.  
**Status:** canonical consolidated context, revision `1.0-engine-consolidated`.

## Product premise

SoloUnicorn is a culturally current parody and strategy simulator about the one-person founder building an AI-assisted company. The founder begins with a tiny budget, primitive tools and a mid, incomplete HUD. They manually perform the work, earn cash, decide where to spend it and gradually replace execution with agents. The company can become absurdly powerful, but every shortcut creates a different obligation: more coordination, more recurring cost, more context rot, more customer exposure or more financing pressure.

The player's north star is reaching a **$1B company valuation as quickly as possible**. The game communicates the one-person-unicorn thesis through play: the claim sounds easy in a meme, but the founder must manage attention, demand, product quality, monetisation, retention, expansion, operations and cash timing simultaneously.

The simulated company and the coding agents building the product are separate systems. `TERMINAL_AGENT.md` governs development work. This file governs the game.

## Player fantasy and learning arc

The player should move through these feelings:

1. “I can personally make the first thing happen.”
2. “I cannot do every function at once.”
3. “I should spend this cash on the bottleneck, not the flashiest upgrade.”
4. “My agents are producing real leverage, but I now have a system to supervise.”
5. “I understand the machine well enough to choose a build and speedrun a unicorn.”

The progression language is **Manual → Assisted → Swarm → Executive → Autonomous**. These are experiential stages rather than fixed quarters. A founder may keep Product manual while Demand and Monetisation run through agents. Autonomy is a player-facing stage label; the engine's axis is named `Automate`.

The first run starts with a small budget, one obvious action and limited information. The HUD reveals richer queues, causal metrics, forecasts and build controls when they become relevant. It never hides a mandatory bill, baseline loan term, accepted VC condition or lethal customer threat merely because the player has not bought an information upgrade.

## What makes it a roguelike

A run combines:

- a seeded market and customer mix;
- finite cash, founder attention, queues and downstream demand;
- deliberate skill-tree purchases during the run;
- build-specific operating interactions and tradeoffs;
- changing opportunities, deadlines and correlated Luck shocks;
- debt and VC choices with lasting run pressure;
- failure that resets run state;
- founder history and relics that reward successful repeat founders.

The same seed can support different viable policies. A build is the consequence of decisions, not a class selected at the start. Manual, product-led, retention/expansion, distribution, bootstrap, debt-backed, VC-backed, automation-heavy, Operations-focused and variance-heavy paths should feel materially different.

The intended successful run is approximately **30–45 active minutes** as a candidate pacing target. With 60 seconds per simulated financial month and three months per quarter, 15 quarters occupy 45 minutes. This is a hypothesis to test, not a hard timeout or a claim about the optimal duration of successful roguelikes. Runs may win earlier, continue after unicorn or fail much later.

After the first $1B checkpoint, the player may continue. Normal costs, churn, strain, rot, financing pressure and opportunities remain active.

## The operating company

The six operating functions are a connected causal pipeline:

| Function | Founder work | Output and downstream consequence |
|---|---|---|
| **Demand** | Swipe/triage market signals and channels | Qualified opportunities with segment mix, acquisition cost and expiry |
| **Product** | Assemble requirements, develop, verify and ship | Capability, activation opportunities, defects and customer fit |
| **Monetisation** | Read price fit and make the offer | Paying subscriptions, base MRR, pricing and collection schedule |
| **Retention** | Prioritise threatened accounts and intervene | Saved or churned ARR, concessions, customer health and care coverage |
| **Expansion** | Read unmet needs and merge a package | Finite addon expansion and additional service cost |
| **Operations** | Investigate, maintain, repair or take an explicit risk bet | Lower strain/rot/incidents or a declared high-upside operational trap |

Every output uses actual input identities. Demand impressions are not ARR. Product activation is not a contract. A Retention save prevents a pending loss and does not book the account's ARR a second time. Expansion consumes an eligible account slot. Operations improves the system through delivery, reliability and cost consequences, not an arbitrary score bonus.

## Finance and liquidity

Finance is a company management domain. It handles cash allocation, skill purchases, agent installation, recurring costs, collections, bills, debt, equity, reserves and forecasts. It is not a seventh compulsory reflex or timing minigame.

The player must understand the difference between:

- **Contractual ARR:** current annualised subscription commitments.
- **Eligible ARR:** contractual ARR still counted for score under collection-grace rules.
- **Earned revenue:** service actually delivered over time.
- **Billed receivables:** earned revenue invoiced but not collected.
- **Collected cash:** liquid funds available to spend.
- **Valuation:** the score derived from eligible ARR, growth and capital quality.

Cash raised by debt or equity is never ARR. Principal repayment consumes cash and reduces debt but is not operating expense. Interest is an expense and cash payment under its own schedule. A company can be profitable and still fail because cash arrives after a mandatory payment.

## Attention and continuous time

Founder attention is the central resource. The founder can directly execute only one operating function at a time. The company keeps running while the founder:

- performs a manual task;
- inspects metrics or the alert inbox;
- opens a skill tree and chooses a purchase;
- uses the Finance surface;
- routes agents or changes policies;
- chooses a post-quarter strategy or relic;
- reviews a financing offer.

Those activities consume simulation time and create opportunity cost. The player can deliberately pause if the implementation supports an explicit pause, but opening a shop, Finance or a metric panel does not freeze the company. A settlement transaction may be brief and ordered; it cannot become a free planning pause, retroactive rescue or duplicate reward.

## Progression axes

Each operating function has four mechanical axes with four ranks each:

- **Craft:** increases the output of an individual work unit. It makes a manual or automated unit more capable, precise or productive.
- **Scale:** creates more work units and capacity. It also increases coordination load, recurring upkeep and the chance that neglected strain reduces effective output.
- **Automate:** makes execution faster or delegates it. It buys founder attention at the cost of recurring compute/agent upkeep, context rot and exception work.
- **Luck:** unlocks a modestly positive expected output with wider variance. The founder chooses exposure; a rank does not force maximum risk on every task. Shared shocks make provider/market risk persist across a swarm.

Each rank must have a cost, prerequisite, exact effect ID, observable dashboard result and downside/commitment where applicable. A rank is not a title wrapped around an anonymous percentage. Cash, deployment time, finite inputs and risk remain meaningful after purchase.

Finance may eventually have management progression, but no Finance motor tree is enabled in this baseline. A future Finance upgrade must improve comparison, policy, collection or treasury decisions through explicit numerical effects; it cannot hide baseline terms or mint ARR.

## Strain, rot and Operations

The engine separates:

- **Coordination load:** work-unit handoffs and concurrent architecture.
- **Ops capacity:** sustainable coordination capacity.
- **Instant overload:** current load beyond capacity.
- **Accumulated strain backlog:** unresolved overextension that persists after throttling.
- **Context rot:** drift and supervision burden caused by autonomous work and configuration changes.
- **Rework:** actual failed work that must be serviced again.
- **Defects/incidents:** customer-facing consequences that feed health, churn, cost and queue pressure.

These conditions create causal pressure: more units/agents → more load and upkeep → slower or less reliable work → retries/defects/incidents → customer and cash consequences. Operations has finite repair output and must choose how to allocate it across strain and six function rot targets. Optional optimisation can play the Lucky Cat-like trap role: explicit upside and downside, legible before commitment, never a guaranteed cash printer and never mandatory for competent automation.

## Luck and ruin

Luck is a distribution, not a free multiplier. At rank 4, the raw candidate outcomes have mean 1.04, standard deviation 0.64 and approximate range 0.1395–1.9405 before finite-input caps. Forty percent of variance comes from a shared exposure shock; sixty percent is local. A bad shared epoch can hurt many agents simultaneously. Finite demand can waste upside while downside still lands, so realised EV can be negative in a saturated or overextended state.

The player sees the stake, range, exposure and commitment point before opting into a risky route. The engine samples from stable seeded streams. Opening a tooltip or resizing the screen cannot reroll it.

## Founder history, winners and relics

Founder history is persistent meta progression. A successful run records the founder's win and may award a relic or achievement. A failed run records failure and awards no new permanent power. Already-owned successful-founder advantages remain owned.

Repeat founders are intentionally stronger and can bypass some of the hardest first-run friction. Do not normalize the market, secretly increase difficulty or cap relic stacking merely to force experienced winners to face the first-run version again. Evaluate first-time and repeat-founder outcomes separately: time to unicorn, failure reason, relic loadout, starting resources, build diversity and whether the company simulation is still understood. Relic balance is its own later design/evaluation pass; this package defines interfaces and reporting, not a final catalogue.

## Platform and tone

Build a responsive React + HTML Canvas PWA for desktop and mobile. The outer frame keeps Valuation, ARR, Cash, time and critical obligations readable. The centre hosts the current tactile work object. A persistent alert inbox aggregates urgent causes without interrupting an active gesture with routine modals.

The visual language is minimal and luxurious around tactile work objects: graphite operations, pastel ethereal aspiration, custom contextual 3D objects, and iridescent liquid metal reserved for the Ethereal apex of rarity. The product should feel culturally literate and current without depending on copyrighted characters, slogans, memes or third-party UI copies.

Writing is sharp, human, mechanically clear and funny when earned. The mechanical consequence is always legible without understanding a reference. Generated narrative can react to the actual company only after the engine fixes the event, choices, values and effect IDs.

## Scope boundaries

The current engine package specifies the core economic and operational contract. It does not claim that all future relics, shop cards, 448 catalogue slots, generated situations, audio or final assets are authored. Disabled features must have disabled triggers and pools. The next implementation target is a thin playable loop followed by automation/Operations, financing, full-run content, relics and release breadth.
