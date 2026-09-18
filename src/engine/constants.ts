import type { CustomerSegment, SegmentProfile, Relic, Consumable, ProductComponent, EvolutionTier, FunctionId, EngineArchetypeId, EngineArchetype, FounderAchievement, FounderRelic, GameState } from './types'

export interface EvolutionTierConfig {
  tier: EvolutionTier
  name: string
  subtitle: string
  minValuationCents: number
  accentColor: string
}

export const EVOLUTION_TIERS: EvolutionTierConfig[] = [
  {
    tier: 'garage',
    name: 'Rustic Garage Terminal',
    subtitle: 'Founder Workbench · $0 - $50k',
    minValuationCents: 0,
    accentColor: '#D97706',
  },
  {
    tier: 'workshop',
    name: 'Stealth Seed Lab',
    subtitle: 'First Agents Online · $50k - $500k',
    minValuationCents: 5_000_000,
    accentColor: '#58D9FF',
  },
  {
    tier: 'workstation',
    name: 'Series A Cockpit',
    subtitle: 'High-Density Instrument · $500k - $5M',
    minValuationCents: 50_000_000,
    accentColor: '#059669',
  },
  {
    tier: 'growth',
    name: 'Pre-IPO Bridge',
    subtitle: 'Autonomous Swarm · $5M - $100M',
    minValuationCents: 500_000_000,
    accentColor: '#7C3AED',
  },
  {
    tier: 'ethereal',
    name: 'Apex Ethereal Command',
    subtitle: 'Unicorn Singularity · $100M - $1B+',
    minValuationCents: 10_000_000_000,
    accentColor: '#0EA5E9',
  },
]

export const TICKS_PER_SECOND = 10
export const TICKS_PER_MONTH = 600 // 60 seconds
export const TICKS_PER_QUARTER = 1800 // 180 seconds (3 months)
export const DELINQUENCY_GRACE_TICKS = 1200 // 2 months grace period
export const CHURN_THREAT_TTL_TICKS = 120 // 12 seconds threat window
export const INITIAL_CUSTOMER_HEALTH = 70 // Health starts at 70/100
export const EXPANSION_MATURITY_TICKS = 1200 // 2 months active age required
export const EXPANSION_MIN_HEALTH = 60 // Minimum health for expansion
export const ADDON_PRICE_FRACTION = 0.25 // floor(base price * 0.25)
export const ADDON_SERVICE_COST_FRACTION = 0.30 // +30% service cost per addon
export const MAX_ADDON_SLOTS = 2 // max 2 addons per customer
export const MAXIMUM_ACCEPTED_PRICE_TO_WTP = 2.0

export const COMPETITION_START = 0.10
export const COMPETITION_PER_QUARTER = 0.025
export const COMPETITION_CAP = 0.85

export const FORECAST_TICKS = 1800
export const FORECAST_COLLECTION_HAIRCUT = 0.80

export const DEBT_MIN_MRR_CENTS = 10_000 // $100/mo ($12k/yr ARR) min to draw credit
export const DEBT_CAPACITY_MRR_MULTIPLE = 3 // 3x MRR credit line
export const DEBT_NOMINAL_APR = 0.18 // 18% nominal APR
export const DEBT_DEFAULT_TERM_MONTHS = 6

export const VC_MIN_ARR_CENTS = 1_200_000 // $12,000/yr ARR min to accept VC
export const VC_PRE_MONEY_ARR_MULTIPLE = 4 // 4x ARR pre-money valuation
export const VC_MAX_RAISE_FRACTION = 0.25 // raise up to 25% of pre-money
export const VC_GROWTH_TARGET_RATIO = 0.50 // +50% ARR growth per quarter

export const UNICORN_VALUATION_CENTS = 100_000_000_000 // $1,000,000,000 (1 Billion Dollars)
export const INITIAL_CASH_CENTS = 150_000 // $1,500 starting liquid capital
export const BASE_OVERHEAD_MONTHLY_CENTS = 10_000 // $100/mo fixed burn (garage default)
export const TIER_BASE_OVERHEAD_MONTHLY_CENTS: Record<EvolutionTier, number> = {
  garage: 10_000, // $100/mo
  workshop: 10_000, // $100/mo
  workstation: 25_000, // $250/mo
  growth: 500_000, // $5,000/mo
  ethereal: 2_500_000, // $25,000/mo
}

export interface FunctionSpec {
  manualSeconds: number
  unitLoad: number
  baseError: number
  attemptCostCents: number
}

export const FUNCTION_SPECS: Record<FunctionId, FunctionSpec> = {
  demand: { manualSeconds: 2, unitLoad: 1.0, baseError: 0.02, attemptCostCents: 100 },
  product: { manualSeconds: 6, unitLoad: 1.4, baseError: 0.03, attemptCostCents: 25 },
  monetisation: { manualSeconds: 3, unitLoad: 0.8, baseError: 0.02, attemptCostCents: 10 },
  retention: { manualSeconds: 4, unitLoad: 0.8, baseError: 0.02, attemptCostCents: 50 },
  expansion: { manualSeconds: 6, unitLoad: 1.2, baseError: 0.03, attemptCostCents: 25 },
  operations: { manualSeconds: 5, unitLoad: 0.6, baseError: 0.02, attemptCostCents: 30 },
  finance: { manualSeconds: 0, unitLoad: 0.0, baseError: 0.0, attemptCostCents: 0 },
}

export const SEGMENT_PROFILES: Record<CustomerSegment, SegmentProfile> = {
  creator: {
    id: 'creator',
    label: 'Solopreneur / Creator',
    baseWtpMonthlyCents: 4_000, // $40/mo
    serviceCostMonthlyCents: 400, // $4/mo
    needSpeed: 0.7,
    needCollaboration: 0.2,
    needControl: 0.1,
    collectionDelayTicks: 60, // 6 seconds
    collectionProbability: 0.95,
  },
  team: {
    id: 'team',
    label: 'High-Velocity Team',
    baseWtpMonthlyCents: 15_000, // $150/mo
    serviceCostMonthlyCents: 1_800, // $18/mo
    needSpeed: 0.2,
    needCollaboration: 0.6,
    needControl: 0.2,
    collectionDelayTicks: 120, // 12 seconds
    collectionProbability: 0.98,
  },
  enterprise: {
    id: 'enterprise',
    label: 'Regulated Enterprise',
    baseWtpMonthlyCents: 80_000, // $800/mo
    serviceCostMonthlyCents: 12_000, // $120/mo
    needSpeed: 0.1,
    needCollaboration: 0.3,
    needControl: 0.6,
    collectionDelayTicks: 240, // 24 seconds
    collectionProbability: 0.90,
  },
}

export const UPGRADE_RANK_COSTS = [
  50_000,       // Rank 1: $500
  300_000,      // Rank 2: $3,000
  2_000_000,    // Rank 3: $20,000
  15_000_000,   // Rank 4: $150,000
  100_000_000,  // Rank 5 (Singularity Hyperscale): $1,000,000
]

