export type AgentRoleType = 
  | 'ENGINEERING'
  | 'GROWTH'
  | 'SALES'
  | 'SUPPORT'
  | 'QA'
  | 'OPERATIONS'
  | 'MANAGER'
  | 'EXECUTIVE'
  | 'CEO';

export type AgentTraitType =
  | 'COWBOY'
  | 'PERFECTIONIST'
  | 'CHRONICALLY_ONLINE'
  | 'ENTERPRISE_BRAIN'
  | 'PROMPT_MAXXER'
  | 'REFACTOR_ENJOYER'
  | 'HALLUCINATOR'
  | 'SPEED_DEMON'
  | 'GIGA_OPTIMIZER'
  | 'LINKEDIN_LUNATIC'
  | 'MEME_LORD'
  | 'PARANOID_ARCHITECT'
  | 'COFFEE_OVERLOAD'
  | 'SLEEP_DEPRIVED'
  | 'OVERENGINEER'
  | 'METRIC_HACKER'
  | 'VIBE_PURIST'
  | 'CHAOS_MONKEY'
  | 'SECURITY_HAWK'
  | 'SYCOPHANT';

export interface AgentTraitDefinition {
  id: AgentTraitType;
  name: string;
  description: string;
  badgeColor: string;
  effects: {
    outputMultiplier?: number;
    techDebtMultiplier?: number;
    computeMultiplier?: number;
    trustRiskMultiplier?: number;
    salesLeadMultiplier?: number;
    enterpriseMultiplier?: number;
    supportSpeedMultiplier?: number;
    hallucinationRisk?: number;
    specialDesc?: string;
  };
}

export interface AgentRoleDefinition {
  role: AgentRoleType;
  title: string;
  department: 'Product' | 'Growth' | 'Operations' | 'Executive';
  baseOutputDescription: string;
  baseOutputValue: number; // e.g., 2.0 BP/s, 40 Att/s, 0.25 Leads/s, 0.15 Tickets/s, 0.05 Debt/s, 15% Ops
  baseComputeCost: number; // in CU
  hireCost: number; // in Cash
  unlockRequirement: string;
  unlockedByDefault: boolean;
  description: string;
}

export interface AgentInstance {
  id: string;
  name: string;
  role: AgentRoleType;
  level: number; // 1 to 10
  xp: number;
  xpToNextLevel: number;
  trait: AgentTraitType;
  currentTask: string;
  outputPerSec: number;
  computeCost: number;
  reliability: number; // 0 to 100%
  quote: string;
  hiredAt: number;
  department: 'Product' | 'Growth' | 'Operations' | 'Executive';
  assignedManagerId?: string;
  isExecutive?: boolean;
  isCEO?: boolean;
}

export interface OrgNode {
  id: string;
  agentId?: string;
  title: string;
  role: AgentRoleType;
  department: 'Product' | 'Growth' | 'Operations' | 'Executive' | 'Founder';
  parentId?: string;
  childrenIds: string[];
  isUnlocked: boolean;
  unlockCost: number;
  bonusDescription: string;
}
