import type { CompanyState, SemanticAction } from '../contracts/game'
import { initialState } from './fixture'

const unlock = (state: CompanyState, functionId: CompanyState['activeFunction']) =>
  state.unlockedFunctions.includes(functionId) ? state.unlockedFunctions : [...state.unlockedFunctions, functionId]

export function reducer(state: CompanyState, action: SemanticAction): CompanyState {
  switch (action.type) {
    case 'attention.switch':
      if (!state.unlockedFunctions.includes(action.functionId)) return state
      return { ...state, activeFunction: action.functionId }
    case 'demand.triage': {
      if (!state.opportunity || state.opportunity.id !== action.opportunityId) return state
      if (action.decision === 'reject') {
        return {
          ...state,
          opportunity: null,
          alerts: [{ id: 'rejected', tone: 'warning', text: 'Signal rejected. Starter fixture has no second signal yet.' }],
          ledger: [...state.ledger, 'Rejected the first demand signal.'],
        }
      }
      const cash = state.cash - state.opportunity.acquisitionCost
      return {
        ...state,
        cash,
        qualifiedOpportunity: state.opportunity,
        opportunity: null,
        activeFunction: 'product',
        unlockedFunctions: unlock(state, 'product'),
        alerts: [{ id: 'qualified', tone: 'info', text: 'Qualified demand is waiting for a product.' }],
        ledger: [...state.ledger, `Qualified demand; spent $${state.opportunity.acquisitionCost} acquisition cash.`],
      }
    }
    case 'product.place':
      if (!state.qualifiedOpportunity || state.productShipped || !(action.slotId in state.productSlots)) return state
      return {
        ...state,
        productSlots: { ...state.productSlots, [action.slotId]: action.componentId },
        productVerified: false,
      }
    case 'product.verify': {
      const components = Object.values(state.productSlots)
      const valid = components.every(Boolean) && new Set(components).size === components.length
      return {
        ...state,
        productVerified: valid,
        alerts: [{ id: 'verify', tone: valid ? 'info' : 'warning', text: valid ? 'Build verified. Ship it.' : 'Verification failed. Fill all three slots with unique components.' }],
        ledger: [...state.ledger, valid ? 'Verified product build.' : 'Product verification failed.'],
      }
    }
    case 'product.ship':
      if (!state.productVerified) return state
      return {
        ...state,
        productShipped: true,
        activeFunction: 'monetisation',
        unlockedFunctions: unlock(state, 'monetisation'),
        alerts: [{ id: 'ship', tone: 'info', text: 'Activation created. Price the first contract.' }],
        ledger: [...state.ledger, 'Shipped verified product and created one activation.'],
      }
    case 'monetisation.commit': {
      if (!state.productShipped || state.customerSigned) return state
      const fit = Math.max(0, Math.min(1, action.normalizedPriceFit))
      const success = fit >= 0.42 && fit <= 0.72
      if (!success) {
        return {
          ...state,
          alerts: [{ id: 'price-miss', tone: 'warning', text: 'Price missed willingness-to-pay. Try the live band again.' }],
          ledger: [...state.ledger, `Pricing attempt missed at ${(fit * 100).toFixed(0)}% of band.`],
        }
      }
      const contractualArr = 12_000
      const eligibleArr = 12_000
      return {
        ...state,
        customerSigned: true,
        contractualArr,
        eligibleArr,
        valuation: eligibleArr * 8,
        collectionDueSeconds: state.elapsedSeconds + 8,
        alerts: [{ id: 'signed', tone: 'info', text: 'First customer signed. ARR is not cash; collection is pending.' }],
        ledger: [...state.ledger, 'Signed first customer at $12k ARR.', 'Invoice scheduled; cash has not been collected yet.'],
      }
    }
    case 'run.reset':
      return structuredClone(initialState)
  }
  return state
}

export function tick(state: CompanyState): CompanyState {
  const next = { ...state, elapsedSeconds: state.elapsedSeconds + 1 }
  if (next.collectionDueSeconds !== null && next.elapsedSeconds >= next.collectionDueSeconds) {
    return {
      ...next,
      cash: next.cash + 1_000,
      collectionDueSeconds: null,
      alerts: [{ id: 'collected', tone: 'info', text: '$1,000 collected. Now the company has liquid cash.' }],
      ledger: [...next.ledger, 'Collected first $1,000 monthly invoice.'],
    }
  }
  return next
}