export const CRAFT_MULTIPLIERS = [1, 2, 4, 8, 16, 32]
export const MONETISATION_CRAFT_MULTIPLIERS = [1.0, 1.20, 1.45, 1.75, 2.10, 2.75]
export const SCALE_UNITS = [1, 2, 4, 8, 16, 32]
export const AUTOMATE_SPEEDS = [0, 0.20, 0.40, 0.70, 1.10, 1.80]
export const AUTOMATE_UPKEEP_CENTS = [0, 3_000, 7_000, 18_000, 50_000, 150_000] // $0, $30, $70, $180, $500, $1,500
export const EXTRA_UNIT_UPKEEP_CENTS = 1_000 // $10/mo per unit beyond 1
export const SPECULATIVE_OPTIMIZER_COOLDOWN_TICKS = 300 // 30s operational cooldown
export const DEMAND_REPLENISH_INTERVAL_TICKS = 140 // 14s organic demand refresh wave

export const DEFAULT_PRODUCT_COMPONENTS: ProductComponent[] = [
  // --- SPEED / WRITE PIPELINE ---
  {
    id: 'engine-streaming',
    name: 'Realtime Latency Piper',
    category: 'speed',
    bucket: 'write',
    shape: '2x1',
    capabilityBonus: 0.28,
    defectRisk: 0.04,
    flavor: 'Bypasses serialization layers directly to customer edge nodes.',
  },
  {
    id: 'engine-speculative',
    name: 'Speculative Token Cache',
    category: 'speed',
    bucket: 'write',
    shape: '1x1',
    capabilityBonus: 0.35,
    defectRisk: 0.08,
    flavor: 'Pre-computes predicted completions before the user submits input.',
  },
  {
    id: 'engine-jit',
    name: 'JIT Bytecode Compiler',
    category: 'speed',
    bucket: 'write',
    shape: '2x2',
    capabilityBonus: 0.42,
    defectRisk: 0.07,
    flavor: 'Transforms abstract syntax trees into native x86 machine instructions.',
  },
  {
    id: 'engine-gpu-kernel',
    name: 'Triton GPU Kernel Accelerator',
    category: 'speed',
    bucket: 'write',
    shape: 'L',
    capabilityBonus: 0.46,
    defectRisk: 0.10,
    flavor: 'Custom CUDA kernels optimizing tensor matrix multiplications in SRAM.',
  },
  {
    id: 'engine-kv-compress',
    name: 'Paged KV-Cache Condenser',
    category: 'speed',
    bucket: 'write',
    shape: '1x2',
    capabilityBonus: 0.32,
    defectRisk: 0.05,
    flavor: 'Deduplicates shared attention keys across multi-agent contexts.',
  },
  {
    id: 'engine-zero-copy',
    name: 'Zero-Copy IPC Ring',
    category: 'speed',
    bucket: 'write',
    shape: 'T',
    capabilityBonus: 0.38,
    defectRisk: 0.06,
    flavor: 'Shared memory ring buffers delivering 2 microsecond inter-process latency.',
  },

  // --- COLLABORATION / DIFF MESH ---
  {
    id: 'collab-presence',
    name: 'CRDT Sync Fabric',
    category: 'collaboration',
    bucket: 'diff',
    shape: '2x1',
    capabilityBonus: 0.30,
    defectRisk: 0.05,
    flavor: 'Sub-millisecond multiplayer cursor and state reconciliation.',
  },
  {
    id: 'collab-swarm',
    name: 'Multi-Agent Handoff Bus',
    category: 'collaboration',
    bucket: 'diff',
    shape: 'L',
    capabilityBonus: 0.38,
    defectRisk: 0.09,
    flavor: 'Allows AI agents and human teammates to share conversation traces.',
  },
  {
    id: 'collab-ast',
    name: 'Semantic AST Differ',
    category: 'collaboration',
    bucket: 'diff',
    shape: '1x1',
    capabilityBonus: 0.26,
    defectRisk: 0.03,
    flavor: 'Performs syntax-aware structural diffing instead of naive line matching.',
  },
  {
    id: 'collab-consensus',
    name: 'Raft Consensus State Machine',
    category: 'collaboration',
    bucket: 'diff',
    shape: '2x2',
    capabilityBonus: 0.44,
    defectRisk: 0.06,
    flavor: 'Guarantees strict linearizability across distributed agent clusters.',
  },
  {
    id: 'collab-branching',
    name: 'Ephemeral Branching Worktrees',
    category: 'collaboration',
    bucket: 'diff',
    shape: '1x2',
    capabilityBonus: 0.34,
    defectRisk: 0.04,
    flavor: 'Instantly spins up isolated sandbox worktrees for speculative agent code.',
  },
  {
    id: 'collab-vector-sync',
    name: 'Vector Embeddings Reconciler',
    category: 'collaboration',
    bucket: 'diff',
    shape: 'T',
    capabilityBonus: 0.39,
    defectRisk: 0.07,
    flavor: 'Syncs vector index partitions asynchronously across geographic replicas.',
  },

  // --- CONTROL & TESTING HARNESS ---
  {
    id: 'control-sandbox',
    name: 'Deterministic Docker Jail',
    category: 'control',
    bucket: 'test',
    shape: '2x1',
    capabilityBonus: 0.32,
    defectRisk: 0.03,
    flavor: 'Zero-trust runtime isolation guaranteeing SOC2 Type II compliance.',
  },
  {
    id: 'test-chaos',
    name: 'Chaos Regression Harness',
    category: 'control',
    bucket: 'test',
    shape: 'L',
    capabilityBonus: 0.36,
    defectRisk: 0.04,
    flavor: 'Fuzzes prompt boundaries and injected state exceptions in isolated memory.',
  },
  {
    id: 'test-fuzzing',
    name: 'Boundary Invariant Fuzzer',
    category: 'control',
    bucket: 'test',
    shape: '1x2',
    capabilityBonus: 0.35,
    defectRisk: 0.02,
    flavor: 'Runs 10,000 deterministic generative scenarios before code ships.',
  },
  {
    id: 'test-benchmark',
    name: 'p99 Latency Probe Rig',
    category: 'control',
    bucket: 'test',
    shape: '1x1',
    capabilityBonus: 0.28,
    defectRisk: 0.03,
    flavor: 'Simulates synthetic enterprise traffic spikes to catch tail latencies.',
  },
  {
    id: 'control-sanitizer',
    name: 'Prompt Injection Sanitizer',
    category: 'control',
    bucket: 'test',
    shape: 'T',
    capabilityBonus: 0.37,
    defectRisk: 0.03,
    flavor: 'Strips malicious jailbreak sequences and recursive system prompt overrides.',
  },

  // --- DEPLOYMENT & PRODUCTION ROUTING ---
  {
    id: 'deploy-edge',
    name: 'Zero-Downtime Edge Canary',
    category: 'speed',
    bucket: 'deploy',
    shape: '2x1',
    capabilityBonus: 0.34,
    defectRisk: 0.02,
    flavor: 'Traffic shifting canary router with automated rollback on degradation.',
  },
  {
    id: 'deploy-global-mesh',
    name: 'Global Anycast Edge Router',
    category: 'speed',
    bucket: 'deploy',
    shape: '2x2',
    capabilityBonus: 0.45,
    defectRisk: 0.05,
    flavor: 'Routes customer requests to the nearest GPU cluster in under 15ms.',
  },
  {
    id: 'control-telemetry',
    name: 'Immutable Audit Vault',
    category: 'control',
    bucket: 'deploy',
    shape: '1x1',
    capabilityBonus: 0.40,
    defectRisk: 0.04,
    flavor: 'Cryptographic ledger recording prompt inputs, tool calls, and hashes.',
  },
  {
    id: 'control-waf',
    name: 'eBPF Zero-Trust Gateway',
    category: 'control',
    bucket: 'deploy',
    shape: 'T',
    capabilityBonus: 0.41,
    defectRisk: 0.03,
    flavor: 'Kernel-level packet filtering enforcing strict egress authorization.',
  },
  {
    id: 'deploy-blue-green',
    name: 'Instant Blue/Green Switcher',
    category: 'speed',
    bucket: 'deploy',
    shape: '1x2',
    capabilityBonus: 0.36,
    defectRisk: 0.02,
    flavor: 'Swaps production traffic between environments with 0 dropped sockets.',
  },
  {
    id: 'control-rbac',
    name: 'Sovereign Multi-Tenant Vault',
    category: 'control',
    bucket: 'deploy',
    shape: 'L',
    capabilityBonus: 0.43,
    defectRisk: 0.04,
    flavor: 'Hardware security module storing tenant encryption keys in cold HSMs.',
  },
]

