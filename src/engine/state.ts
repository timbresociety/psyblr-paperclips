import type { GameState, DemandSignal, FunctionId, FunctionFleet, ScratchCard, ScratchPod } from './types'
import {
  INITIAL_CASH_CENTS,
  DEFAULT_PRODUCT_COMPONENTS,
  RELIC_CATALOG,
  CONSUMABLE_CATALOG,
} from './constants'

export function createInitialDemandSignals(): DemandSignal[] {
  return [
    {
      id: 'sig-ops-logistics',
      title: 'Series B logistics fleet suffering coordination bottleneck',
      quote: 'Every exception ends up on one person’s desk. We’ve hired three coordinators this year, and all they do is copy-paste between systems.',
      segment: 'team',
      segmentLabel: 'Operations Lead, Series B Logistics',
      purchaseIntent: 'Buying now',
      signalRationale: 'High urgency, manual triage bleeding 15 hrs/wk, ready to deploy autonomous workflow immediately.',
      acquisitionCostCents: 15_000, // $150 CAC
      expiryTick: 600,
      estimatedWtpCents: 15_000, // $150/mo
    },
    {
      id: 'sig-creator-video',
      title: 'Technical educator launching high-frequency AI dev tutorials',
      quote: 'Our community churns if project walk-throughs take over 3 minutes to compile. Give us instant live code execution sandboxes.',
      segment: 'creator',
      segmentLabel: 'Founder, Developer Media Lab',
      purchaseIntent: 'Buying now',
      signalRationale: 'Zero procurement friction, pays upfront on company credit card, demands sub-second latency.',
      acquisitionCostCents: 4_000, // $40 CAC
      expiryTick: 450,
      estimatedWtpCents: 4_000, // $40/mo
    },
    {
      id: 'sig-enterprise-audit',
      title: 'Global fin-tech requiring deterministic agent audit ledger',
      quote: 'Our risk committee froze the AI roadmap until we can prove every prompt, tool execution, and token hash is cryptographically signed.',
      segment: 'enterprise',
      segmentLabel: 'VP Engineering, Global Payments Core',
      purchaseIntent: 'Budget Approved',
      signalRationale: 'Massive budget allocation ($800/mo ARR), requires SOC2 Type II audit vault and isolated sandboxes.',
      acquisitionCostCents: 60_000, // $600 CAC
      expiryTick: 900,
      estimatedWtpCents: 80_000, // $800/mo
    },
    {
      id: 'sig-team-multiagent',
      title: 'B2B CRM startup needing swarm reconciliation bus',
      quote: 'When two autonomous agents handle the same customer thread, they send contradictory quotes. We need unified shared context.',
      segment: 'team',
      segmentLabel: 'Head of Product, SaaS CRM',
      purchaseIntent: 'Evaluating',
      signalRationale: 'Rapid growth, experiencing coordination strain, willing to sign annual agreement.',
      acquisitionCostCents: 15_000, // $150 CAC
      expiryTick: 750,
      estimatedWtpCents: 15_000, // $150/mo
    },
  ]
}

