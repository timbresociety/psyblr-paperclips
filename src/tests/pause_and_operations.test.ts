import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'

describe('Pause Invariants & Operations Diagnostic Rig', () => {
  it('halts simulation clock ticks when the simulation is paused and resumes on run.resume', () => {
    let state = createInitialState(1)
    const initialElapsed = state.elapsedTicks
    const initialCash = state.cashCents

    // Explicitly pause simulation
    state = gameReducer(state, { type: 'run.pause' })
    expect(state.paused).toBe(true)

    // Clock ticks are frozen during pause
    state = gameReducer(state, { type: 'clock.tick' })
    expect(state.elapsedTicks).toBe(initialElapsed)
    expect(state.cashCents).toBe(initialCash)

    // Settings can be adjusted during pause
    state = gameReducer(state, { type: 'run.set_speed', speed: 2 })
    expect(state.speedMultiplier).toBe(2)

    // Unpause
    state = gameReducer(state, { type: 'run.resume' })
    expect(state.paused).toBe(false)

    // Clock tick advances now that simulation is resumed
    state = gameReducer(state, { type: 'clock.tick' })
    expect(state.elapsedTicks).toBe(initialElapsed + 1)
  })

  it('allows the Operations Diagnostic Rig to bank rewards and flush strain/rot on cash out', () => {
    let state = createInitialState(1)
    state.operations.strainBacklog = 12.0
    state.operations.contextRot = 0.40

    expect(state.activeScratchCard).toBeDefined()
    const card = state.activeScratchCard!
    const healthyPod = card.pods.find(p => !p.isNegative)!

    // Probe a healthy pod
    state = gameReducer(state, { type: 'operations.scratch_pod', podId: healthyPod.id })
    const updatedCard = state.activeScratchCard!
    expect(updatedCard.pods.find(p => p.id === healthyPod.id)?.isScratched).toBe(true)
    expect(updatedCard.isBusted).toBe(false)

    // Cash out
    const initialCash = state.cashCents
    const bankedCash = updatedCard.bankedCashCents ?? 0
    const bankedStrain = updatedCard.bankedStrainRelief ?? 0

    state = gameReducer(state, { type: 'operations.cash_out_card' })
    expect(state.cashCents).toBe(initialCash + bankedCash)
    expect(state.operations.strainBacklog).toBe(Math.max(0, 12.0 - bankedStrain))
    expect(state.activeScratchCard?.claimed).toBe(true)
  })

  it('trips thermal fault and incurs overload penalty when probing a trap pod', () => {
    let state = createInitialState(1)
    state.operations.strainBacklog = 2.0

    const card = state.activeScratchCard!
    const trapPod = card.pods.find(p => p.isNegative)!
    state = gameReducer(state, { type: 'operations.scratch_pod', podId: trapPod.id })
    expect(state.activeScratchCard?.isBusted).toBe(true)
    expect(state.operations.strainBacklog).toBeGreaterThan(2.0)
  })

  it('does not trigger operations incident event for mild normal strain, only severe strain', () => {
    let state = createInitialState(1)
    state.operations.strainBacklog = 5.0
    state.operations.contextRot = 0.20

    // Advance clock by 1 tick
    state = gameReducer(state, { type: 'clock.tick' })
    expect(state.operationsEvent).toBeNull()

    // Under severe strain (> 18), operations event triggers calmly
    state.operations.strainBacklog = 20.0
    state = gameReducer(state, { type: 'clock.tick' })
    expect(state.operationsEvent).not.toBeNull()
    expect(state.operationsEvent?.active).toBe(true)
    expect(state.operationsEvent?.title).toBe('Cluster Thermal Throttling')
  })
})