export const SCALE_POD_LIMITS = [1, 2, 4, 6, 8, 12]
export const DEMAND_CHANNEL_LIMITS = [1, 2, 3, 4, 5, 6]
export const MONETISATION_DESK_LIMITS = [1, 2, 3, 4, 5, 6]
export const RETENTION_BAY_LIMITS = [1, 2, 3, 4, 5, 6]
export const EXPANSION_BAY_LIMITS = [1, 2, 3, 4, 5, 6]
export const OPERATIONS_RACK_LIMITS = [1, 2, 3, 4, 5, 6]
export const EXPANSION_GRID_SIZES = [16, 16, 25, 25, 36, 36]
export const EXPANSION_GRID_DIMS = [4, 4, 5, 5, 6, 6]

export const EXTENDED_TIER_NAMES: Record<string, string[]> = {
  intelligence: [
    'Vector Embedding',
    'LoRA Adapter',
    'Context Engine',
    'Agent Swarm',
    'AGI Supercore',
    'Autonomous Research Cluster',
    'Sovereign Superintelligence',
  ],
  infrastructure: [
    'Micro-Pod',
    'K8s Node',
    'Edge Cache',
    'Mesh Gateway',
    'Exascale Grid',
    'Planetary Fibre Mesh',
    'Dyson Compute Sphere',
  ],
  security: [
    'API Key Vault',
    'SOC2 Gateway',
    'Zero-Trust Proxy',
    'HSM Enclave',
    'Quantum Bastion',
    'Post-Quantum Citadel',
    'Omnipresent Zero-Knowledge Fabric',
  ],
}

export interface DemandChannelMeta {
  id: string
  channelNumber: number
  name: string
  focusSegment: CustomerSegment | 'mixed'
  icon: string
  desc: string
  cacModifier: number
  wtpModifier: number
}

export const DEMAND_CHANNELS: DemandChannelMeta[] = [
  {
    id: 'ch-dev-community',
    channelNumber: 1,
    name: 'Dev Community & Open Source',
    focusSegment: 'creator',
    icon: '⚡',
    desc: 'High-velocity developer inbound and OSS hacker adopters.',
    cacModifier: 0.85,
    wtpModifier: 1.0,
  },
  {
    id: 'ch-launch-radar',
    channelNumber: 2,
    name: 'Product Launch & Showcase Radar',
    focusSegment: 'mixed',
    icon: '🚀',
    desc: 'Viral aggregator launches, Product Hunt & tech ecosystem traffic.',
    cacModifier: 1.0,
    wtpModifier: 1.15,
  },
  {
    id: 'ch-midmarket-radar',
    channelNumber: 3,
    name: 'Mid-Market Procurement Radar',
    focusSegment: 'team',
    icon: '🏢',
    desc: 'Fast-scaling engineering orgs seeking automated productivity.',
    cacModifier: 1.15,
    wtpModifier: 1.35,
  },
  {
    id: 'ch-enterprise-rfp',
    channelNumber: 4,
    name: 'Enterprise RFP & Security Inbound',
    focusSegment: 'enterprise',
    icon: '🛡️',
    desc: 'Regulated institutional inquiries and large multi-seat RFPs.',
    cacModifier: 1.4,
    wtpModifier: 1.8,
  },
  {
    id: 'ch-viral-referral',
    channelNumber: 5,
    name: 'Global Viral Referral Mesh',
    focusSegment: 'mixed',
    icon: '🌐',
    desc: 'Customer word-of-mouth referral network with $0 organic CAC.',
    cacModifier: 0.3,
    wtpModifier: 1.5,
  },
  {
    id: 'ch-sovereign-ai',
    channelNumber: 6,
    name: 'Sovereign AI Market Gateway',
    focusSegment: 'enterprise',
    icon: '🔮',
    desc: 'Hyperscale sovereign foundation model contracts.',
    cacModifier: 1.5,
    wtpModifier: 2.5,
  },
]

export const CODING_POD_MODULES: Array<{
  moduleName: string
  categoryTag: string
  codeSnippet: string
  baseLinesAdded: number
  baseLinesRemoved: number
  segmentAffinity: CustomerSegment
}> = [
  {
    moduleName: 'API GATEWAY',
    categoryTag: 'CORE INFRA',
    codeSnippet: 'export const gateway = new Router();',
    baseLinesAdded: 184,
    baseLinesRemoved: 32,
    segmentAffinity: 'creator',
  },
  {
    moduleName: 'VECTOR SEARCH',
    categoryTag: 'AI ENGINE',
    codeSnippet: 'const docs = await vectorIdx.query(q);',
    baseLinesAdded: 320,
    baseLinesRemoved: 14,
    segmentAffinity: 'team',
  },
  {
    moduleName: 'AUTH & RBAC',
    categoryTag: 'SECURITY',
    codeSnippet: 'validateSessionToken(jwt, { rbac: true });',
    baseLinesAdded: 142,
    baseLinesRemoved: 56,
    segmentAffinity: 'enterprise',
  },
  {
    moduleName: 'BILLING ENGINE',
    categoryTag: 'FINTECH',
    codeSnippet: 'await stripe.charges.create({...});',
    baseLinesAdded: 210,
    baseLinesRemoved: 19,
    segmentAffinity: 'team',
  },
  {
    moduleName: 'REALTIME SSE',
    categoryTag: 'STREAMING',
    codeSnippet: 'stream.pipeTo(eventSink.writable);',
    baseLinesAdded: 98,
    baseLinesRemoved: 12,
    segmentAffinity: 'creator',
  },
  {
    moduleName: 'SWARM ROUTER',
    categoryTag: 'AGENT ORCH',
    codeSnippet: 'const plan = await swarm.compile(spec);',
    baseLinesAdded: 412,
    baseLinesRemoved: 88,
    segmentAffinity: 'enterprise',
  },
]

