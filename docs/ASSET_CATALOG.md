# SoloUnicorn Homogeneous Asset & Icon Catalog

This document establishes the canonical asset registry, naming conventions, material progression, visual semantics, and 2.5D rendering specifications for SoloUnicorn.

---

## 1. Visual & Physical Asset Philosophy

All semantic game objects are strictly isolated **2.5D models on transparent backgrounds** adhering to:
- **Perspective**: Consistent 30° isometric or orthographic-tilt perspective.
- **Lighting**: Key top-left cool white studio light (5500K), soft ambient occlusion, subtle cyan/gold rim lighting, and realistic self-shadowing.
- **Silhouette**: Bold, readable geometry optimized for small display sizes (24px to 64px) up to hero inspection scale (256px+).
- **Background**: Zero baked backgrounds or cards. Outer boundaries are clean alpha ($A = 0$).
- **No Stock Slop / Emoji**: Zero flat generic SVG icons or stock AI slop. Every object mixes familiar physical hardware with futuristic digital meaning.

---

## 2. The 5 Canonical Material Tiers

Per `docs/context/VISUAL_BRAND.md` and `docs/context/archive/master-context-v1/references/ASSET_BRIEFS.md`:

| Tier | Material | Visual Treatment | Meaning / Stage |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Charcoal / Dark Basalt** | Matte obsidian graphite with vibrant functional accent circuitry | Baseline manual tool / garage stage |
| **Tier 2** | **Gunmetal / Titanium** | Brushed aerospace alloy with micro-chamfers and specular silver rim | Hardened precision machine |
| **Tier 3** | **Polished Gold / Brass** | High-polish mirror gold chassis with glowing warm amber core | Compounding capital / high-leverage unit |
| **Tier 4** | **Liquid Glass / Optical Crystal** | Refractive prismatic crystal with caustic light dispersion | Hyper-parallel abstraction / zero-latency |
| **Tier 5** | **Ethereal / Liquid Mercury** | Physically convincing iridescent liquid metal with subtle cosmic pearl shift | Singularity / autonomous sovereign engine |

---

## 3. Core Engine Archetypes (5 Founder Relic Equivalents)

Located in `public/assets/archetypes/`:

| ID | Name | Core Object Metaphor | Color Accent | Path |
| :--- | :--- | :--- | :--- | :--- |
| `product_led_machine` | Product-Led Machine | Monolithic self-assembling compiler cube with cyan conduits | `#58D9FF` | `/assets/archetypes/archetype_product_led_machine.png` |
| `distribution_engine` | Distribution Engine | Radar telemetry dish & quantum beacon tower | `#FF5C9A` | `/assets/archetypes/archetype_distribution_engine.png` |
| `nrr_fortress` | NRR Fortress | Interlocking golden vaults with crystalline expansion prisms | `#FFC857` | `/assets/archetypes/archetype_nrr_fortress.png` |
| `default_alive` | Default-Alive Engine | Obsidian emergency reactor with perpetual emerald turbine | `#10B981` | `/assets/archetypes/archetype_default_alive.png` |
| `operations_fortress` | Operations Fortress | Titanium multi-rack cluster with cryogenic cooling manifolds | `#B5F35A` | `/assets/archetypes/archetype_operations_fortress.png` |

---

## 4. Work Function Navigation Hubs (7 Functions)

Located in `public/assets/2.5d/`:

| Function | ID | 2.5D Semantic Object | Accent | Path |
| :--- | :--- | :--- | :--- | :--- |
| **Demand** | `demand` | Orbital phased-array antenna radar scanner | `#FF5C9A` | `/assets/2.5d/nav_demand.png` |
| **Product** | `product` | Holographic logic core with floating component wafers | `#58D9FF` | `/assets/2.5d/nav_product.png` |
| **Monetisation** | `monetisation` | Heavy gold coin press & dynamic pricing caliper | `#FFC857` | `/assets/2.5d/nav_monetise.png` |
| **Retention** | `retention` | Obsidian safety anchor & life-preserver gyro | `#6F8CFF` | `/assets/2.5d/nav_retention.png` |
| **Expansion** | `expansion` | Fractal branching crystal tree & modular rack units | `#A778FF` | `/assets/2.5d/nav_expansion.png` |
| **Operations** | `operations` | Cryogenic cooling turbine & thermal heatsink core | `#B5F35A` | `/assets/2.5d/nav_operations.png` |
| **Finance** | `finance` | Biometric treasury vault & liquidity balance scale | `#38BDF8` | `/assets/2.5d/nav_finance.png` |

