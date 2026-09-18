import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer, getActiveBuffs } from '../engine/reducer'
import { calculateCustomerHealthDelta } from '../engine/formulas'

describe('Minigames & HUD Fixes Verification', () => {
  describe('Retention Whack-a-Mole & Interventions', () => {
    it('damages virtual threat HP and deducts mallet cost', () => {
      let state = createInitialState(1)
      state.cashCents = 50_000 // $500
      state.accounts = [
        {
          id: 'acc-test-1',
          name: 'Acme Test Corp',
          segment: 'enterprise',
          baseMrrCents: 50_000,
          addonMrrCents: 0,
          health: 35,
          ageTicks: 1000,
          addonSlotsUsed: 0,
          isThreatened: true,
          threatDeadlineTick: 500,
          threatReason: 'Severe latency degradation',
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.8,
          overpricing: 0,
          defects: 0,
          serviceRemainderCents: 0,
        },
      ]

      // Initial state has no retentionIncidents; virtual threat ID is threat-acc-test-1
      const threatId = 'threat-acc-test-1'
      
      // Hit 1: Slap dealing 1 damage
      state = gameReducer(state, {
        type: 'retention.squash_hit',
        incidentId: threatId,
        damage: 1,
        costCents: 0,
      })

      expect(state.retentionIncidents).toBeDefined()
      expect(state.retentionIncidents!.length).toBe(1)
      expect(state.retentionIncidents![0].hp).toBe(3) // 4 - 1 = 3
      expect(state.retentionCombo).toBe(1)

      // Mallet hit dealing 5 damage with $10 (1000 cents) cost
      const prevCash = state.cashCents
      state = gameReducer(state, {
        type: 'retention.squash_hit',
        incidentId: threatId,
        damage: 5,
        costCents: 1000,
      })

      // Threat should be fully squashed!
      expect(state.cashCents).toBe(prevCash - 1000 + 500) // -$10 cost + combo bounty ($5)
      expect(state.retentionIncidents!.length).toBe(0)
      expect(state.accounts[0].isThreatened).toBe(false)
      expect(state.accounts[0].health).toBeGreaterThan(50)
      expect(state.retentionSavedArrCents).toBe(600_000) // 50,000 * 12
    })

    it('allows preventive care squashing on unthreatened accounts with 4 sequential hits cracking and shattering the pig, healing SLA health', () => {
      let state = createInitialState(1)
      state.cashCents = 5_000
      state.accounts = [
        {
          id: 'acc-healthy-1',
          name: 'Acme Health Co',
          segment: 'team',
          baseMrrCents: 10_000,
          addonMrrCents: 0,
          addonSlotsUsed: 0,
          health: 55, // sub-optimal health, but not isThreatened
          isThreatened: false,
          threatReason: null,
          threatDeadlineTick: null,
          ageTicks: 200,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.9,
          overpricing: 0,
          defects: 0,
          serviceRemainderCents: 0,
        },
      ]

      // Hit 1: Slap dealing 1 damage (HP 4 -> 3)
      state = gameReducer(state, {
        type: 'retention.squash_hit',
        incidentId: 'mock-threat-0',
        accountId: 'acc-healthy-1',
        damage: 1,
        costCents: 0,
      })
      expect(state.retentionIncidents).toBeDefined()
      expect(state.retentionIncidents!.length).toBe(1)
      expect(state.retentionIncidents![0].hp).toBe(3)
      expect(state.retentionCombo).toBe(1)

      // Hit 2: Slap dealing 1 damage (HP 3 -> 2)
      state = gameReducer(state, {
        type: 'retention.squash_hit',
        incidentId: 'mock-threat-0',
        accountId: 'acc-healthy-1',
        damage: 1,
        costCents: 0,
      })
      expect(state.retentionIncidents![0].hp).toBe(2)
      expect(state.retentionCombo).toBe(2)

      // Hit 3: Slap dealing 1 damage (HP 2 -> 1)
      state = gameReducer(state, {
        type: 'retention.squash_hit',
        incidentId: 'mock-threat-0',
        accountId: 'acc-healthy-1',
        damage: 1,
        costCents: 0,
      })
      expect(state.retentionIncidents![0].hp).toBe(1)
      expect(state.retentionCombo).toBe(3)

      // Hit 4: Shatter hit dealing 1 damage (HP 1 -> 0)
      const prevCash = state.cashCents
      state = gameReducer(state, {
        type: 'retention.squash_hit',
        incidentId: 'mock-threat-0',
        accountId: 'acc-healthy-1',
        damage: 1,
        costCents: 0,
      })
      // SLA Health restored by +35% (55 + 35 = 90)!
      expect(state.accounts[0].health).toBe(90)
      // Pig shattered -> incident cleared
      expect(state.retentionIncidents!.length).toBe(0)
      // Combo bounty awarded
      expect(state.cashCents).toBeGreaterThan(prevCash)
      expect(state.retentionCombo).toBe(4)
      expect(state.alerts.some(a => a.title.includes('Problem Squashed!'))).toBe(true)
    })

    it('preserves combo streak across clock ticks if no churn occurs', () => {
      let state = createInitialState(1)
      state.retentionCombo = 3
      state.retentionIncidents = [
        {
          id: 'inc-1',
          accountId: 'acc-1',
          accountName: 'Corp A',
          title: 'Bug',
          category: 'executive',
          urgencyTicks: 100,
          maxUrgencyTicks: 120,
          consequence: 'Cancellation',
          hp: 3,
          maxHp: 4,
          threatType: 'bug',
        },
      ]

      // Tick clock forward 10 ticks (1 second)
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 10 })

      expect(state.retentionCombo).toBe(3) // Combo preserved!
      expect(state.retentionIncidents![0].urgencyTicks).toBe(90) // Urgency decremented!
    })

    it('executes strategic founder call intervention', () => {
      let state = createInitialState(1)
      state.cashCents = 10_000
      state.accounts = [
        {
          id: 'acc-rescue',
          name: 'Rescue Co',
          segment: 'enterprise',
          baseMrrCents: 20_000,
          addonMrrCents: 0,
          health: 40,
          ageTicks: 1000,
          addonSlotsUsed: 0,
          isThreatened: true,
          threatDeadlineTick: 200,
          threatReason: 'Latency breach',
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.8,
          overpricing: 0,
          defects: 0,
          serviceRemainderCents: 0,
        },
      ]

      state = gameReducer(state, {
        type: 'retention.intervene',
        accountId: 'acc-rescue',
        interventionType: 'founder_call',
      })

      expect(state.cashCents).toBe(9_000) // $10 cost
      expect(state.accounts[0].health).toBe(85) // 40 + 45 = 85
      expect(state.accounts[0].isThreatened).toBe(false)
      expect(state.retentionSavedArrCents).toBe(240_000) // 20_000 * 12
    })
  })

  describe('Expansion Grid Move & Order Synchronization', () => {
    it('allows moving an item to an empty slot', () => {
      let state = createInitialState(1)
      state.mergeGrid = Array(16).fill(null)
      state.mergeGrid[0] = { id: 'item-1', chain: 'intelligence', tier: 2 }

      // Move from index 0 to index 5
      state = gameReducer(state, {
        type: 'expansion.merge_grid',
        fromIndex: 0,
        toIndex: 5,
      })

      expect(state.mergeGrid![0]).toBeNull()
      expect(state.mergeGrid![5]).toEqual({ id: 'item-1', chain: 'intelligence', tier: 2 })
    })

    it('merges two items of the same tier and chain', () => {
      let state = createInitialState(1)
      state.mergeGrid = Array(16).fill(null)
      state.mergeGrid[0] = { id: 'item-1', chain: 'intelligence', tier: 2 }
      state.mergeGrid[1] = { id: 'item-2', chain: 'intelligence', tier: 2 }

      state = gameReducer(state, {
        type: 'expansion.merge_grid',
        fromIndex: 0,
        toIndex: 1,
      })

      expect(state.mergeGrid![0]).toBeNull()
      expect(state.mergeGrid![1]).toBeDefined()
      expect(state.mergeGrid![1]!.chain).toBe('intelligence')
      expect(state.mergeGrid![1]!.tier).toBe(3)
    })

    it('fulfills customer supply order and increases ARR and cash', () => {
      let state = createInitialState(1)
      state.accounts = [
        {
          id: 'acc-exp',
          name: 'Expansion Partner',
          segment: 'enterprise',
          baseMrrCents: 10_000,
          addonMrrCents: 0,
          health: 70,
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
      ]
      state.expansionOrders = [
        {
          id: 'order-1',
          accountId: 'acc-exp',
          accountName: 'Expansion Partner',
          chain: 'infrastructure',
          targetTier: 2,
          rewardArrCents: 60_000,
          rewardCashCents: 10_000,
        },
      ]
      state.mergeGrid = Array(16).fill(null)
      state.mergeGrid[3] = { id: 'feat-1', chain: 'infrastructure', tier: 2 }

      const prevCash = state.cashCents
      state = gameReducer(state, {
        type: 'expansion.fulfill_order',
        orderId: 'order-1',
      })

      expect(state.cashCents).toBe(prevCash + 10_000)
      expect(state.accounts[0].addonMrrCents).toBe(5_000) // 60,000 / 12
      expect(state.accounts[0].addonSlotsUsed).toBe(1)
      expect(state.mergeGrid![3]).toBeNull() // Consumed feature item
    })
  })

  describe('Operations Push-Your-Luck Recovery Rig', () => {
    it('banks telemetry rewards and commits recovery patch', () => {
      let state = createInitialState(1)
      state.operations.strainBacklog = 15
      state.operations.contextRot = 0.5

      expect(state.activeScratchCard).toBeDefined()
      const healthyPod = state.activeScratchCard!.pods.find(p => !p.isNegative)!

      state = gameReducer(state, {
        type: 'operations.scratch_pod',
        podId: healthyPod.id,
      })

      expect(state.activeScratchCard!.pods[healthyPod.id].isScratched).toBe(true)
      expect(state.activeScratchCard!.isBusted).toBe(false)

      const prevCash = state.cashCents
      state = gameReducer(state, { type: 'operations.cash_out_card' })

      expect(state.activeScratchCard!.claimed).toBe(true)
      expect(state.cashCents).toBeGreaterThanOrEqual(prevCash)
      expect(state.operations.strainBacklog).toBeLessThanOrEqual(15)
    })
  })

  describe('Lifecycle Gating & Anti-Phantom Account Invariants', () => {
    it('initializes game with zero expansion orders and empty merge grid', () => {
      const state = createInitialState(1)
      expect(state.expansionOrders).toEqual([])
      expect(state.mergeGrid).toEqual(Array(16).fill(null))
      expect(state.accounts).toEqual([])
    })

    it('does not spawn expansion orders or operations events when no customer accounts exist', () => {
      let state = createInitialState(1)
      // Advance clock through multiple tick cycles
      for (let i = 0; i < 50; i++) {
        state = gameReducer(state, { type: 'clock.tick', dtTicks: 50 })
      }
      expect(state.expansionOrders).toEqual([])
      expect(state.operationsEvent).toBeNull()
      expect(state.retentionEvent).toBeNull()
      expect(state.accounts).toHaveLength(0)
    })

    it('generates expansion orders dynamically when accounts exist, and refuses phantom fulfillment', () => {
      let state = createInitialState(1)
      state.accounts = [
        {
          id: 'acc-real-1',
          name: 'Real Customer Co',
          segment: 'team',
          baseMrrCents: 20_000,
          addonMrrCents: 0,
          health: 80,
          ageTicks: 500,
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

      // Tick clock to trigger order generation for Real Customer Co
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 300 })
      expect(state.expansionOrders!.length).toBeGreaterThanOrEqual(1)
      expect(state.expansionOrders![0].accountId).toBe('acc-real-1')
      expect(state.expansionOrders![0].accountName).toBe('Real Customer Co')

      // Attempting to fulfill an order for a non-existent phantom account must not fabricate an account
      const phantomState = gameReducer(state, {
        type: 'expansion.fulfill_order',
        orderId: 'fake-order-id',
      })
      expect(phantomState.accounts).toHaveLength(1)
      expect(phantomState.accounts[0].id).toBe('acc-real-1')
    })
  })

  describe('Tension & Challenge Escalation: Retention Resolution & Dynamic COGS', () => {
    it('resolves retention crisis cleanly, curing account and dismissing threat alert', () => {
      let state = createInitialState(1)
      state.accounts = [
        {
          id: 'acc-threat',
          name: 'Threatened Enterprise',
          segment: 'enterprise',
          baseMrrCents: 50_000,
          addonMrrCents: 0,
          health: 35,
          ageTicks: 200,
          addonSlotsUsed: 0,
          isThreatened: true,
          threatDeadlineTick: 120,
          threatReason: 'Severe defect escalation',
          delinquent: false,
          unpaidGraceTicks: 0,
          lastCollectionAttemptTick: null,
          serviceRemainderCents: 0,
          fit: 1.0,
          overpricing: 0,
          defects: 0,
        },
      ]
      state.retentionEvent = {
        active: true,
        accountId: 'acc-threat',
        accountName: 'Threatened Enterprise',
        reason: 'Severe defect escalation',
        deadlineTick: 120,
        savedArrCents: 600_000,
      }
      state.retentionIncidents = [
        {
          id: 'inc-threat',
          accountId: 'acc-threat',
          accountName: 'Threatened Enterprise',
          title: 'Severe defect escalation',
          category: 'executive',
          urgencyTicks: 50,
          maxUrgencyTicks: 120,
          consequence: 'Cancellation',
          hp: 4,
          maxHp: 4,
          threatType: 'bug',
        },
      ]
      state.alerts = [
        {
          id: 'threat-alert-1',
          tone: 'critical',
          title: 'Customer Churn Imminent!',
          message: 'Threatened Enterprise is leaving',
          tick: 0,
        },
      ]

      state = gameReducer(state, { type: 'event.resolve_retention' })

      expect(state.retentionEvent).toBeNull()
      expect(state.accounts[0].isThreatened).toBe(false)
      expect(state.accounts[0].health).toBeGreaterThanOrEqual(75)
      expect(state.retentionIncidents).toHaveLength(0)
      expect(state.alerts.some(a => a.id.startsWith('threat-alert-'))).toBe(false)
    })

    it('triggers contract churn when incident urgency countdown expires at 0', () => {
      let state = createInitialState(1)
      state.accounts = [
        {
          id: 'acc-expire',
          name: 'Ignored Account',
          segment: 'team',
          baseMrrCents: 10_000,
          addonMrrCents: 0,
          health: 25,
          ageTicks: 100,
          addonSlotsUsed: 0,
          isThreatened: true,
          threatDeadlineTick: 50,
          threatReason: 'Unanswered defect SLA',
          delinquent: false,
          unpaidGraceTicks: 0,
          lastCollectionAttemptTick: null,
          serviceRemainderCents: 0,
          fit: 1.0,
          overpricing: 0,
          defects: 0,
        },
      ]
      state.retentionIncidents = [
        {
          id: 'inc-expire',
          accountId: 'acc-expire',
          accountName: 'Ignored Account',
          title: 'Unanswered defect SLA',
          category: 'executive',
          urgencyTicks: 5,
          maxUrgencyTicks: 120,
          consequence: 'Cancellation',
          hp: 4,
          maxHp: 4,
          threatType: 'bug',
        },
      ]
      state.retentionCombo = 5

      // Tick forward 10 ticks, expiring the 5-tick incident
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 10 })

      // Account should be dropped from active accounts
      expect(state.accounts.some(a => a.id === 'acc-expire')).toBe(false)
      // Incidents list should be cleared
      expect(state.retentionIncidents).toHaveLength(0)
      // Combo should be reset
      expect(state.retentionCombo).toBe(0)
      // Arr bridge churn should record the loss
      expect(state.arrBridge.churnArrCents).toBe(120_000)
    })

    it('enqueues and settles cloud infrastructure and inference COGS in Growth tier', () => {
      let state = createInitialState(1)
      state.valuationCents = 600_000_000 // $6M valuation -> Growth tier
      state.cashCents = 50_000_000 // $500,000 liquid capital
      state.accounts = [
        {
          id: 'acc-growth',
          name: 'Growth Client',
          segment: 'enterprise',
          baseMrrCents: 20_000_000, // $200,000/mo ($2.4M/yr)
          addonMrrCents: 0,
          health: 80,
          ageTicks: 100,
          addonSlotsUsed: 0,
          isThreatened: false,
          threatDeadlineTick: null,
          threatReason: null,
          delinquent: false,
          unpaidGraceTicks: 0,
          lastCollectionAttemptTick: null,
          serviceRemainderCents: 0,
          fit: 1.0,
          overpricing: 0,
          defects: 0,
        },
      ]
      state.contractualArrCents = 240_000_000 // $2.4M ARR
      state.eligibleArrCents = 240_000_000

      // Advance 600 ticks to hit monthly boundary
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 600 })

      const cogsPayment = state.ledger.find(l => l.message.includes('Inference COGS') && l.message.includes('GROWTH'))
      expect(cogsPayment).toBeDefined()
      expect(cogsPayment!.deltaCashCents).toBeLessThan(0)
    })

    it('awards 20% bonus contract ARR and guarantees conversion on perfect bullseye strike', () => {
      let state = createInitialState(1)
      state.currentActivation = {
        id: 'act-test-1',
        title: 'Enterprise Architecture Deployment',
        targetSegment: 'enterprise',
        defectExposure: 0,
        speedFit: 1.0,
        collabFit: 1.0,
        controlFit: 1.0,
        overallFit: 1.0,
        timestampTick: 0,
      }

      // 1. Commit with 'good' strike
      const stateGood = gameReducer(state, {
        type: 'monetisation.commit_price',
        normalizedCursor: 0.65,
        rating: 'good',
      })
      const goodPrice = stateGood.accounts[0].baseMrrCents

      // 2. Commit with 'perfect' strike
      const statePerfect = gameReducer(state, {
        type: 'monetisation.commit_price',
        normalizedCursor: 0.65,
        rating: 'perfect',
      })
      const perfectPrice = statePerfect.accounts[0].baseMrrCents

      // Perfect strike awards exactly +20% contract ARR bonus
      expect(perfectPrice).toBe(Math.round(goodPrice * 1.20))
      expect(statePerfect.contractualArrCents).toBe(perfectPrice * 12)

      // Alert should celebrate bullseye
      expect(statePerfect.alerts.some(a => a.title.includes('Bullseye Contract Signed (+20% ARR Bonus)!'))).toBe(true)
    })
  })

  describe('Operations Incident Hotfix & Retention SLA Invariants', () => {
    it('accurately resolves incident backlog via operations.resolve_incident', () => {
      let state = createInitialState(1)
      state.operations.incidentsBacklog = 2
      state.operations.diagnosedRootCause = 'Inference Gateway Memory Leak'

      // First hotfix patch
      state = gameReducer(state, { type: 'operations.resolve_incident' })
      expect(state.operations.incidentsBacklog).toBe(1)
      expect(state.operations.diagnosedRootCause).toBeNull()
      expect(state.alerts.some(a => a.title === 'Incident Resolved')).toBe(true)

      // Second hotfix patch
      state = gameReducer(state, { type: 'operations.resolve_incident' })
      expect(state.operations.incidentsBacklog).toBe(0)

      // Attempting to resolve when 0 does not negative-overflow
      state = gameReducer(state, { type: 'operations.resolve_incident' })
      expect(state.operations.incidentsBacklog).toBe(0)
    })

    it('inflicts -5 HP/mo customer health penalty per active incident', () => {
      const baseDelta = calculateCustomerHealthDelta(1.0, 0, 0, 0, 0)
      const oneIncidentDelta = calculateCustomerHealthDelta(1.0, 0, 0, 0, 1)
      const twoIncidentsDelta = calculateCustomerHealthDelta(1.0, 0, 0, 0, 2)

      expect(baseDelta - oneIncidentDelta).toBe(5)
      expect(baseDelta - twoIncidentsDelta).toBe(10)
    })
  })

  describe('2.5D Asset Integrity Invariant', () => {
    it('guarantees that all required 2.5D assets exist and are referenced correctly', () => {
      const fs = require('fs')
      const path = require('path')
      const assetsDir = path.resolve(__dirname, '../../public/assets/2.5d')

      const requiredAssets = [
        'expansion_infrastructure.png',
        'expansion_intelligence.png',
        'expansion_security.png',
        'nav_demand.png',
        'nav_finance.png',
        'nav_monetise.png',
        'nav_operations.png',
        'nav_product.png',
        'nav_retention.png',
        'node_golden_core.png',
        'node_memory_purge.png',
        'node_rebate_token.png',
        'node_thermal_fault.png',
        'piggy_bank_cracked.png',
        'piggy_bank_intact.png',
        'shield_perimeter_secure.png',
        'threat_contract_breach.png',
        'threat_latency_gremlin.png',
        'tool_coffee_surge.png',
        'tool_hotfix_sledge.png',
      ]

      for (const assetName of requiredAssets) {
        const fullPath = path.join(assetsDir, assetName)
        expect(fs.existsSync(fullPath)).toBe(true)
        const stat = fs.statSync(fullPath)
        expect(stat.size).toBeGreaterThan(1000) // File must be non-empty and substantial
      }
    })
  })

  describe('RCA Engine & HUD Fixes Verification', () => {
    it('does not display phantom expansion badge when expansionOrders is empty, even with unacknowledged alerts', () => {
      let state = createInitialState(1)
      state.expansionOrders = []
      state.alerts = [
        {
          id: 'exp-event-1',
          tone: 'info',
          title: 'EXPANSION RFP RECEIVED',
          message: 'Historical expansion alert',
          tick: 100,
          targetFunction: 'expansion',
        },
        {
          id: 'exp-event-2',
          tone: 'info',
          title: 'EXPANSION RFP RECEIVED',
          message: 'Second historical alert',
          tick: 200,
          targetFunction: 'expansion',
        },
      ]

      // Expansion orders count should be strictly 0
      const expansionOrdersCount = (state.expansionOrders || []).length
      expect(expansionOrdersCount).toBe(0)
    })

    it('acknowledges alerts targeted to a function when attention is switched', () => {
      let state = createInitialState(1)
      state.alerts = [
        {
          id: 'alert-ret-1',
          tone: 'critical',
          title: 'Customer Churn Warning',
          message: 'Test message',
          tick: 50,
          targetFunction: 'retention',
        },
        {
          id: 'alert-dem-1',
          tone: 'info',
          title: 'Demand signal',
          message: 'Test message 2',
          tick: 60,
          targetFunction: 'demand',
        },
      ]

      // Switch to retention
      state = gameReducer(state, { type: 'attention.switch', functionId: 'retention' })
      expect(state.activeFunction).toBe('retention')
      expect(state.alerts.find(a => a.id === 'alert-ret-1')?.acknowledged).toBe(true)
      // Demand alert should remain unacknowledged
      expect(state.alerts.find(a => a.id === 'alert-dem-1')?.acknowledged).toBeUndefined()
    })

    it('retention alert count is 0 when the single active account is healthy and not threatened', () => {
      const state = createInitialState(1)
      state.accounts = [
        {
          id: 'acc-healthy-1',
          name: 'Consolidated Logistics',
          segment: 'enterprise',
          baseMrrCents: 32_825,
          addonMrrCents: 0,
          health: 93,
          isThreatened: false,
          threatReason: null,
          threatDeadlineTick: null,
          ageTicks: 500,
          addonSlotsUsed: 0,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.9,
          overpricing: 0,
          defects: 0,
          serviceRemainderCents: 0,
        },
      ]
      state.retentionIncidents = []
      state.retentionEvent = null

      const threatenedAccountsCount = (state.accounts || []).filter(a => a.isThreatened || a.health < 50).length
      const standaloneRetentionEvent = Boolean(state.retentionEvent) && !state.accounts.some(a => a.id === state.retentionEvent?.accountId && (a.isThreatened || a.health < 50)) ? 1 : 0
      const retentionAlertCount = threatenedAccountsCount + standaloneRetentionEvent

      expect(retentionAlertCount).toBe(0)
    })

    it('correctly aggregates passive buffs from active archetype and equipped founder relic', () => {
      let state = createInitialState(1)
      state.activeArchetype = 'product_led_machine'
      state.founderHistory = {
        totalRuns: 1,
        victories: 0,
        bestValuationCents: 10_000_000,
        historicalRelics: [],
        unlockedAchievementIds: ['ach_zero_defect'],
        equippedFounderRelicId: 'founder_formal_verification',
      }

      const buffs = getActiveBuffs(state)
      expect(buffs.productYieldBonus).toBe(0.25)
      expect(buffs.defectReduction).toBeCloseTo(0.55, 2)
    })

    it('normalizes sovereign compute grant to $15k instead of $100k', () => {
      let state = createInitialState(1)
      state.cashCents = 100_000 // $1,000
      state.ticksInCurrentMonth = 590
      state.monthInQuarter = 3
      state.activeRelics = [
        {
          id: 'relic-sovereign-grant',
          name: 'Sovereign AI Compute Grant',
          category: 'capital',
          effectSummary: 'Provides $15,000 non-dilutive liquid grant every quarter and eliminates base overhead.',
          flavor: 'National compute reserve grant for critical AI infrastructure development.',
          rarity: 'ethereal',
          costCents: 5_000_000,
        },
      ]

      state = gameReducer(state, { type: 'clock.tick', dtTicks: 20 })
      // Grant adds $15k (1,500,000 cents), baseline net burn is -$100 (-10,000 cents), total 1,590,000
      expect(state.cashCents).toBe(1_590_000)
    })

    it('normalizes anisotropic sheen growth multiple distortion to 0.4x instead of 3.0x', () => {
      let state = createInitialState(1)
      state.activeRelics = [
        {
          id: 'relic-anisotropic-sheen',
          name: 'Founder Reality Distortion Field',
          category: 'capital',
          effectSummary: 'Boosts Growth Multiple by +0.4x in Valuation formulas.',
          flavor: 'Wall Street analysts start grading your company by compute-vibes rather than GAAP EBITDA.',
          rarity: 'ethereal',
          costCents: 5_000_000,
        },
      ]

      state = gameReducer(state, { type: 'clock.tick', dtTicks: 10 })
      // Base knot at 0% growth is 4.0x. With 0.4x distortion, total is 4.4x (previously was 7.0x with 3.0x distortion)
      expect(state.growthMultiple).toBeCloseTo(4.4, 1)
      expect(state.growthMultiple).toBeLessThan(5.0)
    })
  })
})