export const ENGINE_ARCHETYPES: Record<EngineArchetypeId, EngineArchetype> = {
  product_led_machine: {
    id: 'product_led_machine',
    name: 'Product-Led Autonomous Machine',
    title: 'Autonomous Builder Swarm',
    description: 'High-frequency self-compiling autonomous agent pods with continuous CI/CD automated verification.',
    buffsSummary: '+25% Build Yield · -20% Defect Escape · +1 Base Pod Slot',
    assetPath: '/assets/archetypes/archetype_product_led_machine.png',
    passiveEffects: {
      productYieldBonus: 0.25,
      defectReduction: 0.20,
      podCapacityBonus: 1,
    },
  },
  distribution_engine: {
    id: 'distribution_engine',
    name: 'Distribution Viral Engine',
    title: 'Top-of-Funnel Market Monopoly',
    description: 'Algorithmic crawler scraping high-intent executive signals across tech hubs with viral compounding.',
    buffsSummary: '+35% Lead Arrival · -25% CAC · +15% Qualification Speed',
    assetPath: '/assets/archetypes/archetype_distribution_engine.png',
    passiveEffects: {
      demandRateBonus: 0.35,
      acquisitionCostDiscount: 0.25,
    },
  },
  nrr_fortress: {
    id: 'nrr_fortress',
    name: 'NRR Sovereign Fortress',
    title: 'Negative Net Churn Moat',
    description: 'Autonomous customer success agents intercepting account churn and driving contractual NRR upsells.',
    buffsSummary: '+40% Churn Resistance · +25% Upsell ACV · Zero Renewal Delinquency',
    assetPath: '/assets/archetypes/archetype_nrr_fortress.png',
    passiveEffects: {
      churnResistance: 0.40,
      expansionBonus: 0.25,
    },
  },
  default_alive: {
    id: 'default_alive',
    name: 'Default-Alive Capital Compounder',
    title: 'Endowment Runway Arbitrage',
    description: 'Hyper-disciplined treasury management converting operational cash flow into non-dilutive compounding.',
    buffsSummary: '+15% Cash Yield on ARR · -30% Fixed OPEX Burn · Extended Debt Tolerance',
    assetPath: '/assets/archetypes/archetype_default_alive.png',
    passiveEffects: {
      cashYieldBonus: 0.15,
      opexDiscount: 0.30,
    },
  },
  operations_fortress: {
    id: 'operations_fortress',
    name: 'Operations Sovereign Grid',
    title: 'Zero-Strain Cluster Infrastructure',
    description: 'Industrial-grade cluster orchestration eliminating coordination strain and context rot decay.',
    buffsSummary: '+50% Ops Capacity · -40% Strain Accumulation · Instant Incident Diagnostic',
    assetPath: '/assets/archetypes/archetype_operations_fortress.png',
    passiveEffects: {
      opsCapacityBonus: 0.50,
      strainReduction: 0.40,
    },
  },
}

export const RELIC_PRICING: Record<'rare' | 'monumental' | 'ethereal', number> = {
  rare: 1_500_000,        // $15,000
  monumental: 15_000_000, // $150,000
  ethereal: 150_000_000,  // $1,500,000
}

export const CONSUMABLE_PRICING: Record<'rare' | 'monumental' | 'ethereal', number> = {
  rare: 500_000,          // $5,000
  monumental: 3_500_000,  // $35,000
  ethereal: 25_000_000,   // $250,000
}

export const MAX_CONSUMABLE_SLOTS = 6
export const QUARTER_REROLL_BASE_COST_CENTS = 1_000_000 // $10,000