---

## 5. Work Function Interactive Primitives & Tactical Objects

Located in `public/assets/primitives/` and `public/assets/2.5d/`:

### Product Specification Primitives
1. `primitive_prompt.png` — Obsidian prompt prompt capsule with glowing prompt prompt socket.
2. `primitive_diff.png` — Prismatic Git diff wafer showing green additions and red deletions.
3. `primitive_test.png` — Verification multimeter & test probe with green check indicator.
4. `primitive_deploy.png` — Orbital rocket thruster canister ready for production release.

### Retention Churn Rescue
1. `piggy_bank_intact.png` — Luxury matte black obsidian and mirror gold ceramic vault.
2. `piggy_bank_cracked.png` — Luxury vault fractured with glowing amber stress fissures.

### Expansion Swarm Modules
1. `expansion_infrastructure.png` — High-density server blade rack unit.
2. `expansion_intelligence.png` — Neural tensor processor prism.
3. `expansion_security.png` — Armored cryptographic perimeter shield.

### Operations Triage Nodes & Tools
1. `node_golden_core.png` — Flawless gold computing module.
2. `node_memory_purge.png` — Cryogenic RAM purge vacuum canister.
3. `node_rebate_token.png` — Mirror brass customer rebate token.
4. `node_thermal_fault.png` — Overheated circuit chip with glowing red thermal flare.
5. `threat_contract_breach.png` — Red alert legal subpoena cylinder.
6. `threat_latency_gremlin.png` — Spiky cybernetic parasitic bug.
7. `shield_perimeter_secure.png` — Glowing blue electromagnetic defensive barrier.
8. `tool_coffee_surge.png` — High-tech thermos canister with espresso energy gauge.
9. `tool_hotfix_sledge.png` — Precision pneumatic magnetic breaker mallet.

---

## 6. Active Milestone Upgrades (35 Unique Assets)

Located in `public/assets/milestones/`:

