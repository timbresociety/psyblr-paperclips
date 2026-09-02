import type { Trend, FounderPostTemplate } from '../types/growth';

export const INITIAL_TRENDS: Trend[] = [
  {
    id: 'trend_agents',
    name: 'Autonomous AI Agents',
    category: 'AI Zeitgeist',
    strength: 88,
    momentum: 'rising',
    viralMultiplier: 1.8,
    description: 'Everyone wants software that works while they sleep on a yacht in Monaco.'
  },
  {
    id: 'trend_one_person_unicorn',
    name: 'One-Person Unicorns',
    category: 'Startup Culture',
    strength: 94,
    momentum: 'peaked',
    viralMultiplier: 2.2,
    description: 'Founders bragging about $10M ARR with exactly 0 employees.'
  },
  {
    id: 'trend_vibe_coding',
    name: 'Vibe Coding',
    category: 'Engineering',
    strength: 92,
    momentum: 'rising',
    viralMultiplier: 2.0,
    description: 'Writing code without knowing any programming syntax. Pure vibes and prompt loops.'
  },
  {
    id: 'trend_founder_mode',
    name: 'Founder Mode',
    category: 'Management',
    strength: 78,
    momentum: 'falling',
    viralMultiplier: 1.5,
    description: 'Micromanaging every single CSS margin directly over Slack at 3:15 AM.'
  },
  {
    id: 'trend_e_acc',
    name: 'e/acc & Infinite Acceleration',
    category: 'Philosophy',
    strength: 82,
    momentum: 'rising',
    viralMultiplier: 1.7,
    description: 'Thermodynamics dictates we must build AGI before the next quarterly review.'
  },
  {
    id: 'trend_local_llms',
    name: 'Local Quantized Models',
    category: 'Hardware',
    strength: 65,
    momentum: 'rising',
    viralMultiplier: 1.4,
    description: 'Running 70B parameter models on an overheated MacBook Air.'
  },
  {
    id: 'trend_b2b_agents',
    name: 'Enterprise Agentic Workflows',
    category: 'Enterprise',
    strength: 70,
    momentum: 'rising',
    viralMultiplier: 1.6,
    description: 'Selling automated data reconciliation to Fortune 500 banks for $500k/year.'
  },
  {
    id: 'trend_saas_is_dead',
    name: '"SaaS is Dead"',
    category: 'Hot Takes',
    strength: 85,
    momentum: 'peaked',
    viralMultiplier: 1.9,
    description: 'Claiming software subscriptions will be replaced by bespoke synthetic micro-apps.'
  },
  {
    id: 'trend_burnout_brag',
    name: '100-Hour Workweek Flexing',
    category: 'Hustle',
    strength: 55,
    momentum: 'falling',
    viralMultiplier: 1.2,
    description: 'Drinking cold-brew espresso straight from the French press while debugging.'
  },
  {
    id: 'trend_ai_video',
    name: 'Synthetic Brainrot Video',
    category: 'Media',
    strength: 90,
    momentum: 'rising',
    viralMultiplier: 2.1,
    description: 'Subway Surfers gameplay under a voice-cloned historical debate.'
  }
];

export const FOUNDER_POST_TEMPLATES: FounderPostTemplate[] = [
  {
    id: 'post_01',
    hook: 'Vibe Coding Confession',
    archetype: 'VIBE_CODER',
    baseAttention: 350,
    hypeDelta: 4,
    trustRiskDelta: 1,
    content: 'I haven\'t written a line of syntax in 6 months. I just whisper business requirements into the microphone and our agent ships to prod. ARR is up 400%.'
  },
  {
    id: 'post_02',
    hook: 'Founder Mode Manifesto',
    archetype: 'FOUNDER_MODE',
    baseAttention: 500,
    hypeDelta: 6,
    trustRiskDelta: 3,
    content: 'Corporate managers will tell you to "delegate". Real founders know you must personally inspect every single database query and tell your agents they lack ambition.'
  },
  {
    id: 'post_03',
    hook: 'Zero Employees Flex',
    archetype: 'THOUGHT_LEADER',
    baseAttention: 650,
    hypeDelta: 8,
    trustRiskDelta: 2,
    content: 'People ask how many employees we have. Exactly ONE. Me. The rest are 48 autonomous LLM agents who don\'t need dental insurance or offsites.'
  },
  {
    id: 'post_04',
    hook: 'e/acc Acceleration',
    archetype: 'E_ACC',
    baseAttention: 420,
    hypeDelta: 5,
    trustRiskDelta: 2,
    content: 'Compute is the only honest currency in the universe. We are consuming 5,000 GPU units an hour and generating pure economic velocity.'
  },
  {
    id: 'post_05',
    hook: 'Build in Public Milestone',
    archetype: 'BUILD_IN_PUBLIC',
    baseAttention: 300,
    hypeDelta: 3,
    trustRiskDelta: -1,
    content: 'Month 3: Shipped 28 features, fixed 400 bugs, zero human hires. Transparency is our superpower. Here is our exact Stripe revenue chart.'
  },
  {
    id: 'post_06',
    hook: 'Contrarian Doomer Take',
    archetype: 'DOOMER',
    baseAttention: 550,
    hypeDelta: 7,
    trustRiskDelta: 4,
    content: '99% of SaaS companies will be bankrupt in 18 months unless they fire everyone and replace their entire leadership team with autonomous recursive loops.'
  },
  {
    id: 'post_07',
    hook: 'The Death of Human Meetings',
    archetype: 'THOUGHT_LEADER',
    baseAttention: 480,
    hypeDelta: 5,
    trustRiskDelta: 1,
    content: 'We eliminated all standups, syncs, and 1-on-1s. When our agents need to align, they pass JSON schemas over Redis in 4 milliseconds.'
  },
  {
    id: 'post_08',
    hook: 'Why I Don\'t Care About Unit Tests',
    archetype: 'VIBE_CODER',
    baseAttention: 620,
    hypeDelta: 9,
    trustRiskDelta: 5,
    content: 'Unit tests are a coping mechanism for people who fear production deployments. We test on our paying users in real time. Velocity is our unit test.'
  },
  {
    id: 'post_09',
    hook: 'The Autonomous Holding Co. Vision',
    archetype: 'FOUNDER_MODE',
    baseAttention: 580,
    hypeDelta: 8,
    trustRiskDelta: 2,
    content: 'We are no longer building a single app. We are deploying an autonomous conglomerate where 12 subsidiary startups buy and sell compute from each other.'
  },
  {
    id: 'post_10',
    hook: 'Cold Water Plunge & Prompting',
    archetype: 'BUILD_IN_PUBLIC',
    baseAttention: 390,
    hypeDelta: 4,
    trustRiskDelta: 0,
    content: '4:30 AM: Ice bath. 4:45 AM: Espresso. 5:00 AM: Dispatched 14 feature prompts to our engineering cluster. 5:15 AM: $12k in new ARR.'
  }
];
