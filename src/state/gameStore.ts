import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameStage, ScreenTab, StartupIdea, ActivityLog, CustomerSegment, OfflineRecapData, HoldingCompanyStats, AutonomyInfo, CompanyState } from '../types/game';
import type { AgentInstance, AgentRoleType, AgentTraitType, AgentModelType, AgentExecutionTrace } from '../types/agents';
import type { ProductFeature, ArchitectureUpgrade } from '../types/product';
import type { Trend, GrowthCampaign } from '../types/growth';
import type { VCTermSheet } from '../types/finance';
import type { GameEvent } from '../types/events';
import type { MilestoneDef } from '../data/milestones';
import { INITIAL_PRODUCT_FEATURES, ARCHITECTURE_UPGRADES } from '../data/productFeatures';
import { INITIAL_TRENDS, INITIAL_GROWTH_CAMPAIGNS } from '../data/trends';
import { INITIAL_VC_OFFERS, COMPUTE_TIERS } from '../data/vcOffers';
import { AGENT_ROLES, AGENT_NAMES, AGENT_QUOTES } from '../data/agentRoles';
import { AGENT_TRAITS, getRandomTrait } from '../data/agentTraits';
import { soundEngine } from '../audio/soundEffects';

export interface GameState {
  // Conglomerate & Portfolio Multi-Company State
  activeCompanyId: string;
  companies: CompanyState[];
  conglomerateTreasury: number;

  // Active Company & Meta
  company: StartupIdea | null;
  stage: GameStage;
  activeTab: ScreenTab;
  gameSpeed: number;
  soundEnabled: boolean;
  totalPlayTimeSeconds: number;
  lastTickTime: number;

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
  employees: 1; // Permanent canonical constant

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
  growthCampaigns: GrowthCampaign[];
  customerSegments: CustomerSegment[];
  vcOffers: VCTermSheet[];
  activeEvents: GameEvent[];
  eventHistory: GameEvent[];
  unlockedMilestones: string[];
  activityLogs: ActivityLog[];
  holdingPortfolio: HoldingCompanyStats;

  // UI Modals
  isIdeaModalOpen: boolean;
  isOfflineModalOpen: boolean;
  offlineRecapData: OfflineRecapData | null;
  activeMilestoneCelebration: MilestoneDef | null;
  isUnicornModalOpen: boolean;
  hasSeenUnicorn: boolean;

  // Orchestration & Swarm Canvas
  selectedCanvasAgentId: string | null;
  agentTraces: AgentExecutionTrace[];
  tokenBurnPerHour: number;

  // Actions
  initCompany: (idea: StartupIdea) => void;
  setActiveTab: (tab: ScreenTab) => void;
  setGameSpeed: (speed: number) => void;
  toggleSound: () => void;
  addLog: (text: string, category: ActivityLog['category'], type?: ActivityLog['type']) => void;
  
  // Holding Company & Subsidiary Actions
  launchSubsidiary: (idea: StartupIdea, seedCash?: number, switchImmediately?: boolean) => void;
  switchActiveCompany: (companyId: string) => void;
  injectCapital: (targetCompanyId: string, amount: number) => boolean;
  syncActiveCompanyToPortfolio: () => void;

  // Founder Manual Actions
  vibeCodeManual: () => void;
  postManual: (trendId?: string, customContent?: string) => void;
  sellManual: () => void;
  supportManual: () => void;

  // Agents Management & Orchestrator
  hireAgent: (role: AgentRoleType, customTrait?: AgentTraitType, customName?: string) => boolean;
  upgradeAgent: (agentId: string) => boolean;
  fireAgent: (agentId: string) => void;
  setSelectedCanvasAgent: (agentId: string | null) => void;
  updateAgentModel: (agentId: string, model: AgentModelType) => void;
  updateAgentConfig: (agentId: string, updates: Partial<AgentInstance>) => void;
  patchAgentPrompt: (agentId: string, newInstruction: string) => void;
  addAgentExecutionTrace: (trace: AgentExecutionTrace) => void;
  
  // Product Roadmap & Tech Debt
  setActiveRoadmap: (featureId: string) => void;
  executeTechDebtRefactor: (debtReduced: number, bpCost: number, cashCost: number, name: string) => boolean;
  upgradeArchitecture: (archId: string) => boolean;

  // Growth & Trends
  setActiveTrend: (trendId: string | null) => void;
  toggleGrowthCampaign: (campaignId: string) => void;

  // Finance & VC
  upgradeComputeTier: (tierId: string) => boolean;
  acceptVcOffer: (offerId: string) => boolean;

  // Events & Inbox
  resolveEvent: (eventId: string, choiceId: string) => void;

  // Modals & Milestones
  closeMilestoneModal: () => void;
  closeOfflineModal: () => void;
  closeUnicornModal: () => void;
  startHoldingCompanyMode: () => void;
  resetGame: () => void;
}

export function calcBuildTarget(level: number): number {
  return Math.round(100 * Math.pow(1.12, Math.max(0, level - 1)));
}

export function calcAutonomyInfo(state: { agents: AgentInstance[]; valuation: number; stage?: GameStage }): AutonomyInfo {
  const { agents, valuation } = state;
  const hasCEO = agents.some(a => a.role === 'CEO');
  const hasExec = agents.some(a => a.role === 'EXECUTIVE');
  const hasManager = agents.some(a => a.role === 'MANAGER');
  const agentCount = agents.length;

  if (hasCEO && valuation >= 1000000000) {
    return {
      level: 5,
      percent: 100,
      title: 'L5: Fully Autonomous Unicorn',
      subtitle: '100% Self-Driving Enterprise',
      badgeClass: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/40 shadow-[0_0_12px_rgba(48,209,88,0.25)]',
      nextRequirement: '★ Peak Autonomy Achieved (Generates Conglomerate Dividends)',
      isMax: true
    };
  }

  if (hasExec && agentCount >= 30) {
    const valM = (valuation / 1000000).toFixed(1);
    return {
      level: 4,
      percent: 75,
      title: 'L4: Autonomous Startup',
      subtitle: 'C-Suite Orchestration & Cross-Functional Autonomy',
      badgeClass: 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30',
      nextRequirement: hasCEO
        ? `Reach $1B Valuation ($${valM}M / $1000M)`
        : `Appoint Autonomous CEO Agent & Reach $1B Valuation ($${valM}M / $1000M)`,
      isMax: false
    };
  }

  if (hasManager && agentCount >= 8) {
    return {
      level: 3,
      percent: 50,
      title: 'L3: Managed Operations',
      subtitle: 'Department Pods & Automated Triage',
      badgeClass: 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30',
      nextRequirement: hasExec
        ? `Scale workforce to 30+ agents (${agentCount}/30)`
        : `Scale to 30+ agents (${agentCount}/30) & Hire C-Suite Executive`,
      isMax: false
    };
  }

  if (agentCount >= 1) {
    return {
      level: 2,
      percent: 25,
      title: 'L2: Assisted Vibe Coder',
      subtitle: 'Specialist Agent Automation',
      badgeClass: 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30',
      nextRequirement: hasManager
        ? `Scale workforce to 8+ agents (${agentCount}/8)`
        : `Scale to 8+ agents (${agentCount}/8) & Hire Department Manager`,
      isMax: false
    };
  }

  return {
    level: 1,
    percent: 0,
    title: 'L1: Manual Founder',
    subtitle: 'Solo Founder In A Garage',
    badgeClass: 'bg-white/[0.08] text-white/70 border-white/[0.12]',
    nextRequirement: 'Hire your first Specialist Agent (Engineering or Growth)',
    isMax: false
  };
}