| # | Milestone Upgrade ID | Name | Semantic 2.5D Object | Target File |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `relic-vibe-coder` | Prompt Firewall | Holographic firewall crystal | `milestone_prompt_firewall.png` |
| 2 | `relic-circuit-breaker` | Self-Healing Mesh | Cybernetic circuit breaker with glowing emerald switch | `milestone_self_healing.png` |
| 3 | `relic-dark-fiber` | Dark Fiber Trunk | Glowing high-density glass fiber conduit bundle | `milestone_dark_fiber.png` |
| 4 | `relic-open-source` | Viral Git Monolith | Floating black obsidian cube with glowing fork branching | `milestone_viral_repo.png` |
| 5 | `relic-gpu-cluster` | GPU Compute Hive | Multi-tiered GPU cluster with gold fins and cyan liquid tubes | `milestone_gpu_cluster.png` |
| 6 | `relic-stealth-moat` | Procurement Passkey | Titanium biometric keycard with enterprise security seal | `milestone_procurement_passkey.png` |
| 7 | `relic-negative-churn` | Expansion Gravity Core | Gravitational singularity ring pulling retained value inward | `milestone_negative_churn.png` |
| 8 | `relic-algo-pricing` | Algorithmic Price Puck | Stepper motor micrometer dial setting optimal price points | `milestone_algo_pricing.png` |
| 9 | `relic-syndicate` | Seed Syndicate Syndicate | Cluster of 5 interlocking golden signet rings | `milestone_seed_syndicate.png` |
| 10 | `relic-soc2-fasttrack` | SOC2 Compliance Vault | Heavy cryptographic safe with dual rotary dial locks | `milestone_soc2_vault.png` |
| 11 | `relic-direct-debit` | Direct ACH Conduit | High-speed pneumatic banking pipe with golden currency stream | `milestone_direct_debit.png` |
| 12 | `relic-auto-compiler` | Autonomous AST Foundry | Self-feeding laser code synthesis forge | `milestone_auto_compiler.png` |
| 13 | `relic-anisotropic-sheen` | Reality Distortion Prism | Refractive quartz prism distorting spatial light rays | `milestone_reality_distortion.png` |
| 14 | `relic-sovereign-grant` | Sovereign AI Grant | Wax-sealed royal sovereign patent parchment in titanium case | `milestone_sovereign_grant.png` |
| 15 | `relic-holding-swarm` | Conglomerate Matrix | Interlinked hexagonal honeycomb holding structure | `milestone_holding_swarm.png` |
| 16 | `relic-anti-fragile` | Hydraulic Buffer | Heavy hydraulic compression shock absorber | `milestone_anti_fragile.png` |
| 17 | `relic-cold-outreach` | Sub-Zero Transmitter | Cryogenic microwave transmitter antenna | `milestone_cold_outreach.png` |
| 18 | `relic-feature-flags` | Feature Flag Switchboard | Physical aeronautical toggle switchboard with LED status | `milestone_feature_flags.png` |
| 19 | `relic-tam-expansion` | Market Telescope | Steampunk astronomical brass telescope surveying market horizon | `milestone_tam_expansion.png` |
| 20 | `relic-ops-telemetry` | Oscilloscope HUD | Miniature analog CRT oscilloscope with green sine wave | `milestone_ops_telemetry.png` |
| 21 | `relic-sub-pod-buffer` | Zero-Copy Micro-Pods | Ultra-compact microchip wafer tray with zero-latency bus | `milestone_micro_pods.png` |
| 22 | `relic-customer-advocacy` | NPS Flywheel | Kinetic perpetual flywheel with acoustic resonance bells | `milestone_nps_flywheel.png` |
| 23 | `relic-quantum-annealing` | Quantum Annealing Core | Supercooled dilution refrigerator cylinder with golden conduits | `milestone_quantum_annealing.png` |
| 24 | `relic-silicon-mafia` | Mafia Executive Signet | Obsidian and onyx signet ring bearing private syndicate crest | `milestone_executive_network.png` |
| 25 | `relic-debt-arbitrage` | Treasury Arbitrage Scale | Balanced jeweled apothecary scale holding cash and sovereign notes | `milestone_debt_arbitrage.png` |
| 26 | `relic-zk-proofs` | ZK Enclave Vault | Black cubic chamber completely sealed by laser hologram lattice | `milestone_zk_enclave.png` |
| 27 | `relic-shadow-fleet` | Shadow Overclock Battery | Overcharged crimson battery module emitting electrical discharge | `milestone_shadow_fleet.png` |
| 28 | `relic-neural-distillation` | Model Distillation Flask | Alchemical scientific flask condensing giant model weights into pure crystal | `milestone_neural_distillation.png` |
| 29 | `relic-algorithmic-upsell` | Predictive Churn Interceptor | Automated radar tracking missile turret targeting churn signals | `milestone_churn_interceptor.png` |
| 30 | `relic-hyper-concurrency` | Erlang Actor Matrix | Polyhedral geodesic dome with hundreds of glowing interconnected nodes | `milestone_erlang_matrix.png` |
| 31 | `relic-viral-monolith` | Monolith of Network Effects | Towering obsidian obelisk emitting circular pulse waves | `milestone_viral_monolith.png` |
| 32 | `relic-pre-ipo-distortion` | Wall Street Narrative Engine | Antique stock ticker tape machine extruding golden holographic tape | `milestone_narrative_engine.png` |
| 33 | `relic-singularity-supercore` | Singularity AGI Core | Floating hyper-torus particle accelerator containing micro black hole | `milestone_singularity_core.png` |
| 34 | `relic-defense-monopoly` | Classified Defense Seal | Pentagon-shaped tungsten vault plaque with classified holographic emblem | `milestone_defense_monopoly.png` |
| 35 | `relic-immortal-balance` | Infinite Runway Ouroboros | Liquid gold serpent swallowing its tail around a glowing diamond balance | `milestone_infinite_runway.png` |

---

## 7. The 120 Skill Tree Upgrade Matrix ($6 \times 4 \times 5$)

Located in `public/assets/skills/{fn}_{axis}_t{tier}.png`:

### Axes & Core Visual Verbs
1. **Craft** (`crft`): Precision micrometer, laser cutting nozzle, diamond stylus, compilation lens.
2. **Scale** (`scle`): Parallel rack rails, cluster bus, multi-core array, distributed mesh.
3. **Automate** (`auto`): Clockwork governor, robotic actuator arm, self-driving gyro, neural autonomy node.
4. **Luck** (`luck`): Quantum polyhedral dice, refraction prism, magnetic horseshoe, probability compass.

### 6 Functions $\times$ 4 Axes Breakdown ($24$ Upgrade Lines $\times 5$ Tiers = $120$ Icons)

