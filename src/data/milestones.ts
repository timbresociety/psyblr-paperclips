import { dollarsToCents } from '../sim/math';

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
    id: 'ms_first_contract',
    title: 'First Customer ARR',
    description: 'Closed your first paying enterprise customer contract.',
    conditionDescription: 'Generate New Customer ARR',
    bannerTitle: 'FIRST CONTRACT LOCKED',
    flavorQuote: '"Wait, someone actually put a credit card down for this?"',
    rewardFlavor: 'Revenue stream activated. 1 Human CEO, infinite upside.',
    check: (s) => s.currentQuarterNewCustomerArrCents > 0n || s.arrCents > dollarsToCents(100_000),
  },
  {
    id: 'ms_first_agent',
    title: 'First Autonomous Coworker',
    description: 'Hired your first autonomous AI agent. Employee count remains exactly 1.',
    conditionDescription: 'Deploy any Agent Tier ≥ 1',
    bannerTitle: 'FIRST AGENT DEPLOYED',
    flavorQuote: '"They do not need healthcare, sleep, or equity vesting."',
    rewardFlavor: 'Pipelines now run autonomously while you sleep.',
    check: (s: any) => (Object.values(s.agents || {}) as number[]).some((tier) => tier >= 1),
  },
  {
    id: 'ms_arr_1m',
    title: 'Seven-Figure Run Rate ($1M ARR)',
    description: 'Crossed $1,000,000 Annual Recurring Revenue as a solo founder.',
    conditionDescription: 'Reach $1,000,000 ARR',
    bannerTitle: '$1,000,000 ARR ACHIEVED',
    flavorQuote: '"Gross margin is 96%. Silicon Valley is confused."',
    rewardFlavor: 'Unlocked institutional capital line of credit.',
    check: (s: any) => s.arrCents >= dollarsToCents(1_000_000),
  },
  {
    id: 'ms_yolo_mode',
    title: 'YOLO Mode: Autopilot Engaged',
    description: 'Automated 3+ company departments. Permissions disabled. Let it cook.',
    conditionDescription: 'Automate 3 or more departments',
    bannerTitle: 'YOLO MODE ACTIVATED',
    flavorQuote: '"Turned off the confirmation prompts. Code ships at 200 mph."',
    rewardFlavor: 'Autonomous cross-department throughput compounded.',
    check: (s: any) => (Object.values(s.agents || {}) as number[]).filter((tier) => tier >= 1).length >= 3,
  },
  {
    id: 'ms_val_10m',
    title: '$10,000,000 Valuation',
    description: 'Series A scale achieved with zero payroll overhead.',
    conditionDescription: 'Reach $10M Valuation',
    bannerTitle: '$10M VALUATION BENCHMARK',
    flavorQuote: '"VCs are sliding into DMs asking who the VP of Eng is. It is Claude Code."',
    rewardFlavor: 'Valuation multiple expansion unlocked.',
    check: (s) => s.valuationCents >= dollarsToCents(10_000_000),
  },
  {
    id: 'ms_gas_town_swarm',
    title: 'Gas Town: The Autonomous Swarm',
    description: 'Recursive agents managing agents. The org chart is a fractal.',
    conditionDescription: 'Deploy 6+ cumulative agent tiers across company',
    bannerTitle: 'GAS TOWN SWARM ONLINE',
    flavorQuote: '"The compound hums with recursive productivity. You just steer."',
    rewardFlavor: 'Hyperscale concurrency active.',
    check: (s: any) => {
      if (!s) return false;
      if (s.agents && !Array.isArray(s.agents)) {
        return (Object.values(s.agents) as number[]).reduce((a, b) => a + b, 0) >= 6;
      }
      return (s.agents?.length || 0) >= 6;
    },
  },
  {
    id: 'ms_arr_10m',
    title: 'Deca-Million Run Rate ($10M ARR)',
    description: 'Double-digit million recurring revenue. Cash flow positive powerhouse.',
    conditionDescription: 'Reach $10,000,000 ARR',
    bannerTitle: '$10,000,000 ARR REACHED',
    flavorQuote: '"Our GPU cluster electricity bill is higher than our rent."',
    rewardFlavor: 'Whale enterprise accounts unlocked.',
    check: (s) => s.arrCents >= dollarsToCents(10_000_000),
  },
  {
    id: 'ms_val_100m',
    title: 'Centicorn Horizon ($100M Valuation)',
    description: 'Triple-digit million valuation. A single human running a financial powerhouse.',
    conditionDescription: 'Reach $100M Valuation',
    bannerTitle: '$100M CENTICORN HORIZON',
    flavorQuote: '"Wall Street analysts cannot model a 1-person company with 95% margin."',
    rewardFlavor: 'Sovereign compute tier accessible.',
    check: (s) => s.valuationCents >= dollarsToCents(100_000_000),
  },
  {
    id: 'ms_val_500m',
    title: 'Half-Billion Solo Empire ($500M)',
    description: 'The final ascent to Unicorn status. Autonomous operations running at 98%.',
    conditionDescription: 'Reach $500M Valuation',
    bannerTitle: '$500M EMPIRE REACHED',
    flavorQuote: '"One person. 500 million dollars. The machine is unstoppable."',
    rewardFlavor: 'Final sprint to $1B Unicorn checkpoint.',
    check: (s) => s.valuationCents >= dollarsToCents(500_000_000),
  },
  {
    id: 'ms_unicorn_victory',
    title: 'THE $1,000,000,000 UNICORN',
    description: 'One human CEO. Autonomous agent swarm. A billion-dollar empire.',
    conditionDescription: 'Reach $1,000,000,000 Valuation',
    bannerTitle: 'ONE-PERSON UNICORN ACHIEVED',
    flavorQuote: '"You built a billion-dollar company by yourself. You win."',
    rewardFlavor: 'Post-Unicorn Conglomerate & Decacorn Horizon unlocked.',
    check: (s) => s.valuationCents >= dollarsToCents(1_000_000_000),
  },
];
