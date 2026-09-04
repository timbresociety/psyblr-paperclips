import type { ScreenTab } from '../types/game';

export interface EarlyUpgrade {
  id: string;
  name: string;
  category: 'gear' | 'caffeine' | 'tooling' | 'launch';
  cost: number;
  description: string;
  benefitText: string;
  minBp?: number;
  isUnlocked: (state: any) => boolean;
  effect?: (state: any) => Partial<any>;
}

export interface EraConfig {
  id: number;
  name: string;
  shortName: string;
  arrThreshold: number; // in dollars
  hint: string;
  description: string;
  unlockedTabs: ScreenTab[];
  unlockedActions: ('vibe_code' | 'post' | 'sell' | 'support')[];
  unlockedMetrics: ('treasury' | 'focus' | 'arr' | 'customers' | 'trust' | 'tickets' | 'techDebt' | 'compute' | 'valuation')[];
  gateConditionDescription: string;
}

export const ERAS: EraConfig[] = [
  {
    id: 1,
    name: 'Era 1: Garage Hacker',
    shortName: 'Garage',
    arrThreshold: 0,
    hint: 'vibe code your prototype to ship MVP (100 BP)...',
    description: 'A lone founder in a dark room with a laptop. No revenue, no employees, just pure code and caffeine.',
    unlockedTabs: ['command'],
    unlockedActions: ['vibe_code'],
    unlockedMetrics: ['treasury', 'focus'],
    gateConditionDescription: 'Reach 100 Build Points to ship MVP'
  },
  {
    id: 2,
    name: 'Era 2: First Customers',
    shortName: 'Traction',
    arrThreshold: 1,
    hint: 'pitch leads and close your first paying customers...',
    description: 'Your MVP is live. People on the internet are actually entering their credit card numbers.',
    unlockedTabs: ['command'],
    unlockedActions: ['vibe_code', 'post', 'sell'],
    unlockedMetrics: ['treasury', 'focus', 'arr', 'customers'],
    gateConditionDescription: 'Reach $10k ARR'
  },
  {
    id: 3,
    name: 'Era 3: The First Coworker',
    shortName: 'Coworker',
    arrThreshold: 10000,
    hint: 'hire your first autonomous AI agent coworker...',
    description: 'You hire your first autonomous AI engineer. Work starts shipping while you sleep, and executive incidents arrive.',
    unlockedTabs: ['command', 'agents', 'inbox'],
    unlockedActions: ['vibe_code', 'post', 'sell', 'support'],
    unlockedMetrics: ['treasury', 'focus', 'arr', 'customers', 'trust', 'tickets'],
    gateConditionDescription: 'Reach $100k ARR'
  },
  {
    id: 4,
    name: 'Era 4: Product Engine',
    shortName: 'Product',
    arrThreshold: 100000,
    hint: 'automate sprint velocity and refactor debt...',
    description: 'A structured roadmap and automated CI/CD pipeline. Balance technical debt against feature speed and navigate incidents.',
    unlockedTabs: ['command', 'agents', 'product', 'inbox'],
    unlockedActions: ['vibe_code', 'post', 'sell', 'support'],
    unlockedMetrics: ['treasury', 'focus', 'arr', 'customers', 'trust', 'tickets', 'techDebt'],
    gateConditionDescription: 'Reach $1M ARR'
  },
  {
    id: 5,
    name: 'Era 5: Growth Flywheel',
    shortName: 'Flywheel',
    arrThreshold: 1000000,
    hint: 'ignite viral loops and scale GPU compute...',
    description: 'Crossing $1M ARR. Inbound marketing and GPU clusters become the lifeblood of your autonomous swarm.',
    unlockedTabs: ['command', 'agents', 'product', 'growth', 'inbox'],
    unlockedActions: ['vibe_code', 'post', 'sell', 'support'],
    unlockedMetrics: ['treasury', 'focus', 'arr', 'customers', 'trust', 'tickets', 'techDebt', 'compute'],
    gateConditionDescription: 'Reach $10M ARR'
  },

  {
    id: 6,
    name: 'Era 6: Enterprise Whales',
    shortName: 'Enterprise',
    arrThreshold: 10000000,
    hint: 'close enterprise contracts and navigate crises...',
    description: 'Fortune 500 procurement teams, SOC2 audits, and live crisis management in your executive inbox.',
    unlockedTabs: ['command', 'agents', 'product', 'growth', 'customers', 'inbox'],
    unlockedActions: ['vibe_code', 'post', 'sell', 'support'],
    unlockedMetrics: ['treasury', 'focus', 'arr', 'customers', 'trust', 'tickets', 'techDebt', 'compute'],
    gateConditionDescription: 'Reach $50M ARR'
  },
  {
    id: 7,
    name: 'Era 7: Institutional Capital',
    shortName: 'Finance',
    arrThreshold: 50000000,
    hint: 'negotiate VC term sheets and expand valuation multiple...',
    description: 'Venture capital term sheets arrive in bulk. Optimize dilution and expand valuation to astronomical multiples.',
    unlockedTabs: ['command', 'agents', 'product', 'growth', 'customers', 'inbox', 'finance'],
    unlockedActions: ['vibe_code', 'post', 'sell', 'support'],
    unlockedMetrics: ['treasury', 'focus', 'arr', 'customers', 'trust', 'tickets', 'techDebt', 'compute', 'valuation'],
    gateConditionDescription: 'Reach $100M ARR'
  },
  {
    id: 8,
    name: 'Era 8: Swarm Orchestration',
    shortName: 'Swarm',
    arrThreshold: 100000000,
    hint: 'coordinate autonomous departmental swarms on the canvas...',
    description: 'Dozens of autonomous agents operate in parallel. The CEO inspects live agent execution traces and topology.',
    unlockedTabs: ['command', 'agents', 'product', 'growth', 'customers', 'inbox', 'finance', 'swarm', 'terminal'],
    unlockedActions: ['vibe_code', 'post', 'sell', 'support'],
    unlockedMetrics: ['treasury', 'focus', 'arr', 'customers', 'trust', 'tickets', 'techDebt', 'compute', 'valuation'],
    gateConditionDescription: 'Reach $500M ARR'
  },
  {
    id: 9,
    name: 'Era 9: Corporate Conglomerate',
    shortName: 'Holding Co',
    arrThreshold: 500000000,
    hint: 'spin out autonomous subsidiaries toward the $1B summit...',
    description: 'Spinning out subsidiary startups, each governed by an autonomous AI CEO. The $1B ARR summit is in reach.',
    unlockedTabs: ['command', 'agents', 'product', 'growth', 'customers', 'inbox', 'finance', 'swarm', 'terminal', 'holding'],
    unlockedActions: ['vibe_code', 'post', 'sell', 'support'],
    unlockedMetrics: ['treasury', 'focus', 'arr', 'customers', 'trust', 'tickets', 'techDebt', 'compute', 'valuation'],
    gateConditionDescription: 'Reach $1,000,000,000 ARR'
  },
  {
    id: 10,
    name: 'Era 10: The Sovereign Empire',
    shortName: '$1B Summit',
    arrThreshold: 1000000000,
    hint: 'you built a $1B ARR empire with exactly 1 human.',
    description: 'The pinnacle of autonomous software craft. A ten-figure corporate titan commanded by a single human founder.',
    unlockedTabs: ['command', 'agents', 'product', 'growth', 'customers', 'inbox', 'finance', 'swarm', 'terminal', 'holding'],
    unlockedActions: ['vibe_code', 'post', 'sell', 'support'],
    unlockedMetrics: ['treasury', 'focus', 'arr', 'customers', 'trust', 'tickets', 'techDebt', 'compute', 'valuation'],
    gateConditionDescription: 'Infinite Conglomerate Sandbox'
  }
];

