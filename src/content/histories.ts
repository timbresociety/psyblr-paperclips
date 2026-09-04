/**
 * 9 Founder Histories & Origin Relics
 * Product Truth: company_sim_v1/product_final.md Section 15
 */

import type { FounderHistoryId, RoomId } from '../sim/types';

export interface FounderHistoryDefinition {
  id: FounderHistoryId;
  name: string;
  tagline: string;
  nativeRoom: RoomId | 'capital_efficiency' | 'cross_room' | 'none';
  originRelic: {
    id: string;
    name: string;
    description: string;
  } | null;
  complementaryRooms: RoomId[];
  preSeedSafeCapMultiplier: number;
  seedPreMoneyMultiplier: number;
  baseCostRatio: number; // default 0.30, 0.26 for bootstrapper
  description: string;
}

export const FOUNDER_HISTORIES: Record<FounderHistoryId, FounderHistoryDefinition> = {
  fresh: {
    id: 'fresh',
    name: 'Fresh Founder',
    tagline: 'Standard competitive ranked baseline',
    nativeRoom: 'none',
    originRelic: null,
    complementaryRooms: [],
    preSeedSafeCapMultiplier: 1.0,
    seedPreMoneyMultiplier: 1.0,
    baseCostRatio: 0.30,
    description: 'No history bonuses. Standard unlock pool. Use for standardized leaderboard runs.',
  },
  vibe_coder: {
    id: 'vibe_coder',
    name: 'Vibe Coder',
    tagline: 'Ship first, ask architecture questions later',
    nativeRoom: 'product',
    originRelic: {
      id: 'relic_ten_x_engineer',
      name: 'Ten-X Engineer',
      description: 'First clean Product merge every 8s advances request one additional valid step if required piece is queued.',
    },
    complementaryRooms: ['marketing', 'expansion'],
    preSeedSafeCapMultiplier: 1.0,
    seedPreMoneyMultiplier: 1.0,
    baseCostRatio: 0.30,
    description: 'Product-centric velocity. Encouraged to build distribution and expansion early.',
  },
  distribution_native: {
    id: 'distribution_native',
    name: 'Distribution Native',
    tagline: 'Attention is the only scarce resource',
    nativeRoom: 'marketing',
    originRelic: {
      id: 'relic_distribution_goblin',
      name: 'Distribution Goblin',
      description: 'Every third consecutive correct Marketing choice spawns one follow-up opportunity worth 0.5 Demand GU.',
    },
    complementaryRooms: ['product', 'retention'],
    preSeedSafeCapMultiplier: 1.0,
    seedPreMoneyMultiplier: 1.0,
    baseCostRatio: 0.30,
    description: 'Master of market timing. Must balance incoming traffic with actual product activation and retention.',
  },
  monetization_nerd: {
    id: 'monetization_nerd',
    name: 'Monetization Nerd',
    tagline: 'Price on value, not compute costs',
    nativeRoom: 'monetization',
    originRelic: {
      id: 'relic_price_sense',
      name: 'Price Sense',
      description: 'Perfect pricing zone is 20% wider for manual founder taps only.',
    },
    complementaryRooms: ['retention', 'expansion'],
    preSeedSafeCapMultiplier: 1.0,
    seedPreMoneyMultiplier: 1.0,
    baseCostRatio: 0.30,
    description: 'Unlocks high ARR capture from day one. Needs strong retention to prevent churn.',
  },
  customer_obsessive: {
    id: 'customer_obsessive',
    name: 'Customer Obsessive',
    tagline: 'Churn is a personal failure',
    nativeRoom: 'retention',
    originRelic: {
      id: 'relic_inbox_zero',
      name: 'Inbox Zero',
      description: 'First S1 Retention threat every 20s is automatically resolved.',
    },
    complementaryRooms: ['marketing', 'monetization'],
    preSeedSafeCapMultiplier: 1.0,
    seedPreMoneyMultiplier: 1.0,
    baseCostRatio: 0.30,
    description: 'Unmatched customer retention. Pushes you to build top-of-funnel demand generation.',
  },
  enterprise_operator: {
    id: 'enterprise_operator',
    name: 'Enterprise Operator',
    tagline: 'Multi-year contracts with procurement signoff',
    nativeRoom: 'expansion',
    originRelic: {
      id: 'relic_enterprise_whisperer',
      name: 'Enterprise Whisperer',
      description: 'First Exceptional Expansion fit on each account produces +0.25 GU additional Expansion ARR.',
    },
    complementaryRooms: ['product', 'operations'],
    preSeedSafeCapMultiplier: 1.0,
    seedPreMoneyMultiplier: 1.0,
    baseCostRatio: 0.30,
    description: 'Specializes in high-NRR account growth and complex modular packing.',
  },
  systems_operator: {
    id: 'systems_operator',
    name: 'Systems Operator',
    tagline: 'Reliability is table stakes',
    nativeRoom: 'operations',
    originRelic: {
      id: 'relic_former_sre',
      name: 'Former SRE',
      description: 'First Operations incident each quarter begins 75% revealed. Starting Ops Capacity +1.',
    },
    complementaryRooms: ['marketing', 'expansion'],
    preSeedSafeCapMultiplier: 1.0,
    seedPreMoneyMultiplier: 1.0,
    baseCostRatio: 0.30,
    description: 'High initial capacity and resilience. Can handle heavy agent automation without strain.',
  },
  bootstrapper: {
    id: 'bootstrapper',
    name: 'Bootstrapper',
    tagline: 'Default Alive from day one',
    nativeRoom: 'capital_efficiency',
    originRelic: {
      id: 'relic_default_alive',
      name: 'Default Alive',
      description: 'Healthy-state scheduled operating costs reduced by 10% (30% -> 26% of collections).',
    },
    complementaryRooms: ['marketing', 'product'],
    preSeedSafeCapMultiplier: 1.0,
    seedPreMoneyMultiplier: 1.0,
    baseCostRatio: 0.26,
    description: 'Extreme capital efficiency and survival margins. Capitalizes on cash accumulation without financing.',
  },
  repeat_founder: {
    id: 'repeat_founder',
    name: 'Repeat Founder',
    tagline: 'Raised before, scaled before',
    nativeRoom: 'cross_room',
    originRelic: {
      id: 'relic_raised_before',
      name: 'Raised Before',
      description: 'Pre-seed SAFE cap anchor +30%. Seed pre-money anchor +15%. Previews situation downstream effects.',
    },
    complementaryRooms: ['marketing', 'product'],
    preSeedSafeCapMultiplier: 1.30,
    seedPreMoneyMultiplier: 1.15,
    baseCostRatio: 0.30,
    description: 'Favored by venture capital and sophisticated cross-room systems.',
  },
};
