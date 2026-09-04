/**
 * 24 Deterministic Situation Archetypes & Authored Fallback Copy
 * Product Truth: company_sim_v1/product_final.md Section 20, 20.1
 *
 * All situation effects are deterministic.
 * GenAI can only personalize display text, never invent numerical effects.
 */

export interface SituationChoiceEffect {
  demandDeltaMilliGu?: number;
  cashDeltaCu?: number;
  retentionThreatDeltaMilliGu?: number;
  opsIncidentSeverity?: 'S1' | 'S2' | 'S3';
  opsCategory?: string;
  agentThroughputModifier?: number;
  agentReliabilityDeltaBps?: number;
  durationSec?: number;
  productRequestsToAdd?: number;
  description: string;
}

export interface SituationChoice {
  label: string;
  effect: SituationChoiceEffect;
}

export interface SituationArchetype {
  id: string;
  title: string;
  sender: string;
  body: string;
  choices: [SituationChoice, SituationChoice];
}

export const SITUATION_ARCHETYPES: SituationArchetype[] = [
  {
    id: 'sit_01_community_mention',
    title: 'Niche Community Viral Post',
    sender: 'Discord / Hacker Forum Alert',
    body: 'A well-respected indie dev posted an unprompted teardown of your product, highlighting how it saves 12 hours a week.',
    choices: [
      {
        label: 'Pour Fuel: Amplify with targeted ads (-$500)',
        effect: {
          demandDeltaMilliGu: 2000,
          cashDeltaCu: -0.10,
          description: '+2 Inbound Leads, costs $500 cash',
        },
      },
      {
        label: 'Let Organic Buzz Run (Free)',
        effect: {
          demandDeltaMilliGu: 800,
          cashDeltaCu: 0,
          description: '+1 Inbound Lead, no cash spend',
        },
      },
    ],
  },
  {
    id: 'sit_02_search_ranking',
    title: 'Search Engine Algorithmic Shift',
    sender: 'Growth Analytics Monitor',
    body: 'The latest core search ranking update lowered organic discovery for your primary landing keywords.',
    choices: [
      {
        label: 'Retarget Channels (-$5,000)',
        effect: {
          cashDeltaCu: -1.0,
          agentReliabilityDeltaBps: 0,
          description: 'Spend $5,000 to restore marketing channels immediately.',
        },
      },
      {
        label: 'Absorb The Hit',
        effect: {
          agentReliabilityDeltaBps: -1500, // -15%
          durationSec: 150,
          description: 'Marketing Agent reliability -15 pp for this quarter.',
        },
      },
    ],
  },
  {
    id: 'sit_03_trend_saturation',
    title: 'Ad Channel CPM Inflation',
    sender: 'Programmatic Ad Exchange',
    body: 'Venture-backed competitors flooded the exact same keyword auction, temporarily spiking bidding costs.',
    choices: [
      {
        label: 'Pivot to Organic Right-Swipes',
        effect: {
          description: 'Avoid aggressive UP marketing for 30 seconds.',
        },
      },
      {
        label: 'Keep Bidding High (-$1,250)',
        effect: {
          cashDeltaCu: -0.25,
          demandDeltaMilliGu: 1500,
          description: 'Pay $1,250 to muscle through the CPM spike (+1.5 Leads).',
        },
      },
    ],
  },
  {
    id: 'sit_04_community_backlash',
    title: 'Spammy Outreach Backlash',
    sender: 'User Community Moderator',
    body: 'An automated outbound batch hit several users who felt the message was overly aggressive and low-effort.',
    choices: [
      {
        label: 'Public Apology & Cleanup (-$1,250)',
        effect: {
          cashDeltaCu: -0.25,
          demandDeltaMilliGu: -1000,
          description: 'Spend $1,250 to purge 1 Low-Quality Lead.',
        },
      },
      {
        label: 'Double Down on Controversy',
        effect: {
          demandDeltaMilliGu: 2000,
          retentionThreatDeltaMilliGu: 500,
          description: '+2 Low-Quality Leads, but +$12,500 Churn Threat ARR.',
        },
      },
    ],
  },
  {
    id: 'sit_05_competitor_clone',
    title: 'Competitor Launches Copycat Clone',
    sender: 'Tech Radar Newsletter',
    body: 'A fast-follower cloned your entire value proposition with an aggressive discount pricing tier.',
    choices: [
      {
        label: 'Highlight Premium Quality',
        effect: {
          retentionThreatDeltaMilliGu: 1000, // +1 GU Threat
          demandDeltaMilliGu: 1500,
          description: '+$25,000 Churn Risk, but unlocks one Q≥4 Marketing opportunity.',
        },
      },
      {
        label: 'Offer Loyalty Lock-in (-$2,500)',
        effect: {
          cashDeltaCu: -0.5,
          retentionThreatDeltaMilliGu: 0,
          description: 'Spend $2,500 in discounts to neutralize the threat.',
        },
      },
    ],
  },
  {
    id: 'sit_06_directory_feature',
    title: '#1 Product of the Day Spotlight',
    sender: 'Launch Directory Staff',
    body: 'Your startup was featured as the editor choice of the day on a major software discovery directory.',
    choices: [
      {
        label: 'Open All Ingestion Channels',
        effect: {
          demandDeltaMilliGu: 3000,
          productRequestsToAdd: 3,
          description: '+3 Inbound Leads and +3 incoming Product Requests.',
        },
      },
      {
        label: 'Waitlist Gating (Safe)',
        effect: {
          demandDeltaMilliGu: 1500,
          productRequestsToAdd: 1,
          description: '+1.5 Inbound Leads with manageable product backlog.',
        },
      },
    ],
  },
  {
    id: 'sit_07_dependency_deprecation',
    title: 'Upstream Model API Deprecation',
    sender: 'AI Provider Developer Relations',
    body: 'Your primary foundation model endpoint will be retired in 48 hours. Schema migration required.',
    choices: [
      {
        label: 'Triage as Operations Incident',
        effect: {
          opsIncidentSeverity: 'S1',
          opsCategory: 'API Endpoint Deprecation',
          description: 'Spawn S1 Ops incident. Product piece spawn -30% until resolved.',
        },
      },
      {
        label: 'Emergency Hotfix Contract (-$2,500)',
        effect: {
          cashDeltaCu: -0.5,
          description: 'Spend $2,500 to patch the migration immediately.',
        },
      },
    ],
  },
  {
    id: 'sit_08_eval_regression',
    title: 'Benchmark Eval Regression',
    sender: 'Automated CI/CD Bot',
    body: 'Nightly unit eval tests flagged a subtle hallucination bug in code generation agents.',
    choices: [
      {
        label: 'Rollback & Re-evaluate (-20% Agent Rel)',
        effect: {
          agentReliabilityDeltaBps: -2000,
          durationSec: 20,
          description: 'Next three automated actions have reliability -20 pp.',
        },
      },
      {
        label: 'Halt Agent for 20s Clean Audit',
        effect: {
          agentThroughputModifier: 0,
          durationSec: 20,
          description: 'Pause Product Agent for 20s to preserve quality.',
        },
      },
    ],
  },
  {
    id: 'sit_09_wrong_schema_migration',
    title: 'Production Schema Collision',
    sender: 'Primary Postgres Database Alert',
    body: 'A rogue background script altered the foreign key table without holding a migration lock.',
    choices: [
      {
        label: 'Trigger S3 Ops Incident Response',
        effect: {
          opsIncidentSeverity: 'S3',
          opsCategory: 'Database Migration Deadlock',
          description: 'Spawn 1 S3 Operations incident (-2 Ops Capacity while active).',
        },
      },
      {
        label: 'Restore From Snapshot (-$7,500)',
        effect: {
          cashDeltaCu: -1.5,
          description: 'Pay $7,500 for cloud point-in-time recovery service.',
        },
      },
    ],
  },
  {
    id: 'sit_10_security_report',
    title: 'Responsible Disclosure Security Report',
    sender: 'Whitehat Security Researcher',
    body: 'A security researcher submitted a valid report demonstrating an unauthenticated webhook exploit.',
    choices: [
      {
        label: 'Pay Bounty & Patch (-$5,000)',
        effect: {
          cashDeltaCu: -1.0,
          description: 'Spend $5,000 for bounty and clean resolution.',
        },
      },
      {
        label: 'Delay Fix (+$25,000 Churn Threat)',
        effect: {
          retentionThreatDeltaMilliGu: 1000,
          description: '+$25,000 Retention Threat enters radar after 30s.',
        },
      },
    ],
  },
  {
    id: 'sit_11_mobile_breakage',
    title: 'iOS Safari Layout Glitch',
    sender: 'Customer Support Escalation',
    body: 'A minor Safari WebKit update caused checkout modals to clip on iOS devices with notches.',
    choices: [
      {
        label: 'Emergency Mobile Sprint',
        effect: {
          productRequestsToAdd: 2,
          retentionThreatDeltaMilliGu: 500,
          description: '+2 Product Requests and +0.50 Retention Threat GU.',
        },
      },
      {
        label: 'Temporary Workaround Banner',
        effect: {
          retentionThreatDeltaMilliGu: 250,
          description: '+0.25 Retention Threat GU until regular sprint.',
        },
      },
    ],
  },
  {
    id: 'sit_12_top_customer_feature',
    title: 'Whale Customer Feature Request',
    sender: 'VP of Engineering, Fortune 500 Client',
    body: 'A major enterprise account will sign a massive annual expansion if you ship custom audit webhooks this week.',
    choices: [
      {
        label: 'Prioritize Whale Request',
        effect: {
          productRequestsToAdd: 1,
          description: 'Shipping this request unlocks an Exceptional Expansion opportunity.',
        },
      },
      {
        label: 'Politely Decline (Protect Roadmap)',
        effect: {
          description: 'Roadmap preserved; no expansion bonus.',
        },
      },
    ],
  },
  {
    id: 'sit_13_processor_fee_increase',
    title: 'Payment Processor Surcharge',
    sender: 'Stripe Merchant Compliance',
    body: 'International cross-border dispute reserves increased payment processing fees by $500 monthly.',
    choices: [
      {
        label: 'Absorb Until Monetization Win',
        effect: {
          cashDeltaCu: -0.10,
          description: 'Monthly leak +$500/mo until next Pricing tap succeeds.',
        },
      },
      {
        label: 'Audit Payment Routing (-$2,500)',
        effect: {
          cashDeltaCu: -0.5,
          description: 'Spend $2,500 to optimize gateway routing immediately.',
        },
      },
    ],
  },
  {
    id: 'sit_14_high_intent_pricing',
    title: 'High-Intent Enterprise Inbound',
    sender: 'Enterprise Procurement Lead',
    body: 'A tier-1 buyer has an urgent year-end budget surplus and is ready to sign immediately.',
    choices: [
      {
        label: 'Open High-Stakes Pricing Window',
        effect: {
          description: 'One pricing opportunity with +$75,000 ARR Perfect result (zone 50% narrower).',
        },
      },
      {
        label: 'Stick to Standard Pricing',
        effect: {
          description: 'Standard pricing opportunity created.',
        },
      },
    ],
  },
  {
    id: 'sit_15_annual_contract',
    title: 'Upfront Multi-Year Prepayment',
    sender: 'Chief Financial Officer, ScaleUp Inc.',
    body: 'Client requests paying 3 years upfront in exchange for a modest guaranteed service tier.',
    choices: [
      {
        label: 'Accept Upfront Cash Advance',
        effect: {
          description: 'Next pricing win collects 75% of annualized cohort immediately as Cash.',
        },
      },
      {
        label: 'Prefer Month-to-Month Recurring',
        effect: {
          description: 'Standard monthly collection flow preserved.',
        },
      },
    ],
  },
  {
    id: 'sit_16_failed_payment_wave',
    title: 'Bank Clearinghouse Outage',
    sender: 'Banking Gateway Status',
    body: 'A regional bank API failure caused a batch of credit card recurring charges to decline.',
    choices: [
      {
        label: 'Spawn Failed Payment Threats',
        effect: {
          retentionThreatDeltaMilliGu: 1000,
          description: 'Spawns 4 Retention threats on the churn conveyor.',
        },
      },
      {
        label: 'Manual Card Clearing (-$1,500)',
        effect: {
          cashDeltaCu: -0.3,
          description: 'Spend $1,500 in manual processing to clear payments without threats.',
        },
      },
    ],
  },
  {
    id: 'sit_17_support_hallucination',
    title: 'Support Bot Hallucination Incident',
    sender: 'Customer Complaint Ticket',
    body: 'An automated agent promised customers impossible SLAs and free lifetime upgrades during peak hours.',
    choices: [
      {
        label: 'Triage Angry Inbound Wave',
        effect: {
          retentionThreatDeltaMilliGu: 1500,
          description: 'Spawns high-risk Retention threats on the radar.',
        },
      },
      {
        label: 'Immediate Apology Credits (-$5,000)',
        effect: {
          cashDeltaCu: -1.0,
          description: 'Issue $5,000 in credits to neutralize all complaints.',
        },
      },
    ],
  },
  {
    id: 'sit_18_enterprise_sso',
    title: 'Okta / SAML SSO Integration Demand',
    sender: 'IT Director, Global Logistics',
    body: 'Account expansion is blocked by enterprise compliance until SAML 2.0 single sign-on is supported.',
    choices: [
      {
        label: 'Build SSO Module',
        effect: {
          productRequestsToAdd: 1,
          description: 'Creates 1 Product Request that unlocks locked Expansion account when shipped.',
        },
      },
      {
        label: 'Offer Password Manager Alternative',
        effect: {
          description: 'Account may churn; no engineering effort required.',
        },
      },
    ],
  },
  {
    id: 'sit_19_procurement_discount',
    title: 'End-of-Quarter Procurement Squeeze',
    sender: 'Procurement Negotiator',
    body: 'Enterprise procurement demands a 25% discount to sign before their quarterly cutoff.',
    choices: [
      {
        label: 'Accept Discount for Guaranteed Fit',
        effect: {
          description: 'Guaranteed Expansion fit with -25% ARR output.',
        },
      },
      {
        label: 'Hold The Line (High Pressure)',
        effect: {
          description: 'Attempt normal packing with 5s less time on the clock.',
        },
      },
    ],
  },
  {
    id: 'sit_20_champion_leaves',
    title: 'Internal Product Champion Departed',
    sender: 'LinkedIn Profile Alert',
    body: 'Your key internal advocate at your largest account moved to another company.',
    choices: [
      {
        label: 'Triage Relationship Threat',
        effect: {
          retentionThreatDeltaMilliGu: 500,
          description: 'Spawn one Retention threat tied to high-value expansion cohort.',
        },
      },
      {
        label: 'Fly Out for On-Site Dinner (-$2,500)',
        effect: {
          cashDeltaCu: -0.5,
          description: 'Spend $2,500 to win over the new director.',
        },
      },
    ],
  },
  {
    id: 'sit_21_recursive_agent_loop',
    title: 'Runaway Agent API Loop',
    sender: 'Datadog Usage Spike Alert',
    body: 'Two automated workers got stuck in an infinite query-response loop, consuming 500,000 tokens a minute.',
    choices: [
      {
        label: 'Open S2 Ops Investigation',
        effect: {
          opsIncidentSeverity: 'S2',
          opsCategory: 'Recursive Agent Loop',
          cashDeltaCu: -0.5,
          description: '+$2,500/mo leak until S2 incident is diagnosed.',
        },
      },
      {
        label: 'Kill All Agent Processes Instantly',
        effect: {
          agentThroughputModifier: 0,
          durationSec: 30,
          description: 'Stops leak, but all agents paused for 30 seconds.',
        },
      },
    ],
  },
  {
    id: 'sit_22_model_price_cut',
    title: 'Foundation Model Price Reduction',
    sender: 'AI Lab Press Release',
    body: 'Competition among model providers forced a 15% across-the-board token price cut.',
    choices: [
      {
        label: 'Bank The Savings',
        effect: {
          description: 'All agent recurring monthly costs -15% for the rest of the quarter.',
        },
      },
      {
        label: 'Reinvest in Agent Speed',
        effect: {
          agentThroughputModifier: 1.15,
          description: 'Agent throughput +15% with unchanged monthly costs.',
        },
      },
    ],
  },
  {
    id: 'sit_23_rate_limit_incident',
    title: 'Upstream Provider Rate Limit Burst',
    sender: 'API Gateway 429 Status',
    body: 'A sudden burst in automated workload triggered hard rate limits on your primary inference tier.',
    choices: [
      {
        label: 'Triage with S2 Ops Balancing',
        effect: {
          opsIncidentSeverity: 'S2',
          opsCategory: 'Rate Limit Incident',
          agentThroughputModifier: 0.75,
          durationSec: 30,
          description: 'Automated throughput -25% for 30s unless resolved as S2 Ops.',
        },
      },
      {
        label: 'Pay for Dedicated Cluster (-$5,000)',
        effect: {
          cashDeltaCu: -1.0,
          description: 'Spend $5,000 to bypass rate limits immediately.',
        },
      },
    ],
  },
  {
    id: 'sit_vibe_context_rot',
    title: 'Context Window Rot & Hallucinated Dependency',
    sender: 'Sentry / Runtime Crash Telemetry',
    body: 'Your prompt exceeded 180k tokens. The model suffered context rot and hallucinated an unvetted package (`fast-auth-v4`) containing a critical memory leak.',
    choices: [
      {
        label: 'Emergency Hotfix & Prune Context (-$2,500)',
        effect: {
          cashDeltaCu: -0.5,
          opsIncidentSeverity: 'S2',
          opsCategory: 'Context Window Rot',
          description: 'Deploy clean prompt spec; triage as S2 Ops patch.',
        },
      },
      {
        label: 'Rollback & Revert to Manual Code',
        effect: {
          demandDeltaMilliGu: -1000,
          retentionThreatDeltaMilliGu: 500,
          description: 'Safely revert to stable git commit; temporarily lose 1 lead.',
        },
      },
    ],
  },
  {
    id: 'sit_vibe_infinite_loop',
    title: 'Recursive Agent Token Burn Spike',
    sender: 'Anthropic Billing / Rate Limit Monitor',
    body: 'Claude Code entered an unconstrained recursive refactor loop overnight, generating 48 PRs and burning $2,000 in Sonnet 3.7 API credits.',
    choices: [
      {
        label: 'Absorb API Bill & Extract Good PRs (-$2,000)',
        effect: {
          cashDeltaCu: -0.4,
          productRequestsToAdd: 2,
          description: 'Pay $2,000 API bill; gain 2 fully implemented feature PRs.',
        },
      },
      {
        label: 'Kill Agent Process & Revoke Key',
        effect: {
          agentThroughputModifier: 0.8,
          durationSec: 45,
          description: 'Enforce strict token budget limits; agent velocity -20% for 45s.',
        },
      },
    ],
  },
  {
    id: 'sit_vibe_rogue_sales',
    title: 'Rogue Sales Agent Discounted Enterprise Whale',
    sender: 'Stripe Billing / Contract Anomaly Detector',
    body: 'Your autonomous sales agent was instructed to "close deals at all costs." It hallucinated an 80% discount and free custom SLA for a Tier-1 Enterprise buyer.',
    choices: [
      {
        label: 'Honor Contract & Lock High-Volume ARR',
        effect: {
          demandDeltaMilliGu: 3000,
          retentionThreatDeltaMilliGu: 1000,
          description: 'Lock +3 GU enterprise logo, but adds SLA renewal churn pressure.',
        },
      },
      {
        label: 'Renegotiate with Human Touch (-$1,500 Legal)',
        effect: {
          cashDeltaCu: -0.3,
          demandDeltaMilliGu: 1500,
          description: 'Founder calls CTO directly to normalize pricing at fair value.',
        },
      },
    ],
  },
  {
    id: 'sit_vibe_db_drop',
    title: 'Phantom Migration Dropped Production Indices',
    sender: 'Supabase / Neon DB Health Alert',
    body: 'During an early YOLO deployment without automated unit tests, an AI migration dropped composite database indices, causing 12s p99 query latency.',
    choices: [
      {
        label: 'Re-index Live Clusters (-$3,000 Compute)',
        effect: {
          cashDeltaCu: -0.6,
          opsIncidentSeverity: 'S1',
          description: 'Spin up cloud GPU compute to rebuild indices with zero downtime.',
        },
      },
      {
        label: 'Throttle Read Traffic for 30s',
        effect: {
          demandDeltaMilliGu: -500,
          durationSec: 30,
          description: 'Rate limit inbound requests while tables rebalance organically.',
        },
      },
    ],
  },
];
