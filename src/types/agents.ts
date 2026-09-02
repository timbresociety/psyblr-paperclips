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

export type AgentModelType = 
  | 'CLAUDE_3_7_SONNET'
  | 'DEEPSEEK_R1'
  | 'GPT_5_TURBO'
  | 'GEMINI_2_5_FLASH';

export type AgentToolType = 'github' | 'browser' | 'stripe' | 'postiz' | 'supabase' | 'email';

export interface ModelDefinition {
  id: AgentModelType;
  name: string;
  provider: 'Anthropic' | 'DeepSeek' | 'OpenAI' | 'Google';
  intelligenceRating: number; // 1-100
  speedRating: number; // 1-100
  costPerMillionTokens: number; // in $
  description: string;
  recommendedRoles: AgentRoleType[];
  tag: string;
}

export const AI_MODELS: Record<AgentModelType, ModelDefinition> = {
  CLAUDE_3_7_SONNET: {
    id: 'CLAUDE_3_7_SONNET',
    name: 'Claude 3.7 Sonnet (Hybrid Reasoning)',
    provider: 'Anthropic',
    intelligenceRating: 98,
    speedRating: 88,
    costPerMillionTokens: 3.0,
    description: 'Premier coding and complex multi-step orchestration engine with hybrid thinking tokens.',
    recommendedRoles: ['ENGINEERING', 'MANAGER', 'CEO', 'EXECUTIVE'],
    tag: 'SOTA CODING'
  },
  DEEPSEEK_R1: {
    id: 'DEEPSEEK_R1',
    name: 'DeepSeek R1 (Open Reasoning)',
    provider: 'DeepSeek',
    intelligenceRating: 96,
    speedRating: 82,
    costPerMillionTokens: 0.55,
    description: 'Extreme cost efficiency with deep mathematical and strategic enterprise negotiation reasoning.',
    recommendedRoles: ['SALES', 'EXECUTIVE', 'QA'],
    tag: 'MAX REASONING / $'
  },
  GPT_5_TURBO: {
    id: 'GPT_5_TURBO',
    name: 'GPT-5 Turbo (Multi-Tool Router)',
    provider: 'OpenAI',
    intelligenceRating: 95,
    speedRating: 94,
    costPerMillionTokens: 2.5,
    description: 'Fast function calling and robust multi-modal tool execution across web & APIs.',
    recommendedRoles: ['OPERATIONS', 'SALES', 'ENGINEERING'],
    tag: 'FAST TOOLS'
  },
  GEMINI_2_5_FLASH: {
    id: 'GEMINI_2_5_FLASH',
    name: 'Gemini 2.5 Flash (1M Context / Realtime)',
    provider: 'Google',
    intelligenceRating: 92,
    speedRating: 99,
    costPerMillionTokens: 0.15,
    description: 'Ultra-high throughput & massive 1M context window. Perfect for 24/7 social trend scraping & support triage.',
    recommendedRoles: ['GROWTH', 'SUPPORT', 'QA'],
    tag: 'HYPERSPEED'
  }
};

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
  defaultModel: AgentModelType;
  defaultTools: AgentToolType[];
}

export interface AgentExecutionTrace {
  id: string;
  agentId: string;
  agentName: string;
  role: AgentRoleType;
  model: AgentModelType;
  thought: string;
  toolCall?: {
    tool: AgentToolType;
    args: string;
    result: string;
  };
  tokensUsed: number;
  durationMs: number;
  timestamp: number;
  status: 'success' | 'running' | 'warning' | 'hallucinating';
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

  // Advanced AI Orchestration specs
  model: AgentModelType;
  temperature: number;
  systemPrompt: string;
  enabledTools: AgentToolType[];
  tokensConsumedTotal: number;
  hallucinationRisk: number; // 0 to 100
  recentTraces?: AgentExecutionTrace[];
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
