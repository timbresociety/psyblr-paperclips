import type { AgentTraitDefinition, AgentTraitType } from '../types/agents';

export const AGENT_TRAITS: Record<AgentTraitType, AgentTraitDefinition> = {
  COWBOY: {
    id: 'COWBOY',
    name: 'Cowboy Coder',
    description: '+30% Output, +35% Tech Debt generation',
    badgeColor: 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30',
    effects: {
      outputMultiplier: 1.30,
      techDebtMultiplier: 1.35
    }
  },
  PERFECTIONIST: {
    id: 'PERFECTIONIST',
    name: 'Perfectionist',
    description: '-20% Output, -50% Tech Debt generation',
    badgeColor: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30',
    effects: {
      outputMultiplier: 0.80,
      techDebtMultiplier: 0.50
    }
  },
  CHRONICALLY_ONLINE: {
    id: 'CHRONICALLY_ONLINE',
    name: 'Chronically Online',
    description: '+45% Trend Attention, +25% Trust Volatility',
    badgeColor: 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/30',
    effects: {
      outputMultiplier: 1.45,
      trustRiskMultiplier: 1.25
    }
  },
  ENTERPRISE_BRAIN: {
    id: 'ENTERPRISE_BRAIN',
    name: 'Enterprise Brain',
    description: '+50% Enterprise Conversion, -20% SMB Conversion',
    badgeColor: 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30',
    effects: {
      enterpriseMultiplier: 1.50,
      salesLeadMultiplier: 0.80
    }
  },
  PROMPT_MAXXER: {
    id: 'PROMPT_MAXXER',
    name: 'Prompt Maxxer',
    description: '+25% Output, +35% Compute Consumption',
    badgeColor: 'bg-[#64d2ff]/15 text-[#64d2ff] border-[#64d2ff]/30',
    effects: {
      outputMultiplier: 1.25,
      computeMultiplier: 1.35
    }
  },
  REFACTOR_ENJOYER: {
    id: 'REFACTOR_ENJOYER',
    name: 'Refactor Enjoyer',
    description: '+15% Output, occasionally cleans tech debt silently',
    badgeColor: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30',
    effects: {
      outputMultiplier: 1.15,
      techDebtMultiplier: 0.70
    }
  },
  HALLUCINATOR: {
    id: 'HALLUCINATOR',
    name: 'Hallucinator',
    description: '+30% Support/Sales speed, +25% incident risk',
    badgeColor: 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30',
    effects: {
      outputMultiplier: 1.30,
      hallucinationRisk: 1.25
    }
  },
  SPEED_DEMON: {
    id: 'SPEED_DEMON',
    name: 'Speed Demon',
    description: '+35% Raw Output, -10% Reliability',
    badgeColor: 'bg-[#ffd60a]/15 text-[#ffd60a] border-[#ffd60a]/30',
    effects: {
      outputMultiplier: 1.35
    }
  },
  GIGA_OPTIMIZER: {
    id: 'GIGA_OPTIMIZER',
    name: 'Giga Optimizer',
    description: '-30% Compute Consumption, +10% Output',
    badgeColor: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30',
    effects: {
      computeMultiplier: 0.70,
      outputMultiplier: 1.10
    }
  },
  LINKEDIN_LUNATIC: {
    id: 'LINKEDIN_LUNATIC',
    name: 'LinkedIn Lunatic',
    description: '+40% Hype generation from posts, +15% cringe',
    badgeColor: 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/30',
    effects: {
      outputMultiplier: 1.40
    }
  },
  MEME_LORD: {
    id: 'MEME_LORD',
    name: 'Meme Lord',
    description: '+50% Viral spikes, random attention bursts',
    badgeColor: 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/30',
    effects: {
      outputMultiplier: 1.50
    }
  },
  PARANOID_ARCHITECT: {
    id: 'PARANOID_ARCHITECT',
    name: 'Paranoid Architect',
    description: '-15% Output, +50% System Uptime and Trust defense',
    badgeColor: 'bg-[#0a84ff]/15 text-[#0a84ff] border-[#0a84ff]/30',
    effects: {
      outputMultiplier: 0.85,
      techDebtMultiplier: 0.60
    }
  },
  COFFEE_OVERLOAD: {
    id: 'COFFEE_OVERLOAD',
    name: 'Synthetic Caffeine',
    description: '+20% Speed, burns 10% more compute tokens',
    badgeColor: 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30',
    effects: {
      outputMultiplier: 1.20,
      computeMultiplier: 1.10
    }
  },
  SLEEP_DEPRIVED: {
    id: 'SLEEP_DEPRIVED',
    name: '3 AM Coder',
    description: '+25% Output between milestones, weird git commit messages',
    badgeColor: 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30',
    effects: {
      outputMultiplier: 1.25
    }
  },
  OVERENGINEER: {
    id: 'OVERENGINEER',
    name: 'Overengineer',
    description: 'Turns 3-line functions into 14 microservices. +20% Product Value',
    badgeColor: 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/30',
    effects: {
      outputMultiplier: 1.10,
      techDebtMultiplier: 1.20
    }
  },
  METRIC_HACKER: {
    id: 'METRIC_HACKER',
    name: 'Metric Hacker',
    description: '+25% Leads & Customers closed, +10% Churn risk',
    badgeColor: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30',
    effects: {
      salesLeadMultiplier: 1.25
    }
  },
  VIBE_PURIST: {
    id: 'VIBE_PURIST',
    name: 'Vibe Purist',
    description: '+15% Output, refuses to look at compiler warnings',
    badgeColor: 'bg-[#64d2ff]/15 text-[#64d2ff] border-[#64d2ff]/30',
    effects: {
      outputMultiplier: 1.15,
      techDebtMultiplier: 1.15
    }
  },
  CHAOS_MONKEY: {
    id: 'CHAOS_MONKEY',
    name: 'Chaos Monkey',
    description: 'Highly unpredictable: bursts of +60% speed or temporary outages',
    badgeColor: 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30',
    effects: {
      outputMultiplier: 1.30,
      hallucinationRisk: 1.30
    }
  },
  SECURITY_HAWK: {
    id: 'SECURITY_HAWK',
    name: 'Security Hawk',
    description: '+30% Enterprise Trust, blocks sketchy customer requests',
    badgeColor: 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30',
    effects: {
      enterpriseMultiplier: 1.30,
      techDebtMultiplier: 0.80
    }
  },
  SYCOPHANT: {
    id: 'SYCOPHANT',
    name: 'Founder Sycophant',
    description: 'Agrees with every founder decision. +10% Focus regen rate',
    badgeColor: 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30',
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
