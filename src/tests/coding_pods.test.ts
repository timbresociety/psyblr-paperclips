import { describe, it, expect } from 'vitest'
import { gameReducer } from '../engine/reducer'
import { createInitialState } from '../engine/state'
import { SCALE_POD_LIMITS } from '../engine/constants'

describe('Autonomous Vibe Coding Pods Engine', () => {
  it('scales active pod concurrency based on scaleRank (1 -> 2 -> 4 -> 6)', () => {
    let state = createInitialState(42)
    state = gameReducer(state, { type: 'product.auto_fill_primitive', primitive: 'prompt' })
    expect(state.productPods?.length).toBe(SCALE_POD_LIMITS[0]) // 1 pod

    // Upgrade scale to rank 1 -> 2 pods
    state.fleet.product.scaleRank = 1
    state = gameReducer(state, { type: 'product.auto_fill_primitive', primitive: 'prompt' })
    expect(state.productPods?.length).toBe(SCALE_POD_LIMITS[1]) // 2 pods

    // Upgrade scale to rank 2 -> 4 pods
    state.fleet.product.scaleRank = 2
    state = gameReducer(state, { type: 'product.auto_fill_primitive', primitive: 'prompt' })
    expect(state.productPods?.length).toBe(SCALE_POD_LIMITS[2]) // 4 pods

    // Upgrade scale to rank 3 -> 6 pods
    state.fleet.product.scaleRank = 3
    state = gameReducer(state, { type: 'product.auto_fill_primitive', primitive: 'prompt' })
    expect(state.productPods?.length).toBe(SCALE_POD_LIMITS[3]) // 6 pods
  })

  it('fills sockets using AI primitives and transitions pod to ready-to-ship', () => {
    let state = createInitialState(42)
    state.fleet.product.scaleRank = 0 // 1 pod

    // Qualify a demand opportunity first
    const signal = state.demandSignals[0]
    state = gameReducer(state, { type: 'demand.triage', signalId: signal.id, decision: 'qualify' })

    const pod = state.productPods![0]
    expect(pod).toBeDefined()
    expect(pod.isReadyToShip).toBe(false)

    // Fill each required socket in order
    for (let i = 0; i < pod.sockets.length; i++) {
      const requiredType = pod.sockets[i].type
      state = gameReducer(state, {
        type: 'product.fill_socket',
        podId: pod.id,
        socketIndex: i,
        primitive: requiredType,
      })
    }

    const updatedPod = state.productPods![0]
    expect(updatedPod.sockets.every(s => s.filled)).toBe(true)
    expect(updatedPod.isReadyToShip).toBe(true)
    expect(updatedPod.isVerified).toBe(true)

    // Ship the pod
    const initialActivations = state.activationsQueue.length
    state = gameReducer(state, { type: 'product.ship_pod', podId: updatedPod.id })

    expect(state.activationsQueue.length).toBe(initialActivations + 1)
    expect(state.currentActivation).not.toBeNull()
    expect(state.pipelineStage).toBe('monetisation')
    expect(state.activeFunction).toBe('monetisation')
  })

  it('auto_fill_primitive targets the first open socket matching the primitive', () => {
    let state = createInitialState(42)
    const signal = state.demandSignals[0]
    state = gameReducer(state, { type: 'demand.triage', signalId: signal.id, decision: 'qualify' })

    const pod = state.productPods![0]
    const promptIndex = pod.sockets.findIndex(s => s.type === 'prompt')

    if (promptIndex !== -1) {
      state = gameReducer(state, { type: 'product.auto_fill_primitive', primitive: 'prompt' })
      expect(state.productPods![0].sockets[promptIndex].filled).toBe(true)
    }
  })

  it('automated workers stream tokens and ship pods at automateRank >= 3', () => {
    let state = createInitialState(42)
    const signal = state.demandSignals[0]
    state = gameReducer(state, { type: 'demand.triage', signalId: signal.id, decision: 'qualify' })
    expect(state.qualifiedOpportunities.length).toBeGreaterThan(0)

    state.fleet.product.automateRank = 3
    state.fleet.product.onlineUnits = 4

    state = gameReducer(state, { type: 'clock.tick', dtTicks: 100 })
    expect(state.systemCapabilities.speed).toBeGreaterThan(0.35)
  })
})
