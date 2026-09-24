import { describe, it, expect } from 'vitest'
import { gameReducer } from '../engine/reducer'
import { createInitialState } from '../engine/state'
import type { ExpansionOrder } from '../engine/types'

describe('Expansion Swarm Automation Engine', () => {
  it('autonomously fulfills matching expansion orders from merge grid during tick', () => {
    let state = createInitialState(1)
    
    // Setup a mature healthy account
    state.accounts = [
      {
        id: 'acc-exp-1',
        name: 'OmniFlow Cloud',
        segment: 'team',
        baseMrrCents: 15_000,
        addonMrrCents: 0,
        health: 85,
        ageTicks: 2000,
        addonSlotsUsed: 0,
        isThreatened: false,
        threatDeadlineTick: null,
        threatReason: null,
        unpaidGraceTicks: 0,
        delinquent: false,
        lastCollectionAttemptTick: null,
        fit: 0.9,
        overpricing: 0,
        defects: 0,
        serviceRemainderCents: 0,
      },
    ]

    // Setup an order
    const order: ExpansionOrder = {
      id: 'ord-test-1',
      accountId: 'acc-exp-1',
      accountName: 'OmniFlow Cloud',
      chain: 'infrastructure',
      targetTier: 2,
      rewardArrCents: 120_000, // $1,200/yr
      rewardCashCents: 20_000, // $200 cash
    }
    state.expansionOrders = [order]

    // Setup matching item on merge grid
    state.mergeGrid = Array(16).fill(null)
    state.mergeGrid[4] = {
      id: 'item-infra-2',
      chain: 'infrastructure',
      tier: 2,
    }

    // Enable automation on Expansion and Operations
    state.fleet.expansion.automateRank = 2
    state.fleet.expansion.onlineUnits = 16
    state.fleet.operations.onlineUnits = 16
    state.cashCents = 500_000

    // Run clock tick
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 50 })

    // Order should be fulfilled autonomously
    expect(state.expansionOrders?.find(o => o.id === 'ord-test-1')).toBeUndefined()
    expect(state.arrBridge.expansionArrCents).toBeGreaterThanOrEqual(120_000)
    expect(state.accounts[0].addonSlotsUsed).toBeGreaterThanOrEqual(1)
    expect(state.accounts[0].addonMrrCents).toBeGreaterThanOrEqual(10_000)
  })

  it('autonomously merges matching pairs on the grid when automateRank >= 2', () => {
    let state = createInitialState(1)
    state.mergeGrid = Array(16).fill(null)
    state.mergeGrid[0] = { id: 'm1', chain: 'intelligence', tier: 1 }
    state.mergeGrid[1] = { id: 'm2', chain: 'intelligence', tier: 1 }

    state.fleet.expansion.automateRank = 2
    state.fleet.expansion.onlineUnits = 16
    state.fleet.operations.onlineUnits = 16

    state = gameReducer(state, { type: 'clock.tick', dtTicks: 50 })

    // Items should be merged into tier 2
    const tier2Item = state.mergeGrid?.find(item => item && item.chain === 'intelligence' && item.tier === 2)
    expect(tier2Item).toBeDefined()
  })
})
