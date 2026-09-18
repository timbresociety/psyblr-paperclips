export type FunctionId = 'demand' | 'product' | 'monetisation' | 'retention' | 'expansion' | 'operations'

export type SemanticAction =
  | { type: 'attention.switch'; functionId: FunctionId }
  | { type: 'demand.triage'; opportunityId: string; decision: 'reject' | 'qualify' }
  | { type: 'product.place'; componentId: string; slotId: string }
  | { type: 'product.verify' }
  | { type: 'product.ship' }
  | { type: 'monetisation.commit'; normalizedPriceFit: number }
  | { type: 'run.reset' }

export type Opportunity = {
  id: string
  title: string
  segment: string
  signal: string
  acquisitionCost: number
}

export type CompanyState = {
  cash: number
  contractualArr: number
  eligibleArr: number
  valuation: number
  elapsedSeconds: number
  activeFunction: FunctionId
  unlockedFunctions: FunctionId[]
  opportunity: Opportunity | null
  qualifiedOpportunity: Opportunity | null
  productSlots: Record<string, string | null>
  productVerified: boolean
  productShipped: boolean
  customerSigned: boolean
  collectionDueSeconds: number | null
  alerts: Array<{ id: string; tone: 'info' | 'warning' | 'critical'; text: string }>
  ledger: string[]
}

export const FUNCTION_ORDER: FunctionId[] = ['demand', 'product', 'monetisation', 'retention', 'expansion', 'operations']
