/**
 * Canonical V1 One-Person Company Roguelite Types
 * Product Truth: company_sim_v1/product_final.md
 * Implementation Contract: company_sim_v1/AGENTS.md
 */

export type MoneyCents = bigint;
export type BasisPoints = number; // 0..10,000, where 10,000 = 100.00%
export type MilliUnits = number;  // 1,000 = 1.000 GU or CU

export type RoomId =
  | 'marketing'
  | 'product'
  | 'monetization'
  | 'retention'
  | 'expansion'
  | 'operations';

export const ALL_ROOMS: readonly RoomId[] = [
  'marketing',
  'product',
  'monetization',
  'retention',
  'expansion',
  'operations',
] as const;

export type GrowthMultiple = 2 | 4 | 6 | 10 | 14 | 20 | 28 | 40;

export type StrainState = 'stable' | 'strained' | 'overloaded' | 'critical';

export type AgentTier = 0 | 1 | 2 | 3 | 4;

export interface AgentTierConfig {
  tier: AgentTier;
  name: string;
  cumulativeInstallCu: number;
  monthlyCostCu: number;
  throughputMultiplier: number;
  baseReliabilityBps: BasisPoints;
  complexity: number;
}

export const AGENT_TIER_CONFIGS: Record<AgentTier, AgentTierConfig> = {
  0: { tier: 0, name: 'None', cumulativeInstallCu: 0, monthlyCostCu: 0, throughputMultiplier: 0, baseReliabilityBps: 0, complexity: 0 },
  1: { tier: 1, name: 'Worker', cumulativeInstallCu: 1, monthlyCostCu: 0.15, throughputMultiplier: 0.60, baseReliabilityBps: 7200, complexity: 1.0 },
  2: { tier: 2, name: 'Specialist', cumulativeInstallCu: 3, monthlyCostCu: 0.30, throughputMultiplier: 1.30, baseReliabilityBps: 8400, complexity: 1.5 },
  3: { tier: 3, name: 'Swarm', cumulativeInstallCu: 7, monthlyCostCu: 0.60, throughputMultiplier: 2.60, baseReliabilityBps: 9000, complexity: 3.0 },
  4: { tier: 4, name: 'Closed Loop', cumulativeInstallCu: 14, monthlyCostCu: 1.00, throughputMultiplier: 4.50, baseReliabilityBps: 9400, complexity: 5.0 },
};

export interface ArrBridge {
  startingArrCents: MoneyCents;
  newCustomerArrCents: MoneyCents;
  expansionArrCents: MoneyCents;
  churnedArrCents: MoneyCents;
  endingArrCents: MoneyCents;
}

export interface FinancingRound {
  stage: 'preseed' | 'seed' | 'series_a' | 'series_b';
  quarter: number;
  cashRaisedCents: MoneyCents;
  preMoneyCents?: MoneyCents;
  safeCapCents?: MoneyCents;
  dilutionBps: BasisPoints;
  ownershipBeforeBps: BasisPoints;
  ownershipAfterBps: BasisPoints;
}

export type FounderHistoryId =
  | 'fresh'
  | 'vibe_coder'
  | 'distribution_native'
  | 'monetization_nerd'
  | 'customer_obsessive'
  | 'enterprise_operator'
  | 'systems_operator'
  | 'bootstrapper'
  | 'repeat_founder';

export interface MarketingCard {
  id: string;
  relevance: number;      // 0..2
  audienceFit: number;    // 0..2
  trendVelocity: number;  // 0..2
  saturation: number;     // 0..2
  channelCost: number;    // 0..2
  scoreQ: number;         // relevance + audienceFit + trendVelocity - saturation - channelCost
  expiresInSeconds: number;
}

export type ProductPieceType = 'PROMPT' | 'DIFF' | 'TEST' | 'DEPLOY';
export type ProductPieceShape =
  | 'DIAMOND'
  | 'HEXAGON'
  | 'TRIANGLE'
  | 'ORB'
  | 'SQUARE'
  | 'STAR'
  | 'PENTAGON'
  | 'PLUS';

export type ProductRequestState = 'REQUEST' | 'IMPLEMENTATION' | 'VERIFIED' | 'SHIPPED';

