import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'

describe('Deterministic Economic Engine', () => {
  it('initializes with correct baseline capital and score invariants', () => {
    const state = createInitialState(42)
    expect(state.cashCents).toBe(150_000) // $1,500
    expect(state.contractualArrCents).toBe(0)
    expect(state.eligibleArrCents).toBe(0)
    expect(state.valuationCents).toBe(0)
    expect(state.activeFunction).toBe('demand')
    expect(state.demandSignals.length).toBeGreaterThan(0)
  })

  it('proves the golden first-customer loop with delayed cash collection', () => {
    let state = createInitialState(100)
    const initialCash = state.cashCents
    const signal = state.demandSignals[0]
    expect(signal).toBeDefined()

    // 1. Qualify Demand signal
    state = gameReducer(state, {
      type: 'demand.triage',
      signalId: signal.id,
      decision: 'qualify',
    })

    // Cash decreased by CAC
    expect(state.cashCents).toBe(initialCash - signal.acquisitionCostCents)
    // Switched attention to Product
    expect(state.activeFunction).toBe('product')

    // 2. Assemble Product in all 3 sockets
    state = gameReducer(state, {
      type: 'product.place_component',
      componentId: 'engine-streaming',
      slot: 'speed',
    })
    state = gameReducer(state, {
      type: 'product.place_component',
      componentId: 'collab-presence',
      slot: 'collaboration',
    })
    state = gameReducer(state, {
      type: 'product.place_component',
      componentId: 'control-sandbox',
      slot: 'control',
    })

    // 3. Verify architecture
    state = gameReducer(state, { type: 'product.verify' })
    expect(state.productVerified).toBe(true)

    // 4. Ship architecture
    state = gameReducer(state, { type: 'product.ship' })
    expect(state.activationsQueue.length).toBe(1)
    expect(state.currentActivation).not.toBeNull()
    expect(state.activeFunction).toBe('monetisation')

    // 5. Commit pricing in Monetisation
    const cashBeforeCommit = state.cashCents
    state = gameReducer(state, {
      type: 'monetisation.set_slider',
      normalizedCursor: 0.5, // 100% WTP
    })
    state = gameReducer(state, { type: 'monetisation.commit_price' })

    // Signed contract creates ARR
    expect(state.contractualArrCents).toBeGreaterThan(0)
    expect(state.eligibleArrCents).toBeGreaterThan(0)
    expect(state.valuationCents).toBeGreaterThan(0)
    expect(state.accounts.length).toBe(1)

    // CRITICAL INVARIANT: ARR IS NOT CASH. Cash did NOT increase immediately!
    expect(state.cashCents).toBe(cashBeforeCommit)
    expect(state.pendingInvoices.length).toBe(1)
    const invoice = state.pendingInvoices[0]
    expect(invoice.collected).toBe(false)

    // 6. Fast-forward clock to invoice collection timestamp
    const ticksToCollection = invoice.dueTick - state.elapsedTicks + 1
    state = gameReducer(state, { type: 'clock.tick', dtTicks: ticksToCollection })

    // Cash has now been collected!
    expect(state.cashCents).toBeGreaterThan(cashBeforeCommit)
    const updatedInvoice = state.pendingInvoices.find(i => i.id === invoice.id)
    expect(updatedInvoice?.collected).toBe(true)
  })

  it('guarantees 100% engine determinism under identical action sequences', () => {
    const seed = 9999
    let stateA = createInitialState(seed)
    let stateB = createInitialState(seed)

    const actions = [
      { type: 'demand.triage', signalId: stateA.demandSignals[0].id, decision: 'qualify' } as const,
      { type: 'product.place_component', componentId: 'engine-streaming', slot: 'speed' } as const,
      { type: 'product.place_component', componentId: 'collab-presence', slot: 'collaboration' } as const,
      { type: 'product.place_component', componentId: 'control-sandbox', slot: 'control' } as const,
      { type: 'product.verify' } as const,
      { type: 'product.ship' } as const,
      { type: 'monetisation.set_slider', normalizedCursor: 0.5 } as const,
      { type: 'monetisation.commit_price' } as const,
      { type: 'clock.tick', dtTicks: 200 } as const,
    ]

    for (const action of actions) {
      stateA = gameReducer(stateA, action)
      stateB = gameReducer(stateB, action)
    }

    expect(stateA.cashCents).toBe(stateB.cashCents)
    expect(stateA.contractualArrCents).toBe(stateB.contractualArrCents)
    expect(stateA.valuationCents).toBe(stateB.valuationCents)
    expect(stateA.elapsedTicks).toBe(stateB.elapsedTicks)
  })

  it('enforces insolvency failure when mandatory bills cannot be paid', () => {
    let state = createInitialState(42)
    state.cashCents = 100 // only $1 left

    // Advance 600 ticks (month boundary) where $100 overhead bill triggers
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 620 })

    expect(state.runStatus).toBe('failed')
    expect(state.failureReason).toContain('Insolvency')
  })
})