const RAW_RELICS: Omit<Relic, 'costCents'>[] = [
  {
    id: 'relic-vibe-coder',
    name: 'Prompt Injection Firewall',
    category: 'stability',
    effectSummary: 'Reduces Context Rot accumulation by 50% across all automated functions.',
    flavor: 'Patches agent hallucination drift before it corrupts customer production pipelines.',
    rarity: 'rare',
  },
  {
    id: 'relic-circuit-breaker',
    name: 'Self-Healing Architecture',
    category: 'efficiency',
    effectSummary: 'Operations capacity increased by +30%; automatically auto-heals 1 incident per quarter.',
    flavor: 'A watchdog daemon that reboots crashing inference microservices before alarms trigger.',
    rarity: 'rare',
  },
  {
    id: 'relic-dark-fiber',
    name: 'Dark Fiber Edge Peering',
    category: 'efficiency',
    effectSummary: 'Gives +40% Speed component capability bonus and eliminates network latency.',
    flavor: 'Direct fiber optic links into Tokyo, Frankfurt, and Ashburn data hubs.',
    rarity: 'rare',
  },
  {
    id: 'relic-open-source',
    name: 'Viral Open Source Repo',
    category: 'growth',
    effectSummary: 'Inbound Demand organically delivers 1 free pre-qualified lead every 15 seconds ($0 CAC).',
    flavor: 'Trending on GitHub with 24k stars, generating steady organic inbound interest.',
    rarity: 'rare',
  },
  {
    id: 'relic-gpu-cluster',
    name: 'H100 Reserved Instances',
    category: 'automation',
    effectSummary: 'Increases all Automate agent execution speeds by +25% without compute upkeep.',
    flavor: 'Locked in three-year reserved capacity before the sovereign AI fund bubble.',
    rarity: 'monumental',
  },
  {
    id: 'relic-stealth-moat',
    name: 'Enterprise Procurement Passkey',
    category: 'growth',
    effectSummary: 'Enterprise collection delays cut from 24s to 6s; collection rate boosted to 100%.',
    flavor: 'Gets vendor security sign-off through an executive backchannel golf game.',
    rarity: 'monumental',
  },
  {
    id: 'relic-negative-churn',
    name: 'Negative Net Churn Engine',
    category: 'growth',
    effectSummary: 'Healthy accounts (>70 health) automatically expand ARR by +5% every quarter.',
    flavor: 'Expansion land-and-expand flywheel that turns happy users into enterprise buyers.',
    rarity: 'monumental',
  },
  {
    id: 'relic-algo-pricing',
    name: 'Algorithmic Dynamic Pricing',
    category: 'growth',
    effectSummary: 'Increases WTP pricing capture by +35% with zero customer churn sensitivity penalty.',
    flavor: 'Reinforcement learning model that calculates the exact willingness to pay of every buyer.',
    rarity: 'monumental',
  },
  {
    id: 'relic-syndicate',
    name: 'Silicon Valley Seed Syndicate',
    category: 'capital',
    effectSummary: 'Decreases all Skill Tree research cash costs by 35%.',
    flavor: 'Angel syndicate provides subsidized founder grants and advisor discounts.',
    rarity: 'monumental',
  },
  {
    id: 'relic-soc2-fasttrack',
    name: 'SOC2 Type II Fast-Track',
    category: 'stability',
    effectSummary: 'Triples Enterprise conversion probability and increases enterprise initial ACV by +50%.',
    flavor: 'Pre-audited compliance vault certified by top cryptographic auditors.',
    rarity: 'monumental',
  },
  {
    id: 'relic-direct-debit',
    name: 'Automated Direct Debit',
    category: 'capital',
    effectSummary: 'Eliminates invoice delinquencies completely; payment retries never fail.',
    flavor: 'Direct corporate ACH pull authorization embedded into the master service agreement.',
    rarity: 'monumental',
  },
  {
    id: 'relic-auto-compiler',
    name: 'Self-Correcting Transformer',
    category: 'automation',
    effectSummary: 'Automated Product builds gain +20% build yield and -50% defect probability.',
    flavor: 'Synthesizes verified formal proofs before pushing any code to production.',
    rarity: 'monumental',
  },
  {
    id: 'relic-anisotropic-sheen',
    name: 'Founder Reality Distortion Field',
    category: 'capital',
    effectSummary: 'Boosts Growth Multiple by +0.4x in Valuation formulas.',
    flavor: 'Wall Street analysts start grading your company by compute-vibes rather than GAAP EBITDA.',
    rarity: 'ethereal',
  },
  {
    id: 'relic-sovereign-grant',
    name: 'Sovereign AI Compute Grant',
    category: 'capital',
    effectSummary: 'Provides $15,000 non-dilutive liquid grant every quarter and eliminates base overhead.',
    flavor: 'National compute reserve grant for critical AI infrastructure development.',
    rarity: 'ethereal',
  },
  {
    id: 'relic-holding-swarm',
    name: 'Autonomous Holding Swarm',
    category: 'automation',
    effectSummary: 'Doubles maximum worker unit capacity across all 6 company departments.',
    flavor: 'Self-organizing neural swarm that coordinates hundreds of specialized agents.',
    rarity: 'ethereal',
  },
  {
    id: 'relic-anti-fragile',
    name: 'Anti-Fragile Architecture',
    category: 'stability',
    effectSummary: 'Company valuation increases by +5% whenever an Operations crisis or Churn threat is averted.',
    flavor: 'Every operational stress-test makes the core enterprise network stronger.',
    rarity: 'ethereal',
  },
  // --- NEW HIGH-SYNERGY ROGUELIKE RELICS ---
  {
    id: 'relic-cold-outreach',
    name: 'Cold Outreach Multi-Threading',
    category: 'growth',
    effectSummary: 'Demand room generates +2 additional market signals per refresh cycle.',
    flavor: 'Automated agent scrapers parse executive job postings and funding rounds.',
    rarity: 'rare',
  },
  {
    id: 'relic-feature-flags',
    name: 'Dark-Launched Feature Flags',
    category: 'efficiency',
    effectSummary: 'Product coding pods complete with 40% lower defect risk exposure.',
    flavor: 'Canary deployments decouple code releases from customer visibility.',
    rarity: 'rare',
  },
  {
    id: 'relic-tam-expansion',
    name: 'Hyper-Niche TAM Expansion',
    category: 'growth',
    effectSummary: 'All inbound market signals roll +25% higher customer willingness-to-pay.',
    flavor: 'Uncovers desperate enterprise verticals willing to pay premiums for speed.',
    rarity: 'rare',
  },
  {
    id: 'relic-ops-telemetry',
    name: 'eBPF Kernel Telemetry',
    category: 'stability',
    effectSummary: 'Operations push-your-luck card reveals 1 negative hazard pod safely.',
    flavor: 'Direct bytecode inspection inside the host Linux kernel catches faults early.',
    rarity: 'rare',
  },
  {
    id: 'relic-sub-pod-buffer',
    name: 'Zero-Copy Micro-Pods',
    category: 'efficiency',
    effectSummary: 'Expansion matrix synthesis costs $0 compute for all Tier 1 features.',
    flavor: 'Shared memory ring buffers allow instantaneous feature spawning without compute overhead.',
    rarity: 'rare',
  },
  {
    id: 'relic-customer-advocacy',
    name: 'Net Promoter Viral Loop',
    category: 'growth',
    effectSummary: 'Every 20 active paying customers organically delivers 1 pre-qualified lead every 20s.',
    flavor: 'Delighted engineers recommend your platform in developer Discords and Slack communities.',
    rarity: 'rare',
  },
  {
    id: 'relic-quantum-annealing',
    name: 'Quantum Annealing Synthesizer',
    category: 'efficiency',
    effectSummary: 'Expansion synthesizer directly spawns Tier 2 modules onto the 4x4 matrix.',
    flavor: 'D-Wave quantum annealer finds optimal feature architectures instantaneously.',
    rarity: 'monumental',
  },
  {
    id: 'relic-silicon-mafia',
    name: 'PayPal Mafia Executive Network',
    category: 'growth',
    effectSummary: '16 running agents in Demand automatically feeds double opportunities to Product.',
    flavor: 'Executive warm intros bypass procurement gatekeepers and accelerate deals.',
    rarity: 'monumental',
  },
  {
    id: 'relic-debt-arbitrage',
    name: 'Venture Debt Treasury Arbitrage',
    category: 'capital',
    effectSummary: 'Earns 12% annualized yield on unspent cash reserves every month.',
    flavor: 'Treasury yields outpace venture debt interest through overnight repo facilities.',
    rarity: 'monumental',
  },
  {
    id: 'relic-zk-proofs',
    name: 'Zero-Knowledge Enterprise Enclave',
    category: 'stability',
    effectSummary: 'Eliminates enterprise procurement latency; enterprise invoices mature 4x faster.',
    flavor: 'Cryptographic proofs mathematically verify privacy without manual SOC2 questionnaires.',
    rarity: 'monumental',
  },
  {
    id: 'relic-shadow-fleet',
    name: 'Shadow Overclock Protocol',
    category: 'automation',
    effectSummary: 'When runway drops below 6 months, all swarm agents run at 2.5x speed in survival mode.',
    flavor: 'All safety throttles are bypassed when the company faces bankruptcy.',
    rarity: 'monumental',
  },
  {
    id: 'relic-neural-distillation',
    name: 'Neural Distillation Pipeline',
    category: 'efficiency',
    effectSummary: 'Fulfilling an Expansion RFP permanently boosts Product system capability by +5%.',
    flavor: 'Real-world customer upsell data fine-tunes your base models in production.',
    rarity: 'monumental',
  },
  {
    id: 'relic-algorithmic-upsell',
    name: 'Predictive Churn Interceptor',
    category: 'stability',
    effectSummary: 'Accounts with health < 60% automatically receive +20 health triage without founder cost.',
    flavor: 'Predictive churn ML model triggers customer success interventions proactively.',
    rarity: 'monumental',
  },
  {
    id: 'relic-hyper-concurrency',
    name: 'Erlang Actor Matrix',
    category: 'stability',
    effectSummary: 'Operations cluster strain generation reduced by 60% across all functions.',
    flavor: 'Lightweight fault-tolerant actor processes never leak state across nodes.',
    rarity: 'monumental',
  },
  {
    id: 'relic-viral-monolith',
    name: 'Viral Flywheel Monolith',
    category: 'growth',
    effectSummary: 'Every 10 active customers compound total company ARR by +3% at every quarter review.',
    flavor: 'Network effects turn every new enterprise customer into a sales hub for others.',
    rarity: 'ethereal',
  },
  {
    id: 'relic-pre-ipo-distortion',
    name: 'Wall Street Narrative Engine',
    category: 'capital',
    effectSummary: 'Valuation pre-money multiple permanently doubles (8x ARR base instead of 4x).',
    flavor: 'Investment bankers price your software as a generational category sovereign.',
    rarity: 'ethereal',
  },
  {
    id: 'relic-singularity-supercore',
    name: 'Singularity AGI Core',
    category: 'automation',
    effectSummary: 'Swarm agent execution frequency doubles across all 6 departments simultaneously.',
    flavor: 'Self-improving cognitive loop operates at the thermal limits of silicon.',
    rarity: 'ethereal',
  },
  {
    id: 'relic-defense-monopoly',
    name: 'Classified Defense Exclusivity',
    category: 'capital',
    effectSummary: 'Unlocks recurring $250,000/quarter government AI research grant.',
    flavor: 'Sole-source contract designation guarantees non-dilutive sovereign capital.',
    rarity: 'ethereal',
  },
  {
    id: 'relic-immortal-balance',
    name: 'Infinite Runway Endowment',
    category: 'capital',
    effectSummary: 'Cash interest on treasury pays 100% of base company overhead bills forever.',
    flavor: 'Achieves true default-alive escape velocity where fixed costs are perpetually zero.',
    rarity: 'ethereal',
  },
]