export interface ProductSlot {
  id: string;
  state: ProductRequestState;
  hasPrompt: boolean;
  hasDiff: boolean;
  hasTest: boolean;
  lockedUntilMs: number;
  name?: string;
  tag?: string;
  desc?: string;
  requirements?: ProductPieceType[];
  requirementShapes?: ProductPieceShape[];
  filledIndices?: number[];
}

export interface MonetizationOpportunity {
  id: string;
  cursorPositionBps: number; // 0..10,000 (0.00% to 100.00%)
  cursorSpeedBpsPerSec: number;
  cursorDirection: 1 | -1;
  centerBps: number;         // center of Perfect zone
  widthBps: number;          // total band width
  expiresInSeconds: number;
}

export interface RetentionThreat {
  id: string;
  severity: 'S1' | 'S2' | 'S3';
  hp: number;
  maxHp: number;
  arrValueMilliGu: MilliUnits; // S1=250, S2=500, S3=1000
  travelTimeTotalSec: number;
  travelTimeRemainingSec: number;
  causeId: string;
}

export interface ExpansionModule {
  id: string;
  name: string;
  width: number;
  height: number;
  tags: string[];
  conflicts: string[];
}

export interface ExpansionAccount {
  id: string;
  name: string;
  archetype: string;
  archetypeMultiplier?: number;
  tierBadge?: string;
  tierColor?: string;
  requiredTags: string[];
  compatibleTags: string[];
  conflictingTags: string[];
  revealedNeedsCount: number;
  grid: (string | null)[][]; // 4x4
  expiresInSeconds: number;
  packWindowSeconds: number;
  isOpen: boolean;
}

export interface OperationsIncident {
  id: string;
  severity: 'S1' | 'S2' | 'S3';
  category: string;
  diagnosisOptions: string[];
  correctDiagnosisIndex: number;
  revealedMask: boolean[][]; // 16x16 grid
  revealedPercentage: number;
  activeDurationSec: number;
  lockedUntilMs: number;
  isResolved: boolean;
}

export interface RoomStateMarketing {
  queue: MarketingCard[];
  comboCount: number;
  lowQualityDemandMilliGu: MilliUnits;
  nextCardTimerSec: number;
}

export interface RoomStateProduct {
  slots: ProductSlot[];
  queuedRequests: number;
  pieceSpawns: ProductPieceType[];
  nextPieceTimerSec: number;
}

export interface RoomStateMonetization {
  currentOpportunity: MonetizationOpportunity | null;
  queuedActivations: number;
}

export interface RoomStateRetention {
  threats: RetentionThreat[];
  founderTurretFireTimerSec: number;
  founderAimThreatId: string | null;
}

export interface RoomStateExpansion {
  accounts: ExpansionAccount[];
  activeAccountIndex: number | null;
  quarterlyExpansionArrCents: MoneyCents;
  nextAccountTimerSec: number;
}

export interface RoomStateOperations {
  incidents: OperationsIncident[];
  activeIncidentIndex: number | null;
  monthlyLeakCents: MoneyCents;
}

export interface CompanyState {
  id: string;
  name: string;
  tagline: string;
  category: string;
  quarter: number;
  quarterElapsedMs: number;
  isIntermission: boolean;
  founderHistory: FounderHistoryId;
  activeRoom: RoomId;

  // Economic Core
  arrCents: MoneyCents;
  quarterStartArrCents: MoneyCents;
  cashCents: MoneyCents;
  debtCents: MoneyCents;
  founderOwnershipBps: BasisPoints;
  valuationMultiple: GrowthMultiple;
  valuationCents: MoneyCents;
  peakValuationCents: MoneyCents;
  unicornQuarter: number | null;
  growthCommitment: number | null; // e.g. 0.10, 0.25, 0.50, 0.75, 1.00
  isBankrupt: boolean;
  bankruptcyReason?: 'growth_mandate_missed' | 'insolvency';
  bankruptcyGraceRemainingMs: number;

  // Normalized units locked at quarter start
  growthUnitCents: MoneyCents;
  capitalUnitCents: MoneyCents;

  // Complexity & Ops
  complexity: number;
  opsCapacity: number;
  strain: number;
  strainState: StrainState;