export function createDynamicDemandSignals(valuationCents = 0, elapsed = 0): DemandSignal[] {
  const base = createInitialDemandSignals().map(s => ({
    ...s,
    id: `${s.id}-${elapsed}-${Math.floor(Math.random() * 1000)}`,
    expiryTick: elapsed + 800,
  }))

  // Tier 2: Seed Lab ($50k - $500k valuation)
  if (valuationCents >= 5_000_000) {
    base.push(
      {
        id: `sig-t2-team-${elapsed}`,
        title: 'High-growth AI engineering fleet expanding swarm seats',
        quote: 'Our engineering velocity doubled with multi-agent handoffs. We are upgrading the entire 10-engineer team.',
        segment: 'team',
        segmentLabel: 'VP Engineering, FastAI Inc',
        purchaseIntent: 'Buying now',
        signalRationale: 'High willingness to pay ($350/mo ARR), instant credit card checkout.',
        acquisitionCostCents: 20_000, // $200 CAC
        expiryTick: elapsed + 900,
        estimatedWtpCents: 35_000, // $350/mo
      },
      {
        id: `sig-t2-studio-${elapsed}`,
        title: 'Autonomous Design Agency deploying multi-modal agents',
        quote: 'We need high-speed creative agents running parallel asset pipelines 24/7.',
        segment: 'team',
        segmentLabel: 'Creative Director, VoxelStudio',
        purchaseIntent: 'Evaluating',
        signalRationale: 'Studio deployment ($600/mo ARR), pre-authorized departmental card.',
        acquisitionCostCents: 35_000, // $350 CAC
        expiryTick: elapsed + 900,
        estimatedWtpCents: 60_000, // $600/mo
      }
    )
  }

  // Tier 3: Series A ($500k - $5M valuation)
  if (valuationCents >= 50_000_000) {
    base.push(
      {
        id: `sig-t3-fintech-${elapsed}`,
        title: 'Algorithmic Trading Firm deploying low-latency worker pods',
        quote: 'Microsecond execution matters. We need deterministic sandboxes and audit logging.',
        segment: 'enterprise',
        segmentLabel: 'Head of Infrastructure, AlphaQuant',
        purchaseIntent: 'Budget Approved',
        signalRationale: 'Mid-market scale contract ($2,500/mo ARR), ready for quarterly invoice.',
        acquisitionCostCents: 120_000, // $1,200 CAC
        expiryTick: elapsed + 1100,
        estimatedWtpCents: 250_000, // $2,500/mo
      },
      {
        id: `sig-t3-health-${elapsed}`,
        title: 'Digital Health Platform scaling HIPAA-compliant patient triage',
        quote: 'SOC2 Type II and tenant isolation are strict prerequisites for our production release.',
        segment: 'enterprise',
        segmentLabel: 'VP Engineering, CareMesh Health',
        purchaseIntent: 'Budget Approved',
        signalRationale: 'Enterprise pilot ($4,000/mo ARR), expedited vendor sign-off.',
        acquisitionCostCents: 200_000, // $2,000 CAC
        expiryTick: elapsed + 1100,
        estimatedWtpCents: 400_000, // $4,000/mo
      }
    )
  }

  // Tier 4: Pre-IPO ($25M - $250M valuation)
  if (valuationCents >= 2_500_000_000) {
    base.push(
      {
        id: `sig-t4-telco-${elapsed}`,
        title: 'Tier-1 Telecom Core deploying autonomous agent customer triage',
        quote: 'We handle 400,000 inquiries a day. We need isolated sandboxes with zero-latency streaming pipelines.',
        segment: 'enterprise',
        segmentLabel: 'CTO, Global Telco Core',
        purchaseIntent: 'Budget Approved',
        signalRationale: 'Massive scale deployment ($18,000/mo ARR), annual prepayment contract.',
        acquisitionCostCents: 750_000, // $7,500 CAC
        expiryTick: elapsed + 1400,
        estimatedWtpCents: 1_800_000, // $18,000/mo
      },
      {
        id: `sig-t4-sovereign-${elapsed}`,
        title: 'Sovereign Wealth Fund autonomous AI research institute',
        quote: 'We are deploying 1,000 parallel automated researcher agents. Need enterprise SLAs and cryptographic audit ledgers.',
        segment: 'enterprise',
        segmentLabel: 'Director, Sovereign Compute Initiative',
        purchaseIntent: 'Buying now',
        signalRationale: 'Seven-figure strategic contract ($35,000/mo ARR), immediate vendor onboarding.',
        acquisitionCostCents: 1_500_000, // $15,000 CAC
        expiryTick: elapsed + 1400,
        estimatedWtpCents: 3_500_000, // $35,000/mo
      }
    )
  }

  // Tier 5: Ethereal / Unicorn Milestone ($250M - $1B+ valuation)
  if (valuationCents >= 25_000_000_000) {
    base.push(
      {
        id: `sig-t5-hyperscaler-${elapsed}`,
        title: 'Global Cloud Hyperscaler agent operating system contract',
        quote: 'Standardizing our entire developer cloud on your multi-agent architecture. Need unlimited tenant isolation and SOC2 Type II.',
        segment: 'enterprise',
        segmentLabel: 'Executive VP, Cloud Infrastructure',
        purchaseIntent: 'Buying now',
        signalRationale: 'Hyperscale multi-seat rollout ($80,000/mo ARR), pre-funded sovereign deployment.',
        acquisitionCostCents: 3_000_000, // $30,000 CAC
        expiryTick: elapsed + 1800,
        estimatedWtpCents: 8_000_000, // $80,000/mo
      },
      {
        id: `sig-t5-fortune50-${elapsed}`,
        title: 'Fortune 50 Global Banking Consortium swarm deployment',
        quote: 'Automating high-frequency compliance auditing and algorithmic risk operations across 4 continents.',
        segment: 'enterprise',
        segmentLabel: 'Global Chief Risk Officer',
        purchaseIntent: 'Buying now',
        signalRationale: 'Tier-1 enterprise infrastructure ($150,000/mo ARR), wired in quarterly prepayment.',
        acquisitionCostCents: 6_000_000, // $60,000 CAC
        expiryTick: elapsed + 1800,
        estimatedWtpCents: 15_000_000, // $150,000/mo
      }
    )
  }

  return base
}

