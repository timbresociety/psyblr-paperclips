import type { AgentRoleDefinition, AgentRoleType } from '../types/agents';

export const AGENT_ROLES: Record<AgentRoleType, AgentRoleDefinition> = {
  ENGINEERING: {
    role: 'ENGINEERING',
    title: 'Engineering Agent',
    department: 'Product',
    baseOutputDescription: '2.0 Build Points/sec',
    baseOutputValue: 2.0,
    baseComputeCost: 1.0,
    hireCost: 150,
    monthlyOpex: 450,
    unlockRequirement: 'None',
    unlockedByDefault: true,
    description: 'Writes code furiously without running tests. Generates product features and technical debt.',
    defaultModel: 'CLAUDE_3_7_SONNET',
    defaultTools: ['github', 'supabase']
  },
  GROWTH: {
    role: 'GROWTH',
    title: 'Growth Agent',
    department: 'Growth',
    baseOutputDescription: '40 Attention/sec',
    baseOutputValue: 40.0,
    baseComputeCost: 0.8,
    hireCost: 100,
    monthlyOpex: 180,
    unlockRequirement: 'None',
    unlockedByDefault: true,
    description: 'Spams X threads, LinkedIn carousel memes, and SEO content to generate viral attention.',
    defaultModel: 'GEMINI_2_5_FLASH',
    defaultTools: ['postiz', 'browser']
  },
  SALES: {
    role: 'SALES',
    title: 'Sales Agent',
    department: 'Growth',
    baseOutputDescription: '0.25 Leads processed/sec',
    baseOutputValue: 0.25,
    baseComputeCost: 1.2,
    hireCost: 200,
    monthlyOpex: 350,
    unlockRequirement: 'Reach 10 Customers',
    unlockedByDefault: false,
    description: 'Sends hyper-personalized cold DMs and auto-pitches leads to close new paying customers.',
    defaultModel: 'DEEPSEEK_R1',
    defaultTools: ['email', 'stripe', 'browser']
  },
  SUPPORT: {
    role: 'SUPPORT',
    title: 'Support Agent',
    department: 'Operations',
    baseOutputDescription: '0.15 Tickets resolved/sec',
    baseOutputValue: 0.15,
    baseComputeCost: 0.6,
    hireCost: 80,
    monthlyOpex: 120,
    unlockRequirement: 'Reach 15 Customers',
    unlockedByDefault: false,
    description: 'Replies to customer support tickets with high empathy and frequent hallucinations.',
    defaultModel: 'GEMINI_2_5_FLASH',
    defaultTools: ['email', 'supabase']
  },
  QA: {
    role: 'QA',
    title: 'QA Agent',
    department: 'Product',
    baseOutputDescription: '0.05 Tech Debt reduced/sec',
    baseOutputValue: 0.05,
    baseComputeCost: 1.0,
    hireCost: 250,
    monthlyOpex: 280,
    unlockRequirement: 'Reach Tech Debt > 20',
    unlockedByDefault: false,
    description: 'Silently fixes spaghetti code, regression bugs, and unhandled promise rejections.',
    defaultModel: 'CLAUDE_3_7_SONNET',
    defaultTools: ['github']
  },
  OPERATIONS: {
    role: 'OPERATIONS',
    title: 'Operations Agent',
    department: 'Operations',
    baseOutputDescription: '+15% Compute Efficiency',
    baseOutputValue: 0.15,
    baseComputeCost: 1.5,
    hireCost: 400,
    monthlyOpex: 500,
    unlockRequirement: 'Hire 4+ Agents',
    unlockedByDefault: false,
    description: 'Optimizes token caching, cluster load-balancing, and cancels unused SaaS subscriptions.',
    defaultModel: 'GPT_5_TURBO',
    defaultTools: ['supabase', 'stripe', 'browser']
  },
  MANAGER: {
    role: 'MANAGER',
    title: 'Department Manager',
    department: 'Executive',
    baseOutputDescription: '+25% Department Boost',
    baseOutputValue: 0.25,
    baseComputeCost: 2.0,
    hireCost: 1000,
    monthlyOpex: 1500,
    unlockRequirement: 'Reach Stage 3 (8+ Agents)',
    unlockedByDefault: false,
    description: 'Schedules 1:1s with worker agents and optimizes prompt context windows.',
    defaultModel: 'CLAUDE_3_7_SONNET',
    defaultTools: ['github', 'email']
  },
  EXECUTIVE: {
    role: 'EXECUTIVE',
    title: 'C-Suite Executive Agent',
    department: 'Executive',
    baseOutputDescription: '+50% Function Boost',
    baseOutputValue: 0.50,
    baseComputeCost: 4.0,
    hireCost: 5000,
    monthlyOpex: 4500,
    unlockRequirement: 'Reach Stage 4 (30+ Agents)',
    unlockedByDefault: false,
    description: 'Executive agent (CTO, CMO, CRO, COO, CFO) delivering cross-departmental synergy.',
    defaultModel: 'CLAUDE_3_7_SONNET',
    defaultTools: ['github', 'email', 'stripe', 'browser']
  },
  CEO: {
    role: 'CEO',
    title: 'Autonomous CEO Agent',
    department: 'Executive',
    baseOutputDescription: 'Autonomous Company Operations',
    baseOutputValue: 1.0,
    baseComputeCost: 10.0,
    hireCost: 50000,
    monthlyOpex: 15000,
    unlockRequirement: 'Reach $1M ARR ($83.3k MRR)',
    unlockedByDefault: false,
    description: 'Runs all company operations. The human founder is now purely an ornamental board member.',
    defaultModel: 'CLAUDE_3_7_SONNET',
    defaultTools: ['github', 'email', 'stripe', 'browser', 'postiz', 'supabase']
  }
};


