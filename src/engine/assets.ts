import type { FunctionId, ProgressionAxis, FunctionFleet } from './types'

export interface ActiveSkillTreeUpgrade {
  id: string
  functionId: Exclude<FunctionId, 'finance'>
  functionName: string
  functionCode: string
  axis: ProgressionAxis
  axisName: string
  tier: number
  name: string
  desc: string
  detail: string
  color: string
  assetPath: string
}

export const OPERATIONAL_FUNCTIONS: Array<{
  id: Exclude<FunctionId, 'finance'>
  name: string
  code: string
  color: string
}> = [
  { id: 'demand', name: 'Demand', code: 'DEM', color: '#E11D48' },
  { id: 'product', name: 'Product', code: 'PRD', color: '#58D9FF' },
  { id: 'monetisation', name: 'Monetisation', code: 'MON', color: '#FFC857' },
  { id: 'retention', name: 'Retention', code: 'RET', color: '#6F8CFF' },
  { id: 'expansion', name: 'Expansion', code: 'EXP', color: '#A778FF' },
  { id: 'operations', name: 'Operations', code: 'OPS', color: '#B5F35A' },
]

export const SKILL_TREE_AXIS_CONFIG: Record<
  ProgressionAxis,
  {
    name: string
    code: string
    color: string
    tiers: Array<{ label: string; desc: string; detail: string }>
  }
> = {
  craft: {
    name: 'CRAFT',
    code: 'CRFT',
    color: '#58D9FF',
    tiers: [
      { label: 'Precision AST Parser', desc: '1.3x Output Multiplier', detail: 'Optimizes worker code generation pipelines with strict syntax caching and typing.' },
      { label: 'Vectorized Architecture Compiler', desc: '1.7x Output Multiplier', detail: 'Direct semantic vector embeddings eliminate repetitive component compilation passes.' },
      { label: 'Recursive Synthesis Engine', desc: '2.2x Output Multiplier', detail: 'Autonomous intermediate representation compiler compounds single-engineer code yield.' },
      { label: 'Autonomous Software Foundry', desc: '3.0x Output Multiplier', detail: 'Self-compiling recursive agents produce enterprise-grade features instantaneously.' },
      { label: 'Exascale Omni Compiler', desc: '4.5x Output Multiplier', detail: 'Physical-limit software compilation engine outputting flawless high-throughput architectures.' },
    ],
  },
  scale: {
    name: 'SCALE',
    code: 'SCLE',
    color: '#FFC857',
    tiers: [
      { label: 'Dual Agent Pod', desc: '4 Max Concurrent Units', detail: 'Spawns 4 parallel worker instances to process inbound throughput.' },
      { label: 'Octa-Core Cluster', desc: '8 Max Concurrent Units', detail: 'Distributed worker cluster handling high-volume operational loads.' },
      { label: 'Distributed Grid', desc: '14 Max Concurrent Units', detail: 'Multi-datacenter execution grid for zero-queue enterprise processing.' },
      { label: 'Hyperscale Fleet', desc: '20 Max Concurrent Units', detail: 'Industrial-grade swarm capability running 20 parallel agent threads.' },
      { label: 'Omnipresent Swarm', desc: '28 Max Concurrent Units', detail: 'Global distributed swarm running 28 parallel autonomous threads.' },
    ],
  },
  automate: {
    name: 'AUTOMATE',
    code: 'AUTO',
    color: '#B5F35A',
    tiers: [
      { label: 'JIT Cron Daemon', desc: '0.35x Auto · $30/mo', detail: 'Background scheduler continuously executes this function without manual intervention.' },
      { label: 'Autonomous Worker', desc: '0.80x Auto · $70/mo', detail: 'Self-starting worker agent executes tasks asynchronously at near-human speed.' },
      { label: 'Swarm Orchestrator', desc: '1.60x Auto · $180/mo', detail: 'High-frequency coordination daemon accelerating autonomous background loops.' },
      { label: 'Self-Healing AI', desc: '3.20x Auto · $500/mo', detail: 'Singularity-grade autonomous execution running at super-human velocity.' },
      { label: 'Self-Sovereign Mind', desc: '6.00x Auto · $1,200/mo', detail: 'Zero-latency autonomous execution operating at singularity speeds.' },
    ],
  },
  luck: {
    name: 'LUCK',
    code: 'LUCK',
    color: '#A778FF',
    tiers: [
      { label: 'Market Tailwinds', desc: '+10% / -8% Variance · +1% EV', detail: 'Introduces two-sided outcome variance (+10% / -8%). Favorable outcome skew yields +1.0% expected value across all operations.' },
      { label: 'Alpha Signals', desc: '+20% / -12% Variance · +4% EV', detail: 'Expands operational variance (+20% / -12%). Front-runs high-margin market opportunities with +4.0% expected value.' },
      { label: 'Catalyst Resonance', desc: '+30% / -10% Variance · +10% EV', detail: 'Compresses downside drag while expanding peak catalysts (+30% / -10%), generating +10.0% compounding expected value.' },
      { label: 'Serendipity Engine', desc: '+40% / -5% Variance · +17.5% EV', detail: 'Restricts downside risk to just -5% against massive +40% upside bursts, delivering +17.5% net expected value.' },
      { label: 'Reality Distortion', desc: '+50% / -2% Variance · +24% EV', detail: 'Virtually eliminates downside risk (-2%) while unlocking +50% peak ceilings (+24.0% net expected value).' },
    ],
  },
}

