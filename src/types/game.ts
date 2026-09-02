import type { AgentInstance, AgentRoleType } from './agents';
import type { ProductFeature, ArchitectureUpgrade } from './product';
import type { Trend, GrowthCampaign } from './growth';
import type { VCTermSheet } from './finance';
import type { GameEvent } from './events';

export type GameStage = 
  | 'MANUAL_FOUNDER'      // Stage 1: Founder does everything (0 agents)
  | 'VIBE_CODER'          // Stage 2: 1-7 agents, automating first actions
  | 'AGENT_MANAGER'       // Stage 3: 8-30 agents, managers unlocked
  | 'AUTONOMOUS_STARTUP'  // Stage 4: 30+ agents, C-suite executives unlocked
  | 'ONE_PERSON_UNICORN'  // Stage 5: CEO Agent runs operations, $1B reached
  | 'HOLDING_COMPANY';    // Stage 6: Autonomous conglomerate mode

export type AutonomyLevel = 1 | 2 | 3 | 4 | 5;

export interface AutonomyInfo {
  level: AutonomyLevel;
  percent: number;
  title: string;
  subtitle: string;
  badgeClass: string;
  nextRequirement: string;
  isMax: boolean;
}

export type ScreenTab = 
  | 'command'
  | 'swarm'
  | 'terminal'
  | 'agents'
  | 'product'
  | 'growth'
  | 'customers'
  | 'finance'
  | 'inbox'
  | 'holding';

export type StartupArchetype = 'B2B_SAAS' | 'CONSUMER' | 'DEVTOOLS' | 'ENTERPRISE' | 'CREATOR';

export interface StartupIdea {
  id: string;
  name: string;
  tagline: string;
  problem: string;
  customer: string;
  archetype: StartupArchetype;
  arpu: number;
  virality: 'Low' | 'Medium' | 'High' | 'Extreme';
  enterprisePotential: 'Low' | 'Medium' | 'High' | 'Extreme';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
}

export interface ActivityLog {
  id: string;
  text: string;
  category: 'founder' | 'agent' | 'customer' | 'product' | 'growth' | 'finance' | 'incident' | 'system';
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'milestone';
}

export interface CustomerSegment {
  id: string;
  name: string;
  count: number;
  arpu: number;
  churnRate: number; // monthly percentage
  unlocked: boolean;
}

export interface OfflineRecapData {
  timeOfflineSeconds: number;
  revenueEarned: number;
  customersGained: number;
  featuresShipped: number;
  ticketsResolved: number;
  ticketsGenerated: number;
  incidentsCount: number;
  recapFlavor: string;
}

export interface HoldingCompanyStats {
  portfolioValuation: number;
  totalCompanies: number;
  totalAgents: number;
  totalRevenue: number;
  synergyLevel: number;
  conglomerateTreasury?: number;
  totalDividendsEarned?: number;
}

export interface CompanyState {
  id: string;
  name: string;
  idea: StartupIdea;
  foundedAt: number;
  stage: GameStage;
  autonomyLevel: AutonomyLevel;

  // Headline KPI Numbers
  cash: number;
  customers: number;
  arpu: number;
  baseArpu: number;
  mrr: number;
  arr: number;
  valuation: number;
  lastValuation?: number; // Priced VC round benchmark floor
  valuationMultiple: number;
  founderOwnership: number;
  totalCapitalRaised: number;
  employees: 1;

  // Operational Resources
  focus: number;
  maxFocus: number;
  productLevel: number;
  buildPoints: number;
  buildPointsTarget: number;
  attention: number;
  leads: number;
  tickets: number;
  totalTicketsResolved: number;
  trust: number;
  techDebt: number;
  hype: number;
  computeUsed: number;
  computeCapacity: number;
  currentComputeTierId: string;

  // Systems
  agents: AgentInstance[];
  unlockedAgentRoles: AgentRoleType[];
  roadmapFeatures: ProductFeature[];
  activeRoadmapId: string | null;
  completedFeatures: string[];
  architectureUpgrades: ArchitectureUpgrade[];
  trends: Trend[];
  activeTrendId: string | null;
  growthCampaigns?: GrowthCampaign[];
  customerSegments: CustomerSegment[];
  vcOffers: VCTermSheet[];
  activeEvents: GameEvent[];
  eventHistory: GameEvent[];
  unlockedMilestones: string[];
  activityLogs: ActivityLog[];
}
