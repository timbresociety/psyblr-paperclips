export type FeatureCategory = 'core' | 'enterprise' | 'viral' | 'retention' | 'monetization' | 'ai_magic';

export interface ProductFeature {
  id: string;
  name: string;
  category: FeatureCategory;
  buildPointsRequired: number;
  buildPointsCompleted: number;
  techDebtGenerated: number;
  description: string;
  tier: number;
  effects: {
    conversionBoost?: number; // e.g., +0.04 (+4%)
    enterpriseBoost?: number;
    viralityBoost?: number;
    retentionBoost?: number;
    arpuBoost?: number;
    trustBoost?: number;
    hypeBoost?: number;
  };
  isCompleted: boolean;
  isActiveRoadmap: boolean;
}

export interface TechDebtRefactorTask {
  id: string;
  name: string;
  description: string;
  debtReduced: number;
  buildPointsCost: number;
  cashCost: number;
  cooldownSeconds: number;
  lastExecutedAt?: number;
}

export interface ArchitectureUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  effectDescription: string;
  debtCapReduction: number;
  reliabilityBoost: number;
  isUnlocked: boolean;
}