function createDefaultFleet(): Record<FunctionId, FunctionFleet> {
  const fns: FunctionId[] = ['demand', 'product', 'monetisation', 'retention', 'expansion', 'operations', 'finance']
  const fleet = {} as Record<FunctionId, FunctionFleet>
  for (const fn of fns) {
    fleet[fn] = {
      craftRank: 0,
      scaleRank: 0,
      automateRank: 0,
      luckRank: 0,
      onlineUnits: fn === 'finance' ? 0 : 1,
      accumulatedWorkCredits: 0,
    }
  }
  return fleet
}

export function createInitialState(seed = 1337): GameState {
  const initialSignals = createInitialDemandSignals()

  return {
    version: 1,
    seed,
    elapsedTicks: 0,
    speedMultiplier: 1,
    paused: false,
    runStatus: 'running',
    failureReason: null,

    // Financials
    cashCents: INITIAL_CASH_CENTS,
    contractualArrCents: 0,
    eligibleArrCents: 0,
    valuationCents: 0,
    growthMultiple: 4.0,
    capitalQualityFactor: 1.0,
    shortfallFraction: 0,
    competitionFactor: 0.10,
    earnedRevenueMonthCents: 0,
    cogsMonthCents: 0,
    opexMonthCents: 0,
    interestMonthCents: 0,
    burnRatio: 0,
    forecastObligationsCents: 0,
    forecastExpectedCollectionsCents: 0,
    peakNegativeCashCents: 0,

    // Navigation & Attention & Theme
    activeFunction: 'demand',
    pipelineStage: 'demand',
    unlockedFunctions: ['demand', 'product', 'monetisation', 'retention', 'expansion', 'operations', 'finance'],
    themeTierOverride: null,

    // Event Minigame States
    retentionEvent: null,
    expansionEvent: null,
    operationsEvent: null,

    // Pipeline & Demand
    qualifiedOpportunities: [],
    demandSignals: initialSignals,
    activeSignalId: initialSignals[0].id,
    signalsTriagedCount: 0,
    lastDemandReplenishTick: 0,
    lastDemandTriageTick: -9999,
    lastTriageOutcome: null,

    // Product
    availableComponents: [...DEFAULT_PRODUCT_COMPONENTS],
    productSlots: {
      speed: null,
      collaboration: null,
      control: null,
    },
    productBuckets: {
      write: null,
      diff: null,
      test: null,
      deploy: null,
    },
    productVerified: false,
    verificationErrors: [],
    productPods: [],
    activationsQueue: [],
    systemCapabilities: {
      speed: 0.35,
      collaboration: 0.15,
      control: 0.05,
    },

    // Monetisation
    currentActivation: null,
    activeDealDesks: [
      {
        id: 'desk-0',
        deskIndex: 0,
        activation: null,
        postedPriceMonthlyCents: 4_000,
        status: 'idle',
      },
    ],
    pricingCursor: 0.5, // 100% of WTP
    postedPriceMonthlyCents: 4_000,
    lastSignedContract: null,

    // Customers & Schedules
    accounts: [],
    pendingInvoices: [],
    mandatoryBills: [],

    // Retention & Expansion
    activeThreatAccountId: null,
    retentionSavedArrCents: 0,
    retentionLostArrCents: 0,
    retentionIncidents: [],
    expansionDraftAccount: null,
    expansionAddonPacks: [
      {
        id: 'pack-seats',
        title: 'Unlimited Agent Seats & Workspaces',
        costCents: 5_000,
        addonMrrCents: 3_500,
        serviceLoadInc: 0.2,
      },
      {
        id: 'pack-soc2',
        title: 'Dedicated VPC & SOC2 Type II SLA',
        costCents: 20_000,
        addonMrrCents: 15_000,
        serviceLoadInc: 0.4,
      },
      {
        id: 'pack-finetune',
        title: 'Custom LoRA Agent Fine-Tuning Pipeline',
        costCents: 35_000,
        addonMrrCents: 28_000,
        serviceLoadInc: 0.6,
      },
    ],
    mergeGrid: Array(16).fill(null),
    expansionOrders: [],

    // Operations
    operations: {
      opsCapacity: 16,
      coordinationLoad: 4,
      instantOverload: 0,
      strainBacklog: 0,
      contextRot: 0,
      incidentsBacklog: 0,
      diagnosedRootCause: null,
      scratchedEvidencePct: 0,
      lastSpeculativeTick: -9999,
      speculativeRunsCount: 0,
      luckOptimizerOdds: {
        winChance: 0.60,
        winMultiplier: 1.2,
        lossPenaltyRatio: 0.1,
        rebateCents: 20_000, // $200 flat efficiency rebate on win
        penaltyCents: 25_000, // $250 flat repair fee on failure
      },
    },
    activeScratchCard: createDefaultScratchCard('apple_tree'),
    activeTickets: [createDiagnosticTicket(0, 0)],

    // Fleet
    fleet: createDefaultFleet(),

    // Debt & VC
    debt: {
      active: false,
      principalCents: 0,
      nominalApr: 0.18,
      monthsRemaining: 0,
      monthlyPaymentCents: 0,
      nextPaymentDueTick: 0,
      totalBorrowedCents: 0,
      totalRepaidCents: 0,
    },
    vc: {
      accepted: false,
      mandateIntervalTicks: 1800,
      nextDeadlineTick: 1800,
      requiredGrowthRatio: 0.50,
      baselineArrCents: 0,
      founderOwnershipRatio: 1.0,
      totalCapitalRaisedCents: 0,
    },

    // Quarters & Roguelike Progression
    quarter: 1,
    monthInQuarter: 1,
    ticksInCurrentMonth: 0,
    arrBridge: {
      openingArrCents: 0,
      newArrCents: 0,
      expansionArrCents: 0,
      contractionArrCents: 0,
      churnArrCents: 0,
      delinquencyLossArrCents: 0,
      restorationArrCents: 0,
      closingArrCents: 0,
    },
    auditedArrBridge: null,
    activeArchetype: 'product_led_machine',
    activeRelics: [],
    availableQuarterRelics: [RELIC_CATALOG[0], RELIC_CATALOG[1], RELIC_CATALOG[2]],
    consumablesInventory: [CONSUMABLE_CATALOG[0]],
    availableQuarterConsumables: [CONSUMABLE_CATALOG[1], CONSUMABLE_CATALOG[2]],
    lockedQuarterRelicIds: [],
    lockedQuarterConsumableIds: [],
    quarterReviewRerolls: 0,
    warRoomTicksRemaining: 0,
    warRoomSpeedMultiplier: 1.0,
    bullseyeStrikesRemaining: 0,
    patentShieldTicksRemaining: 0,
    quarterValuationBoostMultiple: 0,
    quarterReviewPending: false,
    unicornVictoryAcknowledged: false,

    // Audit & Notifications
    alerts: [
      {
        id: 'init-1',
        tone: 'info',
        title: 'Founder Cockpit Initialized',
        message: 'You have $1,500 cash. Triage market signals in Demand to land your first paying customer.',
        tick: 0,
      },
    ],
    ledger: [
      {
        id: 'ledger-0',
        tick: 0,
        category: 'finance',
        message: 'Incorporated SoloUnicorn LLC with $1,500 initial founder equity.',
        deltaCashCents: INITIAL_CASH_CENTS,
      },
    ],

    // Meta Progression
    founderHistory: {
      totalRuns: 1,
      victories: 0,
      bestValuationCents: 0,
      historicalRelics: [],
      unlockedAchievementIds: [],
    },
    hasSeenTutorial: false,
    playbookDismissed: false,
    playbookCompletedSteps: [],
  }
}

