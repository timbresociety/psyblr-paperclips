import type { ProductFeature, TechDebtRefactorTask, ArchitectureUpgrade } from '../types/product';

export const INITIAL_PRODUCT_FEATURES: ProductFeature[] = [
  // Tier 1 (Early Stage)
  {
    id: 'feat_dark_mode',
    name: 'Dark Mode (OLED Black)',
    category: 'core',
    buildPointsRequired: 100,
    buildPointsCompleted: 0,
    techDebtGenerated: 4,
    tier: 1,
    description: 'Founders on Twitter will refuse to use the product without this.',
    effects: { conversionBoost: 0.05, hypeBoost: 3 },
    isCompleted: false,
    isActiveRoadmap: true
  },
  {
    id: 'feat_landing_redesign',
    name: 'Hero Section Bento Grid',
    category: 'viral',
    buildPointsRequired: 120,
    buildPointsCompleted: 0,
    techDebtGenerated: 3,
    tier: 1,
    description: 'Bento grid with glowing purple border gradients. 10x perceived legitimacy.',
    effects: { conversionBoost: 0.08, viralityBoost: 0.06 },
    isCompleted: false,
    isActiveRoadmap: true
  },
  {
    id: 'feat_stripe_checkout',
    name: 'Stripe 1-Click Checkout',
    category: 'monetization',
    buildPointsRequired: 150,
    buildPointsCompleted: 0,
    techDebtGenerated: 5,
    tier: 1,
    description: 'Takes customer credit cards before they can change their mind.',
    effects: { arpuBoost: 5, conversionBoost: 0.04 },
    isCompleted: false,
    isActiveRoadmap: true
  },
  {
    id: 'feat_csv_export',
    name: 'CSV & Excel Export',
    category: 'core',
    buildPointsRequired: 180,
    buildPointsCompleted: 0,
    techDebtGenerated: 6,
    tier: 1,
    description: 'Users can download all their data into spreadsheets to feel productive.',
    effects: { retentionBoost: 0.05, conversionBoost: 0.03 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_tweet_share',
    name: '"Built with AI" Badge',
    category: 'viral',
    buildPointsRequired: 200,
    buildPointsCompleted: 0,
    techDebtGenerated: 3,
    tier: 1,
    description: 'Viral watermark on every shared workspace link.',
    effects: { viralityBoost: 0.12, hypeBoost: 5 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_magic_links',
    name: 'Passwordless Magic Links',
    category: 'core',
    buildPointsRequired: 220,
    buildPointsCompleted: 0,
    techDebtGenerated: 5,
    tier: 1,
    description: 'Eliminates passwords. Replaces them with deliverability complaints in spam folders.',
    effects: { conversionBoost: 0.06, retentionBoost: 0.04 },
    isCompleted: false,
    isActiveRoadmap: false
  },

  // Tier 2 (Growth Stage)
  {
    id: 'feat_webhook_engine',
    name: 'Webhooks & Zapier Sync',
    category: 'core',
    buildPointsRequired: 350,
    buildPointsCompleted: 0,
    techDebtGenerated: 8,
    tier: 2,
    description: 'Lets automation freaks trigger 10,000 tasks every time a row updates.',
    effects: { retentionBoost: 0.08, arpuBoost: 10 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_sso_saml',
    name: 'Enterprise SSO / SAML 2.0',
    category: 'enterprise',
    buildPointsRequired: 500,
    buildPointsCompleted: 0,
    techDebtGenerated: 12,
    tier: 2,
    description: 'Unlocks Okta login. Required before any IT director will even look at you.',
    effects: { enterpriseBoost: 0.25, arpuBoost: 25 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_ai_autocomplete',
    name: 'AI Auto-Suggest Engine',
    category: 'ai_magic',
    buildPointsRequired: 450,
    buildPointsCompleted: 0,
    techDebtGenerated: 10,
    tier: 2,
    description: 'Ghost text autocompletion that feels 5 years ahead of reality.',
    effects: { hypeBoost: 8, conversionBoost: 0.10 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_annual_billing',
    name: 'Annual Billing Toggle (20% Off)',
    category: 'monetization',
    buildPointsRequired: 400,
    buildPointsCompleted: 0,
    techDebtGenerated: 6,
    tier: 2,
    description: 'Extracts 12 months of cash upfront to extend startup runway.',
    effects: { arpuBoost: 15, retentionBoost: 0.10 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_audit_logs',
    name: 'SOC 2 Audit Logging',
    category: 'enterprise',
    buildPointsRequired: 600,
    buildPointsCompleted: 0,
    techDebtGenerated: 10,
    tier: 2,
    description: 'Records every single click into an immutable log no human will ever inspect.',
    effects: { enterpriseBoost: 0.20, trustBoost: 5 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_analytics_dashboard',
    name: 'Executive ROI Analytics',
    category: 'retention',
    buildPointsRequired: 480,
    buildPointsCompleted: 0,
    techDebtGenerated: 7,
    tier: 2,
    description: 'Generates beautiful line charts proving customers saved 14 hours this week.',
    effects: { retentionBoost: 0.12, arpuBoost: 8 },
    isCompleted: false,
    isActiveRoadmap: false
  },

  // Tier 3 (Scale Stage)
  {
    id: 'feat_custom_models',
    name: 'Fine-Tuned Domain Models',
    category: 'ai_magic',
    buildPointsRequired: 1200,
    buildPointsCompleted: 0,
    techDebtGenerated: 18,
    tier: 3,
    description: 'Proprietary weights running on quantized endpoints for 99.4% precision.',
    effects: { hypeBoost: 15, conversionBoost: 0.15, enterpriseBoost: 0.20 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_rbac_roles',
    name: 'Granular RBAC Permissions',
    category: 'enterprise',
    buildPointsRequired: 1000,
    buildPointsCompleted: 0,
    techDebtGenerated: 15,
    tier: 3,
    description: 'Custom roles for VP, Director, Associate, and "External Contractor with Read Only".',
    effects: { enterpriseBoost: 0.30, arpuBoost: 35 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_self_healing',
    name: 'Autonomous Self-Healing Backend',
    category: 'ai_magic',
    buildPointsRequired: 1500,
    buildPointsCompleted: 0,
    techDebtGenerated: 14,
    tier: 3,
    description: 'Agents automatically patch runtime exceptions before Sentry sends an email.',
    effects: { trustBoost: 10, retentionBoost: 0.15 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_enterprise_sla',
    name: '99.99% Guaranteed SLA',
    category: 'enterprise',
    buildPointsRequired: 1800,
    buildPointsCompleted: 0,
    techDebtGenerated: 20,
    tier: 3,
    description: 'Guarantees four nines of uptime backed by financial penalties we hope never trigger.',
    effects: { enterpriseBoost: 0.40, arpuBoost: 50 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_prompt_marketplace',
    name: 'Community Template Ecosystem',
    category: 'viral',
    buildPointsRequired: 1400,
    buildPointsCompleted: 0,
    techDebtGenerated: 12,
    tier: 3,
    description: 'User-generated workflows that drive viral creator adoption loops.',
    effects: { viralityBoost: 0.25, hypeBoost: 12 },
    isCompleted: false,
    isActiveRoadmap: false
  },
  {
    id: 'feat_multi_region',
    name: 'Global Multi-Region Edge Deploy',
    category: 'core',
    buildPointsRequired: 2200,
    buildPointsCompleted: 0,
    techDebtGenerated: 22,
    tier: 3,
    description: 'Sub-10ms latency worldwide via 48 distributed edge nodes.',
    effects: { retentionBoost: 0.18, trustBoost: 8 },
    isCompleted: false,
    isActiveRoadmap: false
  }
];

export const TECH_DEBT_REFACTORS: TechDebtRefactorTask[] = [
  {
    id: 'refactor_quick_patch',
    name: 'Hotfix & Dependency Update',
    description: 'Run npm audit fix and pray nothing breaks. Reduces 5 Tech Debt.',
    debtReduced: 5,
    buildPointsCost: 50,
    cashCost: 100,
    cooldownSeconds: 15
  },
  {
    id: 'refactor_test_suite',
    name: 'End-to-End Test Suite',
    description: 'Write automated Playwright tests to catch regression bugs. Reduces 12 Tech Debt.',
    debtReduced: 12,
    buildPointsCost: 180,
    cashCost: 300,
    cooldownSeconds: 30
  },
  {
    id: 'refactor_db_indexes',
    name: 'Database Query Optimization',
    description: 'Add missing SQL indexes and optimize slow JOIN queries. Reduces 20 Tech Debt.',
    debtReduced: 20,
    buildPointsCost: 400,
    cashCost: 800,
    cooldownSeconds: 60
  },
  {
    id: 'refactor_rewrite',
    name: 'Complete Microservice Decoupling',
    description: 'Burn the monolithic spaghetti code to the ground. Reduces 40 Tech Debt.',
    debtReduced: 40,
    buildPointsCost: 1200,
    cashCost: 2500,
    cooldownSeconds: 120
  }
];

export const ARCHITECTURE_UPGRADES: ArchitectureUpgrade[] = [
  {
    id: 'arch_cicd',
    name: 'Automated CI/CD Pipeline',
    description: 'Pre-flight linting and automated preview environments prevent broken builds.',
    cost: 500,
    level: 0,
    maxLevel: 5,
    effectDescription: '-15% Tech Debt accumulation per level',
    debtCapReduction: 5,
    reliabilityBoost: 10,
    isUnlocked: false
  },
  {
    id: 'arch_caching',
    name: 'Redis In-Memory Cache Cluster',
    description: 'Absorbs database load and accelerates API latency for agent swarms.',
    cost: 1500,
    level: 0,
    maxLevel: 5,
    effectDescription: '-10% Swarm Compute load per level',
    debtCapReduction: 8,
    reliabilityBoost: 15,
    isUnlocked: false
  },
  {
    id: 'arch_chaos',
    name: 'Automated Chaos Testing Suite',
    description: 'Simulates server crashes in production so agents write resilient code.',
    cost: 5000,
    level: 0,
    maxLevel: 5,
    effectDescription: '-15% Support Tickets & customer churn per level',
    debtCapReduction: 12,
    reliabilityBoost: 25,
    isUnlocked: false
  }
];

