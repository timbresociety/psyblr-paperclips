export type FunctionId = 'demand' | 'product' | 'monetisation' | 'retention' | 'expansion' | 'operations' | 'finance'

export type ProgressionAxis = 'craft' | 'scale' | 'automate' | 'luck'

export type CustomerSegment = 'creator' | 'team' | 'enterprise'

export interface SegmentProfile {
  id: CustomerSegment
  label: string
  baseWtpMonthlyCents: number
  serviceCostMonthlyCents: number
  needSpeed: number
  needCollaboration: number
  needControl: number
  collectionDelayTicks: number
  collectionProbability: number
  qualificationSuccessRate: number
}

export interface LuckVarianceResult {
  multiplier: number
  delta: number
  isPeakPositive: boolean
  isExtremeNegative: boolean
}

export type EvolutionTier = 'garage' | 'workshop' | 'workstation' | 'growth' | 'ethereal'

export interface DemandSignal {
  id: string
  title: string
  quote?: string
  segment: CustomerSegment
  segmentLabel?: string
  purchaseIntent?: 'Evaluating' | 'Budget Approved' | 'Buying now' | 'Trialing'
  signalRationale: string
  acquisitionCostCents: number
  expiryTick: number
  estimatedWtpCents: number
}

export interface QualifiedOpportunity {
  id: string
  signalId: string
  title: string
  quote?: string
  segment: CustomerSegment
  segmentLabel?: string
  estimatedWtpCents: number
  qualifiedTick: number
}

export interface DemandTriageOutcome {
  id: string
  signalId: string
  title: string
  segment: CustomerSegment
  success: boolean
  probability: number
  failureReason?: string
  effectiveCac: number
  effectiveWtp: number
  isHyper: boolean
  isLuckyWhale: boolean
  luckVariancePct: number
  tick: number
}

export interface SystemCapabilities {
  speed: number
  collaboration: number
  control: number
}

export type ProductBucket = 'write' | 'diff' | 'test' | 'deploy'
export type ProductShape = '1x1' | '2x1' | '1x2' | '2x2' | 'L' | 'T'

export interface ProductComponent {
  id: string
  name: string
  category: 'speed' | 'collaboration' | 'control'
  bucket?: ProductBucket
  shape?: ProductShape
  capabilityBonus: number
  defectRisk: number
  flavor: string
}

export type AIPrimitiveType = 'prompt' | 'diff' | 'test' | 'deploy'

export interface PodSocket {
  type: AIPrimitiveType
  filled: boolean
}

export interface CodingPod {
  id: string
  slotIndex: number // 0..5
  opportunityId?: string
  leadTitle: string
  leadSegment: CustomerSegment
  leadWtpCents: number
  moduleName: string
  categoryTag: string
  codeSnippet: string
  linesAdded: number
  linesRemoved: number
  sockets: PodSocket[]
  isVerified: boolean
  isReadyToShip: boolean
  isAlphaFeature?: boolean
}

export interface RetentionIncident {
  id: string
  accountId: string
  accountName: string
  title: string
  category: 'database' | 'executive' | 'security' | 'billing'
  urgencyTicks: number
  maxUrgencyTicks: number
  consequence: string
  hp?: number
  maxHp?: number
  threatType?: 'piggy' | 'gremlin' | 'bug' | 'dispute' | 'outage'
}

export interface MergeItem {
  id: string
  chain: 'intelligence' | 'infrastructure' | 'security'
  tier: number // 1..7
}

export interface ExpansionOrder {
  id: string
  accountId: string
  accountName: string
  chain: 'intelligence' | 'infrastructure' | 'security'
  targetTier: number // 1..7
  rewardArrCents: number
  rewardCashCents: number
}

export interface ScratchPod {
  id: number
  symbol: 'cat' | 'apple' | 'golden_apple' | 'bolt' | 'broom' | 'shield' | 'coin' | 'rotten' | 'skull' | 'panic'
  rewardType: 'cash' | 'strain' | 'rot' | 'incident' | 'speed' | 'luck' | 'penalty'
  rewardValue: number
  label: string
  isScratched: boolean
  isNegative?: boolean
}

