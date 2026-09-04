/**
 * Deterministic Simulation Engine
 * Product Truth: company_sim_v1/product_final.md
 * Implementation Contract: company_sim_v1/AGENTS.md
 */

import type {
  CompanyState,
  FounderHistoryId,
  MoneyCents,
  RoomId,
  ProductSlot,
} from './types';
import { ALL_ROOMS, AGENT_TIER_CONFIGS } from './types';
import {
  dollarsToCents,
  calcUnits,
  calcGrowthMultiple,
  multiplyBps,
  BPS_DIVISOR,
} from './math';
import { createArrBridge, assertArrBridge } from './arrBridge';
import { calcValuation } from './valuation';
import {
  calcLocLimit,
  calcLocAprBps,
  calcMonthlyInterestCents,
} from './capital';
import { calcStrainDetails } from './complexity';
import { generateRandomFeatureRequest } from './rooms/product';

export const STARTING_ARR_CENTS: MoneyCents = dollarsToCents(100_000);   // $100,000
export const STARTING_CASH_CENTS: MoneyCents = dollarsToCents(25_000);   // $25,000
export const UNICORN_VALUATION_CENTS: MoneyCents = dollarsToCents(1_000_000_000); // $1B

export function createInitialCompanyState(options: {
  id?: string;
  name?: string;
  tagline?: string;
  category?: 'B2B_SAAS' | 'CONSUMER' | 'DEEP_TECH' | 'FINTECH';
  seed?: number;
  founderHistory?: FounderHistoryId;
  history?: FounderHistoryId;
} = {}): CompanyState {
  const history = options.history || 'fresh';
  const startArr = STARTING_ARR_CENTS;
  const { growthUnitCents, capitalUnitCents } = calcUnits(startArr);
  const multiple = 10;
  const valuation = calcValuation(startArr, multiple);

  let initialOpsCapacity = 4;
  if (history === 'systems_operator') {
    initialOpsCapacity += 1; // Systems Operator Origin Relic: Starting Ops Capacity +1
  }

  const agents = ALL_ROOMS.reduce(
    (acc, room) => ({ ...acc, [room]: 0 }),
    {} as Record<RoomId, 0>
  );

  const initialSlots: ProductSlot[] = Array.from({ length: 6 }, (_, i) =>
    generateRandomFeatureRequest(`slot_${i}`)
  );

  return {
    id: options.id || `co_${Date.now()}`,
    name: options.name || 'Autonomous Startup',
    tagline: options.tagline || 'AI-driven one-person company',
    category: options.category || 'B2B_SAAS',
    quarter: 1,
    quarterElapsedMs: 0,
    isIntermission: false,
    founderHistory: history,
    activeRoom: 'marketing',

    arrCents: startArr,
    quarterStartArrCents: startArr,
    cashCents: STARTING_CASH_CENTS,
    debtCents: 0n,
    founderOwnershipBps: 10_000, // 100.00%
    valuationMultiple: multiple,
    valuationCents: valuation,
    peakValuationCents: valuation,
    unicornQuarter: null,
    growthCommitment: null,
    isBankrupt: false,
    bankruptcyGraceRemainingMs: 20_000,

    growthUnitCents,
    capitalUnitCents,

    complexity: 0,
    opsCapacity: initialOpsCapacity,
    strain: 0,
    strainState: 'stable',

    demandBacklogMilliGu: 0,
    activationBacklogMilliGu: 0,
    churnThreatMilliGu: 0,

    agents,
    upgrades: [],
    financingRounds: [],

    marketing: {
      queue: [],
      comboCount: 0,
      lowQualityDemandMilliGu: 0,
      nextCardTimerSec: 1.0,
    },
    product: {
      slots: initialSlots,
      queuedRequests: 0,
      pieceSpawns: [],
      nextPieceTimerSec: 2.0,
    },
    monetization: {
      currentOpportunity: null,
      queuedActivations: 0,
    },
    retention: {
      threats: [],
      founderTurretFireTimerSec: 0.45,
      founderAimThreatId: null,
    },
    expansion: {
      accounts: [],
      activeAccountIndex: null,
      quarterlyExpansionArrCents: 0n,
      nextAccountTimerSec: 20.0,
    },
    operations: {
      incidents: [],
      activeIncidentIndex: null,
      monthlyLeakCents: 0n,
    },

    currentQuarterNewCustomerArrCents: 0n,
    currentQuarterExpansionArrCents: 0n,
    currentQuarterChurnedArrCents: 0n,

    historicalBridges: [],
    actionLog: [],

    isPaused: false,
    unicornAcknowledged: false,
    totalManualActions: 0,
    totalAutomatedActions: 0,
    overclockRooms: {
      marketing: false,
      product: false,
      monetization: false,
      retention: false,
      expansion: false,
      operations: false,
    },
    safetyIndex: 100,
    computeLoadBps: 1500,
    achievedMilestones: [],

    vibeCodingStage: 'manual',
    vibeDebt: 0,
    tokenBurnRateCentsPerSec: 0n,
    totalTokensBurnedCents: 0n,
    activeAgentArchetypes: {
      claudeCode: 0,
      geminiFlash: 0,
      sonnetSales: 0,
      deepseekSre: 0,
    },
    recentVibecodingEvents: [
      {
        id: 'ev_boot',
        timestampMs: 0,
        stage: 'manual',
        title: 'FOUNDER TERMINAL INITIALIZED',
        detail: 'Starting with raw code and manual typing. Zero AI hallucinations.',
        type: 'win',
      },
    ],
  };
}