/**
 * Contextual, function-specific skill tree configurations across all 6 operational functions.
 * (6 functions x 4 axes x 5 tiers = 120 unique contextual upgrades)
 */
export const FUNCTION_SKILL_TREE_CONFIG: Record<
  Exclude<FunctionId, 'finance'>,
  Record<ProgressionAxis, Array<{ label: string; desc: string; detail: string }>>
> = {
  demand: {
    craft: [
      { label: 'Signal Parsing Engine', desc: '1.3x Output · -12% CAC', detail: 'Automated intent telemetry cleans inbound signals, lowering lead acquisition costs.' },
      { label: 'Lookalike Neural Graphs', desc: '1.7x Output · -24% CAC', detail: 'Synthesizes multi-channel audience vectors to target highest-propensity enterprise prospects.' },
      { label: 'High-Intent Funnel', desc: '2.2x Output · -36% CAC', detail: 'Dynamic qualification logic filters low-intent traffic and escalates high-WTP buyer accounts.' },
      { label: 'Omnichannel Demand Matrix', desc: '3.0x Output · -48% CAC', detail: 'Cross-platform attribution and continuous bidding optimization driving maximum pipeline density.' },
      { label: 'Autonomous Inbound Gravity', desc: '4.5x Output · -60% CAC', detail: 'Market-dominating viral loop commanding organic high-ACV enterprise inbound without ad waste.' },
    ],
    scale: [
      { label: 'Dual Outbound Pod', desc: '4 Max Concurrent Streams', detail: 'Spawns 4 parallel prospecting threads to process inbound funnel volume.' },
      { label: 'Multi-Segment Growth Cluster', desc: '8 Max Concurrent Streams', detail: 'Distributed pipeline cluster handling high-volume cross-vertical inbound demand.' },
      { label: 'Global Campaign Grid', desc: '14 Max Concurrent Streams', detail: 'Multi-market execution grid capturing zero-queue enterprise inbound leads.' },
      { label: 'Hyper-Growth Acquisition Swarm', desc: '20 Max Concurrent Streams', detail: 'Industrial-grade lead generation swarm running 20 parallel prospecting threads.' },
      { label: 'Planetary Market Monolith', desc: '28 Max Concurrent Streams', detail: 'Omnipresent autonomous acquisition grid running 28 parallel capture threads.' },
    ],
    automate: [
      { label: 'Inbound Lead Cron Daemon', desc: '0.35x Auto · $30/mo', detail: 'Background scheduler continuously scrapes and qualifies inbound leads automatically.' },
      { label: 'Automated SDR Agent', desc: '0.80x Auto · $70/mo', detail: 'Self-operating AI sales rep handles prospect research and booking asynchronously.' },
      { label: 'Growth Engine Orchestrator', desc: '1.60x Auto · $180/mo', detail: 'High-frequency campaign daemon accelerating autonomous lead pipeline conversion.' },
      { label: 'Self-Optimizing Demand AI', desc: '3.20x Auto · $500/mo', detail: 'Autonomous growth system generating continuous high-velocity deal pipelines.' },
      { label: 'Sovereign Market Synthesizer', desc: '6.00x Auto · $1,200/mo', detail: 'Zero-latency autonomous growth engine operating at singularity market velocity.' },
    ],
    luck: [
      { label: 'Viral Market Tailwinds', desc: '+10% / -8% Variance · +1% EV', detail: 'Captures sudden viral brand tailwinds with favorable positive demand skew.' },
      { label: 'Demand Alpha Signals', desc: '+20% / -12% Variance · +4% EV', detail: 'Front-runs high-converting enterprise search trends with +4.0% net expected value.' },
      { label: 'Audience Resonance Catalyst', desc: '+30% / -10% Variance · +10% EV', detail: 'Generates massive viral amplification while dampening market downturns (+10.0% EV).' },
      { label: 'Market Serendipity Engine', desc: '+40% / -5% Variance · +17.5% EV', detail: 'Compresses CAC down to near-zero during sudden macroeconomic tech-wave expansions.' },
      { label: 'Cultural Reality Distortion', desc: '+50% / -2% Variance · +24% EV', detail: 'Establishes category monopoly mindshare with +50% explosive inbound ceilings (+24.0% EV).' },
    ],
  },
  product: {
    craft: [
      { label: 'Precision AST Parser', desc: '1.3x Output Multiplier', detail: 'Optimizes worker code generation pipelines with strict syntax caching and typing.' },
      { label: 'Vectorized Architecture Compiler', desc: '1.7x Output Multiplier', detail: 'Direct semantic vector embeddings eliminate repetitive component compilation passes.' },
      { label: 'Recursive Synthesis Engine', desc: '2.2x Output Multiplier', detail: 'Autonomous intermediate representation compiler compounds single-engineer code yield.' },
      { label: 'Autonomous Software Foundry', desc: '3.0x Output Multiplier', detail: 'Self-compiling recursive agents produce enterprise-grade features instantaneously.' },
      { label: 'Exascale Omni Compiler', desc: '4.5x Output Multiplier', detail: 'Physical-limit software compilation engine outputting flawless high-throughput architectures.' },
    ],
    scale: [
      { label: 'Dual Dev Container Pod', desc: '4 Max Concurrent Pods', detail: 'Spawns 4 parallel development containers to build concurrent feature modules.' },
      { label: 'Octa-Core Build Cluster', desc: '8 Max Concurrent Pods', detail: 'Distributed worker cluster delivering zero-backlog feature engineering.' },
      { label: 'Distributed Microservice Grid', desc: '14 Max Concurrent Pods', detail: 'Decoupled architecture grid executing 14 simultaneous development threads.' },
      { label: 'Hyperscale CI/CD Fleet', desc: '20 Max Concurrent Pods', detail: 'Industrial-grade autonomous developer fleet running 20 parallel branch integrations.' },
      { label: 'Omnipresent Engineering Swarm', desc: '28 Max Concurrent Pods', detail: 'Limitless engineering collective driving 28 parallel architectural pipelines.' },
    ],
    automate: [
      { label: 'Continuous Integration Daemon', desc: '0.35x Auto · $30/mo', detail: 'Background scheduler continuously executes code compilation and unit tests.' },
      { label: 'Autonomous Build Worker', desc: '0.80x Auto · $70/mo', detail: 'Self-starting AI engineer resolves pull requests and merges changes asynchronously.' },
      { label: 'Compiler Swarm Orchestrator', desc: '1.60x Auto · $180/mo', detail: 'High-frequency coordination daemon accelerating autonomous background development.' },
      { label: 'Self-Healing Codebase AI', desc: '3.20x Auto · $500/mo', detail: 'Singularity-grade development system fixing defects and shipping features at lightspeed.' },
      { label: 'Autonomous Architect Mind', desc: '6.00x Auto · $1,200/mo', detail: 'Zero-latency autonomous core synthesizing architectural breakthroughs autonomously.' },
    ],
    luck: [
      { label: 'Breakthrough Serendipity', desc: '+10% / -8% Variance · +1% EV', detail: 'Unlocks accidental algorithmic breakthroughs with positive capability skew.' },
      { label: 'Architectural Alpha Signals', desc: '+20% / -12% Variance · +4% EV', detail: 'Detects 10x architectural shortcuts, yielding +4.0% expected feature velocity.' },
      { label: 'Eureka Compilation Resonance', desc: '+30% / -10% Variance · +10% EV', detail: 'Dramatically compresses refactoring friction while enabling 10x engineering breakthroughs.' },
      { label: 'Algorithmic Miracle Engine', desc: '+40% / -5% Variance · +17.5% EV', detail: 'Restricts technical debt to just -5% against massive +40% development velocity bursts.' },
      { label: 'Singularity Synthesis Flux', desc: '+50% / -2% Variance · +24% EV', detail: 'Virtually eliminates compilation bugs (-2%) while delivering +50% capability leaps.' },
    ],
  },
  monetisation: {
    craft: [
      { label: 'Value Metric Indexer', desc: '1.3x Pricing Yield', detail: 'Calibrates customer willingness-to-pay tiers against exact product usage signals.' },
      { label: 'Dynamic Packaging Engine', desc: '1.7x Pricing Yield', detail: 'Algorithmic feature bundling optimizes enterprise proposal value and margin.' },
      { label: 'Algorithmic Price Discrimination', desc: '2.2x Pricing Yield', detail: 'Extracts maximum consumer surplus across enterprise procurement departments.' },
      { label: 'Autonomous Closing Foundry', desc: '3.0x Pricing Yield', detail: 'Automated negotiation agents lock in multi-year upfront commitments effortlessly.' },
      { label: 'Exascale Monetisation Matrix', desc: '4.5x Pricing Yield', detail: 'Absolute market pricing dominance commanding maximum enterprise contract value.' },
    ],
    scale: [
      { label: 'Dual Closing Desk', desc: '4 Max Concurrent Deals', detail: 'Maintains 4 parallel negotiation channels for inbound enterprise contract flows.' },
      { label: 'Commercial Deal Cluster', desc: '8 Max Concurrent Deals', detail: 'Distributed sales syndicate closing high-ticket deals without executive bottleneck.' },
      { label: 'Global Enterprise Trading Grid', desc: '14 Max Concurrent Deals', detail: 'Multi-territory deal routing grid managing 14 simultaneous high-value negotiations.' },
      { label: 'Hyperscale Revenue Fleet', desc: '20 Max Concurrent Deals', detail: 'Industrial-grade monetization engine closing 20 parallel enterprise RFPs.' },
      { label: 'Omnipresent Capital Swarm', desc: '28 Max Concurrent Deals', detail: 'Unrestricted revenue operations collective locking in 28 enterprise deals simultaneously.' },
    ],
    automate: [
      { label: 'Quote-to-Cash Daemon', desc: '0.35x Auto · $30/mo', detail: 'Background scheduler dispatches contract approvals and billing invoices automatically.' },
      { label: 'Autonomous Account Executive', desc: '0.80x Auto · $70/mo', detail: 'Self-operating sales agent drafts quotes and negotiates contract terms asynchronously.' },
      { label: 'Revenue Loop Orchestrator', desc: '1.60x Auto · $180/mo', detail: 'High-frequency coordination daemon accelerating deal execution and invoicing cycles.' },
      { label: 'Self-Driving Treasury AI', desc: '3.20x Auto · $500/mo', detail: 'Autonomous revenue system locking in institutional-scale recurring contracts.' },
      { label: 'Autonomous Capital Sovereign', desc: '6.00x Auto · $1,200/mo', detail: 'Zero-latency autonomous revenue engine operating at superhuman capital velocity.' },
    ],
    luck: [
      { label: 'Procurement Tailwinds', desc: '+10% / -8% Variance · +1% EV', detail: 'Capitalizes on unexpected end-of-quarter enterprise budget surpluses.' },
      { label: 'Budget Flush Alpha', desc: '+20% / -12% Variance · +4% EV', detail: 'Unlocks sudden enterprise budget windfalls with +4.0% net deal expected value.' },
      { label: 'Multi-Year Pre-Pay Resonance', desc: '+30% / -10% Variance · +10% EV', detail: 'Converts annual contracts into upfront multi-year cash windfalls (+10.0% EV).' },
      { label: 'Institutional Arbitrage Engine', desc: '+40% / -5% Variance · +17.5% EV', detail: 'Shields contract margin against discounts (-5%) while unlocking +40% valuation bumps.' },
      { label: 'Billion-Dollar Sovereign Deal', desc: '+50% / -2% Variance · +24% EV', detail: 'Virtually eliminates discount concessions (-2%) while securing +50% ceiling windfalls.' },
    ],
  },
  retention: {
    craft: [
      { label: 'SLA Telemetry Probes', desc: '1.3x Health Recovery', detail: 'Continuous real-time ping monitors customer health degradation before churn triggers.' },
      { label: 'Proactive Health Restorer', desc: '1.7x Health Recovery', detail: 'Automated diagnostic agents restore client health reserves and stabilize contracts.' },
      { label: 'SLA Shielding Matrix', desc: '2.2x Health Recovery', detail: 'Compounds account durability with rapid automated customer care responses.' },
      { label: 'Zero-Churn Sentinel Foundry', desc: '3.0x Health Recovery', detail: 'Autonomous triage engines eliminate contract friction and ensure 100% SLA uptime.' },
      { label: 'Immortality Account Moat', desc: '4.5x Health Recovery', detail: 'Indestructible customer success protocol establishing eternal retention lock-in.' },
    ],
    scale: [
      { label: 'Dual Sentinel Bay', desc: '4 Max Guarded Bays', detail: 'Deploys 4 dedicated sentinel bays to monitor and defend high-risk accounts.' },
      { label: 'CSM Defense Cluster', desc: '8 Max Guarded Bays', detail: 'Distributed customer success cluster protecting 8 parallel accounts simultaneously.' },
      { label: 'Enterprise Escort Grid', desc: '14 Max Guarded Bays', detail: 'Multi-tier account preservation grid resolving threats across 14 accounts in parallel.' },
      { label: 'Hyperscale Defense Fleet', desc: '20 Max Guarded Bays', detail: 'Industrial-grade retention armada safeguarding 20 enterprise contracts continuously.' },
      { label: 'Omnipresent Citadel Swarm', desc: '28 Max Guarded Bays', detail: 'Total enterprise account fortress shielding 28 critical enterprise accounts at once.' },
    ],
    automate: [
      { label: 'Heartbeat Sentinel Daemon', desc: '0.35x Auto · $30/mo', detail: 'Background scheduler continuously pings and stabilizes flagged customer health.' },
      { label: 'Autonomous Success Manager', desc: '0.80x Auto · $70/mo', detail: 'Self-operating CSM agent handles client ticket triage and health stabilization.' },
      { label: 'Anti-Churn Orchestrator', desc: '1.60x Auto · $180/mo', detail: 'High-frequency coordination daemon preempting enterprise escalations instantly.' },
      { label: 'Self-Healing Relationship AI', desc: '3.20x Auto · $500/mo', detail: 'Autonomous customer success intelligence maintaining flawless customer satisfaction.' },
      { label: 'Autonomous Retention Mind', desc: '6.00x Auto · $1,200/mo', detail: 'Zero-latency autonomous retention sovereign making account churn mathematically impossible.' },
    ],
    luck: [
      { label: 'Goodwill Tailwinds', desc: '+10% / -8% Variance · +1% EV', detail: 'Capitalizes on unexpected executive champion goodwill to offset churn risk.' },
      { label: 'Advocacy Alpha Signals', desc: '+20% / -12% Variance · +4% EV', detail: 'Amplifies positive account health spikes with +4.0% net contract survival EV.' },
      { label: 'Sponsor Resonance Catalyst', desc: '+30% / -10% Variance · +10% EV', detail: 'Neutralizes negative escalation drag while sparking unexpected enterprise renewals.' },
      { label: 'Executive Serendipity Engine', desc: '+40% / -5% Variance · +17.5% EV', detail: 'Virtually eliminates sudden account departures (-5%) while locking +40% satisfaction.' },
      { label: 'Cult Customer Lock-In', desc: '+50% / -2% Variance · +24% EV', detail: 'Creates intense customer loyalty, eliminating churn risk (-2%) with +50% NPS peaks.' },
    ],
  },
  expansion: {
    craft: [
      { label: 'Seat Audit Telemetry', desc: '1.3x Upsell Yield', detail: 'Discovers hidden departmental utilization to trigger timely seat expansions.' },
      { label: 'Feature Adoption Engine', desc: '1.7x Upsell Yield', detail: 'Identifies power users to unlock high-tier modular add-ons and premium packages.' },
      { label: 'Land-and-Expand Accelerator', desc: '2.2x Upsell Yield', detail: 'Spreads product penetration horizontally across subsidiary corporate units.' },
      { label: 'Autonomous Expansion Foundry', desc: '3.0x Upsell Yield', detail: 'Automated upsell engines generate continuous enterprise contract expansions.' },
      { label: 'Universal NRR Multiplier', desc: '4.5x Upsell Yield', detail: 'Exascale net revenue retention system compounding enterprise contract size exponentially.' },
    ],
    scale: [
      { label: 'Dual Upsell Track', desc: '4 Max Concurrent Tracks', detail: 'Processes 4 parallel upsell negotiations across active customer accounts.' },
      { label: 'Cross-Sell Division Cluster', desc: '8 Max Concurrent Tracks', detail: 'Distributed expansion team managing 8 simultaneous account add-on cycles.' },
      { label: 'Enterprise Rollout Grid', desc: '14 Max Concurrent Tracks', detail: 'Multi-subsidiary deployment grid expanding across 14 enterprise divisions.' },
      { label: 'Hyperscale Expansion Fleet', desc: '20 Max Concurrent Tracks', detail: 'Industrial-scale account growth fleet running 20 parallel cross-sell workstreams.' },
      { label: 'Omnipresent Growth Swarm', desc: '28 Max Concurrent Tracks', detail: 'Unbounded expansion collective multiplying ACV across 28 accounts concurrently.' },
    ],
    automate: [
      { label: 'Seat Limit Notifier Daemon', desc: '0.35x Auto · $30/mo', detail: 'Background scheduler continuously triggers automated seat limit upgrades.' },
      { label: 'Autonomous Account Farmer', desc: '0.80x Auto · $70/mo', detail: 'Self-starting expansion agent proposes and provisions module upgrades automatically.' },
      { label: 'NRR Growth Orchestrator', desc: '1.60x Auto · $180/mo', detail: 'High-frequency coordination daemon accelerating add-on provisioning and upsells.' },
      { label: 'Self-Expanding Account AI', desc: '3.20x Auto · $500/mo', detail: 'Autonomous growth system multiplying customer contract values automatically.' },
      { label: 'Autonomous Expansion Mind', desc: '6.00x Auto · $1,200/mo', detail: 'Zero-latency autonomous growth core driving exponential account expansion.' },
    ],
    luck: [
      { label: 'Organic Adoption Tailwinds', desc: '+10% / -8% Variance · +1% EV', detail: 'Rides viral bottom-up internal adoption waves across corporate teams.' },
      { label: 'Expansion Alpha Signals', desc: '+20% / -12% Variance · +4% EV', detail: 'Detects viral departmental growth signals with +4.0% net upsell EV.' },
      { label: 'Enterprise Mandate Catalyst', desc: '+30% / -10% Variance · +10% EV', detail: 'Converts pilot programs into company-wide enterprise mandates (+10.0% EV).' },
      { label: 'Subsidiary Serendipity Engine', desc: '+40% / -5% Variance · +17.5% EV', detail: 'Dampens budget delays (-5%) while triggering massive +40% cross-sell sweeps.' },
      { label: 'Global Enterprise Standard', desc: '+50% / -2% Variance · +24% EV', detail: 'Mandates software across entire Fortune 500 conglomerate (+50% ceiling, +24.0% EV).' },
    ],
  },
  operations: {
    craft: [
      { label: 'Garbage Collector Routine', desc: '1.3x Cleansing Rate', detail: 'Systematic memory hygiene sweeps eliminate early context rot build-up.' },
      { label: 'Context Defragmenter', desc: '1.7x Cleansing Rate', detail: 'Defragments operational memory buffers, accelerating task turnaround speed.' },
      { label: 'Operational Sanitizer Engine', desc: '2.2x Cleansing Rate', detail: 'Compounds fleet hygiene yield with automated pipeline error-recovery.' },
      { label: 'Autonomous Hygiene Foundry', desc: '3.0x Cleansing Rate', detail: 'Autonomous operations engine resolving system bottlenecks instantaneously.' },
      { label: 'Zero-Entropy Singularity Core', desc: '4.5x Cleansing Rate', detail: 'Absolute operational perfection maintaining zero context rot across the entire fleet.' },
    ],
    scale: [
      { label: 'Dual Ops Handler Pod', desc: '4 Max Concurrent Threads', detail: 'Maintains 4 parallel operational threads to process context rot and incident queues.' },
      { label: 'Infrastructure Ops Cluster', desc: '8 Max Concurrent Threads', detail: 'Distributed operational cluster resolving high-volume system anomalies.' },
      { label: 'Decentralized SRE Grid', desc: '14 Max Concurrent Threads', detail: 'Multi-node operational grid executing 14 simultaneous incident response threads.' },
      { label: 'Hyperscale SRE Fleet', desc: '20 Max Concurrent Threads', detail: 'Industrial-grade operations fleet orchestrating 20 parallel hygiene sweeps.' },
      { label: 'Omnipresent Ops Collective', desc: '28 Max Concurrent Threads', detail: 'Limitless operational swarm executing 28 parallel system triage threads.' },
    ],
    automate: [
      { label: 'Hygiene Janitor Daemon', desc: '0.35x Auto · $30/mo', detail: 'Background scheduler continuously scrubs context rot without manual intervention.' },
      { label: 'Autonomous SRE Bot', desc: '0.80x Auto · $70/mo', detail: 'Self-starting SRE agent executes incident repairs and memory purges asynchronously.' },
      { label: 'SRE Swarm Orchestrator', desc: '1.60x Auto · $180/mo', detail: 'High-frequency coordination daemon accelerating background operational hygiene.' },
      { label: 'Self-Healing Infrastructure AI', desc: '3.20x Auto · $500/mo', detail: 'Autonomous resilience engine eliminating operational defects at superhuman speed.' },
      { label: 'Autonomous Operations Sovereign', desc: '6.00x Auto · $1,200/mo', detail: 'Zero-latency autonomous operational core running with zero administrative friction.' },
    ],
    luck: [
      { label: 'Uptime Tailwinds', desc: '+10% / -8% Variance · +1% EV', detail: 'Favorable execution variance reduces system incident frequency.' },
      { label: 'Reliability Alpha Signals', desc: '+20% / -12% Variance · +4% EV', detail: 'Predicts system anomalies before impact, yielding +4.0% net uptime EV.' },
      { label: 'Resilience Resonance Catalyst', desc: '+30% / -10% Variance · +10% EV', detail: 'Compresses incident downtime while accelerating recovery breakthroughs (+10.0% EV).' },
      { label: 'Chaos Immunity Engine', desc: '+40% / -5% Variance · +17.5% EV', detail: 'Caps operational disruption at just -5% against +40% throughput windfalls.' },
      { label: 'Anti-Fragile Singularity', desc: '+50% / -2% Variance · +24% EV', detail: 'Converts operational stress directly into +50% system efficiency (+24.0% EV).' },
    ],
  },
}