export function createCompanyInstance(idea: StartupIdea, initialCash = 2000, companyId?: string): CompanyState {
  const id = companyId || `comp_${idea.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  return {
    id,
    name: idea.name,
    idea,
    foundedAt: Date.now(),
    stage: 'MANUAL_FOUNDER',
    autonomyLevel: 1,

    cash: initialCash,
    customers: 0,
    arpu: idea.arpu,
    baseArpu: idea.arpu,
    mrr: 0,
    arr: 0,
    valuation: 0,
    lastValuation: 0,
    valuationMultiple: 4.0,
    founderOwnership: 100,
    totalCapitalRaised: 0,
    employees: 1 as const,

    focus: 10,
    maxFocus: 10,
    productLevel: 1,
    buildPoints: 0,
    buildPointsTarget: 100,
    attention: 0,
    leads: 0,
    tickets: 0,
    totalTicketsResolved: 0,
    trust: 60,
    techDebt: 5,
    hype: 0,
    computeUsed: 0,
    computeCapacity: 5,
    currentComputeTierId: 'comp_free',

    agents: [],
    unlockedAgentRoles: ['ENGINEERING', 'GROWTH'],
    roadmapFeatures: INITIAL_PRODUCT_FEATURES.map(f => ({ ...f, buildPointsCompleted: 0, isCompleted: false })),
    activeRoadmapId: 'feat_dark_mode',
    completedFeatures: [],
    architectureUpgrades: ARCHITECTURE_UPGRADES.map(a => ({ ...a, level: 0, isUnlocked: a.id === 'arch_cicd' })),
    trends: INITIAL_TRENDS,
    activeTrendId: 'trend_agents',
    growthCampaigns: INITIAL_GROWTH_CAMPAIGNS.map(c => ({ ...c })),
    customerSegments: [
      { id: 'smb', name: 'Solo / SMB', count: 0, arpu: idea.arpu, churnRate: 5.0, unlocked: true },
      { id: 'pro', name: 'Growth / Pro Teams', count: 0, arpu: Math.round(idea.arpu * 3), churnRate: 3.0, unlocked: false },
      { id: 'enterprise', name: 'Enterprise Whale', count: 0, arpu: Math.round(idea.arpu * 15), churnRate: 1.0, unlocked: false },
    ],
    vcOffers: INITIAL_VC_OFFERS.map(v => ({ ...v, isAccepted: false, isAvailable: false })),
    activeEvents: [],
    eventHistory: [],
    unlockedMilestones: [],
    activityLogs: [
      {
        id: `log_init_${Date.now()}`,
        text: `Founded "${idea.name}" — ${idea.tagline}. Seeded with $${initialCash.toLocaleString()}. Autonomy Level 1.`,
        category: 'system',
        timestamp: Date.now(),
        type: 'milestone'
      }
    ]
  };
}

export function extractActiveCompanyState(state: GameState): CompanyState | null {
  if (!state.company) return null;
  const autonomy = calcAutonomyInfo({ agents: state.agents, valuation: state.valuation, stage: state.stage });
  return {
    id: state.activeCompanyId || `comp_${state.company.id}`,
    name: state.company.name,
    idea: state.company,
    foundedAt: state.totalPlayTimeSeconds ? Date.now() - state.totalPlayTimeSeconds * 1000 : Date.now(),
    stage: state.stage,
    autonomyLevel: autonomy.level,

    cash: state.cash,
    customers: state.customers,
    arpu: state.arpu,
    baseArpu: state.baseArpu,
    mrr: state.mrr,
    arr: state.arr,
    valuation: state.valuation,
    lastValuation: state.lastValuation || 0,
    valuationMultiple: state.valuationMultiple,
    founderOwnership: state.founderOwnership,
    totalCapitalRaised: state.totalCapitalRaised,
    employees: 1 as const,

    focus: state.focus,
    maxFocus: state.maxFocus,
    productLevel: state.productLevel,
    buildPoints: state.buildPoints,
    buildPointsTarget: state.buildPointsTarget,
    attention: state.attention,
    leads: state.leads,
    tickets: state.tickets,
    totalTicketsResolved: state.totalTicketsResolved,
    trust: state.trust,
    techDebt: state.techDebt,
    hype: state.hype,
    computeUsed: state.computeUsed,
    computeCapacity: state.computeCapacity,
    currentComputeTierId: state.currentComputeTierId,

    agents: state.agents,
    unlockedAgentRoles: state.unlockedAgentRoles,
    roadmapFeatures: state.roadmapFeatures,
    activeRoadmapId: state.activeRoadmapId,
    completedFeatures: state.completedFeatures,
    architectureUpgrades: state.architectureUpgrades,
    trends: state.trends,
    activeTrendId: state.activeTrendId,
    growthCampaigns: state.growthCampaigns || INITIAL_GROWTH_CAMPAIGNS.map(c => ({ ...c })),
    customerSegments: state.customerSegments,
    vcOffers: state.vcOffers,
    activeEvents: state.activeEvents,
    eventHistory: state.eventHistory,
    unlockedMilestones: state.unlockedMilestones,
    activityLogs: state.activityLogs
  };
}

export function applyCompanyToActiveState(company: CompanyState): Partial<GameState> {
  return {
    activeCompanyId: company.id,
    company: company.idea,
    stage: company.stage,
    cash: company.cash,
    customers: company.customers,
    arpu: company.arpu,
    baseArpu: company.baseArpu,
    mrr: company.mrr,
    arr: company.arr,
    valuation: company.valuation,
    lastValuation: company.lastValuation || 0,
    valuationMultiple: company.valuationMultiple,
    founderOwnership: company.founderOwnership,
    totalCapitalRaised: company.totalCapitalRaised,
    focus: company.focus,
    maxFocus: company.maxFocus,
    productLevel: company.productLevel,
    buildPoints: company.buildPoints,
    buildPointsTarget: company.buildPointsTarget,
    attention: company.attention,
    leads: company.leads,
    tickets: company.tickets,
    totalTicketsResolved: company.totalTicketsResolved,
    trust: company.trust,
    techDebt: company.techDebt,
    hype: company.hype,
    computeUsed: company.computeUsed,
    computeCapacity: company.computeCapacity,
    currentComputeTierId: company.currentComputeTierId,
    agents: company.agents,
    unlockedAgentRoles: company.unlockedAgentRoles,
    roadmapFeatures: company.roadmapFeatures,
    activeRoadmapId: company.activeRoadmapId,
    completedFeatures: company.completedFeatures,
    architectureUpgrades: company.architectureUpgrades,
    trends: company.trends,
    activeTrendId: company.activeTrendId,
    growthCampaigns: company.growthCampaigns || INITIAL_GROWTH_CAMPAIGNS.map(c => ({ ...c })),
    customerSegments: company.customerSegments,
    vcOffers: company.vcOffers,
    activeEvents: company.activeEvents,
    eventHistory: company.eventHistory,
    unlockedMilestones: company.unlockedMilestones,
    activityLogs: company.activityLogs
  };
}

const FOUNDER_VIBE_LOGS = [
  'Prompted backend endpoint in 24 seconds. Skipped unit tests.',
  'Added OAuth login. DB migrations ran in production without backup.',
  'Refactored frontend state tree with pure vibes.',
  'Pushed 320 lines of code directly to main branch.',
  'Prompted agent to fix an edge-case. Agent generated 3 new microservices.',
  'Optimized CSS flexbox layout at 2:45 AM.'
];

export const getInitialState = () => ({
  activeCompanyId: 'comp_primary',
  companies: [] as CompanyState[],
  conglomerateTreasury: 0,

  company: null as StartupIdea | null,
  stage: 'MANUAL_FOUNDER' as GameStage,
  activeTab: 'command' as ScreenTab,
  gameSpeed: 1,
  soundEnabled: true,
  totalPlayTimeSeconds: 0,
  lastTickTime: Date.now(),

  cash: 2000,
  customers: 0,
  arpu: 25,
  baseArpu: 25,
  mrr: 0,
  arr: 0,
  valuation: 0,
  lastValuation: 0,
  valuationMultiple: 4.0,
  founderOwnership: 100,
  totalCapitalRaised: 0,
  employees: 1 as const,

  focus: 10,
  maxFocus: 10,
  productLevel: 1,
  buildPoints: 0,
  buildPointsTarget: 100,
  attention: 0,
  leads: 0,
  tickets: 0,
  totalTicketsResolved: 0,
  trust: 60,
  techDebt: 5,
  hype: 0,
  computeUsed: 0,
  computeCapacity: 5,
  currentComputeTierId: 'comp_free',

  agents: [] as AgentInstance[],
  unlockedAgentRoles: ['ENGINEERING', 'GROWTH'] as AgentRoleType[],
  roadmapFeatures: INITIAL_PRODUCT_FEATURES.map(f => ({ ...f, buildPointsCompleted: 0, isCompleted: false })),
  activeRoadmapId: 'feat_dark_mode',
  completedFeatures: [] as string[],
  architectureUpgrades: ARCHITECTURE_UPGRADES.map(a => ({ ...a, level: 0, isUnlocked: a.id === 'arch_cicd' })),
  trends: INITIAL_TRENDS,
  activeTrendId: 'trend_agents',
  growthCampaigns: INITIAL_GROWTH_CAMPAIGNS.map(c => ({ ...c })),
  customerSegments: [
    { id: 'smb', name: 'Solo / SMB', count: 0, arpu: 25, churnRate: 5.0, unlocked: true },
    { id: 'pro', name: 'Growth / Pro Teams', count: 0, arpu: 79, churnRate: 3.0, unlocked: false },
    { id: 'enterprise', name: 'Enterprise Whale', count: 0, arpu: 499, churnRate: 1.0, unlocked: false },
  ],
  vcOffers: INITIAL_VC_OFFERS.map(v => ({ ...v, isAccepted: false, isAvailable: false })),
  activeEvents: [] as GameEvent[],
  eventHistory: [] as GameEvent[],
  unlockedMilestones: [] as string[],
  activityLogs: [
    {
      id: 'log_init',
      text: 'Started company with 1 human founder and $2,000 cash. Employee count: 1.',
      category: 'system' as const,
      timestamp: Date.now(),
      type: 'milestone' as const
    }
  ],
  holdingPortfolio: {
    portfolioValuation: 0,
    totalCompanies: 1,
    totalAgents: 0,
    totalRevenue: 0,
    synergyLevel: 1,
    conglomerateTreasury: 0,
    totalDividendsEarned: 0
  },

  isIdeaModalOpen: true,
  isOfflineModalOpen: false,
  offlineRecapData: null,
  activeMilestoneCelebration: null,
  isUnicornModalOpen: false,
  hasSeenUnicorn: false,

  selectedCanvasAgentId: null,
  agentTraces: [],
  tokenBurnPerHour: 0
});


export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      initCompany: (idea: StartupIdea) => {
        const fresh = getInitialState();
        const primaryCompany = createCompanyInstance(idea, 2000, 'comp_primary');
        set({
          ...fresh,
          ...applyCompanyToActiveState(primaryCompany),
          companies: [primaryCompany],
          activeCompanyId: primaryCompany.id,
          isIdeaModalOpen: false,
          lastTickTime: Date.now(),
          activityLogs: [
            {
              id: `log_${Date.now()}`,
              text: `Founded "${idea.name}" — ${idea.tagline}. Target: $1B valuation with exactly 1 employee. Autonomy Level 1.`,
              category: 'system',
              timestamp: Date.now(),
              type: 'milestone'
            }
          ]
        });
        soundEngine.playDeploy();
      },

      setActiveTab: (tab: ScreenTab) => set({ activeTab: tab }),
      setGameSpeed: (speed: number) => set({ gameSpeed: speed }),
      toggleSound: () => {
        const next = !get().soundEnabled;
        soundEngine.enabled = next;
        set({ soundEnabled: next });
      },

      addLog: (text: string, category: ActivityLog['category'], type: ActivityLog['type'] = 'info') => {
        set((state) => ({
          activityLogs: [
            {
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              text,
              category,
              timestamp: Date.now(),
              type
            },
            ...state.activityLogs.slice(0, 49)
          ]
        }));
      },

      syncActiveCompanyToPortfolio: () => {
        const state = get();
        const currentActive = extractActiveCompanyState(state);
        if (!currentActive) return;

        let updatedCompanies = [...state.companies];
        const idx = updatedCompanies.findIndex(c => c.id === currentActive.id);
        if (idx >= 0) {
          updatedCompanies[idx] = currentActive;
        } else {
          updatedCompanies.push(currentActive);
        }
        set({ companies: updatedCompanies });
      },

      launchSubsidiary: (idea: StartupIdea, seedCash: number = 2000, switchImmediately: boolean = false) => {
        const state = get();
        // 1. Snapshot current active company into companies
        const currentActive = extractActiveCompanyState(state);
        let updatedCompanies = [...state.companies];
        if (currentActive) {
          const idx = updatedCompanies.findIndex(c => c.id === currentActive.id);
          if (idx >= 0) {
            updatedCompanies[idx] = currentActive;
          } else {
            updatedCompanies.push(currentActive);
          }
        }

        // 2. Validate and deduct seed cash
        const actualSeed = Math.max(2000, seedCash);
        let newCash = state.cash;
        let newTreasury = state.conglomerateTreasury || 0;
        
        if (actualSeed > 2000) {
          const deduction = actualSeed - 2000;
          if (newTreasury >= deduction) {
            newTreasury -= deduction;
          } else if (newCash >= deduction) {
            newCash -= deduction;
          }
        }

        // 3. Create new subsidiary at L1
        const newCompany = createCompanyInstance(idea, actualSeed);
        updatedCompanies.push(newCompany);

        soundEngine.playMilestone();

        const portfolioVal = updatedCompanies.reduce((acc, c) => acc + c.valuation, 0);
        const portfolioRev = updatedCompanies.reduce((acc, c) => acc + c.arr, 0);
        const totalAgents = updatedCompanies.reduce((acc, c) => acc + c.agents.length, 0);

        const updatedPortfolio: HoldingCompanyStats = {
          portfolioValuation: portfolioVal,
          totalCompanies: updatedCompanies.length,
          totalAgents,
          totalRevenue: portfolioRev,
          synergyLevel: Math.max(1, updatedCompanies.length),
          conglomerateTreasury: newTreasury,
          totalDividendsEarned: state.holdingPortfolio?.totalDividendsEarned || 0
        };

        if (switchImmediately) {
          set({
            ...applyCompanyToActiveState(newCompany),
            companies: updatedCompanies,
            conglomerateTreasury: newTreasury,
            holdingPortfolio: updatedPortfolio,
            activeTab: 'command'
          });
          get().addLog(`🚀 Switched operational command to new subsidiary "${idea.name}" at L1 Autonomy (Manual Founder).`, 'system', 'milestone');
        } else {
          set({
            cash: newCash,
            companies: updatedCompanies,
            conglomerateTreasury: newTreasury,
            holdingPortfolio: updatedPortfolio
          });
          get().addLog(`🚀 Founded new subsidiary "${idea.name}" with $${actualSeed.toLocaleString()} seed capital. Starting at L1 Autonomy.`, 'system', 'milestone');
        }
      },

      switchActiveCompany: (companyId: string) => {
        const state = get();
        if (state.activeCompanyId === companyId) return;

        // Snapshot current active
        const currentActive = extractActiveCompanyState(state);
        let updatedCompanies = [...state.companies];
        if (currentActive) {
          const idx = updatedCompanies.findIndex(c => c.id === currentActive.id);
          if (idx >= 0) {
            updatedCompanies[idx] = currentActive;
          } else {
            updatedCompanies.push(currentActive);
          }
        }

        const target = updatedCompanies.find(c => c.id === companyId);
        if (!target) return;

        soundEngine.playClick();
        const autonomy = calcAutonomyInfo(target);

        set({
          ...applyCompanyToActiveState(target),
          companies: updatedCompanies,
          activeTab: 'command'
        });

        get().addLog(`🎮 Assumed operational command of "${target.name}". Autonomy: ${autonomy.title} (${autonomy.percent}%).`, 'system', 'info');
      },

      injectCapital: (targetCompanyId: string, amount: number) => {
        const state = get();
        if (amount <= 0) return false;

        const totalAvailable = state.cash + (state.conglomerateTreasury || 0);
        if (totalAvailable < amount) {
          get().addLog(`Insufficient funds to wire $${amount.toLocaleString()}.`, 'finance', 'warning');
          return false;
        }

        let updatedActiveCash = state.cash;
        let updatedTreasury = state.conglomerateTreasury || 0;

        if (updatedActiveCash >= amount) {
          updatedActiveCash -= amount;
        } else {
          const remainder = amount - updatedActiveCash;
          updatedActiveCash = 0;
          updatedTreasury = Math.max(0, updatedTreasury - remainder);
        }

        const updatedCompanies = state.companies.map(c => {
          if (c.id === targetCompanyId) {
            return { ...c, cash: c.cash + amount };
          }
          return c;
        });

        soundEngine.playCash();
        const targetComp = updatedCompanies.find(c => c.id === targetCompanyId);

        set({
          cash: updatedActiveCash,
          conglomerateTreasury: updatedTreasury,
          companies: updatedCompanies
        });

        get().addLog(`💸 Transferred $${amount.toLocaleString()} capital into subsidiary "${targetComp?.name}".`, 'finance', 'success');
        return true;
      },

      vibeCodeManual: () => {
        const state = get();
        if (state.focus < 1) return;

        soundEngine.playClick();
        const bpAdded = state.productLevel >= 4 ? 10 : 15;
        const newBP = state.buildPoints + bpAdded;
        const newDebt = Math.min(100, state.techDebt + 2.0);

        let updatedFeatures = [...state.roadmapFeatures];
        let newlyCompletedFeatureName = '';
        let arpuBoostTotal = 0;
        let trustBoostTotal = 0;
        let hypeBoostTotal = 0;

        if (state.activeRoadmapId) {
          updatedFeatures = updatedFeatures.map(feat => {
            if (feat.id === state.activeRoadmapId && !feat.isCompleted) {
              const updatedDone = feat.buildPointsCompleted + bpAdded;
              if (updatedDone >= feat.buildPointsRequired) {
                newlyCompletedFeatureName = feat.name;
                arpuBoostTotal += (feat.effects.arpuBoost || 0);
                trustBoostTotal += (feat.effects.trustBoost || 0);
                hypeBoostTotal += (feat.effects.hypeBoost || 0);
                return { ...feat, buildPointsCompleted: feat.buildPointsRequired, isCompleted: true };
              }
              return { ...feat, buildPointsCompleted: updatedDone };
            }
            return feat;
          });
        }

        let newLevel = state.productLevel;
        let newTarget = state.buildPointsTarget;
        let currBP = newBP;
        let didLevelUp = false;

        if (currBP >= state.buildPointsTarget) {
          didLevelUp = true;
          currBP -= state.buildPointsTarget;
          newLevel += 1;
          newTarget = calcBuildTarget(newLevel);
        }

        const newArpu = state.arpu + arpuBoostTotal;
        const newMrr = Math.round(state.customers * newArpu);
        const newArr = newMrr * 12;
        const newValuation = Math.max(state.lastValuation || 0, Math.round(newArr * state.valuationMultiple));

        const quote = FOUNDER_VIBE_LOGS[Math.floor(Math.random() * FOUNDER_VIBE_LOGS.length)];

        set({
          focus: state.focus - 1,
          buildPoints: currBP,
          productLevel: newLevel,
          buildPointsTarget: newTarget,
          techDebt: Number(newDebt.toFixed(1)),
          roadmapFeatures: updatedFeatures,
          arpu: newArpu,
          mrr: newMrr,
          arr: newArr,
          valuation: newValuation,
          trust: Math.min(100, state.trust + trustBoostTotal),
          hype: Math.min(100, state.hype + hypeBoostTotal)
        });

        if (newlyCompletedFeatureName) {
          soundEngine.playDeploy();
          get().addLog(`🚀 Shipped Feature: "${newlyCompletedFeatureName}"!`, 'product', 'success');
        }

        if (didLevelUp) {
          soundEngine.playDeploy();
          get().addLog(`🎉 Product reached Level ${newLevel}! Conversion & retention boosted.`, 'product', 'success');
        } else if (!newlyCompletedFeatureName) {
          get().addLog(`Founder vibe coded: +${bpAdded} Build Points (+2.0% Tech Debt). "${quote}"`, 'founder', 'info');
        }
      },

      postManual: (trendId?: string, customContent?: string) => {
        const state = get();
        if (state.focus < 1) return;

        soundEngine.playClick();
        let multiplier = 1.0;
        let trendName = 'Organic Social';

        const activeTrend = state.trends.find(t => t.id === (trendId || state.activeTrendId));
        if (activeTrend) {
          multiplier = activeTrend.viralMultiplier * (1 + activeTrend.strength / 100);
          trendName = activeTrend.name;
        }

        const hypeBonus = 1 + (state.hype / 100) * 0.5;
        const saturationFactor = 1 + (state.attention / 300) + (state.customers / 20);
        const baseAtt = (150 * multiplier * hypeBonus) / saturationFactor;
        const attAdded = Math.max(12, Math.round(baseAtt));
        const directLeadsGenerated = Math.max(1, Math.floor(attAdded / 80));

        set({
          focus: state.focus - 1,
          attention: state.attention + attAdded,
          leads: state.leads + directLeadsGenerated,
          hype: Math.min(100, state.hype + 1)
        });

        const text = customContent 
          ? `Founder posted: "${customContent.substring(0, 55)}..." (+${attAdded} Attention, +${directLeadsGenerated} Leads)`
          : `Founder posted on #${trendName}: +${attAdded} Attention & +${directLeadsGenerated} Leads generated.`;
        
        get().addLog(text, 'founder', 'info');
      },

      sellManual: () => {
        const state = get();
        if (state.focus < 1) return;
        if (state.leads < 1 && state.attention < 50) {
          get().addLog('No leads in pipeline! Publish content or hire Growth Agents to generate Attention and Leads.', 'founder', 'warning');
          return;
        }

        soundEngine.playClick();
        let currentLeads = state.leads;
        let currentAttention = state.attention;

        if (currentLeads < 1 && currentAttention >= 50) {
          const leadsFromAtt = Math.floor(currentAttention / 50);
          currentLeads += leadsFromAtt;
          currentAttention = currentAttention % 50;
        }

        const leadsToProcess = 1;
        currentLeads = Math.max(0, currentLeads - leadsToProcess);

        const scaleFriction = 1 + (state.customers / 12);
        const baseRate = 0.25 / scaleFriction;
        const trustMult = Math.max(0.1, state.trust / 60);
        const prodMult = 1 + (state.productLevel - 1) * 0.05;

        let featBoost = 1.0;
        state.roadmapFeatures.filter(f => f.isCompleted).forEach(f => {
          if (f.effects.conversionBoost) featBoost += f.effects.conversionBoost;
        });

        const conversionRate = Math.min(0.60, Math.max(0.01, baseRate * trustMult * prodMult * featBoost));
        const didConvert = Math.random() < conversionRate;
        const newCustomers = didConvert ? 1 : 0;

        const updatedCustomers = state.customers + newCustomers;
        const newMrr = Math.round(updatedCustomers * state.arpu);
        const newArr = newMrr * 12;
        const newValuation = Math.max(state.lastValuation || 0, Math.round(newArr * state.valuationMultiple));

        set({
          focus: state.focus - 1,
          leads: currentLeads,
          attention: currentAttention,
          customers: updatedCustomers,
          mrr: newMrr,
          arr: newArr,
          valuation: newValuation
        });

        if (newCustomers > 0) {
          soundEngine.playCash();
          get().addLog(`Founder closed 1 new customer! Total: ${updatedCustomers} ($${newMrr.toLocaleString()} MRR)`, 'founder', 'success');
        } else {
          if (state.customers >= 15) {
            get().addLog(`Prospect rejected founder pitch: Requested SOC2 compliance and a dedicated account executive. Hire Sales Agents to close at scale.`, 'founder', 'warning');
          } else {
            get().addLog(`Founder pitched 1 lead. Prospect asked for more case studies and pricing discount.`, 'founder', 'info');
          }
        }
      },

      supportManual: () => {
        const state = get();
        if (state.focus < 1) return;
        if (state.tickets <= 0) {
          get().addLog('Support inbox zero! No open tickets.', 'founder', 'info');
          return;
        }

        soundEngine.playTicketResolved();
        const resolved = Math.min(2, state.tickets);
        const newTickets = Math.max(0, state.tickets - resolved);
        const newTrust = Math.min(100, state.trust + 0.5);

        set({
          focus: state.focus - 1,
          tickets: newTickets,
          totalTicketsResolved: state.totalTicketsResolved + resolved,
          trust: newTrust
        });

        get().addLog(`Founder personally resolved ${resolved} support ticket(s). Trust restored to ${newTrust.toFixed(1)}%.`, 'founder', 'info');
      },

      hireAgent: (role: AgentRoleType, customTrait?: AgentTraitType, customName?: string) => {
        const state = get();
        const roleDef = AGENT_ROLES[role];
        if (!roleDef) return false;

        if (state.cash < roleDef.hireCost) {
          get().addLog(`Insufficient funds to hire ${roleDef.title} (Requires $${roleDef.hireCost}).`, 'system', 'error');
          return false;
        }

        const trait = customTrait || getRandomTrait();
        const name = customName || AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
        const roleQuotes = AGENT_QUOTES[role] || ['"Ready to execute."'];
        const quote = roleQuotes[Math.floor(Math.random() * roleQuotes.length)];

        const traitDef = AGENT_TRAITS[trait];
        const outputMult = traitDef.effects.outputMultiplier || 1.0;
        const computeMult = traitDef.effects.computeMultiplier || 1.0;

        const newAgent: AgentInstance = {
          id: `agent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name,
          role,
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          trait,
          currentTask: 'Autonomous Execution',
          outputPerSec: roleDef.baseOutputValue * outputMult,
          computeCost: roleDef.baseComputeCost * computeMult,
          reliability: 95,
          quote,
          hiredAt: Date.now(),
          department: roleDef.department,
          isExecutive: role === 'EXECUTIVE',
          isCEO: role === 'CEO',
          model: roleDef.defaultModel || 'CLAUDE_3_7_SONNET',
          temperature: 0.7,
          systemPrompt: `You are an autonomous ${roleDef.title} at a 1-person billion dollar AI startup. Maximize throughput, execute assigned workflows with high reliability, and preserve trust.`,
          enabledTools: roleDef.defaultTools || ['github', 'browser'],
          tokensConsumedTotal: 0,
          hallucinationRisk: 5
        };

        const updatedAgents = [...state.agents, newAgent];
        const updatedCash = state.cash - roleDef.hireCost;

        let newStage = state.stage;
        if (state.stage !== 'HOLDING_COMPANY' && state.stage !== 'ONE_PERSON_UNICORN') {
          if (updatedAgents.length >= 30 && updatedAgents.some(a => a.role === 'EXECUTIVE')) {
            newStage = 'AUTONOMOUS_STARTUP';
          } else if (updatedAgents.length >= 8 && updatedAgents.some(a => a.role === 'MANAGER')) {
            newStage = 'AGENT_MANAGER';
          } else if (updatedAgents.length >= 1) {
            newStage = 'VIBE_CODER';
          }
        }

        const unlockedRoles = new Set(state.unlockedAgentRoles);
        unlockedRoles.add(role);
        if (updatedAgents.length >= 1) unlockedRoles.add('SALES');
        if (updatedAgents.length >= 2) unlockedRoles.add('SUPPORT');
        if (updatedAgents.length >= 3) unlockedRoles.add('QA');
        if (updatedAgents.length >= 4) unlockedRoles.add('OPERATIONS');
        if (updatedAgents.length >= 8) unlockedRoles.add('MANAGER');
        if (updatedAgents.length >= 15) unlockedRoles.add('EXECUTIVE');
        if (state.mrr >= 83333) unlockedRoles.add('CEO');

        soundEngine.playDeploy();
        set({
          cash: updatedCash,
          agents: updatedAgents,
          stage: newStage,
          unlockedAgentRoles: Array.from(unlockedRoles)
        });

        get().addLog(`🤖 Hired ${roleDef.title} "${name}" [${traitDef.name}] (${newAgent.model}). ${quote}`, 'agent', 'success');
        return true;
      },

      upgradeAgent: (agentId: string) => {
        const state = get();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent || agent.level >= 10) return false;

        const upgradeCost = Math.round(AGENT_ROLES[agent.role].hireCost * 0.75 * Math.pow(1.3, agent.level));
        if (state.cash < upgradeCost) {
          get().addLog(`Need $${upgradeCost} to upgrade ${agent.name}.`, 'system', 'warning');
          return false;
        }

        const nextLevel = agent.level + 1;
        const nextOutput = agent.outputPerSec * 1.15;
        const nextCompute = agent.computeCost * 1.05;

        const updatedAgents = state.agents.map(a => 
          a.id === agentId 
            ? { ...a, level: nextLevel, outputPerSec: nextOutput, computeCost: nextCompute, xp: 0, xpToNextLevel: Math.round(a.xpToNextLevel * 1.4) }
            : a
        );

        soundEngine.playDeploy();
        set({
          cash: state.cash - upgradeCost,
          agents: updatedAgents
        });

        get().addLog(`⚡ Upgraded ${agent.name} to Level ${nextLevel}! Output increased by +15%.`, 'agent', 'info');
        return true;
      },

      fireAgent: (agentId: string) => {
        const state = get();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        set({
          agents: state.agents.filter(a => a.id !== agentId),
          selectedCanvasAgentId: state.selectedCanvasAgentId === agentId ? null : state.selectedCanvasAgentId
        });
        get().addLog(`Terminated ${agent.name}'s API token. Employee count remains exactly 1.`, 'agent', 'warning');
      },

      setSelectedCanvasAgent: (agentId: string | null) => set({ selectedCanvasAgentId: agentId }),

      updateAgentModel: (agentId: string, model: AgentModelType) => {
        const state = get();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        set({
          agents: state.agents.map(a => a.id === agentId ? { ...a, model } : a)
        });
        soundEngine.playClick();
        get().addLog(`Switched ${agent.name} engine to ${model}.`, 'agent', 'info');
      },

      updateAgentConfig: (agentId: string, updates: Partial<AgentInstance>) => {
        set((state) => ({
          agents: state.agents.map(a => a.id === agentId ? { ...a, ...updates } : a)
        }));
      },

      patchAgentPrompt: (agentId: string, newInstruction: string) => {
        const state = get();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        set({
          agents: state.agents.map(a => a.id === agentId ? {
            ...a,
            systemPrompt: newInstruction,
            hallucinationRisk: Math.max(2, a.hallucinationRisk - 15)
          } : a)
        });
        soundEngine.playDeploy();
        get().addLog(`🛡️ Guardrail patched for ${agent.name}. Hallucination risk mitigated.`, 'agent', 'success');
      },

      addAgentExecutionTrace: (trace: AgentExecutionTrace) => {
        set((state) => ({
          agentTraces: [trace, ...state.agentTraces.slice(0, 49)]
        }));
      },

      setActiveRoadmap: (featureId: string) => {
        set({ activeRoadmapId: featureId });
        const feature = get().roadmapFeatures.find(f => f.id === featureId);
        if (feature) {
          get().addLog(`Engineering focus assigned to: "${feature.name}".`, 'product', 'info');
        }
      },

      executeTechDebtRefactor: (debtReduced: number, bpCost: number, cashCost: number, name: string) => {
        const state = get();
        if (state.cash < cashCost) {
          get().addLog(`Insufficient cash for ${name} (Requires $${cashCost}).`, 'product', 'warning');
          return false;
        }
        if (state.buildPoints < bpCost) {
          get().addLog(`Insufficient Build Points for ${name} (Requires ${bpCost} BP).`, 'product', 'warning');
          return false;
        }

        soundEngine.playTicketResolved();
        const newDebt = Math.max(0, state.techDebt - debtReduced);
        const newTrust = Math.min(100, state.trust + 2);

        set({
          cash: state.cash - cashCost,
          buildPoints: state.buildPoints - bpCost,
          techDebt: newDebt,
          trust: newTrust
        });

        get().addLog(`🧹 Refactoring complete: ${name}. Tech Debt reduced by -${debtReduced}%.`, 'product', 'success');
        return true;
      },

      upgradeArchitecture: (archId: string) => {
        const state = get();
        const arch = state.architectureUpgrades.find(a => a.id === archId);
        if (!arch || arch.level >= arch.maxLevel) return false;

        const cost = Math.round(arch.cost * Math.pow(1.5, arch.level));
        if (state.cash < cost) {
          get().addLog(`Need $${cost} to upgrade ${arch.name}.`, 'product', 'warning');
          return false;
        }

        soundEngine.playDeploy();
        const updated = state.architectureUpgrades.map(a => 
          a.id === archId ? { ...a, level: a.level + 1, isUnlocked: true } : a
        );

        set({
          cash: state.cash - cost,
          architectureUpgrades: updated,
          trust: Math.min(100, state.trust + 3)
        });

        get().addLog(`🏗️ Upgraded ${arch.name} to Level ${arch.level + 1}.`, 'product', 'success');
        return true;
      },

      setActiveTrend: (trendId: string | null) => set({ activeTrendId: trendId }),

      toggleGrowthCampaign: (campaignId: string) => {
        const state = get();
        const camp = (state.growthCampaigns || []).find(c => c.id === campaignId);
        if (!camp) return;

        if (!camp.isUnlocked && state.mrr < camp.requiredMrr) {
          get().addLog(`Campaign requires $${camp.requiredMrr.toLocaleString()} MRR to unlock.`, 'growth', 'warning');
          return;
        }

        const nextActive = !camp.isActive;
        const updated = (state.growthCampaigns || []).map(c => 
          c.id === campaignId ? { ...c, isActive: nextActive, isUnlocked: true } : c
        );

        soundEngine.playDeploy();
        set({ growthCampaigns: updated });
        get().addLog(`${nextActive ? '🚀 Launched' : '⏸️ Paused'} Growth Channel: "${camp.name}" ($${camp.monthlyCost}/mo).`, 'growth', 'info');
      },

      upgradeComputeTier: (tierId: string) => {
        const state = get();
        const tier = COMPUTE_TIERS.find(t => t.id === tierId);
        if (!tier) return false;

        if (state.cash < tier.setupCost) {
          get().addLog(`Need $${tier.setupCost} setup fee for ${tier.name}.`, 'finance', 'warning');
          return false;
        }

        soundEngine.playDeploy();
        set({
          cash: state.cash - tier.setupCost,
          computeCapacity: tier.capacityCU,
          currentComputeTierId: tier.id,
          trust: Math.min(100, state.trust + 2)
        });

        get().addLog(`🖥️ Upgraded Compute Infrastructure to "${tier.name}" (${tier.capacityCU} CU capacity).`, 'finance', 'success');
        return true;
      },

      acceptVcOffer: (offerId: string) => {
        const state = get();
        const offer = state.vcOffers.find(o => o.id === offerId);
        if (!offer || offer.isAccepted) return false;

        if (state.mrr < offer.requiredMrr) {
          get().addLog(`Offer requires $${offer.requiredMrr.toLocaleString()} MRR.`, 'finance', 'warning');
          return false;
        }
        if (state.trust < offer.requiredTrust) {
          get().addLog(`Offer requires ${offer.requiredTrust}% Trust. Resolve support tickets and reduce debt.`, 'finance', 'warning');
          return false;
        }
        if (offer.requiredAgents && state.agents.length < offer.requiredAgents) {
          get().addLog(`VC requires at least ${offer.requiredAgents} active autonomous agents. (Current: ${state.agents.length})`, 'finance', 'warning');
          return false;
        }
        if (offer.requiredProductLevel && state.productLevel < offer.requiredProductLevel) {
          get().addLog(`VC requires Product Level ${offer.requiredProductLevel}+. (Current: Level ${state.productLevel})`, 'finance', 'warning');
          return false;
        }
        if (offer.requiresManager && !state.agents.some(a => a.role === 'MANAGER')) {
          get().addLog(`VC requires at least 1 Department Manager Agent to lead operations.`, 'finance', 'warning');
          return false;
        }
        if (offer.requiresExecutive && !state.agents.some(a => a.role === 'EXECUTIVE')) {
          get().addLog(`VC requires at least 1 C-Suite Executive Agent.`, 'finance', 'warning');
          return false;
        }
        if (offer.requiresCEO && !state.agents.some(a => a.role === 'CEO')) {
          get().addLog(`VC requires an appointed Autonomous CEO Agent.`, 'finance', 'warning');
          return false;
        }

        soundEngine.playMilestone();
        const newOwnership = Math.max(0.1, state.founderOwnership * (1 - offer.dilutionPercent / 100));
        const newCash = state.cash + offer.raiseAmount;
        const newTotalRaised = state.totalCapitalRaised + offer.raiseAmount;
        const newHype = Math.min(100, state.hype + offer.hypeBoost);
        const newLastValuation = Math.max(state.lastValuation || 0, offer.valuation);
        const newValuation = Math.max(state.valuation, offer.valuation);

        const updatedOffers = state.vcOffers.map(o => 
          o.id === offerId ? { ...o, isAccepted: true, isAvailable: false } : o
        );

        set({
          cash: newCash,
          founderOwnership: newOwnership,
          totalCapitalRaised: newTotalRaised,
          hype: newHype,
          lastValuation: newLastValuation,
          valuation: newValuation,
          vcOffers: updatedOffers
        });

        get().addLog(`🤝 Closed ${offer.roundStage} Term Sheet! Raised $${offer.raiseAmount.toLocaleString()} from ${offer.firmName} at $${offer.valuation.toLocaleString()} valuation. Founder stake: ${newOwnership.toFixed(1)}%`, 'finance', 'milestone');
        return true;
      },

      resolveEvent: (eventId: string, choiceId: string) => {
        const state = get();
        const event = state.activeEvents.find(e => e.id === eventId);
        if (!event) return;

        const choice = event.choices.find(c => c.id === choiceId);
        if (!choice) return;

        soundEngine.playClick();
        const eff = choice.effects;

        const newCash = state.cash + (eff.cashDelta || 0);
        const newTrust = Math.max(0, Math.min(100, state.trust + (eff.trustDelta || 0)));
        const newHype = Math.max(0, Math.min(100, state.hype + (eff.hypeDelta || 0)));
        const newTechDebt = Math.max(0, Math.min(100, state.techDebt + (eff.techDebtDelta || 0)));
        const newCustomers = Math.max(0, state.customers + (eff.customersDelta || 0));
        const newAttention = Math.max(0, state.attention + (eff.attentionDelta || 0));
        const newLeads = Math.max(0, state.leads + (eff.leadsDelta || 0));
        const newTickets = Math.max(0, state.tickets + (eff.ticketsDelta || 0));
        const newBP = state.buildPoints + (eff.productPointsDelta || 0);
        const newOwnership = Math.max(0.1, Math.min(100, state.founderOwnership + (eff.ownershipDelta || 0)));
        const newMrr = Math.round(newCustomers * state.arpu);
        const newArr = newMrr * 12;
        const newValuation = Math.max(state.lastValuation || 0, Math.round(newArr * state.valuationMultiple));

        const updatedActive = state.activeEvents.filter(e => e.id !== eventId);
        const resolvedEvent: GameEvent = {
          ...event,
          isResolved: true,
          resolvedChoiceId: choiceId
        };

        set({
          cash: newCash,
          trust: newTrust,
          hype: newHype,
          techDebt: newTechDebt,
          customers: newCustomers,
          founderOwnership: Number(newOwnership.toFixed(1)),
          mrr: newMrr,
          arr: newArr,
          valuation: newValuation,
          attention: newAttention,
          leads: newLeads,
          tickets: newTickets,
          buildPoints: newBP,
          activeEvents: updatedActive,
          eventHistory: [resolvedEvent, ...state.eventHistory]
        });

        get().addLog(`Decision made on "${event.title}": ${choice.flavorOutcome}`, 'incident', 'info');
      },

      closeMilestoneModal: () => set({ activeMilestoneCelebration: null }),
      closeOfflineModal: () => set({ isOfflineModalOpen: false, offlineRecapData: null }),
      closeUnicornModal: () => set({ isUnicornModalOpen: false, hasSeenUnicorn: true }),

      startHoldingCompanyMode: () => {
        const state = get();
        soundEngine.playUnicornVictory();

        // Snapshot current active into companies
        const currentActive = extractActiveCompanyState(state);
        let updatedCompanies = [...state.companies];
        if (currentActive) {
          const idx = updatedCompanies.findIndex(c => c.id === currentActive.id);
          if (idx >= 0) {
            updatedCompanies[idx] = currentActive;
          } else {
            updatedCompanies.push(currentActive);
          }
        }

        const portfolioVal = updatedCompanies.reduce((acc, c) => acc + c.valuation, 0);
        const portfolioRev = updatedCompanies.reduce((acc, c) => acc + c.arr, 0);
        const totalAgents = updatedCompanies.reduce((acc, c) => acc + c.agents.length, 0);

        set({
          stage: 'HOLDING_COMPANY',
          isUnicornModalOpen: false,
          hasSeenUnicorn: true,
          activeTab: 'holding',
          companies: updatedCompanies,
          holdingPortfolio: {
            portfolioValuation: portfolioVal,
            totalCompanies: updatedCompanies.length,
            totalAgents,
            totalRevenue: portfolioRev,
            synergyLevel: Math.max(1, updatedCompanies.length),
            conglomerateTreasury: state.conglomerateTreasury || 0,
            totalDividendsEarned: state.holdingPortfolio?.totalDividendsEarned || 0
          }
        });
        get().addLog('🏢 Holding Company Mode Activated. The autonomous conglomerate expands.', 'system', 'milestone');
      },

      resetGame: () => {
        try {
          useGameStore.persist.clearStorage();
        } catch {}
        try {
          localStorage.removeItem('zero-employees-game-store');
          localStorage.clear();
        } catch {}
        set(getInitialState());
      }
    }),
    {
      name: 'zero-employees-game-store',
      partialize: (state) => ({
        activeCompanyId: state.activeCompanyId,
        companies: state.companies,
        conglomerateTreasury: state.conglomerateTreasury,
        company: state.company,
        isIdeaModalOpen: state.isIdeaModalOpen,
        stage: state.stage,
        activeTab: state.activeTab,
        cash: state.cash,
        customers: state.customers,
        arpu: state.arpu,
        baseArpu: state.baseArpu,
        mrr: state.mrr,
        arr: state.arr,
        valuation: state.valuation,
        lastValuation: state.lastValuation,
        valuationMultiple: state.valuationMultiple,
        founderOwnership: state.founderOwnership,
        totalCapitalRaised: state.totalCapitalRaised,
        focus: state.focus,
        maxFocus: state.maxFocus,
        productLevel: state.productLevel,
        buildPoints: state.buildPoints,
        buildPointsTarget: state.buildPointsTarget,
        attention: state.attention,
        leads: state.leads,
        tickets: state.tickets,
        totalTicketsResolved: state.totalTicketsResolved,
        trust: state.trust,
        techDebt: state.techDebt,
        hype: state.hype,
        computeUsed: state.computeUsed,
        computeCapacity: state.computeCapacity,
        currentComputeTierId: state.currentComputeTierId,
        agents: state.agents,
        unlockedAgentRoles: state.unlockedAgentRoles,
        roadmapFeatures: state.roadmapFeatures,
        activeRoadmapId: state.activeRoadmapId,
        completedFeatures: state.completedFeatures,
        architectureUpgrades: state.architectureUpgrades,
        trends: state.trends,
        activeTrendId: state.activeTrendId,
        growthCampaigns: state.growthCampaigns,
        customerSegments: state.customerSegments,
        vcOffers: state.vcOffers,
        eventHistory: state.eventHistory,
        unlockedMilestones: state.unlockedMilestones,
        holdingPortfolio: state.holdingPortfolio,
        hasSeenUnicorn: state.hasSeenUnicorn,
        totalPlayTimeSeconds: state.totalPlayTimeSeconds,
        lastTickTime: state.lastTickTime
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Migration: If companies array is empty but company exists, wrap into companies
        if (state.company && (!state.companies || state.companies.length === 0)) {
          const snapshot = extractActiveCompanyState(state as GameState);
          if (snapshot) {
            state.companies = [snapshot];
            state.activeCompanyId = snapshot.id;
          }
        }
      }
    }
  )
);