export interface ScratchCard {
  id: string
  stationIndex?: number // Bay 0..5
  type: 'lucky_cat' | 'apple_tree' | 'ticket'
  name: string
  subtitle: string
  pods: ScratchPod[]
  outcome?: ScratchPod
  scratchProgress?: number
  claimed: boolean
  bankedCashCents?: number
  bankedStrainRelief?: number
  bankedRotRelief?: number
  bankedLuckDelta?: number
  isBusted?: boolean
  isHazard?: boolean
  isRejected?: boolean
  severity?: 'nominal' | 'elevated' | 'critical' | 'golden'
}

export interface DealDeskState {
  id: string
  deskIndex: number // 0..5
  activation: ProductActivation | null
  postedPriceMonthlyCents: number
  status: 'negotiating' | 'idle' | 'closed'
  rating?: 'perfect' | 'good' | 'hazard'
}

export interface ProductActivation {
  id: string
  title: string
  targetSegment: CustomerSegment
  speedFit: number
  collabFit: number
  controlFit: number
  overallFit: number
  defectExposure: number
  timestampTick: number
  customWtpMonthlyCents?: number
}

export interface CustomerAccount {
  id: string
  name: string
  segment: CustomerSegment
  baseMrrCents: number
  addonMrrCents: number
  health: number // 0..100
  ageTicks: number
  addonSlotsUsed: number // max 2
  isThreatened: boolean
  threatDeadlineTick: number | null
  threatReason: string | null
  unpaidGraceTicks: number
  delinquent: boolean
  lastCollectionAttemptTick: number | null
  fit: number
  overpricing: number
  defects: number
  serviceRemainderCents: number
}

export interface InvoiceSchedule {
  id: string
  accountId: string
  amountCents: number
  dueTick: number
  collected: boolean
  collectionAttempts: number
}

export interface MandatoryBill {
  id: string
  category: 'base_overhead' | 'agent_compute' | 'debt_principal' | 'debt_interest' | 'infrastructure_cogs'
  amountCents: number
  dueTick: number
  label: string
}

export interface DebtFacility {
  active: boolean
  principalCents: number
  nominalApr: number // e.g. 0.18
  monthsRemaining: number
  monthlyPaymentCents: number
  nextPaymentDueTick: number
  totalBorrowedCents: number
  totalRepaidCents: number
}

export interface VCMandate {
  accepted: boolean
  mandateIntervalTicks: number // 1,800 ticks (one quarter)
  nextDeadlineTick: number
  requiredGrowthRatio: number // 0.50 (50% ARR growth)
  baselineArrCents: number
  founderOwnershipRatio: number // 1.0 down to 0.75 etc.
  totalCapitalRaisedCents: number
}

export interface FunctionFleet {
  craftRank: number // 0..4
  scaleRank: number // 0..4
  automateRank: number // 0..4
  luckRank: number // 0..4
  onlineUnits: number
  accumulatedWorkCredits: number
}

export interface OperationsState {
  opsCapacity: number
  coordinationLoad: number
  instantOverload: number
  strainBacklog: number
  contextRot: number // 0..1
  incidentsBacklog: number
  diagnosedRootCause: string | null
  scratchedEvidencePct: number // 0..1
  lastSpeculativeTick?: number
  speculativeRunsCount?: number
  lastFailoverTick?: number
  luckOptimizerOdds: {
    winChance: number
    winMultiplier: number
    lossPenaltyRatio: number
    rebateCents?: number
    penaltyCents?: number
  }
}

export interface Relic {
  id: string
  name: string
  category: 'efficiency' | 'growth' | 'stability' | 'automation' | 'capital'
  effectSummary: string
  flavor: string
  rarity: 'rare' | 'monumental' | 'ethereal'
  costCents?: number
}

export type EngineArchetypeId =
  | 'product_led_machine'
  | 'distribution_engine'
  | 'nrr_fortress'
  | 'default_alive'
  | 'operations_fortress'

export interface PassiveEffects {
  productYieldBonus?: number
  defectReduction?: number
  podCapacityBonus?: number
  demandRateBonus?: number
  acquisitionCostDiscount?: number
  churnResistance?: number
  expansionBonus?: number
  cashYieldBonus?: number
  opexDiscount?: number
  opsCapacityBonus?: number
  contextRotReduction?: number
  strainReduction?: number
  automateSpeedBonus?: number
  manualActionMultiplier?: number
}