/**
 * Returns the contextual tier upgrade info for a given function, axis, and tier (1-indexed).
 */
export function getSkillTreeUpgradeInfo(
  functionId: string,
  axis: ProgressionAxis,
  tier: number
): { label: string; desc: string; detail: string } {
  const funcConfig = FUNCTION_SKILL_TREE_CONFIG[functionId as Exclude<FunctionId, 'finance'>]
  const tierIdx = Math.max(0, Math.min(4, tier - 1))
  if (funcConfig && funcConfig[axis] && funcConfig[axis][tierIdx]) {
    return funcConfig[axis][tierIdx]
  }
  return (
    SKILL_TREE_AXIS_CONFIG[axis]?.tiers[tierIdx] || {
      label: `${axis.toUpperCase()} T${tier}`,
      desc: '',
      detail: '',
    }
  )
}

/**
 * Unique 2.5D asset paths for all 31 Milestone Upgrades (formerly Relics)
 */
export const MILESTONE_UPGRADE_ASSETS: Record<string, string> = {
  'relic-vibe-coder': '/assets/milestones/milestone_prompt_firewall.png',
  'relic-circuit-breaker': '/assets/milestones/milestone_self_healing.png',
  'relic-dark-fiber': '/assets/milestones/milestone_dark_fiber.png',
  'relic-open-source': '/assets/milestones/milestone_viral_repo.png',
  'relic-gpu-cluster': '/assets/milestones/milestone_gpu_cluster.png',
  'relic-stealth-moat': '/assets/milestones/milestone_procurement_passkey.png',
  'relic-negative-churn': '/assets/milestones/milestone_negative_churn.png',
  'relic-algo-pricing': '/assets/milestones/milestone_algo_pricing.png',
  'relic-syndicate': '/assets/milestones/milestone_seed_syndicate.png',
  'relic-soc2-fasttrack': '/assets/milestones/milestone_soc2_vault.png',
  'relic-direct-debit': '/assets/milestones/milestone_direct_debit.png',
  'relic-auto-compiler': '/assets/milestones/milestone_auto_compiler.png',
  'relic-anisotropic-sheen': '/assets/milestones/milestone_reality_distortion.png',
  'relic-sovereign-grant': '/assets/milestones/milestone_sovereign_grant.png',
  'relic-holding-swarm': '/assets/milestones/milestone_holding_swarm.png',
  'relic-anti-fragile': '/assets/milestones/milestone_anti_fragile.png',
  'relic-cold-outreach': '/assets/milestones/milestone_cold_outreach.png',
  'relic-feature-flags': '/assets/milestones/milestone_feature_flags.png',
  'relic-tam-expansion': '/assets/milestones/milestone_tam_expansion.png',
  'relic-ops-telemetry': '/assets/milestones/milestone_ops_telemetry.png',
  'relic-sub-pod-buffer': '/assets/milestones/milestone_micro_pods.png',
  'relic-customer-advocacy': '/assets/milestones/milestone_nps_flywheel.png',
  'relic-quantum-annealing': '/assets/milestones/milestone_quantum_annealing.png',
  'relic-silicon-mafia': '/assets/milestones/milestone_executive_network.png',
  'relic-debt-arbitrage': '/assets/milestones/milestone_debt_arbitrage.png',
  'relic-zk-proofs': '/assets/milestones/milestone_zk_enclave.png',
  'relic-shadow-fleet': '/assets/milestones/milestone_shadow_fleet.png',
  'relic-neural-distillation': '/assets/milestones/milestone_neural_distillation.png',
  'relic-algorithmic-upsell': '/assets/milestones/milestone_churn_interceptor.png',
  'relic-hyper-concurrency': '/assets/milestones/milestone_erlang_matrix.png',
  'relic-viral-monolith': '/assets/milestones/milestone_viral_monolith.png',
  'relic-pre-ipo-distortion': '/assets/milestones/milestone_narrative_engine.png',
  'relic-singularity-supercore': '/assets/milestones/milestone_singularity_core.png',
  'relic-defense-monopoly': '/assets/milestones/milestone_defense_monopoly.png',
  'relic-immortal-balance': '/assets/milestones/milestone_infinite_runway.png',
}

