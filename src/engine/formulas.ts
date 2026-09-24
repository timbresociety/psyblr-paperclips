import type {
  CustomerAccount,
  CustomerSegment,
  FunctionFleet,
  FunctionId,
  GameState,
  PodSocket,
  CodingPod,
  QualifiedOpportunity,
  ProductActivation,
  DemandSignal,
  LuckVarianceResult,
  ArrBridge,
} from './types'
import {
  SEGMENT_PROFILES,
  EVOLUTION_TIERS,
  type EvolutionTierConfig,
  FUNCTION_SPECS,
  BASE_OVERHEAD_MONTHLY_CENTS,
  TIER_BASE_OVERHEAD_MONTHLY_CENTS,
  AUTOMATE_UPKEEP_CENTS,
  EXTRA_UNIT_UPKEEP_CENTS,
  FORECAST_TICKS,
  FORECAST_COLLECTION_HAIRCUT,
  TICKS_PER_MONTH,
  SCALE_POD_LIMITS,
  CODING_POD_MODULES,
  LUCK_VARIANCE_CONFIG,
  UPGRADE_RANK_COSTS,
  ENGINE_ARCHETYPES,
  FOUNDER_ACHIEVEMENTS_AND_RELICS,
} from './constants'

export function getUpgradeRankCost(
  currentRank: number,
  hasSyndicate: boolean = false
): number {
  const baseCost = UPGRADE_RANK_COSTS[currentRank] ?? 0
  return hasSyndicate ? Math.round(baseCost * 0.65) : baseCost
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function getActiveEvolutionTier(state: GameState): EvolutionTierConfig & { isOverridden: boolean } {
  if (state.themeTierOverride) {
    const found = EVOLUTION_TIERS.find(t => t.tier === state.themeTierOverride)
    if (found) {
      return { ...found, isOverridden: true }
    }
  }

  const val = state.valuationCents
  let matched = EVOLUTION_TIERS[0]
  for (let i = EVOLUTION_TIERS.length - 1; i >= 0; i--) {
    if (val >= EVOLUTION_TIERS[i].minValuationCents) {
      matched = EVOLUTION_TIERS[i]
      break
    }
  }

  return { ...matched, isOverridden: false }
}

/**
 * Calculates contractual and score-eligible ARR across all active accounts.
 */
export function calculateArrTotals(accounts: CustomerAccount[]): {
  contractualArrCents: number
  eligibleArrCents: number
} {
  let contractualArrCents = 0
  let eligibleArrCents = 0

  for (const account of accounts) {
    const mrr = account.baseMrrCents + account.addonMrrCents
    const arr = mrr * 12
    contractualArrCents += arr
    if (!account.delinquent) {
      eligibleArrCents += arr
    }
  }

  return { contractualArrCents, eligibleArrCents }
}

/**
 * Piecewise growth multiple calculation according to BALANCE.md.
 */
export function calculateGrowthMultiple(
  openingArrCents: number,
  currentArrCents: number,
  windowTicks: number,
  relicBonus = 0
): number {
  const growthEvidence = Math.min(1, Math.max(0.1, windowTicks / 1800))
  const denominator = Math.max(1_200_000, openingArrCents) // floor at $12k/yr
  const rawGrowth = (currentArrCents - openingArrCents) / denominator
  const scoringGrowth = rawGrowth * growthEvidence

  // Knots: [-1.0: 1x, -0.5: 2x, 0.0: 4x, 0.25: 6x, 0.5: 8x, 1.0: 12x, 2.0: 18x, 4.0: 26x]
  const knots = [
    { g: -1.0, m: 1.0 },
    { g: -0.5, m: 2.0 },
    { g: 0.0, m: 4.0 },
    { g: 0.25, m: 6.0 },
    { g: 0.5, m: 8.0 },
    { g: 1.0, m: 12.0 },
    { g: 2.0, m: 18.0 },
    { g: 4.0, m: 26.0 },
  ]

  let multiple = 1.0
  if (scoringGrowth <= knots[0].g) {
    multiple = knots[0].m
  } else if (scoringGrowth >= knots[knots.length - 1].g) {
    multiple = knots[knots.length - 1].m
  } else {
    for (let i = 0; i < knots.length - 1; i++) {
      if (scoringGrowth >= knots[i].g && scoringGrowth <= knots[i + 1].g) {
        const t = (scoringGrowth - knots[i].g) / (knots[i + 1].g - knots[i].g)
        multiple = knots[i].m + t * (knots[i + 1].m - knots[i].m)
        break
      }
    }
  }

  return Math.max(1.0, multiple + relicBonus)
}

/**
 * Capital quality factor derived from burn ratio and liquidity shortfall.
 */
export function calculateCapitalQualityFactor(
  burnRatio: number,
  shortfallFraction: number
): number {
  const denominator = 1 + 0.4 * Math.max(0, burnRatio) + 1.5 * Math.max(0, shortfallFraction)
  return clamp(1 / denominator, 0.05, 1.0)
}

/**
 * Valuation formula: Eligible ARR * Growth Multiple * Capital Quality Factor
 */
export function calculateValuationCents(
  eligibleArrCents: number,
  growthMultiple: number,
  capitalQualityFactor: number
): number {
  if (eligibleArrCents <= 0) return 0
  return Math.floor(eligibleArrCents * growthMultiple * capitalQualityFactor)
}

/**
 * Customer Willingness-to-pay and conversion probability.
 */
export function calculateCustomerConversion(
  segment: CustomerSegment,
  capabilities: { speed: number; collaboration: number; control: number },
  postedPriceMonthlyCents: number,
  competitionFactor = 0.1
): {
  fit: number
  effectiveWtpMonthlyCents: number
  conversionProbability: number
} {
  const profile = SEGMENT_PROFILES[segment]
  const fit = clamp(
    profile.needSpeed * capabilities.speed +
    profile.needCollaboration * capabilities.collaboration +
    profile.needControl * capabilities.control,
    0.05,
    1.0
  )

  const effectiveWtpMonthlyCents = Math.round(
    profile.baseWtpMonthlyCents * (0.4 + 0.6 * fit) * (1 - 0.3 * competitionFactor)
  )

  const priceRatio = postedPriceMonthlyCents / Math.max(1, effectiveWtpMonthlyCents)
  if (priceRatio > 2.0) {
    return { fit, effectiveWtpMonthlyCents, conversionProbability: 0 }
  }

  const baseConversion = (0.85 * (0.3 + 0.7 * fit)) / (1 + Math.pow(priceRatio, 4))
  const conversionProbability = clamp(baseConversion, 0, 0.95)

  return { fit, effectiveWtpMonthlyCents, conversionProbability }
}

/**
 * Calculates two-sided luck variance (+ / - outcome) for a given rank.
 * Resolves to slightly positive Expected Value across Tiers 1-5:
 * T1: +10% / -8%  (EV: +1.0%)
 * T2: +20% / -12% (EV: +4.0%)
 * T3: +30% / -10% (EV: +10.0%)
 * T4: +40% / -5%  (EV: +17.5%)
 * T5: +50% / -2%  (EV: +24.0%)
 */
export function calculateLuckVariance(luckRank: number, rngFloat?: number): LuckVarianceResult {
  const clampedRank = clamp(Math.floor(luckRank || 0), 0, 5)
  if (clampedRank === 0) {
    return { multiplier: 1.0, delta: 0, isPeakPositive: false, isExtremeNegative: false }
  }
  const cfg = LUCK_VARIANCE_CONFIG[clampedRank] || LUCK_VARIANCE_CONFIG[0]
  const roll = rngFloat !== undefined ? rngFloat : Math.random()
  const delta = -cfg.maxPenalty + roll * (cfg.maxBonus + cfg.maxPenalty)
  const multiplier = 1 + delta
  const isPeakPositive = roll >= 0.88 // Top 12% percentile: catalyst / jackpot rolls
  const isExtremeNegative = roll <= 0.10 // Bottom 10% percentile: high friction rolls
  return { multiplier, delta, isPeakPositive, isExtremeNegative }
}

export interface DemandQualificationResult {
  success: boolean
  probability: number
  failureReason?: string
  effectiveCac: number
  effectiveWtp: number
  isLuckyWhale: boolean
  luckVariance: LuckVarianceResult
}

/**
 * Dynamic qualification calculation for Demand signals.
 * Implements segment-specific qualification success rates:
 * - Creator: 90% base (high volume, low friction)
 * - Team: 70% base (departmental evaluation)
 * - Enterprise: 40% base (high risk, strict RFP, security & compliance review)
 * Adjusted dynamically by capability fit, Demand Craft, and Luck variance.
 */
export function calculateDemandQualification(
  signal: DemandSignal,
  capabilities: { speed: number; collaboration: number; control: number },
  craftRank = 0,
  luckRank = 0,
  isFirstCustomer = false,
  roll = Math.random(),
  luckRoll = Math.random(),
  isHyper = false
): DemandQualificationResult {
  const profile = SEGMENT_PROFILES[signal.segment] || SEGMENT_PROFILES.creator
  const luck = calculateLuckVariance(luckRank, luckRoll)

  // Craft CAC discount: 12% per rank up to 60%
  const cacDiscount = Math.min(0.60, 0.12 * craftRank)
  const rawAcqCost = (signal.acquisitionCostCents ?? 0) * (isHyper ? 2.0 : 1.0)

  // Luck variance directly affects CAC: positive variance yields additional organic discounts,
  // while negative variance increases ad spend overrun / acquisition friction.
  const luckCacMult = Math.max(0.65, 1 - luck.delta)
  const baseCac = Math.round(rawAcqCost * (1 - cacDiscount) * luckCacMult)

  // Lucky Whale catalyst: procs on peak positive roll when luckRank > 0
  const isLuckyWhale = luckRank > 0 && luck.isPeakPositive
  const effectiveCac = isLuckyWhale ? (isHyper ? Math.round(baseCac * 0.25) : 0) : baseCac

  // WTP scaling: Craft bonus + Luck variance multiplier (and Hyper / Whale multipliers)
  const craftWtpMult = isHyper ? (1 + 0.25 * craftRank) : (1 + 0.20 * craftRank)
  const hyperWtpMult = isHyper ? 2.0 : 1.0
  const whaleWtpMult = isLuckyWhale ? (isHyper ? 1.5 : 2.5) : 1.0
  const effectiveWtp = Math.round(
    (signal.estimatedWtpCents ?? profile.baseWtpMonthlyCents) *
    craftWtpMult *
    hyperWtpMult *
    whaleWtpMult *
    luck.multiplier
  )

  // Base qualification rate from profile
  const baseRate = profile.qualificationSuccessRate

  // Capability Fit bonus: matching needs improves qualification
  const fit = clamp(
    profile.needSpeed * capabilities.speed +
    profile.needCollaboration * capabilities.collaboration +
    profile.needControl * capabilities.control,
    0.05,
    1.0
  )
  const fitBonus = (fit - 0.5) * 0.15 // -7.5% to +7.5%

  // Demand Craft vetting bonus: +2% per rank
  const craftBonus = craftRank * 0.02

  // Luck variance swings qualification probability
  const luckBonus = luck.delta

  let probability = clamp(baseRate + fitBonus + craftBonus + luckBonus, 0.10, 0.98)

  // Tutorial / Onboarding safeguard: The first customer lead always qualifies
  if (isFirstCustomer) {
    probability = 1.0
  }

  const success = roll <= probability

  let failureReason: string | undefined
  if (!success) {
    if (signal.segment === 'enterprise') {
      failureReason = 'Enterprise lead disqualified during procurement, SOC2 security and legal compliance review.'
    } else if (signal.segment === 'team') {
      failureReason = 'Team evaluation stalled; internal engineering roadmap deferred adoption.'
    } else {
      failureReason = 'Prospect dropped off before completing self-serve setup.'
    }
  }

  return {
    success,
    probability,
    failureReason,
    effectiveCac,
    effectiveWtp,
    isLuckyWhale,
    luckVariance: luck,
  }
}

/**
 * Fleet coordination load, Ops capacity, and accumulated strain mechanics.
 */
export function calculateOperationsMetrics(
  fleet: Record<FunctionId, FunctionFleet>,
  strainBacklog: number,
  contextRot: number,
  hasSelfHealingRelic = false
): {
  coordinationLoad: number
  opsCapacity: number
  instantOverload: number
  excessStrain: number
  speedFactor: number
  technicalErrorRate: number
} {
  let coordinationLoad = 0

  const functionKeys: FunctionId[] = ['demand', 'product', 'monetisation', 'retention', 'expansion', 'operations']
  for (const fn of functionKeys) {
    const f = fleet[fn]
    if (f.onlineUnits > 0) {
      const unitLoad = FUNCTION_SPECS[fn].unitLoad
      const load = f.onlineUnits * unitLoad * (1 + 0.15 * f.automateRank) + 0.04 * f.onlineUnits * (f.onlineUnits - 1)
      coordinationLoad += load
    }
  }

  const opsFleet = fleet['operations']
  const opsUnits = Math.max(1, opsFleet.onlineUnits)
  const opsCraft = opsFleet.craftRank
  let opsCapacity = 12 + 4 * opsUnits * (1 + 0.25 * opsCraft)
  if (hasSelfHealingRelic) opsCapacity *= 1.25

  const instantOverload = Math.max(0, coordinationLoad / Math.max(1, opsCapacity) - 1)
  const excessStrain = instantOverload + strainBacklog / Math.max(1, opsCapacity)

  const speedFactor = 1 / (1 + 0.35 * Math.pow(excessStrain, 2))
  const technicalErrorRate = clamp(
    0.04 + 0.08 * Math.pow(excessStrain, 2) + 0.45 * Math.pow(contextRot, 2),
    0.02,
    0.95
  )

  return {
    coordinationLoad,
    opsCapacity,
    instantOverload,
    excessStrain,
    speedFactor,
    technicalErrorRate,
  }
}

/**
 * Accrues subscription service delivery in integer cents with carried remainder.
 * Formula: earned_cents, remainder = divmod(monthly_contract_cents * elapsed_ticks + remainder, 600)
 */
export function accrueService(
  monthlyMrrCents: number,
  elapsedTicks: number,
  remainderCents = 0
): { earnedCents: number; remainderCents: number } {
  const total = monthlyMrrCents * elapsedTicks + remainderCents
  const earnedCents = Math.floor(total / TICKS_PER_MONTH)
  const nextRemainder = total % TICKS_PER_MONTH
  return { earnedCents, remainderCents: nextRemainder }
}

/**
 * Calculates customer health delta per month according to BALANCE.md.
 * health_change/month = 12*(fit - .6) - 15*defects - 10*overpricing + 8*care - 5*incidents
 */
export function calculateCustomerHealthDelta(
  fit: number,
  defects: number,
  overpricing: number,
  care: number,
  incidents: number
): number {
  return 12 * (fit - 0.6) - 15 * defects - 10 * overpricing + 8 * care - 5 * incidents
}

/**
 * Calculates monthly churn rate according to BALANCE.md.
 * churn/month = clamp(.01 + .12*(1 - health/100) + .04*overpricing + .05*defects + .02*competition, .005, .35)
 */
export function calculateMonthlyChurn(
  health: number,
  overpricing: number,
  defects: number,
  competition: number
): number {
  const raw = 0.01 + 0.12 * (1 - health / 100) + 0.04 * overpricing + 0.05 * defects + 0.02 * competition
  return clamp(raw, 0.005, 0.35)
}

/**
 * Calculates economic burn according to BALANCE.md:
 * economic_deficit_per_month = max(0, COGS + OPEX + INTEREST - EARNED_REVENUE) / window_months
 * ongoing_burn_ratio = economic_deficit_per_month / max(10,000 cents, earned_revenue_per_month)
 */
export function calculateEconomicBurn(state: GameState): {
  cogsMonthCents: number
  opexMonthCents: number
  interestMonthCents: number
  earnedRevenueMonthCents: number
  economicDeficitMonthCents: number
  burnRatio: number
} {
  let cogsMonthCents = 0
  let earnedRevenueMonthCents = 0

  for (const account of state.accounts) {
    if (!account.delinquent) {
      const mrr = account.baseMrrCents + account.addonMrrCents
      earnedRevenueMonthCents += mrr
      const baseProfile = SEGMENT_PROFILES[account.segment]
      // Addons increase service cost by 30% of base service cost per addon
      const addonServiceCost = Math.round(baseProfile.serviceCostMonthlyCents * 0.30 * account.addonSlotsUsed)
      cogsMonthCents += baseProfile.serviceCostMonthlyCents + addonServiceCost
    }
  }

  // Opex includes tier-scaled overhead + cloud infrastructure compute in growth/ethereal tiers + agent upkeep across fleet + extra units
  const activeTier = getActiveEvolutionTier(state).tier
  const hasFreeOverhead = (state.activeRelics || []).some(r => r.id === 'relic-immortal-balance')
  const tierOverhead = hasFreeOverhead ? 0 : (TIER_BASE_OVERHEAD_MONTHLY_CENTS[activeTier] ?? BASE_OVERHEAD_MONTHLY_CENTS)
  const infraScaleCents = (activeTier === 'growth' || activeTier === 'ethereal')
    ? Math.round((state.eligibleArrCents * (activeTier === 'ethereal' ? 0.15 : 0.10)) / 12)
    : 0
  let opexMonthCents = tierOverhead + infraScaleCents
  const hasGpuCluster = (state.activeRelics || []).some(r => r.id === 'relic-gpu-cluster')
  const functionKeys: FunctionId[] = ['demand', 'product', 'monetisation', 'retention', 'expansion', 'operations']
  for (const fn of functionKeys) {
    const f = state.fleet[fn]
    if (f.automateRank > 0 && !hasGpuCluster) {
      opexMonthCents += AUTOMATE_UPKEEP_CENTS[f.automateRank] * f.onlineUnits
    }
    if (f.onlineUnits > 1) {
      opexMonthCents += (f.onlineUnits - 1) * EXTRA_UNIT_UPKEEP_CENTS
    }
  }

  // Apply OPEX discount from active archetype and equipped founder relic
  const archetype = ENGINE_ARCHETYPES[state.activeArchetype || 'product_led_machine']
  const equippedRelicEntry = FOUNDER_ACHIEVEMENTS_AND_RELICS.find(
    a => a.relicId === state.founderHistory?.equippedFounderRelicId || a.id === state.founderHistory?.equippedFounderRelicId
  )
  const opexDiscount = Math.min(0.8, (archetype?.passiveEffects?.opexDiscount || 0) + (equippedRelicEntry?.unlockedRelic?.passiveEffects?.opexDiscount || 0))
  if (opexDiscount > 0) {
    opexMonthCents = Math.round(opexMonthCents * (1 - opexDiscount))
  }

  // Interest on debt facility (18% nominal APR amortized)
  let interestMonthCents = 0
  if (state.debt.active && state.debt.principalCents > 0) {
    interestMonthCents = Math.floor((state.debt.principalCents * 1800) / 120000)
  }

  const economicDeficitMonthCents = Math.max(0, cogsMonthCents + opexMonthCents + interestMonthCents - earnedRevenueMonthCents)
  const burnRatio = economicDeficitMonthCents / Math.max(10_000, earnedRevenueMonthCents)

  return {
    cogsMonthCents,
    opexMonthCents,
    interestMonthCents,
    earnedRevenueMonthCents,
    economicDeficitMonthCents,
    burnRatio,
  }
}

export interface CashForecastResult {
  forecastObligationsCents: number
  forecastExpectedCollectionsCents: number
  peakNegativeCashCents: number
  shortfallFraction: number
}

/**
 * 1,800-tick cashflow forecast and shortfall calculation according to BALANCE.md and kernel.py.
 * Customer receipts: amount * collection probability * 0.80.
 * shortfall_fraction = clamp(S / max(1, D), 0, 1)
 */
export function calculateCashForecast(state: GameState): CashForecastResult {
  const endTick = state.elapsedTicks + FORECAST_TICKS
  const events: Array<{ tick: number; deltaCents: number; isObligation: boolean }> = []
  let totalObligations = 0
  let totalExpectedCollections = 0

  // 1. Pending mandatory bills
  for (const bill of state.mandatoryBills) {
    if (bill.dueTick >= state.elapsedTicks && bill.dueTick <= endTick) {
      events.push({ tick: bill.dueTick, deltaCents: -bill.amountCents, isObligation: true })
      totalObligations += bill.amountCents
    }
  }

  // 2. Projected monthly cycles within 1800 ticks (up to 3 months)
  let monthlyAgentUpkeep = 0
  for (const fn of ['demand', 'product', 'monetisation', 'retention', 'expansion', 'operations'] as const) {
    const f = state.fleet[fn]
    if (f.automateRank > 0) {
      monthlyAgentUpkeep += AUTOMATE_UPKEEP_CENTS[f.automateRank] * f.onlineUnits
    }
    if (f.onlineUnits > 1) {
      monthlyAgentUpkeep += (f.onlineUnits - 1) * EXTRA_UNIT_UPKEEP_CENTS
    }
  }
  const activeTier = getActiveEvolutionTier(state).tier
  const tierOverhead = TIER_BASE_OVERHEAD_MONTHLY_CENTS[activeTier] ?? BASE_OVERHEAD_MONTHLY_CENTS
  const infraComputeCents = (activeTier === 'growth' || activeTier === 'ethereal')
    ? Math.round((state.eligibleArrCents * (activeTier === 'ethereal' ? 0.15 : 0.10)) / 12)
    : 0

  const fixedMonthlyObligations = tierOverhead + infraComputeCents + monthlyAgentUpkeep

  const ticksToNextMonth = Math.max(1, TICKS_PER_MONTH - (state.elapsedTicks % TICKS_PER_MONTH))
  let futureMonthTick = state.elapsedTicks + ticksToNextMonth
  let debtPrincipal = state.debt.principalCents
  let debtMonths = state.debt.monthsRemaining

  while (futureMonthTick <= endTick) {
    events.push({ tick: futureMonthTick, deltaCents: -fixedMonthlyObligations, isObligation: true })
    totalObligations += fixedMonthlyObligations

    if (debtPrincipal > 0 && debtMonths > 0) {
      const interest = Math.floor((debtPrincipal * 1800) / 120000)
      const principalPortion = Math.ceil(debtPrincipal / debtMonths)
      const pmt = interest + principalPortion
      events.push({ tick: futureMonthTick, deltaCents: -pmt, isObligation: true })
      totalObligations += pmt
      debtPrincipal -= principalPortion
      debtMonths -= 1
    }

    futureMonthTick += TICKS_PER_MONTH
  }

  // 3. Existing pending invoices
  for (const inv of state.pendingInvoices) {
    if (!inv.collected && inv.dueTick >= state.elapsedTicks && inv.dueTick <= endTick) {
      const acc = state.accounts.find(a => a.id === inv.accountId)
      const prob = acc ? SEGMENT_PROFILES[acc.segment].collectionProbability : 0.95
      const expected = Math.floor(inv.amountCents * prob * FORECAST_COLLECTION_HAIRCUT)
      events.push({ tick: inv.dueTick, deltaCents: expected, isObligation: false })
      totalExpectedCollections += expected
    }
  }

  // 4. Future recurring invoice collections from active non-delinquent accounts
  for (const acc of state.accounts) {
    if (!acc.delinquent) {
      const mrr = acc.baseMrrCents + acc.addonMrrCents
      const profile = SEGMENT_PROFILES[acc.segment]
      const expected = Math.floor(mrr * profile.collectionProbability * FORECAST_COLLECTION_HAIRCUT)

      let nextBillTick = state.elapsedTicks + ticksToNextMonth + profile.collectionDelayTicks
      while (nextBillTick <= endTick) {
        events.push({ tick: nextBillTick, deltaCents: expected, isObligation: false })
        totalExpectedCollections += expected
        nextBillTick += TICKS_PER_MONTH
      }
    }
  }

  // Sort events chronologically
  events.sort((a, b) => a.tick - b.tick)

  let projectedCash = state.cashCents
  let peakShortfall = 0

  for (const ev of events) {
    projectedCash += ev.deltaCents
    if (projectedCash < 0) {
      peakShortfall = Math.max(peakShortfall, -projectedCash)
    }
  }

  const shortfallFraction = clamp(peakShortfall / Math.max(1, totalObligations), 0, 1)

  return {
    forecastObligationsCents: totalObligations,
    forecastExpectedCollectionsCents: totalExpectedCollections,
    peakNegativeCashCents: peakShortfall,
    shortfallFraction,
  }
}

export function createSocketsForSegment(segment: CustomerSegment): PodSocket[] {
  switch (segment) {
    case 'creator':
      return [
        { type: 'prompt', filled: false },
        { type: 'test', filled: false },
        { type: 'deploy', filled: false },
      ]
    case 'team':
      return [
        { type: 'prompt', filled: false },
        { type: 'test', filled: false },
        { type: 'diff', filled: false },
      ]
    case 'enterprise':
      return [
        { type: 'prompt', filled: false },
        { type: 'diff', filled: false },
        { type: 'test', filled: false },
        { type: 'deploy', filled: false },
      ]
  }
}

export function syncProductPods(
  currentPods: CodingPod[] | undefined,
  qualifiedOpportunities: QualifiedOpportunity[],
  scaleRank: number,
  craftRank: number
): CodingPod[] {
  const maxPods = SCALE_POD_LIMITS[scaleRank] || 1
  let pods = [...(currentPods ?? [])].slice(0, maxPods)

  for (let i = 0; i < maxPods; i++) {
    const opp = qualifiedOpportunities[i]
    const mod = CODING_POD_MODULES[i % CODING_POD_MODULES.length]
    if (i < pods.length) {
      if (!pods[i].opportunityId && opp) {
        pods[i] = {
          ...pods[i],
          opportunityId: opp.id,
          leadTitle: opp.title,
          leadSegment: opp.segment,
          leadWtpCents: opp.estimatedWtpCents,
          moduleName: mod.moduleName,
          categoryTag: mod.categoryTag,
          codeSnippet: mod.codeSnippet,
          linesAdded: Math.round(mod.baseLinesAdded * (1 + 0.25 * craftRank)),
          linesRemoved: mod.baseLinesRemoved,
          sockets: createSocketsForSegment(opp.segment),
          isVerified: false,
          isReadyToShip: false,
        }
      }
    } else {
      const segment = opp?.segment ?? mod.segmentAffinity
      pods.push({
        id: `pod-${i}-${opp?.id ?? 'idle'}`,
        slotIndex: i,
        opportunityId: opp?.id,
        leadTitle: opp?.title ?? `Awaiting Qualified Lead`,
        leadSegment: segment,
        leadWtpCents: opp?.estimatedWtpCents ?? 15_000,
        moduleName: mod.moduleName,
        categoryTag: mod.categoryTag,
        codeSnippet: mod.codeSnippet,
        linesAdded: Math.round(mod.baseLinesAdded * (1 + 0.25 * craftRank)),
        linesRemoved: mod.baseLinesRemoved,
        sockets: createSocketsForSegment(segment),
        isVerified: false,
        isReadyToShip: false,
      })
    }
  }

  return pods
}

export interface MonetisationDealStats {
  activeCount: number
  queuedCount: number
  totalCount: number
  deskActivations: ProductActivation[]
  queuedActivations: ProductActivation[]
}

/**
 * Accurately calculates Monetisation deal statistics without double-counting
 * activations that are simultaneously assigned to an active deal desk and present
 * in the activationsQueue.
 */
export function getMonetisationDealStats(state: GameState): MonetisationDealStats {
  const deskActivations: ProductActivation[] = []
  const seenIds = new Set<string>()

  const desks = state.activeDealDesks || []
  for (const desk of desks) {
    if (desk?.activation && !seenIds.has(desk.activation.id)) {
      deskActivations.push(desk.activation)
      seenIds.add(desk.activation.id)
    }
  }

  // Fallback to state.currentActivation if desk 0 wasn't populated in activeDealDesks
  if (state.currentActivation && !seenIds.has(state.currentActivation.id)) {
    deskActivations.push(state.currentActivation)
    seenIds.add(state.currentActivation.id)
  }

  // Queued activations are any activations in activationsQueue that are NOT currently active on any desk
  const queuedActivations = (state.activationsQueue || []).filter(
    (act) => act && !seenIds.has(act.id)
  )

  const activeCount = deskActivations.length
  const queuedCount = queuedActivations.length
  const totalCount = activeCount + queuedCount

  return {
    activeCount,
    queuedCount,
    totalCount,
    deskActivations,
    queuedActivations,
  }
}

/**
 * Resolves the audited ARR bridge for the completed quarter.
 */
export function reconcileQuarterBridge(state: GameState): ArrBridge {
  if (state.auditedArrBridge) {
    return state.auditedArrBridge
  }

  const currentBridge = state.arrBridge
  const hasDeltas =
    currentBridge.newArrCents > 0 ||
    currentBridge.expansionArrCents > 0 ||
    currentBridge.contractionArrCents > 0 ||
    currentBridge.churnArrCents > 0 ||
    currentBridge.delinquencyLossArrCents > 0 ||
    currentBridge.restorationArrCents > 0

  if (hasDeltas || currentBridge.openingArrCents !== state.eligibleArrCents) {
    return currentBridge
  }

  let reconstructedNewArr = 0
  let reconstructedExpansionArr = 0

  for (const acc of state.accounts) {
    if (acc.delinquent) continue
    if (acc.ageTicks <= 1800) {
      reconstructedNewArr += acc.baseMrrCents * 12
      if (acc.addonMrrCents > 0) {
        reconstructedExpansionArr += acc.addonMrrCents * 12
      }
    } else if (acc.addonMrrCents > 0) {
      reconstructedExpansionArr += acc.addonMrrCents * 12
    }
  }

  const totalGains = reconstructedNewArr + reconstructedExpansionArr
  const openingEligible = Math.max(0, state.eligibleArrCents - totalGains)

  return {
    openingArrCents: openingEligible,
    newArrCents: reconstructedNewArr,
    expansionArrCents: reconstructedExpansionArr,
    contractionArrCents: 0,
    churnArrCents: 0,
    delinquencyLossArrCents: 0,
    restorationArrCents: 0,
    closingArrCents: state.eligibleArrCents,
  }
}
