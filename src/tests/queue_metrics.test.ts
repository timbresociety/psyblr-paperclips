import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'
import { computeQueueBadges } from '../ui/hq/queueMetrics'

// computeQueueBadges is the single source both the FunctionNav rail and the
// HQ desk badges read — a regression here corrupts attention pressure on two
// surfaces at once, so it gets direct coverage (review finding #11).
describe('computeQueueBadges', () => {
  it('reports the initial demand backlog and zero elsewhere', () => {
    const state = createInitialState(42)
    const badges = computeQueueBadges(state)

    expect(badges.demand.count).toBe(state.demandSignals.length)
    expect(badges.demand.count).toBeGreaterThan(0)
    expect(badges.product.count).toBe(0)
    expect(badges.monetisation.count).toBe(0)
    expect(badges.retention.count).toBe(0)
    expect(badges.expansion.count).toBe(0)
  })

  it('moves backlog from demand to product when a signal is qualified', () => {
    let state = createInitialState(100)
    const before = computeQueueBadges(state)
    const signal = state.demandSignals[0]

    state = gameReducer(state, { type: 'demand.triage', signalId: signal.id, decision: 'qualify' })
    const after = computeQueueBadges(state)

    expect(after.demand.count).toBe(before.demand.count - 1)
    expect(after.product.count).toBe(before.product.count + 1)
  })

  it('counts a threatened account exactly once across threat sources', () => {
    const state = createInitialState(7)
    const threatened = {
      id: 'acct-1',
      isThreatened: true,
      health: 40,
    } as unknown as (typeof state.accounts)[number]
    const withThreat = {
      ...state,
      accounts: [threatened],
      retentionIncidents: [{ id: 'inc-1', accountId: 'acct-1' }] as typeof state.retentionIncidents,
    }

    // Same account surfaced via low health, isThreatened, AND an incident — one badge unit.
    expect(computeQueueBadges(withThreat).retention.count).toBe(1)
  })

  it('escalates operations tone only when backlog exists', () => {
    const state = createInitialState(11)
    const calm = computeQueueBadges(state)
    expect(calm.operations.count).toBe(0)
    expect(calm.operations.tone).toBe('accent')

    const strained = {
      ...state,
      operations: { ...state.operations, strainBacklog: 12 },
    }
    const hot = computeQueueBadges(strained)
    expect(hot.operations.count).toBeGreaterThan(0)
    expect(hot.operations.tone).toBe('warning')
  })
})
