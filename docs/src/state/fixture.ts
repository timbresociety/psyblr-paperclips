import type { CompanyState } from '../contracts/game'

export const initialState: CompanyState = {
  cash: 5_000,
  contractualArr: 0,
  eligibleArr: 0,
  valuation: 0,
  elapsedSeconds: 0,
  activeFunction: 'demand',
  unlockedFunctions: ['demand'],
  opportunity: {
    id: 'opp.agent-sprawl',
    title: 'Ops teams are drowning in agent sprawl',
    segment: 'AI-native teams',
    signal: 'Three founders independently asked for a way to see what their agents changed and why.',
    acquisitionCost: 180,
  },
  qualifiedOpportunity: null,
  productSlots: { observe: null, explain: null, bill: null },
  productVerified: false,
  productShipped: false,
  customerSigned: false,
  collectionDueSeconds: null,
  alerts: [{ id: 'start', tone: 'info', text: 'Find one signal worth pursuing.' }],
  ledger: ['Company started with $5,000 cash.'],
}