export interface EngineArchetype {
  id: EngineArchetypeId
  name: string
  title: string
  description: string
  buffsSummary: string
  assetPath: string
  passiveEffects: PassiveEffects
}

export type ConsumableAction =
  | 'hn_blitz'
  | 'emergency_safe'
  | 'war_room'
  | 'exec_golf'
  | 'kernel_purge'
  | 'defense_rfp'
  | 'tech_raid'
  | 'debt_bridge'
  | 'competitor_raid'
  | 'supercluster_burst'
  | 'patent_shield'
  | 'secondary_sale'
  | 'bullseye_lock'
  | 'matrix_purge'
  | 'enterprise_pilot'
  | 'talent_blitz'
  | 'debt_forgiveness'
  | 'viral_podcast'
  | 'incident_nuke'
  | 'valuation_pump'

export interface Consumable {
  id: string
  name: string
  effectSummary: string
  flavor: string
  actionType: ConsumableAction
  icon: string
  rarity: 'rare' | 'monumental' | 'ethereal'
  costCents?: number
}

export interface FounderRelic {
  id: string
  name: string
  title: string
  tier: 'rare' | 'monumental' | 'ethereal'
  category: 'speed' | 'quality' | 'capital' | 'growth' | 'automation' | 'stability'
  effectSummary: string
  flavor: string
  icon: string
  speedBonus?: number
  passiveEffects?: PassiveEffects
}

export interface FounderAchievement {
  id: string
  name: string
  description: string
  metricLabel: string
  relicId: string
  difficulty?: 'easy' | 'effort'
  unlockedRelic: FounderRelic
}

export interface Alert {
  id: string
  tone: 'info' | 'warning' | 'critical'
  title: string
  message: string
  tick: number
  targetFunction?: FunctionId
  actionLabel?: string
  acknowledged?: boolean
}

export interface LedgerEntry {
  id: string
  tick: number
  category: 'demand' | 'product' | 'monetisation' | 'retention' | 'expansion' | 'ops' | 'finance' | 'quarter' | 'founder'
  message: string
  deltaCashCents?: number
  deltaArrCents?: number
}

export interface ArrBridge {
  openingArrCents: number
  newArrCents: number
  expansionArrCents: number
  contractionArrCents: number
  churnArrCents: number
  delinquencyLossArrCents: number
  restorationArrCents: number
  closingArrCents: number
}

export interface GameState {
  version: number
  seed: number
  elapsedTicks: number
  speedMultiplier: number
  paused: boolean
  runStatus: 'running' | 'paused' | 'failed' | 'unicorn_victory'
  failureReason: string | null
  
  // Scoring & Capital
  cashCents: number
  contractualArrCents: number
  eligibleArrCents: number
  valuationCents: number
  growthMultiple: number
  capitalQualityFactor: number
  shortfallFraction: number
  competitionFactor: number
  earnedRevenueMonthCents: number
  cogsMonthCents: number
  opexMonthCents: number
  interestMonthCents: number
  burnRatio: number
  forecastObligationsCents: number
  forecastExpectedCollectionsCents: number
  peakNegativeCashCents: number
  
  // Navigation & Attention & Theme
  activeFunction: FunctionId
  unlockedFunctions: FunctionId[]
  themeTierOverride: EvolutionTier | null
  
  // Pipeline & Demand
  qualifiedOpportunities: QualifiedOpportunity[]
  demandSignals: DemandSignal[]
  activeSignalId: string | null
  signalsTriagedCount: number
  lastDemandReplenishTick?: number
  lastDemandTriageTick?: number
  lastTriageOutcome?: DemandTriageOutcome | null
  
