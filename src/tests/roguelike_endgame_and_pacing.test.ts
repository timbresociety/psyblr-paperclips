import { describe, it, expect } from 'vitest'
import { gameReducer } from '../engine/reducer'
import { createInitialState } from '../engine/state'
import {
  UPGRADE_RANK_COSTS,
  CRAFT_MULTIPLIERS,
  SCALE_UNITS,
  AUTOMATE_SPEEDS,
  RELIC_CATALOG,
  CONSUMABLE_CATALOG,
} from '../engine/constants'

describe('Roguelike Endgame, Pacing & Pacing 2.0 Invariants', () => {
  it('verifies 5 ranks exist in upgrade costs and multipliers', () => {
    expect(UPGRADE_RANK_COSTS.length).toBe(5)
    expect(UPGRADE_RANK_COSTS[4]).toBe(1_000_000_00) // $1,000,000 for Singularity tier

    expect(CRAFT_MULTIPLIERS.length).toBe(6) // rank 0..5
    expect(CRAFT_MULTIPLIERS[5]).toBe(32)

    expect(SCALE_UNITS.length).toBe(6)
    expect(SCALE_UNITS[5]).toBe(32)

    expect(AUTOMATE_SPEEDS.length).toBe(6)
    expect(AUTOMATE_SPEEDS[5]).toBe(1.8)
  })

  it('verifies the expanded relic and consumable catalog depth', () => {
    // Relics expanded beyond 30+
    expect(RELIC_CATALOG.length).toBeGreaterThanOrEqual(30)
    // Consumables expanded to 20
    expect(CONSUMABLE_CATALOG.length).toBe(20)

    // Ensure conditional synergies exist (Hades / FTL / Slay the Spire mechanics)
    const singularityCore = RELIC_CATALOG.find(r => r.id === 'relic-singularity-supercore')
    expect(singularityCore).toBeDefined()

    const circuitBreaker = RELIC_CATALOG.find(r => r.id === 'relic-circuit-breaker')
    expect(circuitBreaker).toBeDefined()
  })

  it('handles demand.hyper_triage by doubling CAC and ARR output', () => {
    let state = createInitialState()
    // Give enough cash
    state = { ...state, cashCents: 500_000_00 }

    const initialSignal = state.demandSignals[0]
    expect(initialSignal).toBeDefined()

    const startingOpportunities = state.qualifiedOpportunities.length
    const expectedCac = Math.round(initialSignal.acquisitionCostCents * 2)
    const expectedCash = state.cashCents - expectedCac

    const nextState = gameReducer(state, {
      type: 'demand.hyper_triage',
      signalId: initialSignal.id,
    })

    expect(nextState.cashCents).toBe(expectedCash)
    expect(nextState.qualifiedOpportunities.length).toBe(startingOpportunities + 1)
    const qualified = nextState.qualifiedOpportunities[nextState.qualifiedOpportunities.length - 1]
    expect(qualified.estimatedWtpCents).toBe(initialSignal.estimatedWtpCents * 2)
  })

  it('handles tutorial and onboarding playbook actions', () => {
    let state = createInitialState()
    expect(state.hasSeenTutorial).toBe(false)
    expect(state.playbookDismissed).toBe(false)

    // Complete tutorial
    let nextState = gameReducer(state, { type: 'tutorial.complete' })
    expect(nextState.hasSeenTutorial).toBe(true)

    // Complete playbook step
    nextState = gameReducer(nextState, { type: 'playbook.complete_step', stepId: 'step_demand' })
    expect(nextState.playbookCompletedSteps).toContain('step_demand')

    // Dismiss playbook
    nextState = gameReducer(nextState, { type: 'playbook.dismiss' })
    expect(nextState.playbookDismissed).toBe(true)
  })

  it('supports upgrading fleet to Rank 5 when funds are available', () => {
    let state = createInitialState()
    // Set Product to Rank 4
    state = {
      ...state,
      cashCents: 2_000_000_00, // $2M cash
      fleet: {
        ...state.fleet,
        product: {
          ...state.fleet.product,
          craftRank: 4,
        },
      },
    }

    const nextState = gameReducer(state, {
      type: 'fleet.buy_upgrade',
      functionId: 'product',
      axis: 'craft',
    })

    expect(nextState.fleet.product.craftRank).toBe(5)
    expect(nextState.cashCents).toBe(2_000_000_00 - UPGRADE_RANK_COSTS[4])
  })
})