#### 1. Demand (`demand`) — Signal Red / Coral (`#FF5C9A`)
- `demand_craft_t1` through `t5`: Precision Signal Reading $\rightarrow$ Quantum Radar Caliper
- `demand_scale_t1` through `t5`: Multi-Channel Broadcast $\rightarrow$ Orbital Omnipresence Swarm
- `demand_automate_t1` through `t5`: Autonomous Lead Filter $\rightarrow$ Self-Sovereign Qualification Mind
- `demand_luck_t1` through `t5`: Viral Spark $\rightarrow$ Reality Distortion Growth Tailwinds

#### 2. Product (`product`) — Cyan / Electric Sky (`#58D9FF`)
- `product_craft_t1` through `t5`: Syntax AST Compiler $\rightarrow$ Exascale Autonomous Foundry
- `product_scale_t1` through `t5`: Dual Agent Pods $\rightarrow$ Hyperscale Distributed Grid
- `product_automate_t1` through `t5`: JIT Background Builder $\rightarrow$ Autonomous Self-Healing AI
- `product_luck_t1` through `t5`: Weekend Hack Miracle $\rightarrow$ Breakthrough Moonshot Core

#### 3. Monetisation (`monetisation`) — Golden Amber (`#FFC857`)
- `monetisation_craft_t1` through `t5`: Willingness-to-Pay Caliper $\rightarrow$ Dynamic Algorithmic Pricing Engine
- `monetisation_scale_t1` through `t5`: High-Velocity Order Queue $\rightarrow$ Multi-Tier Packaging Swarm
- `monetisation_automate_t1` through `t5`: Auto-Invoicing Daemon $\rightarrow$ Self-Executing Contract Bot
- `monetisation_luck_t1` through `t5`: Whale Inbound $\rightarrow$ Compounding Enterprise Upsell Jackpot

#### 4. Retention (`retention`) — Royal Indigo / Cobalt (`#6F8CFF`)
- `retention_craft_t1` through `t5`: Health Telemetry Scope $\rightarrow$ Root Cause Surgical Probe
- `retention_scale_t1` through `t5`: Rapid Squad Coverage $\rightarrow$ Global Account Guardian Fleet
- `retention_automate_t1` through `t5`: Predictive Health Heartbeat $\rightarrow$ Self-Healing Churn Interceptor
- `retention_luck_t1` through `t5`: Heroic Account Save $\rightarrow$ Viral Customer Advocacy Monolith

#### 5. Expansion (`expansion`) — Regal Violet (`#A778FF`)
- `expansion_craft_t1` through `t5`: Requirement Combiner $\rightarrow$ Synthesis Architecture Forge
- `expansion_scale_t1` through `t5`: Expanded Merge Board $\rightarrow$ Hyperscale Modular Generator Swarm
- `expansion_automate_t1` through `t5`: Auto-Merge Assembler $\rightarrow$ Autonomous Account Expansion Bot
- `expansion_luck_t1` through `t5`: Enterprise Seat Surge $\rightarrow$ Sovereign Contract Bundle Miracle

#### 6. Operations (`operations`) — Acid Lime / Cyber Green (`#B5F35A`)
- `operations_craft_t1` through `t5`: Incident Scratch Probe $\rightarrow$ Deep Diagnostic Analyzer
- `operations_scale_t1` through `t5`: Multi-Threaded Queue Buffer $\rightarrow$ Distributed Cluster Resilience Grid
- `operations_automate_t1` through `t5`: Rot Hygiene Daemon $\rightarrow$ Singularity Self-Repairing Infrastructure
- `operations_luck_t1` through `t5`: Lucky One-Line Fix $\rightarrow$ Serendipitous Outage Recovery

---

## 8. CRED-Style 3D UI Highlight Buttons

Physical button specifications inspired by high-end tactile hardware and CRED's signature interaction design:

- **Classes**:
  - `.cred-3d-button`: Base 3D tactile button with bevel shadows and top-edge specular highlight.
  - `.cred-3d-button-emerald`: High-impact primary action (Launch, Research, Commit).
  - `.cred-3d-button-cyan`: Secondary high-tech action (Deploy, Compile, Inspect).
  - `.cred-3d-button-amber`: Warning/capital action (Procure, Borrow, Debt).
- **Physical States**:
  - `Rest`: 3px extruded lower rim shadow (`box-shadow: 0 4px 0 #...`), crisp 1px specular top highlight.
  - `Hover`: 1px elevation lift, intensified internal radiance.
  - `Active (Pressed)`: Instant physical depression (`transform: translateY(3px)`), shadow compresses to 0px, microswitch click sound trigger.
