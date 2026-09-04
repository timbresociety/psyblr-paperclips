/**
 * Complexity, Operations Capacity & Organizational Strain
 * Product Truth: company_sim_v1/product_final.md Section 11, 12
 */

import type { RoomId, AgentTier, StrainState, BasisPoints } from './types';
import { AGENT_TIER_CONFIGS } from './types';

export interface StrainDetails {
  complexity: number;
  opsCapacity: number;
  strain: number;
  state: StrainState;
  agentReliabilityModifierBps: BasisPoints; // e.g. 10,000 = 100%, 9,500 = 95%
  extraCashLeakBps: BasisPoints;            // 0, 300 (3%), 800 (8%), 1,800 (18%)
  extraChurnPressureBps: BasisPoints;       // 0, 0, 120 (1.2%), 400 (4.0%)
}

export function calcComplexity(
  agents: Record<RoomId, AgentTier>,
  systemComplexityBonus: number = 0,
  isYoloPermissionsCurse: boolean = false
): number {
  let total = 0;
  for (const tier of Object.values(agents)) {
    let tierComplexity = AGENT_TIER_CONFIGS[tier].complexity;
    if (isYoloPermissionsCurse) {
      tierComplexity *= 1.5;
    }
    total += tierComplexity;
  }
  return total + systemComplexityBonus;
}

export function calcStrainDetails(
  complexity: number,
  opsCapacity: number,
  hasQueueingUpgrade: boolean = false
): StrainDetails {
  const safeCapacity = opsCapacity <= 0 ? 1 : opsCapacity;
  const strain = complexity / safeCapacity;

  let state: StrainState;
  let agentReliabilityModifierBps: BasisPoints;
  let extraCashLeakBps: BasisPoints;
  let extraChurnPressureBps: BasisPoints;

  if (strain <= 1.0) {
    state = 'stable';
    agentReliabilityModifierBps = 10_000; // 100%
    extraCashLeakBps = 0;
    extraChurnPressureBps = 0;
  } else if (strain <= 1.25) {
    state = 'strained';
    // Queueing upgrade: at Strain 1.00 to 1.25, agent reliability does not fall
    agentReliabilityModifierBps = hasQueueingUpgrade ? 10_000 : 9_500; // 95%
    extraCashLeakBps = 300; // +3%
    extraChurnPressureBps = 40; // +0.4%
  } else if (strain <= 1.50) {
    state = 'overloaded';
    agentReliabilityModifierBps = 9_000; // 90%
    extraCashLeakBps = 800; // +8%
    extraChurnPressureBps = 120; // +1.2%
  } else {
    state = 'critical';
    agentReliabilityModifierBps = 7_500; // 75%
    extraCashLeakBps = 1_800; // +18%
    extraChurnPressureBps = 400; // +4.0%
  }

  return {
    complexity,
    opsCapacity,
    strain,
    state,
    agentReliabilityModifierBps,
    extraCashLeakBps,
    extraChurnPressureBps,
  };
}