/**
 * Resolves a milestone upgrade asset path, falling back gracefully to category archetype.
 */
export function getMilestoneUpgradeAsset(id: string): string {
  if (MILESTONE_UPGRADE_ASSETS[id]) {
    return MILESTONE_UPGRADE_ASSETS[id]
  }
  // Coherent thematic fallbacks from existing validated 2.5D set
  if (id.includes('compute') || id.includes('neural') || id.includes('intelligence') || id.includes('gpu')) return '/assets/2.5d/expansion_intelligence.png'
  if (id.includes('infra') || id.includes('cluster') || id.includes('server') || id.includes('fiber')) return '/assets/2.5d/expansion_infrastructure.png'
  if (id.includes('shield') || id.includes('security') || id.includes('vault') || id.includes('soc2')) return '/assets/2.5d/shield_perimeter_secure.png'
  if (id.includes('finance') || id.includes('treasury') || id.includes('debt') || id.includes('grant')) return '/assets/2.5d/nav_finance.png'
  if (id.includes('monet') || id.includes('pricing') || id.includes('wtp')) return '/assets/2.5d/nav_monetise.png'
  if (id.includes('product') || id.includes('compiler') || id.includes('code') || id.includes('diff')) return '/assets/primitives/primitive_diff.png'
  return '/assets/2.5d/node_golden_core.png'
}

