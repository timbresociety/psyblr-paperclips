export interface Trend {
  id: string;
  name: string;
  category: string;
  strength: number; // 0 to 100
  momentum: 'rising' | 'peaked' | 'falling' | 'stable';
  viralMultiplier: number;
  description: string;
}

export interface FounderPostTemplate {
  id: string;
  hook: string;
  archetype: 'VIBE_CODER' | 'FOUNDER_MODE' | 'E_ACC' | 'DOOMER' | 'THOUGHT_LEADER' | 'BUILD_IN_PUBLIC';
  baseAttention: number;
  hypeDelta: number;
  trustRiskDelta: number;
  content: string;
}

export interface GrowthCampaign {
  id: string;
  name: string;
  cost: number;
  durationSeconds: number;
  attentionPerSecond: number;
  hypeBoost: number;
  trustModifier: number;
  isUnlocked: boolean;
  isActive: boolean;
  timeRemainingSeconds: number;
  description: string;
}
