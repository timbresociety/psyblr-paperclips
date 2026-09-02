export type FundingRoundStage = 'PRE_SEED' | 'SEED' | 'SERIES_A' | 'SERIES_B' | 'SERIES_C' | 'UNICORN_DEAL';

export interface VCTermSheet {
  id: string;
  roundStage: FundingRoundStage;
  firmName: string;
  partnerName: string;
  partnerTitle: string;
  raiseAmount: number;
  valuation: number;
  dilutionPercent: number; // e.g. 15 for 15%
  hypeBoost: number;
  investorThesis: string;
  requiredMrr: number;
  requiredTrust: number;
  requiredAgents?: number;
  requiredProductLevel?: number;
  requiredComputeTierId?: string;
  requiresManager?: boolean;
  requiresExecutive?: boolean;
  requiresCEO?: boolean;
  isAvailable: boolean;
  isAccepted: boolean;
  expiresInSeconds?: number;
}

export interface ComputeTier {
  id: string;
  name: string;
  capacityCU: number;
  monthlyCost: number; // in Cash
  setupCost: number;
  reliabilityBoost: number;
  description: string;
  isUnlocked: boolean;
  isCurrent: boolean;
}

export interface FinancialMetrics {
  mrr: number;
  arr: number;
  cash: number;
  burnRate: number; // monthly cash expenses (compute + tools + campaigns)
  runwayMonths: number;
  grossMarginPercent: number;
  valuationMultiple: number;
  valuation: number;
  founderOwnership: number;
  totalRaised: number;
}