  // Product
  availableComponents: ProductComponent[]
  productSlots: {
    speed: ProductComponent | null
    collaboration: ProductComponent | null
    control: ProductComponent | null
  }
  productBuckets?: {
    write: ProductComponent | null
    diff: ProductComponent | null
    test: ProductComponent | null
    deploy: ProductComponent | null
  }
  productVerified: boolean
  verificationErrors: string[]
  productStage?: 'write' | 'diff' | 'test' | 'deploy'
  productDiffResolved?: boolean
  productTestsPassed?: boolean
  productPods?: CodingPod[]
  activationsQueue: ProductActivation[]
  lastProductShipTick?: number
  systemCapabilities: SystemCapabilities
  
  // Monetisation
  currentActivation: ProductActivation | null
  lastMonetisationCommitTick?: number
  pricingCursor: number // 0..1 (represents 0% to 200% of WTP)
  postedPriceMonthlyCents: number
  lastSignedContract: {
    customerName: string
    segment: CustomerSegment
    monthlyArrCents: number
    tick: number
  } | null
  
  // Customers & Cashflow Schedules
  accounts: CustomerAccount[]
  pendingInvoices: InvoiceSchedule[]
  mandatoryBills: MandatoryBill[]
  
  // Retention & Expansion
  activeThreatAccountId: string | null
  retentionSavedArrCents: number
  retentionLostArrCents: number
  retentionCombo?: number
  retentionIncidents?: RetentionIncident[]
  expansionDraftAccount: CustomerAccount | null
  expansionAddonPacks: Array<{
    id: string
    title: string
    costCents: number
    addonMrrCents: number
    serviceLoadInc: number
  }>
  mergeGrid?: (MergeItem | null)[]
  expansionOrders?: ExpansionOrder[]
  
  // Operations & Strain
  operations: OperationsState
  activeScratchCard?: ScratchCard | null
  activeTickets?: ScratchCard[] // 1 to 6 parallel diagnostic ticket bays
  activeDealDesks?: DealDeskState[] // 1 to 6 commercial deal negotiation desks
  
  // Fleet & Skill Trees
  fleet: Record<FunctionId, FunctionFleet>
  
  // Debt & VC
  debt: DebtFacility
  vc: VCMandate
  
  // Quarters & Roguelike Progression
  quarter: number
  monthInQuarter: number
  ticksInCurrentMonth: number
  arrBridge: ArrBridge
  auditedArrBridge?: ArrBridge | null
  // Active Engine Archetype (Foundational Founder Relic equivalent)
  activeArchetype: EngineArchetypeId
  activeRelics: Relic[]
  availableQuarterRelics: Relic[]
  consumablesInventory: Consumable[]
  availableQuarterConsumables?: Consumable[]
  lockedQuarterRelicIds?: string[]
  lockedQuarterConsumableIds?: string[]
  quarterReviewRerolls?: number
  warRoomTicksRemaining?: number
  warRoomSpeedMultiplier?: number
  bullseyeStrikesRemaining?: number
  patentShieldTicksRemaining?: number
  quarterValuationBoostMultiple?: number
  quarterReviewPending: boolean
  unicornVictoryAcknowledged?: boolean

  // Primary Funnel Pipeline Stage
  pipelineStage: 'demand' | 'product' | 'monetisation'

  // Event-Driven Minigames
  retentionEvent: {
    active: boolean
    accountId: string
    accountName: string
    reason: string
    deadlineTick: number
    savedArrCents: number
  } | null

  expansionEvent: {
    active: boolean
    orderId: string
    accountName: string
    chain: 'intelligence' | 'infrastructure' | 'security'
    targetTier: number
    rewardArrCents: number
    rewardCashCents: number
  } | null

  operationsEvent: {
    active: boolean
    title: string
    severity: 'warning' | 'critical'
    incidentType: 'strain_spike' | 'rot_drift' | 'cloud_outage'
    strainPenalty: number
    rotPenalty: number
  } | null
  
  // Audit & Notification
  alerts: Alert[]
  ledger: LedgerEntry[]
  
  // Meta-Progression across runs
  founderHistory: {
    totalRuns: number
    victories: number
    bestValuationCents: number
    historicalRelics: string[]
    unlockedAchievementIds?: string[]
    equippedFounderRelicId?: string
  }

  // Guided Onboarding & Starter Playbook
  hasSeenTutorial?: boolean
  playbookDismissed?: boolean
  playbookCompletedSteps?: string[]
}
