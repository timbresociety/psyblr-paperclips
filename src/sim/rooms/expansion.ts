/**
 * Expansion Room Logic: DRAG / PACK
 * Product Truth: company_sim_v1/product_final.md Section 9.5
 *
 * 4x4 Grid packing
 * Fit score:
 * Exact match: +2
 * Compatible match: +1
 * Synergies: +1.5 to +2.0
 * Full coverage bonus: +3
 * Conflicting: -2
 * Duplicate modules: Diminishing returns (100% -> 50% -> 0% -> -1 clutter penalty)
 *
 * Progressive Reward Output:
 * Scaled by Account Archetype (1.0x to 4.2x) & Synergy Multipliers (+15% to +95%)
 */

import type { ExpansionAccount, ExpansionModule } from '../types';
import { SeededRng } from '../rng';

export interface ExpansionSynergy {
  id: string;
  name: string;
  description: string;
  requiredModuleIds: string[];
  fitBonus: number;
  arrMultiplierBonusBps: number; // e.g. 2500 = +25%
}

export const EXPANSION_SYNERGIES: ExpansionSynergy[] = [
  {
    id: 'compliance_fortress',
    name: 'Compliance Fortress',
    description: 'Enterprise SSO + Audit Logging',
    requiredModuleIds: ['sso_auth', 'audit_logs'],
    fitBonus: 2,
    arrMultiplierBonusBps: 2500, // +25%
  },
  {
    id: 'data_pipeline',
    name: 'Data Pipeline Hub',
    description: 'Advanced Analytics + Custom Webhooks',
    requiredModuleIds: ['analytics_hub', 'custom_webhooks'],
    fitBonus: 2,
    arrMultiplierBonusBps: 2500, // +25%
  },
  {
    id: 'enterprise_scale',
    name: 'High-Touch Scale',
    description: 'Seats Expansion + Priority SLA',
    requiredModuleIds: ['seats_pack', 'priority_sla'],
    fitBonus: 1.5,
    arrMultiplierBonusBps: 2000, // +20%
  },
  {
    id: 'dev_platform',
    name: 'Developer Ecosystem',
    description: 'Custom Webhooks + Audit Logging',
    requiredModuleIds: ['custom_webhooks', 'audit_logs'],
    fitBonus: 1.5,
    arrMultiplierBonusBps: 1500, // +15%
  },
];

export interface AccountArchetypeDef {
  id: string;
  name: string;
  tierBadge: string;
  tierColor: string;
  multiplier: number;
}

export const ACCOUNT_ARCHETYPES: AccountArchetypeDef[] = [
  {
    id: 'smb_growth',
    name: 'Early-Stage Startup',
    tierBadge: 'SMB TIER',
    tierColor: '#30d158',
    multiplier: 1.0,
  },
  {
    id: 'mid_market',
    name: 'Mid-Market Enterprise',
    tierBadge: 'MID-MARKET',
    tierColor: '#0a84ff',
    multiplier: 1.8,
  },
  {
    id: 'fintech_scaleup',
    name: 'FinTech Scaleup',
    tierBadge: 'FINTECH',
    tierColor: '#bf5af2',
    multiplier: 2.4,
  },
  {
    id: 'hypergrowth_unicorn',
    name: 'Hypergrowth Unicorn',
    tierBadge: 'UNICORN',
    tierColor: '#ff9f0a',
    multiplier: 3.0,
  },
  {
    id: 'fortune_500',
    name: 'Global Fortune 500',
    tierBadge: 'FORTUNE 500',
    tierColor: '#ffd60a',
    multiplier: 4.2,
  },
];

const COMPANY_NAMES = [
  'Apex Cloud Systems',
  'Stripelet Global',
  'Quantum Dynamics',
  'OmniCorp Logistics',
  'Hyperion AI Labs',
  'Vanguard Healthcare',
  'Nexus Telecom',
  'Synthetix Finance',
  'Aether BioWorks',
  'Strata Data Infra',
  'Veritas CyberSec',
  'Atlas Energy Grid',
  'Prism Media Group',
  'Kinetics Robotics',
  'Pulse FinTech',
  'Helios Space Systems',
];

export interface FitAnalysis {
  baseFit: number;
  synergyFitBonus: number;
  coverageFitBonus: number;
  duplicatePenalty: number;
  totalFitScore: number;
  activeSynergies: ExpansionSynergy[];
  isFullCoverage: boolean;
  hasDiminishingReturns: boolean;
}

