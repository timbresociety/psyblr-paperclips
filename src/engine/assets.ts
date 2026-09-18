import type { FunctionId, ProgressionAxis, FunctionFleet, EngineArchetypeId, Relic } from './types'

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
      { label: 'Precision AST', desc: '1.3x Output Multiplier', detail: 'Optimizes worker code generation pipelines with strict syntax caching.' },
      { label: 'Vector Pipelines', desc: '1.7x Output Multiplier', detail: 'Direct semantic vector embeddings eliminate repetitive work passes.' },
      { label: 'Synthesis Engine', desc: '2.2x Output Multiplier', detail: 'Autonomous intermediate representation compiler compounds single-agent yield.' },
      { label: 'Autonomous Foundry', desc: '3.0x Output Multiplier', detail: 'Self-compiling recursive agents produce production-grade output instantaneously.' },
      { label: 'Omni Compiler', desc: '4.5x Output Multiplier', detail: 'Exascale recursive compiler multiplying output yield to physical limits.' },
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
      { label: 'Market Tailwinds', desc: '+10% Value Variance', detail: 'Favorable customer sentiment and positive outcome skew on all operations.' },
      { label: 'Alpha Signals', desc: '+20% Value Variance', detail: 'Front-runs high-margin market opportunities with elevated conversion upside.' },
      { label: 'Catalyst Resonance', desc: '+30% Value Variance', detail: 'Multiplies compounding valuation bonuses and viral organic customer loops.' },
      { label: 'Serendipity Engine', desc: '+40% Value Variance', detail: 'Statistically tilts random events and customer willingness-to-pay to peak ceilings.' },
      { label: 'Reality Distortion', desc: '+60% Value Variance', detail: 'Quantum variance field permanently skewing conversion and pricing to cosmic peaks.' },
    ],
  },
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
        const tierIdx = Math.min(rank, 5) - 1
        const tierConfig = SKILL_TREE_AXIS_CONFIG[axis].tiers[tierIdx]
        active.push({
          id: `${fn.id}-${axis}-${rank}`,
          functionId: fn.id,
          functionName: fn.name,
          functionCode: fn.code,
          axis,
          axisName: SKILL_TREE_AXIS_CONFIG[axis].name,
          tier: rank,
          name: tierConfig?.label || `${SKILL_TREE_AXIS_CONFIG[axis].name} T${rank}`,
          desc: tierConfig?.desc || '',
          detail: tierConfig?.detail || '',
          color: SKILL_TREE_AXIS_CONFIG[axis].color,
          assetPath: getSkillTreeUpgradeAsset(fn.id, axis, rank),
        })
      }
    }
  }

  return active
}
