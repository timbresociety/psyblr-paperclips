import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'
import { CONSUMABLE_CATALOG, RELIC_CATALOG } from '../engine/constants'

describe('Pipeline Flow, Relics & Consumables', () => {
  it('advances sequentially through Demand -> Product -> Monetisation', () => {
    let state = createInitialState(123)
    expect(state.pipelineStage).toBe('demand')
    expect(state.activeFunction).toBe('demand')

    // 1. Qualify demand lead
    const signal = state.demandSignals[0]
    state = gameReducer(state, {
      type: 'demand.triage',
      signalId: signal.id,
      decision: 'qualify',
    })

    // Automatically transitions to product
    expect(state.pipelineStage).toBe('product')
    expect(state.activeFunction).toBe('product')
    expect(state.qualifiedOpportunities.length).toBe(1)

    // 2. Build & ship product
    state = gameReducer(state, {
      type: 'product.place_bucket',
      bucket: 'write',
      componentId: 'engine-streaming',
    })
    state = gameReducer(state, {
      type: 'product.place_bucket',
      bucket: 'diff',
      componentId: 'collab-presence',
    })
    state = gameReducer(state, {
      type: 'product.place_bucket',
      bucket: 'test',
      componentId: 'control-sandbox',
    })
    state = gameReducer(state, {
      type: 'product.place_bucket',
      bucket: 'deploy',
      componentId: 'deploy-edge',
    })
    state = gameReducer(state, { type: 'product.verify' })
    state = gameReducer(state, { type: 'product.ship' })

    // Automatically transitions to monetisation
    expect(state.pipelineStage).toBe('monetisation')
    expect(state.activeFunction).toBe('monetisation')
    expect(state.currentActivation).not.toBeNull()

    // 3. Close contract in Monetisation
    state = gameReducer(state, { type: 'monetisation.commit_price' })

    // Customer onboarded, ARR created
    expect(state.accounts.length).toBe(1)
    expect(state.contractualArrCents).toBeGreaterThan(0)

    // Automatically returns to demand since queue is empty
    expect(state.pipelineStage).toBe('demand')
    expect(state.activeFunction).toBe('demand')
  })

  it('deploys consumables and applies immediate tactical super-powers', () => {
    let state = createInitialState(456)
    const initialCash = state.cashCents

    // Add Emergency SAFE consumable
    state = {
      ...state,
      consumablesInventory: [CONSUMABLE_CATALOG[1]], // emergency_safe
    }

    state = gameReducer(state, {
      type: 'consumable.use',
      consumableId: CONSUMABLE_CATALOG[1].id,
    })

    // Injected $50,000 cash
    expect(state.cashCents).toBe(initialCash + 5_000_000)
    expect(state.consumablesInventory.length).toBe(0)

    // Add War Room consumable
    state = {
      ...state,
      consumablesInventory: [CONSUMABLE_CATALOG[2]], // war_room
    }
    state = gameReducer(state, {
      type: 'consumable.use',
      consumableId: CONSUMABLE_CATALOG[2].id,
    })
    expect(state.warRoomTicksRemaining).toBe(300)

    // Add Defense RFP consumable
    state = {
      ...state,
      consumablesInventory: [CONSUMABLE_CATALOG[5]], // defense_rfp
    }
    state = gameReducer(state, {
      type: 'consumable.use',
      consumableId: CONSUMABLE_CATALOG[5].id,
    })
    expect(state.contractualArrCents).toBeGreaterThanOrEqual(250_000_00)
  })

  it('triggers and resolves event-driven minigames for Retention, Expansion, Operations', () => {
    let state = createInitialState(789)
    state = {
      ...state,
      retentionEvent: {
        active: true,
        accountId: 'acc-1',
        accountName: 'Test Inc',
        reason: 'SLA defect spike',
        deadlineTick: 300,
        savedArrCents: 50_000,
      },
    }

    state = gameReducer(state, { type: 'event.resolve_retention' })
    expect(state.retentionEvent).toBeNull()
    expect(state.activeFunction).toBe('demand')
  })

  it('strictly blocks product shipping and price commit without qualified demand', () => {
    let state = createInitialState(101)
    expect(state.qualifiedOpportunities.length).toBe(0)
    expect(state.currentActivation).toBeNull()

    // Trying to ship product without qualified opportunities
    state = gameReducer(state, { type: 'product.ship' })
    expect(state.currentActivation).toBeNull()
    expect(state.alerts.some(a => a.title === 'No Market Demand')).toBe(true)

    // Trying to commit price without currentActivation
    state = gameReducer(state, { type: 'monetisation.commit_price' })
    expect(state.accounts.length).toBe(0)
  })

  it('merges expansion packages for mature accounts and resolves operations incidents', () => {
    let state = createInitialState(202)

    // Seed account with 150s maturity (1,500 ticks) and 85% health
    state = {
      ...state,
      accounts: [
        {
          id: 'acc-enterprise-1',
          name: 'Apex Global Corp',
          segment: 'enterprise',
          baseMrrCents: 100_000,
          addonMrrCents: 0,
          health: 85,
          ageTicks: 1500,
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
      ],
      operations: {
        ...state.operations,
        incidentsBacklog: 1,
        scratchedEvidencePct: 0,
        diagnosedRootCause: null,
      },
    }

    // 1. Expansion: Merge package
    state = gameReducer(state, {
      type: 'expansion.merge_package',
      accountId: 'acc-enterprise-1',
      packId: 'pack-seats',
    })

    const expandedAccount = state.accounts.find(a => a.id === 'acc-enterprise-1')!
    expect(expandedAccount.addonSlotsUsed).toBe(1)
    expect(expandedAccount.addonMrrCents).toBe(25_000) // 25% of 100,000 cents
    expect(state.arrBridge.expansionArrCents).toBe(300_000) // 25,000 * 12

    // 2. Operations: Scratch evidence to reach diagnosis
    state = gameReducer(state, {
      type: 'operations.scratch_evidence',
      amount: 0.8,
    })
    expect(state.operations.scratchedEvidencePct).toBe(0.8)
    expect(state.operations.diagnosedRootCause).not.toBeNull()

    // 3. Operations: Resolve incident
    state = gameReducer(state, { type: 'operations.resolve_incident' })
    expect(state.operations.incidentsBacklog).toBe(0)
    expect(state.operations.diagnosedRootCause).toBeNull()
  })

  it('manages quarterly Shop & Lock and reroll mechanics with tiered pricing', () => {
    let state = createInitialState(789)
    state = {
      ...state,
      cashCents: 10_000_000, // $100,000 liquid capital
      quarter: 2,
      quarterReviewPending: true,
      consumablesInventory: [],
      availableQuarterRelics: [RELIC_CATALOG[0], RELIC_CATALOG[1], RELIC_CATALOG[2]],
      availableQuarterConsumables: [CONSUMABLE_CATALOG[0], CONSUMABLE_CATALOG[1], CONSUMABLE_CATALOG[2]],
      lockedQuarterRelicIds: [],
      lockedQuarterConsumableIds: [],
    }

    // 1. Lock a relic and a consumable
    const relicToLock = RELIC_CATALOG[0]
    const consToLock = CONSUMABLE_CATALOG[0]

    state = gameReducer(state, { type: 'relic.lock', relicId: relicToLock.id })
    expect(state.lockedQuarterRelicIds).toContain(relicToLock.id)

    state = gameReducer(state, { type: 'consumable.lock', consumableId: consToLock.id })
    expect(state.lockedQuarterConsumableIds).toContain(consToLock.id)

    // 2. Reroll shop
    const cashBeforeReroll = state.cashCents
    state = gameReducer(state, { type: 'quarter.reroll' })

    // Cash was deducted
    expect(state.cashCents).toBeLessThan(cashBeforeReroll)
    // Locked items are retained
    expect(state.availableQuarterRelics?.some(r => r.id === relicToLock.id)).toBe(true)
    expect(state.availableQuarterConsumables?.some(c => c.id === consToLock.id)).toBe(true)

    // 3. Select relic and verify cost is deducted
    const initialActiveRelics = state.activeRelics.length
    const cashBeforeRelic = state.cashCents
    const relicCost = relicToLock.costCents ?? 0

    state = gameReducer(state, { type: 'relic.select', relicId: relicToLock.id })
    expect(state.activeRelics.length).toBe(initialActiveRelics + 1)
    expect(state.cashCents).toBe(cashBeforeRelic - relicCost)

    // 4. Select consumable and verify cost is deducted
    const cashBeforeCons = state.cashCents
    const consCost = consToLock.costCents ?? 0

    state = gameReducer(state, { type: 'consumable.select', consumableId: consToLock.id })
    expect(state.consumablesInventory.length).toBe(1)
    expect(state.cashCents).toBe(cashBeforeCons - consCost)
  })

  it('supports up to 6 consumable slots and rejects purchases when full', () => {
    let state = createInitialState(999)
    state = {
      ...state,
      cashCents: 50_000_000, // $500k
      consumablesInventory: [
        CONSUMABLE_CATALOG[0],
        CONSUMABLE_CATALOG[1],
        CONSUMABLE_CATALOG[2],
        CONSUMABLE_CATALOG[3],
        CONSUMABLE_CATALOG[4],
      ],
      availableQuarterConsumables: [CONSUMABLE_CATALOG[5], CONSUMABLE_CATALOG[6]],
    }

    // 6th consumable can be bought
    state = gameReducer(state, { type: 'consumable.select', consumableId: CONSUMABLE_CATALOG[5].id })
    expect(state.consumablesInventory.length).toBe(6)

    // 7th consumable should be rejected (slots maxed at 6)
    const cashBeforeSeventh = state.cashCents
    state = gameReducer(state, { type: 'consumable.select', consumableId: CONSUMABLE_CATALOG[6].id })
    expect(state.consumablesInventory.length).toBe(6)
    expect(state.cashCents).toBe(cashBeforeSeventh)
  })

  it('preserves locked upgrades and consumables across quarter transitions', () => {
    let state = createInitialState(123)
    const relicToLock = RELIC_CATALOG[2]
    const consToLock = CONSUMABLE_CATALOG[2]

    state = {
      ...state,
      quarter: 1,
      monthInQuarter: 3,
      ticksInCurrentMonth: 599, // 1 tick away from quarter 2 transition (3*600 = 1800 ticks)
      availableQuarterRelics: [RELIC_CATALOG[0], RELIC_CATALOG[1], relicToLock],
      availableQuarterConsumables: [CONSUMABLE_CATALOG[0], consToLock],
      lockedQuarterRelicIds: [],
      lockedQuarterConsumableIds: [],
      quarterReviewPending: true,
      paused: true,
    }

    // Lock the upgrade and consumable
    state = gameReducer(state, { type: 'relic.lock', relicId: relicToLock.id })
    state = gameReducer(state, { type: 'consumable.lock', consumableId: consToLock.id })
    expect(state.lockedQuarterRelicIds).toContain(relicToLock.id)
    expect(state.lockedQuarterConsumableIds).toContain(consToLock.id)

    // User continues quarter review -> game unpauses and review modal closes
    state = gameReducer(state, { type: 'quarter.close_review' })
    expect(state.quarterReviewPending).toBe(false)
    expect(state.paused).toBe(false)

    // Advance 1 tick across the quarter boundary into Quarter 2
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
    expect(state.quarter).toBe(2)
    expect(state.quarterReviewPending).toBe(true)

    // Verify locked relic is retained in availableQuarterRelics and still marked locked
    expect(state.availableQuarterRelics?.some(r => r.id === relicToLock.id)).toBe(true)
    expect(state.lockedQuarterRelicIds).toContain(relicToLock.id)

    // Verify locked consumable is retained in availableQuarterConsumables and still marked locked
    expect(state.availableQuarterConsumables?.some(c => c.id === consToLock.id)).toBe(true)
    expect(state.lockedQuarterConsumableIds).toContain(consToLock.id)

    // Unlock the consumable
    state = gameReducer(state, { type: 'consumable.lock', consumableId: consToLock.id })
    expect(state.lockedQuarterConsumableIds).not.toContain(consToLock.id)
  })
})