export const RELIC_CATALOG: Relic[] = RAW_RELICS.map(r => ({
  ...r,
  costCents: RELIC_PRICING[r.rarity],
}))

const RAW_CONSUMABLES: Omit<Consumable, 'costCents'>[] = [
  {
    id: 'cons-hn-blitz',
    name: 'Hacker News Frontpage Blitz',
    effectSummary: 'Immediately floods Demand with 4 pre-qualified high-intent leads ($0 CAC).',
    flavor: 'Show HN post hits #1 with 1,200 points and thousands of developer signups.',
    actionType: 'hn_blitz',
    icon: 'Zap',
    rarity: 'rare',
  },
  {
    id: 'cons-emergency-safe',
    name: 'YC Emergency SAFE Note',
    effectSummary: 'Instantly wires $50,000 or 15% of annual ARR in liquid cash to company balance.',
    flavor: 'Quick pro-rata check from top-tier accelerator partners to fuel growth.',
    actionType: 'emergency_safe',
    icon: 'DollarSign',
    rarity: 'rare',
  },
  {
    id: 'cons-war-room',
    name: 'War Room Hyper-Espresso',
    effectSummary: 'Overclocks all automations and manual actions to 400% speed for 30 seconds.',
    flavor: 'Team enters god-mode flow state with zero sleep and unlimited espresso.',
    actionType: 'war_room',
    icon: 'Flame',
    rarity: 'monumental',
  },
  {
    id: 'cons-exec-golf',
    name: 'Executive Golf Backchannel',
    effectSummary: 'Instantly cures all delinquent accounts and collects 100% of pending invoices now.',
    flavor: 'Closes billing disputes over an 18-hole round at Pebble Beach.',
    actionType: 'exec_golf',
    icon: 'CheckCircle',
    rarity: 'monumental',
  },
  {
    id: 'cons-kernel-purge',
    name: 'Zero-Day Kernel Purge',
    effectSummary: 'Instantly purges 100% of context rot and resets strain backlog to zero.',
    flavor: 'Cold restart of all inference caches and rogue worker memory leaks.',
    actionType: 'kernel_purge',
    icon: 'Shield',
    rarity: 'monumental',
  },
  {
    id: 'cons-defense-rfp',
    name: 'Sovereign Defense RFP',
    effectSummary: 'Immediately awards and signs an Enterprise Contract ($250k/yr or 10% of fleet ARR).',
    flavor: 'Exclusive sole-source government contract signed with expedited procurement.',
    actionType: 'defense_rfp',
    icon: 'FileText',
    rarity: 'ethereal',
  },
  {
    id: 'cons-tech-raid',
    name: 'Hostile Competitor Tech Raid',
    effectSummary: 'Grants +3,000 work credits across all 6 departments immediately.',
    flavor: 'Acqui-hires an entire engineering squad from a struggling legacy competitor.',
    actionType: 'tech_raid',
    icon: 'Cpu',
    rarity: 'monumental',
  },
  {
    id: 'cons-debt-bridge',
    name: 'Venture Debt Liquidity Bridge',
    effectSummary: 'Completely wipes out 100% of current debt principal and interest ($0 cash cost).',
    flavor: 'Restructures debt with institutional lenders into forgiven innovation credits.',
    actionType: 'debt_bridge',
    icon: 'TrendingUp',
    rarity: 'ethereal',
  },
  // --- NEW TACTICAL CONSUMABLES ---
  {
    id: 'cons-competitor-raid',
    name: 'Hostile Tech Acqui-Hire',
    effectSummary: 'Siphons $100,000 in monthly ARR from a failing legacy incumbent immediately.',
    flavor: 'Poaches key enterprise customers from a slow-moving legacy SaaS provider.',
    actionType: 'competitor_raid',
    icon: 'Cpu',
    rarity: 'monumental',
  },
  {
    id: 'cons-supercluster-burst',
    name: 'Supercomputer Overclock Burst',
    effectSummary: '5x all swarm actions and compiles for 25 seconds.',
    flavor: 'Channels raw compute from unallocated sovereign clusters.',
    actionType: 'supercluster_burst',
    icon: 'Flame',
    rarity: 'monumental',
  },
  {
    id: 'cons-patent-shield',
    name: 'Sovereign Patent Shield',
    effectSummary: 'Deflects all operational incidents and churn threats for 45 seconds.',
    flavor: 'Top Silicon Valley legal firm issues cease-and-desist defenses against trolls.',
    actionType: 'patent_shield',
    icon: 'Shield',
    rarity: 'rare',
  },
  {
    id: 'cons-secondary-sale',
    name: 'Founder Secondary Share Sale',
    effectSummary: 'Liquidates private stock for $2,000,000 in immediate liquid cash.',
    flavor: 'Growth equity fund buys secondary founder equity at peak valuation.',
    actionType: 'secondary_sale',
    icon: 'DollarSign',
    rarity: 'ethereal',
  },
  {
    id: 'cons-bullseye-lock',
    name: 'Perfect Pricing Calibration',
    effectSummary: 'Next 5 Monetisation deal closures are guaranteed 100% Bullseye strikes (+50% ARR).',
    flavor: 'AI pricing copilot predicts exact customer budget ceilings down to the cent.',
    actionType: 'bullseye_lock',
    icon: 'CheckCircle',
    rarity: 'rare',
  },
  {
    id: 'cons-matrix-purge',
    name: 'Quantum Grid Super-Synthesis',
    effectSummary: 'Upgrades all modules on the 4x4 Expansion matrix by +1 Tier instantly.',
    flavor: 'Quantum annealer compresses matrix modules into next-generation tiers simultaneously.',
    actionType: 'matrix_purge',
    icon: 'Zap',
    rarity: 'monumental',
  },
  {
    id: 'cons-enterprise-pilot',
    name: 'Fortune 50 Enterprise Deployment',
    effectSummary: 'Instantly converts the highest WTP opportunity into an active enterprise account.',
    flavor: 'Signs master enterprise agreement with expedited executive sign-off.',
    actionType: 'enterprise_pilot',
    icon: 'FileText',
    rarity: 'ethereal',
  },
  {
    id: 'cons-talent-blitz',
    name: 'Elite AI Researcher Signing',
    effectSummary: 'Instantly grants 1 free level to Craft across all 6 departments.',
    flavor: 'Renowned researcher leaves big tech to lead autonomous model synthesis.',
    actionType: 'talent_blitz',
    icon: 'Cpu',
    rarity: 'ethereal',
  },
  {
    id: 'cons-debt-forgiveness',
    name: 'Debt Jubilee Accord',
    effectSummary: 'Wipes out 100% of active debt principal and accrued interest.',
    flavor: 'Lenders convert debt into forgiven R&D innovation credits.',
    actionType: 'debt_forgiveness',
    icon: 'TrendingUp',
    rarity: 'ethereal',
  },
  {
    id: 'cons-viral-podcast',
    name: 'Joe Rogan AI Deep-Dive',
    effectSummary: 'Floods Demand with 8 massive-WTP inbound leads at $0 CAC.',
    flavor: 'Three-hour deep dive on technological singularity drives millions of impressions.',
    actionType: 'viral_podcast',
    icon: 'Zap',
    rarity: 'rare',
  },
  {
    id: 'cons-incident-nuke',
    name: 'Global Microservice Failover',
    effectSummary: 'Instantly purges all cluster strain, context rot, and active incidents.',
    flavor: 'Flawless automated multi-region DNS failover clears bad microservices.',
    actionType: 'incident_nuke',
    icon: 'Shield',
    rarity: 'monumental',
  },
  {
    id: 'cons-valuation-pump',
    name: 'Morgan Stanley Research Upgrade',
    effectSummary: 'Grants +5.0x Growth Multiple boost on your next quarterly valuation review.',
    flavor: 'Analyst report names your startup the undisputed category winner.',
    actionType: 'valuation_pump',
    icon: 'TrendingUp',
    rarity: 'ethereal',
  },
]

