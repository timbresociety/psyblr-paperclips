export interface MilestoneDef {
  id: string;
  title: string;
  description: string;
  conditionDescription: string;
  bannerTitle: string;
  flavorQuote: string;
  rewardFlavor: string;
  check: (state: any) => boolean;
}

export const MILESTONES: MilestoneDef[] = [
  {
    id: 'ms_first_customer',
    title: 'First Paying Customer',
    description: 'Someone actually entered their credit card details.',
    conditionDescription: 'Acquire 1 customer',
    bannerTitle: 'FIRST PAYING CUSTOMER',
    flavorQuote: '"Wait, this actually works?"',
    rewardFlavor: '+$25 MRR unlocked. The journey begins.',
    check: (s) => s.customers >= 1
  },
  {
    id: 'ms_first_agent',
    title: 'First Autonomous Coworker',
    description: 'Hired an AI agent. Human employee count remains exactly 1.',
    conditionDescription: 'Hire 1 Agent',
    bannerTitle: 'FIRST AGENT HIRED',
    flavorQuote: '"They don’t need a 401(k) or standup meetings."',
    rewardFlavor: 'Work is now automated while you sleep.',
    check: (s) => (s.agents?.length || 0) >= 1
  },
  {
    id: 'ms_mrr_100',
    title: '$100 MRR',
    description: 'Your ramen profitability is within visual range.',
    conditionDescription: 'Reach $100 MRR & 1 Agent',
    bannerTitle: '$100 MRR REACHED',
    flavorQuote: '"We are basically profitable if I only eat oats."',
    rewardFlavor: 'Unlocked Agent Hiring Marketplace.',
    check: (s) => s.mrr >= 100 && (s.agents?.length || 0) >= 1
  },
  {
    id: 'ms_mrr_1k',
    title: '$1,000 MRR ($12k ARR)',
    description: 'Four figures of monthly recurring revenue with an autonomous crew.',
    conditionDescription: 'Reach $1,000 MRR, 3 Agents & Level 2 Product',
    bannerTitle: '$1,000 MRR HIT',
    flavorQuote: '"People on Twitter are starting to ask if I am taking angel checks."',
    rewardFlavor: 'Unlocked VC Pre-Seed Term Sheets.',
    check: (s) => s.mrr >= 1000 && (s.agents?.length || 0) >= 3 && (s.productLevel || 1) >= 2
  },
  {
    id: 'ms_mrr_10k',
    title: '$10,000 MRR ($120k ARR)',
    description: 'A genuine high-growth SaaS business operated by automated agents.',
    conditionDescription: 'Reach $10,000 MRR, 8 Agents & Level 4 Product',
    bannerTitle: '$10,000 MRR HIT',
    flavorQuote: '"My mom asked if I have an office yet. I told her the cloud is my office."',
    rewardFlavor: 'Unlocked Seed Fundraising & Department Managers.',
    check: (s) => s.mrr >= 10000 && (s.agents?.length || 0) >= 8 && (s.productLevel || 1) >= 4
  },
  {
    id: 'ms_mrr_100k',
    title: '$100,000 MRR ($1.2M ARR)',
    description: 'Seven-figure run rate achieved with zero human payroll and managed agent teams.',
    conditionDescription: 'Reach $100,000 MRR, 20 Agents & 1 Manager',
    bannerTitle: '$1.2M ARR CLUB',
    flavorQuote: '"Gross margins are 94%. Compute is our only real employee."',
    rewardFlavor: 'Unlocked Series A Round & C-Suite Executive Agents.',
    check: (s) => s.mrr >= 100000 && (s.agents?.length || 0) >= 20 && s.agents.some((a: any) => a.role === 'MANAGER')
  },
  {
    id: 'ms_ceo_unlocked',
    title: 'Autonomous CEO Appointed',
    description: 'The company now manages itself. You are purely a symbolic founder.',
    conditionDescription: 'Hire Autonomous CEO Agent & 30+ Agents',
    bannerTitle: 'CEO AGENT ONLINE',
    flavorQuote: '"Founder, your presence is no longer operationally necessary."',
    rewardFlavor: 'Company operates with 100% autonomous synergy.',
    check: (s) => s.agents.some((a: any) => a.role === 'CEO') && (s.agents?.length || 0) >= 30
  },
  {
    id: 'ms_valuation_100m',
    title: 'Centicorn Horizon ($100M Valuation)',
    description: 'Wall Street and Silicon Valley are baffled by your autonomous P&L.',
    conditionDescription: 'Reach $100M Valuation, 35 Agents & Executive Team',
    bannerTitle: '$100M VALUATION',
    flavorQuote: '"Valuation multiple is 24x. The narrative is unstoppable."',
    rewardFlavor: 'Unlocked Sovereign Compute Datacenter.',
    check: (s) => s.valuation >= 100000000 && (s.agents?.length || 0) >= 35 && s.agents.some((a: any) => a.role === 'EXECUTIVE')
  },
  {
    id: 'ms_unicorn_victory',
    title: '$1,000,000,000 UNICORN',
    description: 'You built a billion-dollar empire with 50+ autonomous agents and exactly 1 human employee.',
    conditionDescription: 'Reach $1B Valuation, CEO Agent & 50+ Agents',
    bannerTitle: 'ONE-PERSON UNICORN ACHIEVED',
    flavorQuote: '"You did it. Somehow."',
    rewardFlavor: 'Unlocked Post-Unicorn Autonomous Holding Company Mode.',
    check: (s) => s.valuation >= 1000000000 && s.agents.some((a: any) => a.role === 'CEO') && (s.agents?.length || 0) >= 50
  }
];