  // Cross-Room Work Queues
  demandBacklogMilliGu: MilliUnits;
  activationBacklogMilliGu: MilliUnits;
  churnThreatMilliGu: MilliUnits;

  // Subsystems & Collections
  agents: Record<RoomId, AgentTier>;
  upgrades: string[];
  financingRounds: FinancingRound[];

  // Room states
  marketing: RoomStateMarketing;
  product: RoomStateProduct;
  monetization: RoomStateMonetization;
  retention: RoomStateRetention;
  expansion: RoomStateExpansion;
  operations: RoomStateOperations;

  // Current quarter ARR bridge tracking
  currentQuarterNewCustomerArrCents: MoneyCents;
  currentQuarterExpansionArrCents: MoneyCents;
  currentQuarterChurnedArrCents: MoneyCents;

  // History & logs
  historicalBridges: ArrBridge[];
  actionLog: PlayerCommand[];

  // Real-time Controls, Automation Stages & Climax
  isPaused?: boolean;
  unicornSpeedrunElapsedMs?: number;
  unicornAcknowledged?: boolean;
  totalManualActions: number;
  totalAutomatedActions: number;
  overclockRooms: Record<RoomId, boolean>;
  safetyIndex: number;
  computeLoadBps: number;
  achievedMilestones: string[];

  // Authentic Vibe Coding & Swarm Evolution Mechanics
  vibeCodingStage: VibeCodingStage;
  vibeDebt: number; // 0 to 100 (hallucination & context rot risk)
  tokenBurnRateCentsPerSec: MoneyCents; // Current API inference cost per second
  totalTokensBurnedCents: MoneyCents; // Total API burn across run
  activeAgentArchetypes: {
    claudeCode: number; // Feature synthesis & PR writing
    geminiFlash: number; // Inbound lead scraping
    sonnetSales: number; // Contract pricing & deal closer
    deepseekSre: number; // Incident triage & self-healing
  };
  recentVibecodingEvents: VibecodingEvent[];
}

export type VibeCodingStage =
  | 'manual' // Stage 1: Manual Hacker (0 agents, manual clicks)
  | 'prompter' // Stage 2: Cursor / Prompter (natural language diff prompting)
  | 'yolo' // Stage 3: YOLO Mode (auto-shipping diffs, high velocity, vibe debt)
  | 'swarm' // Stage 4: Agent Swarms (Claude Code, Sonnet, Gemini, DeepSeek)
  | 'sovereign'; // Stage 5: Sovereign Intelligence ($1B Unicorn autonomy)

export interface VibecodingEvent {
  id: string;
  timestampMs: number;
  stage: VibeCodingStage;
  title: string;
  detail: string;
  type: 'win' | 'hallucination' | 'cost' | 'incident' | 'deploy';
}

export type PlayerCommandType =
  | 'MARKETING_SWIPE_LEFT'
  | 'MARKETING_SWIPE_RIGHT'
  | 'MARKETING_SWIPE_UP'
  | 'PRODUCT_MERGE_PIECE'
  | 'PRODUCT_DEPLOY_EARLY'
  | 'MONETIZATION_TAP'
  | 'RETENTION_AIM_THREAT'
  | 'EXPANSION_PLACE_MODULE'
  | 'EXPANSION_SUBMIT_ACCOUNT'
  | 'OPS_SCRATCH_CELL'
  | 'OPS_DIAGNOSE'
  | 'SWITCH_ACTIVE_ROOM'
  | 'BUY_AGENT_TIER'
  | 'BUY_UPGRADE'
  | 'DRAW_LOC'
  | 'REPAY_LOC'
  | 'ACCEPT_FINANCING'
  | 'SELECT_GROWTH_COMMITMENT'
  | 'CONTINUE_TO_NEXT_QUARTER';

export interface PlayerCommand {
  type: PlayerCommandType;
  quarter: number;
  elapsedMs: number;
  payload?: any;
}

export interface HoldingCompanyState {
  unlocked: boolean;
  activeCompanyId: string;
  companies: CompanyState[];
  portfolioFounderValueCents: MoneyCents;
  unicornCount: number;
  availableSlots: number;
}