export interface ExpansionPackResolution {
  accountId: string;
  fitScore: number;
  expansionArrMilliGu: number;
  churnThreatMilliGu: number;
  synergies: string[];
  isExceptional: boolean;
  breakdown?: {
    baseMilliGu: number;
    fitMultiplier: number;
    synergyMilliGu: number;
    archetypeMultiplier: number;
    totalArrMilliGu: number;
  };
}

export const SAMPLE_EXPANSION_MODULES: ExpansionModule[] = [
  { id: 'sso_auth', name: 'Enterprise SSO', width: 2, height: 1, tags: ['security', 'compliance'], conflicts: ['consumer_lite'] },
  { id: 'audit_logs', name: 'Audit Logging', width: 1, height: 2, tags: ['compliance', 'enterprise'], conflicts: [] },
  { id: 'analytics_hub', name: 'Advanced Analytics', width: 2, height: 2, tags: ['reporting', 'analytics'], conflicts: [] },
  { id: 'seats_pack', name: 'Seats Expansion', width: 1, height: 1, tags: ['seats', 'growth'], conflicts: [] },
  { id: 'priority_sla', name: 'Priority SLA', width: 1, height: 1, tags: ['support', 'enterprise'], conflicts: [] },
  { id: 'custom_webhooks', name: 'Custom Webhooks', width: 2, height: 1, tags: ['integrations', 'developer'], conflicts: [] },
];

export function createExpansionAccount(rng: SeededRng, id: string): ExpansionAccount {
  const needsPool = ['security', 'compliance', 'analytics', 'seats', 'support', 'integrations'];
  const shuffled = rng.shuffle(needsPool);
  const requiredTags = [shuffled[0]];
  const compatibleTags = [shuffled[1], shuffled[2]];
  const conflictingTags = [shuffled[3]];

  const archIdx = rng.int(0, ACCOUNT_ARCHETYPES.length - 1);
  const arch = ACCOUNT_ARCHETYPES[archIdx];

  const nameIdx = rng.int(0, COMPANY_NAMES.length - 1);
  const companyName = `${COMPANY_NAMES[nameIdx]} #${rng.int(10, 99)}`;

  const grid: (string | null)[][] = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => null)
  );

  return {
    id,
    name: companyName,
    archetype: arch.name,
    archetypeMultiplier: arch.multiplier,
    tierBadge: arch.tierBadge,
    tierColor: arch.tierColor,
    requiredTags,
    compatibleTags,
    conflictingTags,
    revealedNeedsCount: 1, // 1 visible by default
    grid,
    expiresInSeconds: 30.0,
    packWindowSeconds: 15.0,
    isOpen: false,
  };
}

export function detectSynergies(placedModules: ExpansionModule[]): ExpansionSynergy[] {
  const moduleIds = new Set(placedModules.map((m) => m.id));
  return EXPANSION_SYNERGIES.filter((syn) =>
    syn.requiredModuleIds.every((id) => moduleIds.has(id))
  );
}

export function checkFullCoverage(
  account: ExpansionAccount,
  placedModules: ExpansionModule[]
): boolean {
  if (placedModules.length === 0) return false;
  const allPlacedTags = new Set(placedModules.flatMap((m) => m.tags));
  const hasAllRequired = account.requiredTags.every((t) => allPlacedTags.has(t));
  const hasAllCompatible = account.compatibleTags.every((t) => allPlacedTags.has(t));
  const hasNoConflicts = !placedModules.some(
    (m) =>
      m.tags.some((t) => account.conflictingTags.includes(t)) ||
      m.conflicts.some((c) => account.requiredTags.includes(c) || account.compatibleTags.includes(c))
  );
  return hasAllRequired && hasAllCompatible && hasNoConflicts;
}