export const CONSUMABLE_CATALOG: Consumable[] = RAW_CONSUMABLES.map(c => ({
  ...c,
  costCents: CONSUMABLE_PRICING[c.rarity],
}))

// ============================================================================
// 12 CONTEXTUAL END-OF-RUN ACHIEVEMENTS & FOUNDER RELICS
// ============================================================================

export interface FounderAchievementEntry extends FounderAchievement {
  evaluate: (state: GameState) => boolean
}

export const FOUNDER_ACHIEVEMENTS_AND_RELICS: FounderAchievementEntry[] = [
  {
    id: 'ach_sub_second',
    name: 'Sub-Second Execution',
    description: 'Complete a run reaching Series A ($10M+ Valuation) or achieve $500k+ ARR.',
    metricLabel: 'Valuation >= $10M or ARR >= $500k',
    relicId: 'founder_overclocked_silicon',
    evaluate: (state: GameState) => state.valuationCents >= 1_000_000_000 || state.eligibleArrCents >= 50_000_000,
    unlockedRelic: {
      id: 'founder_overclocked_silicon',
      name: 'Overclocked Silicon',
      title: 'High-Frequency Compute Matrix',
      tier: 'rare',
      category: 'speed',
      speedBonus: 2,
      effectSummary: '⚡ Permanently unlocks 2× Simulation Speed. +15% Product build yield.',
      flavor: 'Liquid-nitrogen chilled TPU racks pushing clock cycles past theoretical architectural bounds.',
      icon: '/assets/2.5d/expansion_infrastructure.png',
      passiveEffects: {
        productYieldBonus: 0.15,
      },
    },
  },
  {
    id: 'ach_hyperscale_singularity',
    name: 'Hyperscale Singularity',
    description: 'Achieve the coveted $1B Valuation Unicorn milestone or reach $50M+ ARR.',
    metricLabel: 'Valuation >= $1B',
    relicId: 'founder_tachyon_chronometer',
    evaluate: (state: GameState) => state.valuationCents >= 100_000_000_000 || state.runStatus === 'unicorn_victory',
    unlockedRelic: {
      id: 'founder_tachyon_chronometer',
      name: 'Tachyon Chronometer',
      title: 'Relativistic Temporal Engine',
      tier: 'ethereal',
      category: 'speed',
      speedBonus: 5,
      effectSummary: '🌀 Permanently unlocks 5× Simulation Speed. Automated agents cycle 20% faster.',
      flavor: 'Causal warp core that compresses days of enterprise execution into split seconds.',
      icon: '/assets/founder_nexus_3d.png',
      passiveEffects: {
        automateSpeedBonus: 0.20,
      },
    },
  },
  {
    id: 'ach_zero_defect',
    name: 'Zero-Defect Dogma',
    description: 'Reach Q4 without letting any customer-facing defects escape into production.',
    metricLabel: 'Quarter >= 4 & Incidents Backlog = 0',
    relicId: 'founder_formal_verification',
    evaluate: (state: GameState) => state.quarter >= 4 && (state.operations?.incidentsBacklog ?? 0) === 0,
    unlockedRelic: {
      id: 'founder_formal_verification',
      name: 'Formal Verification Kernel',
      title: 'Provable Correctness Moat',
      tier: 'rare',
      category: 'quality',
      effectSummary: 'Product pods start with 1 auto-slotted TEST primitive and have -35% defect rate.',
      flavor: 'Mathematical correctness co-pilot guarantees zero runtime crashes or regressions.',
      icon: '/assets/primitives/primitive_test.png',
      passiveEffects: {
        defectReduction: 0.35,
      },
    },
  },
  {
    id: 'ach_default_alive',
    name: 'Default Alive Purist',
    description: 'Reach $1M+ ARR without taking venture debt or VC dilution.',
    metricLabel: 'ARR >= $1M & Founder Equity >= 99%',
    relicId: 'founder_bootstrapper_ledger',
    evaluate: (state: GameState) => state.eligibleArrCents >= 100_000_000 && (state.vc?.founderOwnershipRatio ?? 1) >= 0.99,
    unlockedRelic: {
      id: 'founder_bootstrapper_ledger',
      name: "Bootstrapper's Ledger",
      title: 'Capital Discipline Relic',
      tier: 'rare',
      category: 'capital',
      effectSummary: '+20% liquid cash interest yield on banked treasury and -25% base OPEX burn.',
      flavor: 'Dogged frugality and profitable unit economics that make outside capital obsolete.',
      icon: '/assets/2.5d/piggy_bank_intact.png',
      passiveEffects: {
        cashYieldBonus: 0.20,
        opexDiscount: 0.25,
      },
    },
  },
  {
    id: 'ach_negative_churn',
    name: 'Negative Churn Citadel',
    description: 'Maintain >= 120% Net Revenue Retention with at least 5 active customer accounts.',
    metricLabel: 'Active Accounts >= 5 & Zero Churn',
    relicId: 'founder_churn_ward',
    evaluate: (state: GameState) => state.accounts.length >= 5 && state.arrBridge.churnArrCents === 0,
    unlockedRelic: {
      id: 'founder_churn_ward',
      name: 'The Churn Ward',
      title: 'SLA Retention Perimeter',
      tier: 'monumental',
      category: 'stability',
      effectSummary: 'All customer accounts gain +30 base SLA health buffer and +20% add-on willingness-to-pay.',
      flavor: 'Predictive sentiment neural net resolves executive dissatisfaction before tickets are filed.',
      icon: '/assets/2.5d/shield_perimeter_secure.png',
      passiveEffects: {
        churnResistance: 0.30,
        expansionBonus: 0.20,
      },
    },
  },
  {
    id: 'ach_market_monopoly',
    name: 'Algorithmic Monopoly',
    description: 'Qualify 25+ inbound market signals into the product hopper in a single run.',
    metricLabel: 'Qualified Hopper Opportunities >= 25',
    relicId: 'founder_market_radar',
    evaluate: (state: GameState) => (state.qualifiedOpportunities.length + state.accounts.length * 2) >= 15,
    unlockedRelic: {
      id: 'founder_market_radar',
      name: 'Market Radar Array',
      title: 'Omnipresent Demand Scanner',
      tier: 'rare',
      category: 'growth',
      effectSummary: 'Demand hopper displays +2 simultaneous signals with +25% base willingness-to-pay.',
      flavor: 'Autonomous agent web scrapers identify high-budget buyer intent before RFPs open.',
      icon: '/assets/2.5d/nav_demand.png',
      passiveEffects: {
        demandRateBonus: 0.25,
      },
    },
  },
  {
    id: 'ach_autonomous_centaur',
    name: 'Autonomous Centaur',
    description: 'Upgrade Automate swarm to Rank 3 across at least 3 workstation functions.',
    metricLabel: 'Swarm Automation Rank >= 3 in 3 functions',
    relicId: 'founder_hive_core',
    evaluate: (state: GameState) => Object.values(state.fleet).filter(f => f.automateRank >= 3).length >= 3,
    unlockedRelic: {
      id: 'founder_hive_core',
      name: 'Autonomous Hive Core',
      title: 'Self-Organizing Neural Swarm',
      tier: 'monumental',
      category: 'automation',
      effectSummary: 'Automated agent workers execute +40% faster with zero coordination strain.',
      flavor: 'Coordinated agent mesh eliminates human bottlenecks across the entire corporate stack.',
      icon: '/assets/2.5d/node_golden_core.png',
      passiveEffects: {
        automateSpeedBonus: 0.40,
      },
    },
  },
  {
    id: 'ach_diamond_hands',
    name: 'Diamond Hands Syndicate',
    description: 'Reach $50M+ valuation while retaining >= 85% founder ownership equity.',
    metricLabel: 'Valuation >= $50M & Equity >= 85%',
    relicId: 'founder_voting_proxy',
    evaluate: (state: GameState) => state.valuationCents >= 5_000_000_000 && (state.vc?.founderOwnershipRatio ?? 1) >= 0.85,
    unlockedRelic: {
      id: 'founder_voting_proxy',
      name: 'Founder Voting Proxy',
      title: 'Sovereign Cap Table Shield',
      tier: 'monumental',
      category: 'capital',
      effectSummary: 'VC term sheets offer 50% less equity dilution and boost pre-money valuation multiple.',
      flavor: 'Dual-class super-voting rights that protect visionary founder authority indefinitely.',
      icon: '/assets/milestones/milestone_founder_equity.png',
      passiveEffects: {
        cashYieldBonus: 0.15,
      },
    },
  },
  {
    id: 'ach_incident_commander',
    name: 'Incident Commander',
    description: 'Squash 15+ retention threats and maintain zero customer cancellations.',
    metricLabel: 'Retention combo >= 5 and zero churn',
    relicId: 'founder_hotfix_sledge',
    evaluate: (state: GameState) => ((state.retentionCombo ?? 0) >= 5 || state.accounts.length >= 6) && state.arrBridge.churnArrCents === 0,
    unlockedRelic: {
      id: 'founder_hotfix_sledge',
      name: 'Hotfix Sledgehammer',
      title: 'Zero-Downtime Strike Weapon',
      tier: 'rare',
      category: 'stability',
      effectSummary: 'Mallet tool in Retention costs $0 cash; Operations scratch card reveals 2 positive pods immediately.',
      flavor: 'A legendary tungsten mallet forged in the fires of 3 AM production outages.',
      icon: '/assets/2.5d/tool_hotfix_sledge.png',
      passiveEffects: {
        opsCapacityBonus: 0.25,
      },
    },
  },
  {
    id: 'ach_whale_whisperer',
    name: 'The Whale Whisperer',
    description: 'Sign 3+ Enterprise tier customer contracts with perfect pricing bullseye timing.',
    metricLabel: 'Enterprise Accounts >= 3',
    relicId: 'founder_enterprise_key',
    evaluate: (state: GameState) => state.accounts.filter(a => a.segment === 'enterprise').length >= 3,
    unlockedRelic: {
      id: 'founder_enterprise_key',
      name: 'Enterprise Master Key',
      title: 'SOC2 Procurement Passkey',
      tier: 'monumental',
      category: 'growth',
      effectSummary: 'Enterprise leads arrive twice as often and pay +40% contract ARR on closing.',
      flavor: 'Pre-cleared vendor compliance badges and C-suite golf club introductions.',
      icon: '/assets/2.5d/expansion_security.png',
      passiveEffects: {
        demandRateBonus: 0.30,
      },
    },
  },
  {
    id: 'ach_quantum_grid',
    name: 'Quantum Grid Architect',
    description: 'Synthesize a Tier 4+ component in the Expansion merge studio.',
    metricLabel: 'Merge Synthesis Tier >= 4',
    relicId: 'founder_synthesis_matrix',
    evaluate: (state: GameState) => (state.mergeGrid || []).some(item => item && item.tier >= 4),
    unlockedRelic: {
      id: 'founder_synthesis_matrix',
      name: 'Fractal Synthesis Matrix',
      title: 'High-Order Topology Fabric',
      tier: 'ethereal',
      category: 'growth',
      effectSummary: 'Expansion merge grid spawns with free Tier 2 items and +2 starting merge slots.',
      flavor: 'Recursive compilation matrix that synthesizes enterprise add-ons instantaneously.',
      icon: '/assets/2.5d/expansion_intelligence.png',
      passiveEffects: {
        expansionBonus: 0.35,
      },
    },
  },
  {
    id: 'ach_solopreneur_monolith',
    name: "Solopreneur's Monolith",
    description: 'Reach $50M+ Valuation with total team size / online units <= 2 (pure solopreneur).',
    metricLabel: 'Valuation >= $50M & Team <= 2',
    relicId: 'founder_solopreneur_monolith',
    evaluate: (state: GameState) =>
      state.valuationCents >= 5_000_000_000 &&
      Object.values(state.fleet).reduce((sum, f) => sum + f.onlineUnits, 0) <= 2,
    unlockedRelic: {
      id: 'founder_solopreneur_monolith',
      name: "Solopreneur's Monolith",
      title: 'Infinite Founder Leverage',
      tier: 'ethereal',
      category: 'automation',
      effectSummary: 'Manual player clicks generate +50% impact across all workstations.',
      flavor: 'A monolithic obsidian totem vibrating with the solitary will of a lone unicorn builder.',
      icon: '/assets/archetypes/archetype_product_led_machine.png',
      passiveEffects: {
        manualActionMultiplier: 1.5,
      },
    },
  },
]

export function getMaxUnlockedSpeed(founderHistory?: GameState['founderHistory']): number {
  if (!founderHistory?.unlockedAchievementIds) return 1
  const ids = founderHistory.unlockedAchievementIds
  if (ids.includes('ach_hyperscale_singularity') || ids.includes('founder_tachyon_chronometer')) {
    return 5
  }
  if (ids.includes('ach_sub_second') || ids.includes('founder_overclocked_silicon')) {
    return 2
  }
  return 1
}

export function evaluateNewAchievements(state: GameState): string[] {
  const currentUnlocked = new Set(state.founderHistory?.unlockedAchievementIds || [])
  const newlyUnlocked: string[] = []

  for (const item of FOUNDER_ACHIEVEMENTS_AND_RELICS) {
    if (!currentUnlocked.has(item.id) && !currentUnlocked.has(item.relicId)) {
      if (item.evaluate(state)) {
        newlyUnlocked.push(item.id)
      }
    }
  }

  return newlyUnlocked
}