/**
 * Resolves an active skill tree upgrade asset path (6 functions x 4 axes x 5 tiers = 120 combinations)
 */
export function getSkillTreeUpgradeAsset(functionId: string, axis: ProgressionAxis, tier: number): string {
  return `/assets/skills/${functionId}_${axis}_t${tier}.png`
}

/**
 * Resolves consumable asset paths
 */
export function getConsumableAsset(id: string, actionType?: string): string {
  if (id.includes('purge') || actionType === 'kernel_purge') return '/assets/2.5d/node_memory_purge.png'
  if (id.includes('golf') || id.includes('rebate') || actionType === 'exec_golf') return '/assets/2.5d/node_rebate_token.png'
  if (id.includes('defense') || actionType === 'defense_rfp') return '/assets/2.5d/shield_perimeter_secure.png'
  if (id.includes('tech-raid') || actionType === 'tech_raid') return '/assets/2.5d/node_golden_core.png'
  if (id.includes('debt') || actionType === 'debt_bridge') return '/assets/2.5d/nav_finance.png'
  if (id.includes('coffee') || actionType === 'war_room') return '/assets/2.5d/tool_coffee_surge.png'
  if (id.includes('sledge') || id.includes('hotfix')) return '/assets/2.5d/tool_hotfix_sledge.png'
  if (id.includes('blitz') || actionType === 'hn_blitz') return '/assets/2.5d/node_rebate_token.png'
  if (id.includes('safe') || actionType === 'emergency_safe') return '/assets/2.5d/node_golden_core.png'
  return '/assets/2.5d/node_rebate_token.png'
}