/**
 * Handle a 50s, 100s, or 150s Monthly Cash Close
 * Product Truth: Section 5.1
 */
export function executeMonthlyCashClose(
  state: CompanyState,
  _monthIndex: 1 | 2 | 3
): CompanyState {
  const currentArr = state.arrCents;
  const monthlyArrIncome = currentArr / 12n;

  // Scheduled baseline operating bills (30% healthy baseline, 26% for bootstrapper)
  const costRatioBps = state.founderHistory === 'bootstrapper' ? 2_600 : 3_000;
  const baseScheduledCosts = multiplyBps(monthlyArrIncome, costRatioBps);

  // Agent recurring costs
  let totalAgentMonthlyCu = 0;
  for (const tier of Object.values(state.agents)) {
    totalAgentMonthlyCu += AGENT_TIER_CONFIGS[tier].monthlyCostCu;
  }
  const agentRecurringCosts = (state.capitalUnitCents * BigInt(Math.round(totalAgentMonthlyCu * 100))) / 100n;

  // LOC monthly interest
  const locLimit = calcLocLimit(currentArr, state.valuationCents);
  const isLeveragedGrowth = state.upgrades.includes('cursed_leveraged_growth');
  const aprInfo = calcLocAprBps(state.debtCents, locLimit, state.valuationMultiple, isLeveragedGrowth);
  const monthlyInterest = calcMonthlyInterestCents(state.debtCents, aprInfo.aprBps);

  // Strain leak costs
  const hasQueueing = state.upgrades.includes('room_operations_queueing');
  const strainInfo = calcStrainDetails(state.complexity, state.opsCapacity, hasQueueing);
  const strainLeakCost = multiplyBps(monthlyArrIncome, strainInfo.extraCashLeakBps);

  // Unresolved Operations incident leaks
  const opsLeaks = state.operations.monthlyLeakCents;

  const totalMonthlyOutflow =
    baseScheduledCosts +
    agentRecurringCosts +
    monthlyInterest +
    strainLeakCost +
    opsLeaks;

  let newCash = state.cashCents + monthlyArrIncome - totalMonthlyOutflow;

  // Bankruptcy / PAYABLES OVERDUE check
  let isBankrupt = state.isBankrupt;
  let graceRemaining = state.bankruptcyGraceRemainingMs;

  if (newCash < 0n) {
    // If available credit exists, auto draw
    const availableCredit = locLimit > state.debtCents ? locLimit - state.debtCents : 0n;
    if (availableCredit > 0n) {
      const needed = -newCash;
      const draw = needed < availableCredit ? needed : availableCredit;
      newCash += draw;
      state = {
        ...state,
        debtCents: state.debtCents + draw,
      };
    }
  }

  return {
    ...state,
    cashCents: newCash,
    isBankrupt,
    bankruptcyGraceRemainingMs: graceRemaining,
  };
}

/**
 * Handle Quarter Close
 * Product Truth: Section 5.2, 5.3, 6, AGENTS.md Section 5
 */
export function executeQuarterClose(state: CompanyState): CompanyState {
  const startArr = state.quarterStartArrCents;
  const newCustomer = state.currentQuarterNewCustomerArrCents;
  const expansion = state.currentQuarterExpansionArrCents;
  const churned = state.currentQuarterChurnedArrCents;

  const bridge = createArrBridge(startArr, newCustomer, expansion, churned);
  assertArrBridge(bridge);

  const endingArr = bridge.endingArrCents;
  const { multiple: newMultiple, growthBps } = calcGrowthMultiple(startArr, endingArr);
  const newValuation = calcValuation(endingArr, newMultiple);

  let unicornQuarter = state.unicornQuarter;
  if (newValuation >= UNICORN_VALUATION_CENTS && unicornQuarter === null) {
    unicornQuarter = state.quarter;
  }

  // Check growth commitment if active
  let isBankrupt = state.isBankrupt;
  let bankruptcyReason = state.bankruptcyReason;
  if (state.quarter >= 5 && state.growthCommitment !== null) {
    const requiredGrowthBps = Math.round(state.growthCommitment * BPS_DIVISOR);
    if (growthBps < requiredGrowthBps) {
      isBankrupt = true; // Growth Mandate Missed
      bankruptcyReason = 'growth_mandate_missed';
    }
  }

  return {
    ...state,
    arrCents: endingArr,
    valuationMultiple: newMultiple,
    valuationCents: newValuation,
    peakValuationCents: newValuation > state.peakValuationCents ? newValuation : state.peakValuationCents,
    unicornQuarter,
    isBankrupt,
    bankruptcyReason,
    isIntermission: true,
    historicalBridges: [...state.historicalBridges, bridge],
  };
}

/**
 * Begin the Next Quarter (after intermission finishes)
 */
export function beginNextQuarter(state: CompanyState): CompanyState {
  if (state.isBankrupt) {
    return {
      ...state,
      isIntermission: false,
    };
  }

  const nextQuarter = state.quarter + 1;
  const currentArr = state.arrCents;
  const { growthUnitCents, capitalUnitCents } = calcUnits(currentArr);

  return {
    ...state,
    quarter: nextQuarter,
    quarterElapsedMs: 0,
    quarterStartArrCents: currentArr,
    growthUnitCents,
    capitalUnitCents,
    isIntermission: false,
    currentQuarterNewCustomerArrCents: 0n,
    currentQuarterExpansionArrCents: 0n,
    currentQuarterChurnedArrCents: 0n,
    expansion: {
      ...state.expansion,
      quarterlyExpansionArrCents: 0n,
    },
  };
}