export function createDiagnosticTicket(
  stationIndex: number = 0,
  luckRank: number = 0,
  idSuffix?: string
): ScratchCard {
  // Golden tickets roll with chance scaling with luck (up to 22% at high luck)
  const isGolden = luckRank >= 4
    ? Math.random() < 0.22
    : luckRank >= 2
    ? Math.random() < 0.14
    : luckRank >= 1
    ? Math.random() < 0.08
    : Math.random() < 0.03

  // Hazard rate: drops substantially as luckRank rises, but maintains a healthy floor for peeking gameplay
  // Rank 0: ~35% hazard; Rank 1: ~30%; Rank 2: ~25%; Rank 3: ~20%; Rank 4: ~16%; Rank 5: ~13%
  const hazardChance = isGolden ? 0 : Math.max(0.14, 0.36 - 0.05 * luckRank)
  const isHazard = !isGolden && Math.random() < hazardChance

  // Luck expands statistical Value Variance: higher highs for rewards
  const spread = 0.25 + 0.20 * luckRank
  const varianceMultiplier = Math.max(0.40, 1 + (Math.random() * 2.2 - 0.6) * spread)

  let outcome: ScratchPod

  if (isHazard) {
    // Negative hazard ticket (Thermal fault, Memory leak, or Kernel panic)
    const hazardRoll = Math.random()
    if (hazardRoll < 0.48) {
      // Thermal Fault: strain overload (scaled so cluster doesn't instantly collapse)
      const penaltyStrain = Math.max(2, Math.round((2.0 + Math.random() * 1.5) * (1 + 0.05 * luckRank)))
      outcome = {
        id: 0,
        symbol: 'rotten',
        rewardType: 'penalty',
        rewardValue: penaltyStrain,
        label: `Thermal Fault: +${penaltyStrain} Strain Overload`,
        isScratched: false,
        isNegative: true,
      }
    } else if (hazardRoll < 0.82) {
      // Memory Leak: context rot drift
      const penaltyRot = Number((Math.min(0.20, (0.06 + Math.random() * 0.05) * (1 + 0.05 * luckRank))).toFixed(2))
      outcome = {
        id: 0,
        symbol: 'skull',
        rewardType: 'rot',
        rewardValue: penaltyRot,
        label: `Memory Leak: +${Math.round(penaltyRot * 100)}% Context Rot`,
        isScratched: false,
        isNegative: true,
      }
    } else {
      // Kernel Panic: active incident
      outcome = {
        id: 0,
        symbol: 'panic',
        rewardType: 'incident',
        rewardValue: 1,
        label: 'Kernel Panic: +1 Critical Incident',
        isScratched: false,
        isNegative: true,
      }
    }
  } else if (isGolden) {
    // TPU Supercore jackpot: high cash rebate, strain relief, rot purge, primes shipping
    const goldenCash = Math.round(60_000 * varianceMultiplier)
    outcome = {
      id: 0,
      symbol: 'golden_apple',
      rewardType: 'cash',
      rewardValue: goldenCash,
      label: `TPU Supercore: +$${Math.round(goldenCash / 100).toLocaleString()} Rebate & -15 Strain`,
      isScratched: false,
      isNegative: false,
    }
  } else {
    // Standard Positive Telemetry Ticket
    const positiveRoll = Math.random()
    if (positiveRoll < 0.42) {
      // Compute Rebate
      const computeCash = Math.round((15_000 + Math.floor(Math.random() * 4) * 5_000) * varianceMultiplier)
      outcome = {
        id: 0,
        symbol: 'coin',
        rewardType: 'cash',
        rewardValue: computeCash,
        label: `Compute Credit: +$${Math.round(computeCash / 100).toLocaleString()} Rebate`,
        isScratched: false,
        isNegative: false,
      }
    } else if (positiveRoll < 0.74) {
      // Strain Scrubber
      const strainRelief = Math.max(4, Math.round((6 + Math.floor(Math.random() * 3) * 2) * varianceMultiplier))
      outcome = {
        id: 0,
        symbol: 'shield',
        rewardType: 'strain',
        rewardValue: strainRelief,
        label: `Strain Scrubber: -${strainRelief} Strain Relief`,
        isScratched: false,
        isNegative: false,
      }
    } else {
      // Cache Purge
      const rotRelief = Number((Math.min(0.65, (0.20 + Math.random() * 0.15) * varianceMultiplier)).toFixed(2))
      outcome = {
        id: 0,
        symbol: 'broom',
        rewardType: 'rot',
        rewardValue: rotRelief,
        label: `Cache Purge: -${Math.round(rotRelief * 100)}% Rot Relief`,
        isScratched: false,
        isNegative: false,
      }
    }
  }

  const severity: 'nominal' | 'elevated' | 'critical' | 'golden' = isGolden
    ? 'golden'
    : outcome.isNegative
    ? 'critical'
    : 'nominal'

  return {
    id: `ticket-${stationIndex}-${Date.now()}-${idSuffix || Math.floor(Math.random() * 10000)}`,
    stationIndex,
    type: 'ticket',
    name: `RACK // 0${stationIndex + 1} Diagnostic Ticket`,
    subtitle: isGolden
      ? '★ Golden TPU Supercore Telemetry (Zero Hazard Risk)'
      : outcome.isNegative
      ? '⚠️ Warning: Anomaly Telemetry Detected'
      : 'Live Telemetry & Recovery Bay',
    pods: [outcome],
    outcome,
    scratchProgress: 0,
    claimed: false,
    bankedCashCents: 0,
    bankedStrainRelief: 0,
    bankedRotRelief: 0,
    bankedLuckDelta: 0,
    isBusted: false,
    isHazard: outcome.isNegative,
    severity,
  }
}