export const EARLY_GARAGE_UPGRADES: EarlyUpgrade[] = [
  {
    id: 'upg_mech_keyboard',
    name: 'Mechanical Keyboard',
    category: 'gear',
    cost: 180,
    description: 'Satisfying tactile clicks keep dopamine high during 3 AM coding sessions.',
    benefitText: '+50% Vibe Code Build Points per click',
    isUnlocked: () => true
  },
  {
    id: 'upg_espresso',
    name: 'Breville Espresso Machine',
    category: 'caffeine',
    cost: 450,
    description: 'Triple-shot macchiatos eliminate founder fatigue.',
    benefitText: '2x Founder Focus recovery speed',
    isUnlocked: () => true
  },
  {
    id: 'upg_cursor_pro',
    name: 'Cursor Pro Subscription',
    category: 'tooling',
    cost: 240,
    description: 'AI autocomplete writes the boilerplate so you can focus on shipping.',
    benefitText: '+15 extra BP per manual code burst',
    isUnlocked: (s) => (s.buildPoints || 0) >= 20 || s.mvpShipped
  },
  {
    id: 'upg_deploy_stripe',
    name: 'Deploy MVP & Stripe Checkout',
    category: 'launch',
    cost: 0,
    minBp: 100,
    description: 'Ship the minimum viable product to production and connect Stripe.',
    benefitText: 'Ships MVP, unlocks Era 2: First Customers & Revenue!',
    isUnlocked: (s) => (s.buildPoints || 0) >= 100 && !s.mvpShipped
  }
];

export function calcCurrentEra(state: { arr: number; mvpShipped: boolean; agentsCount?: number }): number {
  if (!state.mvpShipped) return 1;
  if (state.arr >= 1000000000) return 10;
  if (state.arr >= 500000000) return 9;
  if (state.arr >= 100000000) return 8;
  if (state.arr >= 50000000) return 7;
  if (state.arr >= 10000000) return 6;
  if (state.arr >= 1000000) return 5;
  if (state.arr >= 100000) return 4;
  if (state.arr >= 10000 || (state.agentsCount || 0) >= 1) return 3;
  return 2;
}


export function getEraConfig(eraId: number): EraConfig {
  return ERAS.find(e => e.id === eraId) || ERAS[0];
}
