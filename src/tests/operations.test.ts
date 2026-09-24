import { describe, it, expect } from 'vitest'
import { createInitialState, createDiagnosticTicket } from '../engine/state'
import { gameReducer } from '../engine/reducer'
import { calculateOperationsMetrics } from '../engine/formulas'

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
    state.fleet.operations.automateRank = 1
    state.fleet.operations.onlineUnits = 2
    state.fleet.operations.luckRank = 4
    state.operations.strainBacklog = 10
    state.operations.contextRot = 0.2
    state.activeTickets = [
      {
        id: 'clean-maintenance-ticket',
        stationIndex: 0,
        type: 'ticket',
        name: 'Clean Diagnostic Ticket',
        subtitle: 'Telemetry Verified',
        pods: [{
          id: 0,
          symbol: 'bolt',
          rewardType: 'strain',
          rewardValue: 4,
          label: 'Clean Telemetry: +4 Strain Drain',
          isScratched: false,
          isNegative: false,
        }],
        outcome: {
          id: 0,
          symbol: 'bolt',
          rewardType: 'strain',
          rewardValue: 4,
          label: 'Clean Telemetry: +4 Strain Drain',
          isScratched: false,
          isNegative: false,
        },
        scratchProgress: 0,
        claimed: false,
        bankedCashCents: 0,
        bankedStrainRelief: 0,
        bankedRotRelief: 0,
        bankedLuckDelta: 0,
        isBusted: false,
        isHazard: false,
        severity: 'nominal',
      },
    ]

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

  it('allows user to reject a negative hazard ticket with zero penalty and draw a fresh ticket', () => {
    let state = createInitialState(1)
    state.operations.strainBacklog = 5.0
    state.operations.contextRot = 0.1
    state.operations.incidentsBacklog = 0

    const initialStrain = state.operations.strainBacklog
    const initialRot = state.operations.contextRot
    const initialIncidents = state.operations.incidentsBacklog

    // Craft a negative hazard ticket on Rack 0
    const hazardPod = {
      id: 0,
      symbol: 'rotten' as const,
      rewardType: 'penalty' as const,
      rewardValue: 8,
      label: 'Thermal Fault: +8 Strain Overload',
      isScratched: false,
      isNegative: true,
    }
    state.activeTickets = [
      {
        id: 'test-hazard-ticket',
        stationIndex: 0,
        type: 'ticket',
        name: 'RACK // 01 Diagnostic Ticket',
        subtitle: 'Thermal Fault Diagnostic',
        pods: [hazardPod],
        outcome: hazardPod,
        scratchProgress: 0,
        claimed: false,
        bankedCashCents: 0,
        bankedStrainRelief: 0,
        bankedRotRelief: 0,
        bankedLuckDelta: 0,
        isBusted: false,
        isHazard: true,
        severity: 'critical',
      },
    ]

    // Reject the hazard ticket
    state = gameReducer(state, {
      type: 'operations.reject_ticket',
      ticketIndex: 0,
    })

    // Zero penalty must be incurred
    expect(state.operations.strainBacklog).toBe(initialStrain)
    expect(state.operations.contextRot).toBe(initialRot)
    expect(state.operations.incidentsBacklog).toBe(initialIncidents)

    // Fresh ticket drawn
    expect(state.activeTickets![0].id).not.toBe('test-hazard-ticket')
    expect(state.activeTickets![0].isBusted).toBe(false)

    // Alert logged targeted to operations
    const rejectAlert = state.alerts.find(a => a.id.startsWith('ticket-reject-'))
    expect(rejectAlert).toBeDefined()
    expect(rejectAlert?.targetFunction).toBe('operations')
  })

  it('applies fault penalties when scratching or redeeming a negative hazard ticket', () => {
    let state = createInitialState(1)
    state.operations.strainBacklog = 2.0
    state.operations.contextRot = 0.05
    state.operations.incidentsBacklog = 0

    // Craft a negative hazard ticket with +6 strain
    const hazardPod = {
      id: 0,
      symbol: 'rotten' as const,
      rewardType: 'penalty' as const,
      rewardValue: 6,
      label: 'Thermal Fault: +6 Strain Overload',
      isScratched: false,
      isNegative: true,
    }
    state.activeTickets = [
      {
        id: 'test-fault-ticket',
        stationIndex: 0,
        type: 'ticket',
        name: 'RACK // 01 Diagnostic Ticket',
        subtitle: 'Thermal Fault Diagnostic',
        pods: [hazardPod],
        outcome: hazardPod,
        scratchProgress: 0,
        claimed: false,
        bankedCashCents: 0,
        bankedStrainRelief: 0,
        bankedRotRelief: 0,
        bankedLuckDelta: 0,
        isBusted: false,
        isHazard: true,
        severity: 'critical',
      },
    ]

    // Scratch sector 0
    state = gameReducer(state, {
      type: 'operations.scratch_ticket',
      ticketIndex: 0,
      podIndex: 0,
    })

    // Penalty applied
    expect(state.operations.strainBacklog).toBe(8.0) // 2.0 + 6
    expect(state.activeTickets![0].isBusted).toBe(true)

    // Critical alert logged with targetFunction operations
    const faultAlert = state.alerts.find(a => a.id.startsWith('ticket-bust-'))
    expect(faultAlert).toBeDefined()
    expect(faultAlert?.tone).toBe('critical')
    expect(faultAlert?.targetFunction).toBe('operations')
    expect(faultAlert?.actionLabel).toBe('View Operations [6]')

    // Claiming busted ticket draws a fresh clean ticket
    state = gameReducer(state, {
      type: 'operations.claim_ticket',
      stationIndex: 0,
    })
    expect(state.activeTickets![0].id).not.toBe('test-fault-ticket')
    expect(state.activeTickets![0].isBusted).toBe(false)
  })

  it('autonomous daemons blindly open tickets on clock ticks and trigger faults on negative hazards', () => {
    let state = createInitialState(1)
    state.fleet.operations.automateRank = 2
    state.fleet.operations.onlineUnits = 2
    state.fleet.operations.luckRank = 0
    state.operations.strainBacklog = 2.0
    state.operations.contextRot = 0.05
    state.operations.incidentsBacklog = 0

    // Place a negative hazard ticket on Rack 0
    const hazardPod = {
      id: 0,
      symbol: 'panic' as const,
      rewardType: 'incident' as const,
      rewardValue: 1,
      label: 'Kernel Panic: +1 Critical Incident',
      isScratched: false,
      isNegative: true,
    }
    state.activeTickets = [
      {
        id: 'daemon-hazard-ticket',
        stationIndex: 0,
        type: 'ticket',
        name: 'RACK // 01 Diagnostic Ticket',
        subtitle: 'Kernel Panic Diagnostic',
        pods: [hazardPod],
        outcome: hazardPod,
        scratchProgress: 0,
        claimed: false,
        bankedCashCents: 0,
        bankedStrainRelief: 0,
        bankedRotRelief: 0,
        bankedLuckDelta: 0,
        isBusted: false,
        isHazard: true,
        severity: 'critical',
      },
    ]

    // Advance clock by 100 ticks (10s)
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 100 })

    // Autonomous daemons blindly opened the ticket: tripped the incident!
    expect(state.operations.incidentsBacklog).toBeGreaterThanOrEqual(1)

    // Daemon alert emitted targeted to operations
    const daemonAlert = state.alerts.find(a => a.id.startsWith('ticket-bust-daemon-'))
    expect(daemonAlert).toBeDefined()
    expect(daemonAlert?.tone).toBe('critical')
    expect(daemonAlert?.targetFunction).toBe('operations')
  })

  it('luck rank upgrade significantly reduces hazard rates and expands jackpot rewards', () => {
    // Generate 100 tickets at luckRank 0 vs luckRank 4
    const rank0Tickets = Array.from({ length: 100 }, () => createDiagnosticTicket(0, 0))
    const rank4Tickets = Array.from({ length: 100 }, () => createDiagnosticTicket(0, 4))

    const rank0Hazards = rank0Tickets.filter(t => t.pods[0]?.isNegative).length
    const rank4Hazards = rank4Tickets.filter(t => t.pods[0]?.isNegative).length

    // Rank 0 should have substantially more hazards than Rank 4
    expect(rank0Hazards).toBeGreaterThan(rank4Hazards)
    expect(rank0Hazards).toBeGreaterThanOrEqual(20) // ~35%
    expect(rank4Hazards).toBeLessThanOrEqual(25) // ~13%

    // Rank 4 should have golden tickets
    const rank4Goldens = rank4Tickets.filter(t => t.severity === 'golden').length
    expect(rank4Goldens).toBeGreaterThan(0)

    // Value variance: max reward at rank 4 should be higher
    const rank0Cash = rank0Tickets.filter(t => !t.pods[0]?.isNegative && t.pods[0]?.rewardType === 'cash').map(t => t.pods[0].rewardValue as number)
    const rank4Cash = rank4Tickets.filter(t => !t.pods[0]?.isNegative && t.pods[0]?.rewardType === 'cash').map(t => t.pods[0].rewardValue as number)

    expect(Math.max(...rank4Cash)).toBeGreaterThan(Math.max(...rank0Cash))
  })

  it('aggregates operations alerts for HUD badges and clears unacknowledged alerts on attention switch', () => {
    let state = createInitialState(1)
    state.activeFunction = 'demand'
    state.operations.incidentsBacklog = 1
    state.operations.strainBacklog = 12.0 // >= 10 strain alert
    state.operations.contextRot = 0.40 // >= 0.35 rot alert

    // Compute function nav alert count for operations
    const computeNavOpsAlerts = (s: typeof state) => {
      const opsEventActive = s.operationsEvent?.active ? 1 : 0
      const opsIncidentsCount = s.operations?.incidentsBacklog || 0
      const opsBustedCount = (s.activeTickets || []).filter(t => t.isBusted).length
      const opsStrainAlert = (s.operations?.strainBacklog ?? 0) >= 10 ? 1 : 0
      const opsRotAlert = (s.operations?.contextRot ?? 0) >= 0.35 ? 1 : 0
      const opsUnackAlerts = (s.alerts || []).filter(
        a => !a.acknowledged && (a.targetFunction === 'operations' || (a.tone === 'critical' && (a.id.startsWith('ticket-') || a.id.startsWith('ops-'))))
      ).length
      return opsEventActive + opsIncidentsCount + opsBustedCount + opsStrainAlert + opsRotAlert + opsUnackAlerts
    }

    // 1 incident + 1 strain + 1 rot = 3 alerts
    expect(computeNavOpsAlerts(state)).toBe(3)

    // Add an unacknowledged operations alert
    state.alerts.push({
      id: 'ticket-bust-manual-1',
      tone: 'critical',
      title: 'Thermal Fault Overload!',
      message: 'Rack 01 tripped a fault: +6 Strain',
      tick: state.elapsedTicks,
      targetFunction: 'operations',
      actionLabel: 'View Operations [6]',
      acknowledged: false,
    })
    expect(computeNavOpsAlerts(state)).toBe(4)

    // Switch attention to operations: acknowledges operations alerts
    state = gameReducer(state, { type: 'attention.switch', functionId: 'operations' })
    const opsAlert = state.alerts.find(a => a.id === 'ticket-bust-manual-1')
    expect(opsAlert?.acknowledged).toBe(true)

    // Alert count decrements unacknowledged alerts
    expect(computeNavOpsAlerts(state)).toBe(3)
  })
})

