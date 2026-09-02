import type { AgentRoleType } from './agents';
import type { GameStage, StartupArchetype } from './game';

export type EventCategory = 
  | 'Product'
  | 'Growth'
  | 'Customer'
  | 'Agent'
  | 'Infrastructure'
  | 'Investor'
  | 'Legal'
  | 'Founder'
  | 'Market'
  | 'Competitor'
  | 'Crisis'
  | 'Executive';

export interface EventChoiceEffect {
  cashDelta?: number;
  trustDelta?: number;
  hypeDelta?: number;
  customersDelta?: number;
  techDebtDelta?: number;
  attentionDelta?: number;
  leadsDelta?: number;
  ticketsDelta?: number;
  productPointsDelta?: number;
  ownershipDelta?: number; // dilution or buyback
  multiplierEffect?: {
    target: 'engineering' | 'growth' | 'sales' | 'support' | 'all';
    multiplier: number;
    durationSeconds: number;
    description: string;
  };
}

export interface EventChoice {
  id: string;
  label: string;
  summary: string;
  effects: EventChoiceEffect;
  flavorOutcome: string;
}

export interface EventTriggerCondition {
  minMrr?: number;
  maxMrr?: number;
  minCustomers?: number;
  maxCustomers?: number;
  minTechDebt?: number;
  maxTechDebt?: number;
  minAgents?: number;
  maxAgents?: number;
  soloFounderOnly?: boolean;
  requiresAgents?: boolean;
  requiredAgentRoles?: AgentRoleType[];
  prohibitedAgentRoles?: AgentRoleType[];
  minCash?: number;
  maxCash?: number;
  minHype?: number;
  maxHype?: number;
  minTrust?: number;
  maxTrust?: number;
  minComputeUsed?: number;
  maxComputeUsed?: number;
  requiredCompletedFeature?: string;
  stageRequired?: GameStage;
  archetypeRequired?: StartupArchetype;
}

export interface GameEvent {
  id: string;
  templateId?: string;
  title: string;
  body: string;
  category: EventCategory;
  severity: 1 | 2 | 3;
  source: string; // e.g. "CLAWD (Engineering)", "Customer Support", "Sequoia Memo", "SEC"
  timestamp: number;
  choices: [EventChoice, EventChoice] | [EventChoice, EventChoice, EventChoice];
  isResolved: boolean;
  resolvedChoiceId?: string;
  triggerCondition?: EventTriggerCondition;
}

export interface MilestoneDefinition {
  id: string;
  title: string;
  description: string;
  conditionDescription: string;
  isUnlocked: boolean;
  unlockedAt?: number;
  checkUnlocked: (state: any) => boolean;
  rewardFlavor: string;
  bannerTitle?: string;
}