export function analyzeExpansionFit(
  account: ExpansionAccount,
  placedModules: ExpansionModule[]
): FitAnalysis {
  let baseFit = 0;
  let duplicatePenalty = 0;
  let hasDiminishingReturns = false;
  const moduleCounts = new Map<string, number>();

  for (const mod of placedModules) {
    const prevCount = moduleCounts.get(mod.id) || 0;
    const currentCount = prevCount + 1;
    moduleCounts.set(mod.id, currentCount);

    if (currentCount > 1) {
      hasDiminishingReturns = true;
    }

    // Check conflicts
    const hasConflict =
      mod.tags.some((t) => account.conflictingTags.includes(t)) ||
      mod.conflicts.some((c) => account.requiredTags.includes(c) || account.compatibleTags.includes(c));

    if (hasConflict) {
      baseFit -= 2;
      continue;
    }

    // Check exact required matches
    const exactMatch = mod.tags.some((t) => account.requiredTags.includes(t));
    let moduleVal = 0;
    if (exactMatch) {
      moduleVal = 2;
    } else {
      // Check compatible matches
      const compatibleMatch = mod.tags.some((t) => account.compatibleTags.includes(t));
      if (compatibleMatch) {
        moduleVal = 1;
      }
    }

    // Apply diminishing returns on duplicates of same module
    if (currentCount === 1) {
      baseFit += moduleVal;
    } else if (currentCount === 2) {
      baseFit += Math.max(0, Math.floor(moduleVal * 0.5));
    } else if (currentCount === 3) {
      // 3rd copy gives 0
    } else {
      // 4th+ copy applies clutter penalty
      duplicatePenalty += 1;
    }
  }

  const activeSynergies = detectSynergies(placedModules);
  const synergyFitBonus = activeSynergies.reduce((sum, syn) => sum + syn.fitBonus, 0);

  const isFullCoverage = checkFullCoverage(account, placedModules);
  const coverageFitBonus = isFullCoverage ? 3 : 0;

  const totalFitScore = Math.max(
    -10,
    Math.round(baseFit + synergyFitBonus + coverageFitBonus - duplicatePenalty)
  );

  return {
    baseFit,
    synergyFitBonus,
    coverageFitBonus,
    duplicatePenalty,
    totalFitScore,
    activeSynergies,
    isFullCoverage,
    hasDiminishingReturns,
  };
}

export function calcExpansionFitScore(
  account: ExpansionAccount,
  placedModules: ExpansionModule[]
): number {
  return analyzeExpansionFit(account, placedModules).totalFitScore;
}

export function resolveExpansionPack(
  account: ExpansionAccount,
  placedModules: ExpansionModule[]
): ExpansionPackResolution {
  const analysis = analyzeExpansionFit(account, placedModules);
  const fitScore = analysis.totalFitScore;

  let baseMilliGu = 0;
  let churnThreatMilliGu = 0;
  let isExceptional = false;

  if (fitScore >= 11) {
    baseMilliGu = 5500; // Legendary Expansion: 5.5 GU
    isExceptional = true;
  } else if (fitScore >= 9) {
    baseMilliGu = 4000; // Masterclass: 4.0 GU
    isExceptional = true;
  } else if (fitScore >= 7) {
    baseMilliGu = 2800; // Exceptional: 2.8 GU
    isExceptional = true;
  } else if (fitScore >= 5) {
    baseMilliGu = 1800; // Strong: 1.8 GU
  } else if (fitScore >= 3) {
    baseMilliGu = 1000; // Standard: 1.0 GU
  } else if (fitScore >= 1) {
    baseMilliGu = 500;  // Basic: 0.5 GU
  } else {
    baseMilliGu = 0;
    churnThreatMilliGu = 250; // +0.25 Churn Threat GU
  }

  // Multiplier from Archetype (e.g. 1.0x to 4.2x)
  const archMult = account.archetypeMultiplier ?? 1.8;

  // Multiplier from Synergies
  let synergyMultiplier = 1.0;
  for (const syn of analysis.activeSynergies) {
    synergyMultiplier += syn.arrMultiplierBonusBps / 10000;
  }
  if (analysis.isFullCoverage) {
    synergyMultiplier += 0.50; // +50% Total Solution Mastery
  }

  // Clean Pack Bonus (0 conflicts placed): +15% if fit > 0
  const hasConflicts = placedModules.some(
    (m) =>
      m.tags.some((t) => account.conflictingTags.includes(t)) ||
      m.conflicts.some((c) => account.requiredTags.includes(c) || account.compatibleTags.includes(c))
  );
  if (!hasConflicts && fitScore > 0) {
    synergyMultiplier += 0.15;
  }

  const expansionArrMilliGu = Math.round(baseMilliGu * archMult * synergyMultiplier);

  return {
    accountId: account.id,
    fitScore,
    expansionArrMilliGu,
    churnThreatMilliGu,
    synergies: analysis.activeSynergies.map((s) => s.name),
    isExceptional,
    breakdown: {
      baseMilliGu,
      fitMultiplier: fitScore,
      synergyMilliGu: expansionArrMilliGu - Math.round(baseMilliGu * archMult),
      archetypeMultiplier: archMult,
      totalArrMilliGu: expansionArrMilliGu,
    },
  };
}
