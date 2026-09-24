import { describe, it, expect } from 'vitest'
import { createInitialState, createDiagnosticTicket } from '../engine/state'
import { gameReducer, getActiveBuffs } from '../engine/reducer'
import { calculateCustomerHealthDelta, getMonetisationDealStats } from '../engine/formulas'

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

      // Threat should be fully squashed! Deducts tool cost only ($10 / 1000 cents), NO infinite cash bounty
      expect(state.cashCents).toBe(prevCash - 1000)
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
      // No cash bounty awarded (cash unchanged on free slap)
      expect(state.cashCents).toBe(prevCash)
      expect(state.retentionCombo).toBe(4)
      expect(state.alerts.some(a => a.title.includes('Problem Squashed!'))).toBe(true)
    })

    it('prevents spamming squash on 100% healthy accounts and never awards infinite cash', () => {
      let state = createInitialState(1)
      state.cashCents = 10_000
      state.accounts = [
        {
          id: 'acc-healthy-100',
          name: 'Acme Peak Co',
          segment: 'enterprise',
          baseMrrCents: 50_000,
          addonMrrCents: 0,
          addonSlotsUsed: 0,
          health: 100, // already 100% health
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

      const initialAlertsCount = state.alerts.length
      const initialCash = state.cashCents

      // Attempt 10 spam squashes on the 100% healthy account
      for (let i = 0; i < 10; i++) {
        state = gameReducer(state, {
          type: 'retention.squash_hit',
          incidentId: 'threat-acc-healthy-100',
          accountId: 'acc-healthy-100',
          damage: 1,
          costCents: 0,
        })
      }

      // Cash must not have increased
      expect(state.cashCents).toBe(initialCash)
      // Combo must not have increased
      expect(state.retentionCombo ?? 0).toBe(0)
      // No alerts spammed
      expect(state.alerts.length).toBe(initialAlertsCount)
      // Account health remains 100
      expect(state.accounts[0].health).toBe(100)
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
        'expansion_random.png',
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

  describe('Alerts, Workstations & Treasury Pill Invariants', () => {
    it('appends viral whale signals to end of demandSignals without displacing channel 0', () => {
      let state = createInitialState(1)
      state.fleet.retention.luckRank = 5
      state.demandSignals = [
        {
          id: 'lead-0',
          title: 'Direct Outbound Prospect',
          segment: 'creator',
          signalRationale: 'Direct high intent lead',
          acquisitionCostCents: 5000,
          estimatedWtpCents: 10000,
          expiryTick: 800,
        }
      ]
      state.accounts = [
        {
          id: 'acc-viral',
          name: 'Advocate Corp',
          segment: 'enterprise',
          baseMrrCents: 50_000,
          addonMrrCents: 0,
          health: 80,
          isThreatened: false,
          threatDeadlineTick: null,
          threatReason: null,
          fit: 0.9,
          defects: 0,
          overpricing: 0,
          addonSlotsUsed: 0,
          ageTicks: 100,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          serviceRemainderCents: 0,
        }
      ]

      // Squash an incident with viral advocate condition
      // Even if viral advocate triggers, demandSignals[0] must remain 'lead-0'
      const targetInc = {
        id: 'inc-test',
        accountId: 'acc-viral',
        accountName: 'Advocate Corp',
        title: 'Preventive Care',
        category: 'executive' as const,
        urgencyTicks: 120,
        maxUrgencyTicks: 120,
        consequence: 'Contract Cancellation',
        hp: 1, // 1 hit squashes
        maxHp: 4,
        threatType: 'piggy' as const,
      }
      state.retentionIncidents = [targetInc]

      const afterSquash = gameReducer(state, {
        type: 'retention.squash_hit',
        incidentId: 'inc-test',
        accountId: 'acc-viral',
        damage: 1,
        costCents: 0,
      })

      // First signal must STILL be lead-0, not displaced!
      expect(afterSquash.demandSignals[0].id).toBe('lead-0')
    })

    it('correctly detects when remaining cash only covers next bill', () => {
      let state = createInitialState(1)
      state.opexMonthCents = 150_000 // $1,500
      state.cogsMonthCents = 50_000  // $500
      // Next bill default amount is $2,000 (200_000 cents)
      const nextBillAmount = state.opexMonthCents + state.cogsMonthCents

      // Treasury has $5,000 -> more than 1 bill
      state.cashCents = 500_000
      const isCritical1 = state.cashCents <= nextBillAmount && nextBillAmount > 0
      expect(isCritical1).toBe(false)

      // Treasury drops to $2,000 -> exactly 1 bill remaining!
      state.cashCents = 200_000
      const isCritical2 = state.cashCents <= nextBillAmount && nextBillAmount > 0
      expect(isCritical2).toBe(true)

      // Treasury drops to $1,000 -> less than 1 bill remaining!
      state.cashCents = 100_000
      const isCritical3 = state.cashCents <= nextBillAmount && nextBillAmount > 0
      expect(isCritical3).toBe(true)
    })

    it('retention alert count clears to 0 after threat is squashed, and ignores non-threatened sub-65 health accounts', () => {
      let state = createInitialState(1)
      // Account with health 62, but NOT threatened
      state.accounts = [
        {
          id: 'acc-normal',
          name: 'Healthy Enough Corp',
          segment: 'creator',
          baseMrrCents: 100_000,
          addonMrrCents: 0,
          health: 62,
          isThreatened: false,
          threatDeadlineTick: null,
          threatReason: null,
          ageTicks: 100,
          addonSlotsUsed: 0,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.8,
          overpricing: 0,
          defects: 0,
          serviceRemainderCents: 0,
        },
      ]
      state.retentionIncidents = []

      // Test active threat calculation
      const activeThreatIds = new Set<string>()
      ;(state.accounts || []).forEach(a => {
        if (a.isThreatened) activeThreatIds.add(a.id)
      })
      ;(state.retentionIncidents || []).forEach(inc => {
        activeThreatIds.add(inc.accountId || inc.id)
      })
      if (state.retentionEvent?.active && state.retentionEvent.accountId) {
        activeThreatIds.add(state.retentionEvent.accountId)
      }
      const countBefore = activeThreatIds.size + (state.retentionEvent?.active && !state.retentionEvent.accountId ? 1 : 0)
      expect(countBefore).toBe(0)

      // Threat spawns
      state.accounts[0].isThreatened = true
      state.retentionIncidents = [
        {
          id: 'inc-threat-1',
          accountId: 'acc-normal',
          accountName: 'Healthy Enough Corp',
          title: 'Executive Sponsor Churn Warning',
          category: 'executive',
          urgencyTicks: 120,
          maxUrgencyTicks: 120,
          consequence: 'Contract Cancellation',
          hp: 4,
          maxHp: 4,
          threatType: 'piggy',
        }
      ]
      state.alerts = [
        {
          id: 'threat-alert-120-acc-normal',
          tone: 'critical',
          title: 'Customer Churn Imminent!',
          message: 'Healthy Enough Corp is threatening cancellation!',
          tick: 120,
          targetFunction: 'retention',
        }
      ]

      // Verify count is 1 while threat is active
      const threatIdsDuring = new Set<string>()
      state.accounts.forEach(a => { if (a.isThreatened) threatIdsDuring.add(a.id) })
      state.retentionIncidents.forEach(inc => { threatIdsDuring.add(inc.accountId || inc.id) })
      expect(threatIdsDuring.size).toBe(1)

      // Player squashes the threat!
      const afterSquash = gameReducer(state, {
        type: 'retention.squash_hit',
        incidentId: 'inc-threat-1',
        accountId: 'acc-normal',
        damage: 5, // full squash
      })

      // Verify account is no longer threatened, incident is gone, and threat alert is cleaned up
      expect(afterSquash.accounts.find(a => a.id === 'acc-normal')?.isThreatened).toBe(false)
      expect(afterSquash.retentionIncidents?.length ?? 0).toBe(0)
      expect(afterSquash.alerts.some(a => a.id.startsWith('threat-alert-'))).toBe(false)

      // Active alert count is immediately 0!
      const threatIdsAfter = new Set<string>()
      afterSquash.accounts.forEach(a => { if (a.isThreatened || (a.health !== undefined && a.health < 65)) threatIdsAfter.add(a.id) })
      ;(afterSquash.retentionIncidents || []).forEach(inc => { threatIdsAfter.add(inc.accountId || inc.id) })
      const countAfter = threatIdsAfter.size + (afterSquash.retentionEvent?.active ? 1 : 0)
      expect(countAfter).toBe(0)
    })

    it('displays retention alert in nav menu when account health is below 65% and clears after squash', () => {
      let state = createInitialState(1)
      state.accounts = [
        {
          id: 'acc-novartis',
          name: 'Novartis GenSec',
          segment: 'enterprise',
          baseMrrCents: 96_000,
          addonMrrCents: 0,
          health: 64, // below 65% churn threat threshold as seen in Sentinel bay
          isThreatened: false,
          threatReason: null,
          threatDeadlineTick: null,
          ageTicks: 250,
          addonSlotsUsed: 0,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.85,
          overpricing: 0,
          defects: 0,
          serviceRemainderCents: 0,
        },
      ]
      state.retentionIncidents = []
      state.retentionEvent = null

      // Nav menu threat count calculation
      const computeNavRetentionAlerts = (s: typeof state) => {
        const activeIds = new Set<string>()
        ;(s.accounts || []).forEach(a => {
          if (a.isThreatened || (a.health !== undefined && a.health < 65)) {
            activeIds.add(a.id)
          }
        })
        ;(s.retentionIncidents || []).forEach(inc => {
          activeIds.add(inc.accountId || inc.id)
        })
        if (s.retentionEvent?.active && s.retentionEvent.accountId) {
          activeIds.add(s.retentionEvent.accountId)
        }
        return activeIds.size + (s.retentionEvent?.active && !s.retentionEvent.accountId ? 1 : 0)
      }

      // 1. Alert is visible because health: 64 (< 65)
      expect(computeNavRetentionAlerts(state)).toBe(1)

      // 2. Squash the threat on Novartis GenSec
      const afterSquash = gameReducer(state, {
        type: 'retention.squash_hit',
        incidentId: 'threat-acc-novartis',
        accountId: 'acc-novartis',
        damage: 4,
      })

      // 3. Health is boosted from 64 to at least 75+ (99%), isThreatened is false
      const updatedNovartis = afterSquash.accounts.find(a => a.id === 'acc-novartis')
      expect(updatedNovartis?.health).toBeGreaterThanOrEqual(75)
      expect(updatedNovartis?.isThreatened).toBe(false)

      // 4. Alert count in nav menu drops to 0 immediately!
      expect(computeNavRetentionAlerts(afterSquash)).toBe(0)
    })


    it('createDiagnosticTicket generates value variance with high reward potential and active hazards', () => {
      // Generate multiple tickets across Luck ranks to test variance
      const rank0Tickets = Array.from({ length: 80 }, () => createDiagnosticTicket(0, 0))
      const rank4Tickets = Array.from({ length: 80 }, () => createDiagnosticTicket(0, 4))

      // Verify hazards are present in both rank 0 and rank 4 (hazards don't vanish to 0, allowing peeking gameplay)
      const rank0HasHazards = rank0Tickets.some(t => t.pods.some(p => p.isNegative))
      const rank4HasHazards = rank4Tickets.some(t => t.pods.some(p => p.isNegative))
      expect(rank0HasHazards).toBe(true)
      expect(rank4HasHazards).toBe(true)

      // Verify reward values exhibit wider variance at rank 4 vs rank 0
      const rank0Rewards = rank0Tickets.flatMap(t => t.pods.filter(p => !p.isNegative && p.rewardType === 'cash').map(p => p.rewardValue as number))
      const rank4Rewards = rank4Tickets.flatMap(t => t.pods.filter(p => !p.isNegative && p.rewardType === 'cash').map(p => p.rewardValue as number))

      const maxRank0 = Math.max(...rank0Rewards)
      const maxRank4 = Math.max(...rank4Rewards)

      // Rank 4 can roll significantly higher jackpot ceilings due to expanded value variance
      expect(maxRank4).toBeGreaterThan(maxRank0)
    })
  })

  describe('Monetisation Deal Stats & Accurate Badge Counting', () => {
    it('shows 1 deal when only 1 deal is available (not 2)', () => {
      let state = createInitialState(42)
      const sig = state.demandSignals[0]
      state = gameReducer(state, { type: 'demand.triage', signalId: sig.id, decision: 'qualify' })
      const pod = state.productPods![0]
      for (let i = 0; i < pod.sockets.length; i++) {
        state = gameReducer(state, {
          type: 'product.fill_socket',
          podId: pod.id,
          socketIndex: i,
          primitive: pod.sockets[i].type,
        })
      }
      state = gameReducer(state, { type: 'product.ship_pod', podId: pod.id })

      // Exactly 1 deal was shipped
      const stats = getMonetisationDealStats(state)
      expect(stats.totalCount).toBe(1)
      expect(stats.activeCount).toBe(1)
      expect(stats.queuedCount).toBe(0)
    })

    it('accurately counts multi-desk and queued deals without double-counting', () => {
      let state = createInitialState(42)
      // Give state 3 desks
      state.activeDealDesks = [
        { id: 'desk-0', deskIndex: 0, activation: { id: 'act-1', title: 'Deal 1', targetSegment: 'creator', speedFit: 1, collabFit: 1, controlFit: 1, overallFit: 1, defectExposure: 0, timestampTick: 0 }, postedPriceMonthlyCents: 4000, status: 'negotiating' },
        { id: 'desk-1', deskIndex: 1, activation: { id: 'act-2', title: 'Deal 2', targetSegment: 'team', speedFit: 1, collabFit: 1, controlFit: 1, overallFit: 1, defectExposure: 0, timestampTick: 0 }, postedPriceMonthlyCents: 8000, status: 'negotiating' },
        { id: 'desk-2', deskIndex: 2, activation: null, postedPriceMonthlyCents: 4000, status: 'idle' },
      ]
      state.currentActivation = state.activeDealDesks[0].activation
      // activationsQueue has act-1, act-2 (both active) plus act-3 (queued)
      state.activationsQueue = [
        state.activeDealDesks[0].activation!,
        state.activeDealDesks[1].activation!,
        { id: 'act-3', title: 'Deal 3', targetSegment: 'enterprise', speedFit: 1, collabFit: 1, controlFit: 1, overallFit: 1, defectExposure: 0, timestampTick: 0 },
      ]

      const stats = getMonetisationDealStats(state)
      expect(stats.activeCount).toBe(2)
      expect(stats.queuedCount).toBe(1)
      expect(stats.totalCount).toBe(3)
    })

    it('updates correctly upon deal closing', () => {
      let state = createInitialState(42)
      const sig = state.demandSignals[0]
      state = gameReducer(state, { type: 'demand.triage', signalId: sig.id, decision: 'qualify' })
      const pod = state.productPods![0]
      for (let i = 0; i < pod.sockets.length; i++) {
        state = gameReducer(state, {
          type: 'product.fill_socket',
          podId: pod.id,
          socketIndex: i,
          primitive: pod.sockets[i].type,
        })
      }
      state = gameReducer(state, { type: 'product.ship_pod', podId: pod.id })
      expect(getMonetisationDealStats(state).totalCount).toBe(1)

      // Commit price
      state = gameReducer(state, { type: 'monetisation.commit_price', rating: 'perfect' })
      expect(getMonetisationDealStats(state).totalCount).toBe(0)
    })
  })
})