export function createDefaultScratchCard(
  type: 'lucky_cat' | 'apple_tree' | 'ticket' = 'apple_tree',
  luckRank: number = 0,
  stationIndex: number = 0
): ScratchCard {
  if (type === 'ticket') {
    return createDiagnosticTicket(stationIndex, luckRank)
  }
  if (type === 'apple_tree') {
    // Scritchy Scratchers Green Apple push-your-luck mechanic
    // Base card has 12 pods (4x3 grid). Lower luck = more rotten apples.
    // As luck increases, rotten apples are purged and replaced with ripe Green/Golden Apples!
    const rottenCount = Math.max(1, 4 - luckRank) // 4 at rank 0, 1 at rank 3+
    const goldenCount = luckRank >= 2 ? 2 : 1

    const pods: ScratchPod[] = []
    let podId = 0

    // 1. Golden Core(s)
    for (let i = 0; i < goldenCount; i++) {
      pods.push({
        id: podId++,
        symbol: 'golden_apple',
        rewardType: 'cash',
        rewardValue: 50_000, // $500
        label: 'TPU Super Core: -15 Strain & +$500 Rebate',
        isScratched: false,
        isNegative: false,
      })
    }

    // 2. Thermal Faults (Traps)
    for (let i = 0; i < rottenCount; i++) {
      pods.push({
        id: podId++,
        symbol: 'rotten',
        rewardType: 'penalty',
        rewardValue: 6,
        label: 'Thermal Fault: +6 Strain & Overload Trip!',
        isScratched: false,
        isNegative: true,
      })
    }

    // 3. One Kernel Panic trap if luck < 2
    if (luckRank < 2) {
      pods.push({
        id: podId++,
        symbol: 'skull',
        rewardType: 'incident',
        rewardValue: 1,
        label: 'Kernel Panic: +1 Incident & Overload Trip!',
        isScratched: false,
        isNegative: true,
      })
    }

    // 4. Fill remainder with positive telemetry sectors
    const nodeRewards = [
      { type: 'strain' as const, val: 5, label: 'Throughput Bus: -5 Strain & +$150' },
      { type: 'rot' as const, val: 0.2, label: 'Memory Purge: -20% Context Rot' },
      { type: 'cash' as const, val: 20_000, label: 'Compute Credit: +$200 Token Rebate' },
      { type: 'speed' as const, val: 0.2, label: 'Nonblocking Dispatch: +20% Pipeline Speed' },
      { type: 'incident' as const, val: 1, label: 'Hot-Spare Sentry: Auto-Clear Incident' },
      { type: 'strain' as const, val: 8, label: 'Defragmenter: -8 Strain Pts' },
      { type: 'cash' as const, val: 25_000, label: 'Cloud Rebate: +$250 Infrastructure Credit' },
      { type: 'rot' as const, val: 0.25, label: 'Vector Index Cache: -25% Context Rot' },
    ]

    let rIdx = 0
    while (pods.length < 12) {
      const rew = nodeRewards[rIdx % nodeRewards.length]
      pods.push({
        id: podId++,
        symbol: rew.type === 'incident' ? 'shield' : rew.type === 'cash' ? 'coin' : 'apple',
        rewardType: rew.type,
        rewardValue: rew.val,
        label: rew.label,
        isScratched: false,
        isNegative: false,
      })
      rIdx++
    }

    // Deterministic/random shuffle pods so positions change every card
    for (let i = pods.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = pods[i]
      pods[i] = pods[j]
      pods[j] = temp
    }
    // Re-assign ids 0..11 after shuffle for predictable grid indexing
    pods.forEach((p, idx) => {
      p.id = idx
    })

    return {
      id: `card-node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'apple_tree',
      name: 'Cluster Node Diagnostic & Recovery Rig',
      subtitle: `Probe 12 telemetry node sectors to bank compute rebates, flush strain, and purge context rot. Cash out before tripping a thermal fault! (Reliability Rank ${luckRank})`,
      pods,
      claimed: false,
      bankedCashCents: 0,
      bankedStrainRelief: 0,
      bankedRotRelief: 0,
      bankedLuckDelta: 0,
      isBusted: false,
    }
  } else {
    // Maneki-Neko Classic Rig
    return {
      id: `card-cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'lucky_cat',
      name: 'Lucky Maneki-Neko Scratch Rig',
      subtitle: 'Scratch 9 pods to reveal compute bonuses, cash injections, and instant strain relief.',
      pods: [
        { id: 0, symbol: 'cat', rewardType: 'cash', rewardValue: 25_000, label: '+$250 Cash', isScratched: false, isNegative: false },
        { id: 1, symbol: 'bolt', rewardType: 'speed', rewardValue: 0.25, label: '+25% Swarm Speed', isScratched: false, isNegative: false },
        { id: 2, symbol: 'cat', rewardType: 'cash', rewardValue: 25_000, label: '+$250 Cash', isScratched: false, isNegative: false },
        { id: 3, symbol: 'broom', rewardType: 'rot', rewardValue: 0.3, label: '-30% Context Rot', isScratched: false, isNegative: false },
        { id: 4, symbol: 'shield', rewardType: 'incident', rewardValue: 1, label: 'Clear 1 Incident', isScratched: false, isNegative: false },
        { id: 5, symbol: 'cat', rewardType: 'cash', rewardValue: 50_000, label: '+$500 Jackpot', isScratched: false, isNegative: false },
        { id: 6, symbol: 'coin', rewardType: 'cash', rewardValue: 15_000, label: '+$150 Cash', isScratched: false, isNegative: false },
        { id: 7, symbol: 'apple', rewardType: 'strain', rewardValue: 12, label: '-12 Strain Pts', isScratched: false, isNegative: false },
        { id: 8, symbol: 'cat', rewardType: 'cash', rewardValue: 25_000, label: '+$250 Cash', isScratched: false, isNegative: false },
      ],
      claimed: false,
      bankedCashCents: 0,
      bankedStrainRelief: 0,
      bankedRotRelief: 0,
      bankedLuckDelta: 0,
      isBusted: false,
    }
  }
}

