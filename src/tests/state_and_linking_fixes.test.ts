import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'

describe('State Management, Event Resolution & Runway Alerts', () => {
  it('resolves operations drill by purging 75% strain without throwing user to another room', () => {
    let state = createInitialState(42)
    state = {
      ...state,
      activeFunction: 'operations',
      operations: {
        ...state.operations,
        strainBacklog: 40.0,
        contextRot: 0.5,
      },
      operationsEvent: {
        active: true,
        title: 'Cluster Strain Spike',
        severity: 'warning',
        incidentType: 'strain_spike',
        strainPenalty: 12,
        rotPenalty: 0.15,
      },
    }

    state = gameReducer(state, { type: 'event.resolve_operations' })

    expect(state.activeFunction).toBe('operations')
    expect(state.operationsEvent).toBeNull()
    // Strain purged by 75% -> 40 * 0.25 = 10.0
    expect(state.operations.strainBacklog).toBeCloseTo(10.0, 1)
    // Rot reduced by 0.35 -> 0.5 - 0.35 = 0.15
    expect(state.operations.contextRot).toBeCloseTo(0.15, 1)
    expect(state.operations.lastFailoverTick).toBe(state.elapsedTicks)
  })

  it('resolves retention drill by curing threatened account without changing activeFunction', () => {
    let state = createInitialState(42)
    state = {
      ...state,
      activeFunction: 'retention',
      accounts: [
        {
          id: 'acc-test',
          name: 'Acme Corp',
          segment: 'enterprise',
          baseMrrCents: 50_000,
          addonMrrCents: 10_000,
          health: 40,
          isThreatened: true,
          threatReason: 'Severe Latency Degradation',
          threatDeadlineTick: 200,
          addonSlotsUsed: 0,
          ageTicks: 10,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.8,
          overpricing: 0,
          defects: 0.05,
          serviceRemainderCents: 0,
        },
      ],
      retentionEvent: {
        active: true,
        accountId: 'acc-test',
        accountName: 'Acme Corp',
        reason: 'Severe Latency Degradation',
        deadlineTick: 200,
        savedArrCents: 720_000,
      },
    }

    state = gameReducer(state, { type: 'event.resolve_retention' })

    expect(state.activeFunction).toBe('retention')
    expect(state.retentionEvent).toBeNull()
    const cured = state.accounts.find(a => a.id === 'acc-test')
    expect(cured?.isThreatened).toBe(false)
    expect(cured?.health).toBe(85) // Math.max(a.health, 85)
  })

  it('resolves expansion drill with full ARR reward and cash bonus without room interruption', () => {
    let state = createInitialState(42)
    const initialCash = state.cashCents
    state = {
      ...state,
      activeFunction: 'expansion',
      accounts: [
        {
          id: 'acc-expand',
          name: 'BigTech',
          segment: 'enterprise',
          baseMrrCents: 100_000,
          addonMrrCents: 0,
          health: 90,
          isThreatened: false,
          threatReason: null,
          threatDeadlineTick: null,
          addonSlotsUsed: 0,
          ageTicks: 10,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.9,
          overpricing: 0,
          defects: 0.01,
          serviceRemainderCents: 0,
        },
      ],
      expansionEvent: {
        active: true,
        orderId: 'order-1',
        accountName: 'BigTech',
        chain: 'intelligence',
        targetTier: 3,
        rewardArrCents: 240_000, // $2,400/yr -> $200/mo
        rewardCashCents: 50_000,  // $500
      },
    }

    state = gameReducer(state, { type: 'event.resolve_expansion' })

    expect(state.activeFunction).toBe('expansion')
    expect(state.expansionEvent).toBeNull()
    expect(state.cashCents).toBe(initialCash + 50_000)
    const account = state.accounts.find(a => a.name === 'BigTech')
    expect(account?.addonMrrCents).toBe(20_000) // $2,400/yr / 12 = $200/mo
    expect(account?.baseMrrCents).toBe(100_000)
    expect(state.contractualArrCents).toBe(1_440_000) // (100,000 + 20,000) * 12
  })

  it('keeps activeFunction in monetisation when more queued activations remain', () => {
    let state = createInitialState(42)
    state = {
      ...state,
      activeFunction: 'monetisation',
      pipelineStage: 'monetisation',
      currentActivation: {
        id: 'act-1',
        title: 'Deal 1',
        targetSegment: 'creator',
        speedFit: 0.8,
        collabFit: 0.8,
        controlFit: 0.8,
        overallFit: 0.8,
        defectExposure: 0.05,
        timestampTick: 10,
      },
      activationsQueue: [
        {
          id: 'act-2',
          title: 'Deal 2',
          targetSegment: 'team',
          speedFit: 0.9,
          collabFit: 0.9,
          controlFit: 0.9,
          overallFit: 0.9,
          defectExposure: 0.02,
          timestampTick: 15,
        },
      ],
    }

    state = gameReducer(state, { type: 'monetisation.commit_price', rating: 'perfect' })

    // Since act-2 was in queue, currentActivation should now be act-2, and activeFunction remains monetisation!
    expect(state.activeFunction).toBe('monetisation')
    expect(state.currentActivation?.id).toBe('act-2')
    expect(state.activationsQueue.length).toBe(0)

    // Advance ticks past 20-tick commit debounce window
    state = { ...state, elapsedTicks: state.elapsedTicks + 25 }

    // Commit second deal
    state = gameReducer(state, { type: 'monetisation.commit_price', rating: 'good' })
    expect(state.currentActivation).toBeNull()
    // Returns to pipeline stage
    expect(state.activeFunction).toBe('demand')
  })

  it('generates proactive runway alert before upcoming obligations when cash is insufficient', () => {
    let state = createInitialState(42)
    state = {
      ...state,
      cashCents: 5_000, // $50 in bank
      mandatoryBills: [
        {
          id: 'rent-bill',
          label: 'Office Lease',
          category: 'base_overhead',
          amountCents: 20_000, // $200 due
          dueTick: 200,
        },
      ],
    }

    // Tick forward to within 220 ticks of dueTick (i.e. tick 1 to 25)
    for (let t = 0; t < 25; t++) {
      state = gameReducer(state, { type: 'clock.tick' })
    }

    const runwayAlert = state.alerts.find(a => a.id.startsWith('runway-risk-rent-bill'))
    expect(runwayAlert).toBeDefined()
    expect(runwayAlert?.tone).toBe('critical')
    expect(runwayAlert?.title).toContain('RUNWAY ALERT')
    expect(runwayAlert?.targetFunction).toBe('finance')
  })

  it('dismisses individual alerts and clears all alerts cleanly', () => {
    let state = createInitialState(42)
    state = {
      ...state,
      alerts: [
        { id: 'a1', tone: 'info', title: 'Alert 1', message: 'Msg 1', tick: 1 },
        { id: 'a2', tone: 'warning', title: 'Alert 2', message: 'Msg 2', tick: 2 },
      ],
    }

    state = gameReducer(state, { type: 'alerts.dismiss', alertId: 'a1' })
    expect(state.alerts.length).toBe(1)
    expect(state.alerts[0].id).toBe('a2')

    state = gameReducer(state, { type: 'alerts.clear_all' })
    expect(state.alerts.length).toBe(0)
  })

  it('retention.squash_hit dismisses threat-alert-* alerts and resets retentionEvent when threat neutralized', () => {
    let state = createInitialState(42)
    state = {
      ...state,
      accounts: [
        {
          id: 'acc-1',
          name: 'HyperScale Corp',
          segment: 'enterprise',
          baseMrrCents: 50_000,
          addonMrrCents: 0,
          health: 15,
          isThreatened: true,
          threatReason: 'Infrastructure Degradation',
          threatDeadlineTick: 100,
          addonSlotsUsed: 0,
          ageTicks: 10,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.8,
          overpricing: 0,
          defects: 0.05,
          serviceRemainderCents: 0,
        },
      ],
      retentionEvent: {
        active: true,
        accountId: 'acc-1',
        accountName: 'HyperScale Corp',
        reason: 'Infrastructure Degradation',
        deadlineTick: 100,
        savedArrCents: 600_000,
      },
      alerts: [
        {
          id: 'threat-alert-acc-1',
          tone: 'critical',
          title: 'Threat Alert: HyperScale Corp',
          message: 'Account under threat!',
          tick: 1,
          targetFunction: 'retention',
          actionLabel: 'Neutralize Threat [5]',
        },
        {
          id: 'other-alert-1',
          tone: 'info',
          title: 'Unrelated Info',
          message: 'Keep this',
          tick: 1,
        },
      ],
    }

    // Hit the threat with sledge (damage: 4, squashes the incident and saves the account!)
    state = gameReducer(state, { type: 'retention.squash_hit', incidentId: 'threat-acc-1', accountId: 'acc-1', damage: 4 })

    // Account should no longer be threatened
    const acc = state.accounts.find(a => a.id === 'acc-1')
    expect(acc?.isThreatened).toBe(false)
    // retentionEvent should be cleared
    expect(state.retentionEvent).toBeNull()
    // threat-alert-acc-1 alert should be dismissed!
    expect(state.alerts.some(a => a.id === 'threat-alert-acc-1')).toBe(false)
    // Unrelated alert should remain
    expect(state.alerts.some(a => a.id === 'other-alert-1')).toBe(true)
  })

  it('retention.tool_surge dismisses all threat-alert-* alerts and resets retentionEvent', () => {
    let state = createInitialState(42)
    state = {
      ...state,
      cashCents: 50_000,
      accounts: [
        {
          id: 'acc-1',
          name: 'Acme',
          segment: 'enterprise',
          baseMrrCents: 50_000,
          addonMrrCents: 0,
          health: 20,
          isThreatened: true,
          threatReason: 'Latency',
          threatDeadlineTick: 100,
          addonSlotsUsed: 0,
          ageTicks: 10,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.8,
          overpricing: 0,
          defects: 0.05,
          serviceRemainderCents: 0,
        },
      ],
      retentionEvent: {
        active: true,
        accountId: 'acc-1',
        accountName: 'Acme',
        reason: 'Latency',
        deadlineTick: 100,
        savedArrCents: 600_000,
      },
      alerts: [
        {
          id: 'threat-alert-acc-1',
          tone: 'critical',
          title: 'Threat Alert: Acme',
          message: 'Account under threat!',
          tick: 1,
        },
      ],
    }

    state = gameReducer(state, { type: 'retention.tool_surge', tool: 'coffee' })

    expect(state.retentionEvent).toBeNull()
    expect(state.alerts.some(a => a.id.startsWith('threat-alert-'))).toBe(false)
    expect(state.accounts.every(a => !a.isThreatened)).toBe(true)
  })

  it('expansion.fulfill_order dismisses exp-event-* alerts and resets expansionEvent', () => {
    let state = createInitialState(42)
    state = {
      ...state,
      accounts: [
        {
          id: 'acc-1',
          name: 'Enterprise Client',
          segment: 'enterprise',
          baseMrrCents: 10_000,
          addonMrrCents: 0,
          health: 80,
          addonSlotsUsed: 0,
          isThreatened: false,
          threatReason: null,
          threatDeadlineTick: null,
          ageTicks: 100,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.9,
          overpricing: 0,
          defects: 0.01,
          serviceRemainderCents: 0,
        },
      ],
      expansionEvent: {
        active: true,
        orderId: 'exp-rfp-test',
        accountName: 'Enterprise Client',
        chain: 'intelligence',
        targetTier: 1,
        rewardArrCents: 240_000,
        rewardCashCents: 50_000,
      },
      expansionOrders: [
        {
          id: 'exp-rfp-test',
          accountId: 'acc-1',
          accountName: 'Enterprise Client',
          chain: 'intelligence',
          targetTier: 1,
          rewardArrCents: 240_000,
          rewardCashCents: 50_000,
        },
      ],
      mergeGrid: [
        { id: 'item-1', chain: 'intelligence', tier: 1 },
        ...Array(15).fill(null),
      ],
      alerts: [
        {
          id: 'exp-event-10',
          tone: 'info',
          title: 'RFP Inbound',
          message: 'RFP available',
          tick: 10,
        },
      ],
    }

    state = gameReducer(state, {
      type: 'expansion.fulfill_order',
      orderId: 'exp-rfp-test',
    })

    expect(state.expansionEvent).toBeNull()
    expect(state.alerts.some(a => a.id.startsWith('exp-event-'))).toBe(false)
  })

  it('operations.cash_out_card dismisses ops-event-* alerts and resets operationsEvent', () => {
    let state = createInitialState(42)
    state = {
      ...state,
      operationsEvent: {
        active: true,
        title: 'Cluster Strain Spike',
        severity: 'warning',
        incidentType: 'strain_spike',
        strainPenalty: 12,
        rotPenalty: 0.15,
      },
      alerts: [
        {
          id: 'ops-event-20',
          tone: 'warning',
          title: 'Operations Strain Alert',
          message: 'Throttling company pipeline',
          tick: 20,
        },
      ],
      activeScratchCard: {
        id: 'card-1',
        name: 'Cluster Node Diagnostic Rig',
        subtitle: 'Probing...',
        type: 'apple_tree',
        pods: [
          {
            id: 0,
            label: 'Healthy Core: Strain Flush',
            rewardType: 'strain',
            rewardValue: 5,
            symbol: 'apple',
            isScratched: true,
            isNegative: false,
          },
        ],
        isBusted: false,
        claimed: false,
        bankedCashCents: 10_000,
        bankedStrainRelief: 5,
        bankedRotRelief: 0.1,
      },
    }

    state = gameReducer(state, { type: 'operations.cash_out_card' })

    expect(state.operationsEvent).toBeNull()
    expect(state.alerts.some(a => a.id.startsWith('ops-event-'))).toBe(false)
    expect(state.activeScratchCard?.claimed).toBe(true)
  })
})
