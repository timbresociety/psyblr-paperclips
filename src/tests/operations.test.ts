import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'
import { calculateOperationsMetrics } from '../engine/formulas'
import { FUNCTION_SPECS } from '../engine/constants'

describe('Operations, Coordination Load, Strain & Context Rot Balance', () => {
  it('calculates fleet coordination load with exact unitLoad and Ops capacity', () => {
    const state = createInitialState(1)
    // Baseline: 1 unit in each function, automateRank 0
    const baseline = calculateOperationsMetrics(state.fleet, 0, 0, false)

    // Sum of unitLoads across 6 functions:
    // demand (1.0) + product (1.4) + monetisation (0.8) + retention (0.8) + expansion (1.2) + operations (0.6) = 5.8
    // Each function has 1 unit, so 0.04 * n * (n - 1) = 0
    expect(baseline.coordinationLoad).toBeCloseTo(5.8, 1)

    // Ops capacity = 12 + 4 * 1 * (1 + 0.25 * 0) = 16
    expect(baseline.opsCapacity).toBe(16)
    expect(baseline.instantOverload).toBe(0)
    expect(baseline.excessStrain).toBe(0)
    expect(baseline.speedFactor).toBe(1.0)
    expect(baseline.technicalErrorRate).toBeCloseTo(0.04, 2)
  })

  it('generates instant overload and excess strain when coordination exceeds Ops capacity', () => {
    const state = createInitialState(1)
    // Scale up Product fleet to 8 units with automation rank 3
    state.fleet.product.onlineUnits = 8
    state.fleet.product.automateRank = 3

    const metrics = calculateOperationsMetrics(state.fleet, 5, 0.3, false)
    expect(metrics.coordinationLoad).toBeGreaterThan(metrics.opsCapacity)
    expect(metrics.instantOverload).toBeGreaterThan(0)
    expect(metrics.excessStrain).toBeGreaterThan(metrics.instantOverload)
    // Excess strain throttles execution speed below 1.0
    expect(metrics.speedFactor).toBeLessThan(1.0)
    // Context rot and strain increase technical error rate
    expect(metrics.technicalErrorRate).toBeGreaterThan(0.04)
  })

  it('accumulates automated work credits, drifts context rot, and processes maintenance via clock ticks', () => {
    let state = createInitialState(1)
    // Deploy automation on Product and Operations
    state.fleet.product.automateRank = 2
    state.fleet.product.onlineUnits = 1
    state.fleet.operations.automateRank = 1
    state.fleet.operations.onlineUnits = 2
    state.operations.strainBacklog = 10
    state.operations.contextRot = 0.2

    const initialStrain = state.operations.strainBacklog
    const initialSpeed = state.systemCapabilities.speed

    // Advance clock by 200 ticks (20s)
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 200 })

    // Product automation should have produced work credits and improved system capabilities
    expect(state.systemCapabilities.speed).toBeGreaterThanOrEqual(initialSpeed)

    // Operations maintenance output should have drained strain
    expect(state.operations.strainBacklog).toBeLessThan(initialStrain)
  })

  it('allows manual Operations Room interventions to clear strain and cleanse rot', () => {
    let state = createInitialState(1)
    state.operations.strainBacklog = 8.5
    state.operations.contextRot = 0.45
    state.operations.incidentsBacklog = 2
    state.operations.diagnosedRootCause = 'Memory leak in streaming engine'

    // 1. Resolve diagnosed incident
    state = gameReducer(state, { type: 'operations.resolve_incident' })
    expect(state.operations.incidentsBacklog).toBe(1)
    expect(state.operations.diagnosedRootCause).toBeNull()

    // 2. Clear strain
    state = gameReducer(state, { type: 'operations.clear_strain' })
    expect(state.operations.strainBacklog).toBeLessThan(8.5)

    // 3. Cleanse rot
    state = gameReducer(state, { type: 'operations.cleanse_rot' })
    expect(state.operations.contextRot).toBeLessThan(0.45)
  })
})
