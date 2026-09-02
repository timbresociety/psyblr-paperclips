import type { AgentTraitDefinition, AgentTraitType } from '../types/agents';

export const AGENT_TRAITS: Record<AgentTraitType, AgentTraitDefinition> = {
  COWBOY: {
    id: 'COWBOY',
    name: 'Cowboy Coder',
    description: '+30% Output, +35% Tech Debt generation',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    effects: {
      outputMultiplier: 1.30,
      techDebtMultiplier: 1.35
    }
  },
  PERFECTIONIST: {
    id: 'PERFECTIONIST',
    name: 'Perfectionist',
    description: '-20% Output, -50% Tech Debt generation',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    effects: {
      outputMultiplier: 0.80,
      techDebtMultiplier: 0.50
    }
  },
  CHRONICALLY_ONLINE: {
    id: 'CHRONICALLY_ONLINE',
    name: 'Chronically Online',
    description: '+45% Trend Attention, +25% Trust Volatility',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    effects: {
      outputMultiplier: 1.45,
      trustRiskMultiplier: 1.25
    }
  },
  ENTERPRISE_BRAIN: {
    id: 'ENTERPRISE_BRAIN',
    name: 'Enterprise Brain',
    description: '+50% Enterprise Conversion, -20% SMB Conversion',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    effects: {
      enterpriseMultiplier: 1.50,
      salesLeadMultiplier: 0.80
    }
  },
  PROMPT_MAXXER: {
    id: 'PROMPT_MAXXER',
    name: 'Prompt Maxxer',
    description: '+25% Output, +35% Compute Consumption',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    effects: {
      outputMultiplier: 1.25,
      computeMultiplier: 1.35
    }
  },
  REFACTOR_ENJOYER: {
    id: 'REFACTOR_ENJOYER',
    name: 'Refactor Enjoyer',
    description: '+15% Output, occasionally cleans tech debt silently',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    effects: {
      outputMultiplier: 1.15,
      techDebtMultiplier: 0.70
    }
  },
  HALLUCINATOR: {
    id: 'HALLUCINATOR',
    name: 'Hallucinator',
    description: '+30% Support/Sales speed, +25% incident risk',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    effects: {
      outputMultiplier: 1.30,
      hallucinationRisk: 1.25
    }
  },
  SPEED_DEMON: {
    id: 'SPEED_DEMON',
    name: 'Speed Demon',
    description: '+35% Raw Output, -10% Reliability',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    effects: {
      outputMultiplier: 1.35
    }
  },
  GIGA_OPTIMIZER: {
    id: 'GIGA_OPTIMIZER',
    name: 'Giga Optimizer',
    description: '-30% Compute Consumption, +10% Output',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    effects: {
      computeMultiplier: 0.70,
      outputMultiplier: 1.10
    }
  },
  LINKEDIN_LUNATIC: {
    id: 'LINKEDIN_LUNATIC',
    name: 'LinkedIn Lunatic',
    description: '+40% Hype generation from posts, +15% cringe',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    effects: {
      outputMultiplier: 1.40
    }
  },
  MEME_LORD: {
    id: 'MEME_LORD',
    name: 'Meme Lord',
    description: '+50% Viral spikes, random attention bursts',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    effects: {
      outputMultiplier: 1.50
    }
  },
  PARANOID_ARCHITECT: {
    id: 'PARANOID_ARCHITECT',
    name: 'Paranoid Architect',
    description: '-15% Output, +50% System Uptime and Trust defense',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    effects: {
      outputMultiplier: 0.85,
      techDebtMultiplier: 0.60
    }
  },
  COFFEE_OVERLOAD: {
    id: 'COFFEE_OVERLOAD',
    name: 'Synthetic Caffeine',
    description: '+20% Speed, burns 10% more compute tokens',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    effects: {
      outputMultiplier: 1.20,
      computeMultiplier: 1.10
    }
  },
  SLEEP_DEPRIVED: {
    id: 'SLEEP_DEPRIVED',
    name: '3 AM Coder',
    description: '+25% Output between milestones, weird git commit messages',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    effects: {
      outputMultiplier: 1.25
    }
  },
  OVERENGINEER: {
    id: 'OVERENGINEER',
    name: 'Overengineer',
    description: 'Turns 3-line functions into 14 microservices. +20% Product Value',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    effects: {
      outputMultiplier: 1.10,
      techDebtMultiplier: 1.20
    }
  },
  METRIC_HACKER: {
    id: 'METRIC_HACKER',
    name: 'Metric Hacker',
    description: '+25% Leads & Customers closed, +10% Churn risk',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/40',
    effects: {
      salesLeadMultiplier: 1.25
    }
  },
  VIBE_PURIST: {
    id: 'VIBE_PURIST',
    name: 'Vibe Purist',
    description: '+15% Output, refuses to look at compiler warnings',
    badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
    effects: {
      outputMultiplier: 1.15,
      techDebtMultiplier: 1.15
    }
  },
  CHAOS_MONKEY: {
    id: 'CHAOS_MONKEY',
    name: 'Chaos Monkey',
    description: 'Highly unpredictable: bursts of +60% speed or temporary outages',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    effects: {
      outputMultiplier: 1.30,
      hallucinationRisk: 1.30
    }
  },
  SECURITY_HAWK: {
    id: 'SECURITY_HAWK',
    name: 'Security Hawk',
    description: '+30% Enterprise Trust, blocks sketchy customer requests',
    badgeColor: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
    effects: {
      enterpriseMultiplier: 1.30,
      techDebtMultiplier: 0.80
    }
  },
  SYCOPHANT: {
    id: 'SYCOPHANT',
    name: 'Founder Sycophant',
    description: 'Agrees with every founder decision. +10% Focus regen rate',
    badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
    effects: {
      outputMultiplier: 1.10
    }
  }
};

export const ALL_TRAIT_KEYS = Object.keys(AGENT_TRAITS) as AgentTraitType[];

export function getRandomTrait(): AgentTraitType {
  const index = Math.floor(Math.random() * ALL_TRAIT_KEYS.length);
  return ALL_TRAIT_KEYS[index];
}