/**
 * Computes the list of all currently active skill tree upgrades from state.fleet.
 * Only returns upgrades that are actually researched (rank > 0).
 */
export function getActiveSkillTreeUpgrades(fleet: Record<FunctionId, FunctionFleet>): ActiveSkillTreeUpgrade[] {
  const active: ActiveSkillTreeUpgrade[] = []
  const axes: ProgressionAxis[] = ['craft', 'scale', 'automate', 'luck']

  for (const fn of OPERATIONAL_FUNCTIONS) {
    const f = fleet[fn.id]
    if (!f) continue

    for (const axis of axes) {
      const rankKey = `${axis}Rank` as keyof FunctionFleet
      const rank = (f[rankKey] as number) || 0
      if (rank > 0) {
        const info = getSkillTreeUpgradeInfo(fn.id, axis, rank)
        active.push({
          id: `${fn.id}-${axis}-${rank}`,
          functionId: fn.id,
          functionName: fn.name,
          functionCode: fn.code,
          axis,
          axisName: SKILL_TREE_AXIS_CONFIG[axis].name,
          tier: rank,
          name: info.label,
          desc: info.desc,
          detail: info.detail,
          color: SKILL_TREE_AXIS_CONFIG[axis].color,
          assetPath: getSkillTreeUpgradeAsset(fn.id, axis, rank),
        })
      }
    }
  }

  return active
}