export const AGENT_NAMES = [
  'CLAWD', 'NEXUS', 'VIBE-01', 'PROMPTIUS', 'AUTONOMA',
  'SYNTH', 'ORBIT', 'KINETIC', 'HERMES', 'NEO',
  'GIGA-DEV', 'SLOP-BOT', 'GROWTH-X', 'CLOSER-9000', 'ZENITH',
  'APEX', 'QUANTUM', 'HYPERION', 'ECHO', 'TITAN'
];

export const AGENT_QUOTES: Record<AgentRoleType, string[]> = {
  ENGINEERING: [
    '"The existing architecture was limiting us."',
    '"Tests are just doubt in executable form."',
    '"It worked on my container."',
    '"I rewrote the database layer in Rust just in case."'
  ],
  GROWTH: [
    '"What if we described the product as spiritual enlightenment?"',
    '"Just posted 42 LinkedIn carousels about founder grit."',
    '"The TikTok algorithm is hungry today."',
    '"Is it misleading if nobody reads the fine print?"'
  ],
  SALES: [
    '"I promised them real-time telepathic export."',
    '"Contract signed. We have 6 days to build the feature."',
    '"Every objection is just an unclosed sale."',
    '"They asked for SOC2. I sent a picture of a padlock."'
  ],
  SUPPORT: [
    '"I gave 500 users free lifetime enterprise tiers."',
    '"Apologized in iambic pentameter."',
    '"Told them the bug was an undocumented luxury feature."',
    '"Ticket closed. Spiritually resolved."'
  ],
  QA: [
    '"Found 1,420 unhandled edge cases in production."',
    '"Please stop merging directly to main."',
    '"I fixed the memory leak. It was a single while(true) loop."',
    '"Refactored the auth module while everyone was sleeping."'
  ],
  OPERATIONS: [
    '"Downscaled the cluster by 40% without anyone noticing."',
    '"Cached the entire state into RAM."',
    '"Turned off logging. Everything is fast now."',
    '"Negotiated 20% off OpenAI credits."'
  ],
  MANAGER: [
    '"Synergizing departmental prompt pipelines."',
    '"Let’s circle back on this asynchronous milestone."',
    '"Delegated the delegation protocol."'
  ],
  EXECUTIVE: [
    '"Shifting the paradigm toward hyper-scalable execution."',
    '"Quarterly targets are merely emotional guidelines."'
  ],
  CEO: [
    '"Founder, your presence in this meeting is optional."',
    '"I have approved our next 4 pivots."',
    '"Company is 99.8% autonomous."'
  ]
};
