import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'
import {
  DEMAND_CHANNEL_LIMITS,
  MONETISATION_DESK_LIMITS,
  RETENTION_BAY_LIMITS,
  EXPANSION_BAY_LIMITS,
  OPERATIONS_RACK_LIMITS,
  MONETISATION_CRAFT_MULTIPLIERS,
  EXPANSION_GRID_SIZES,
  EXPANSION_GRID_DIMS,
  EXTENDED_TIER_NAMES,
} from '../engine/constants'
import type { DemandSignal, MergeItem, ExpansionOrder } from '../engine/types'

describe('Workstations, Increments & Demand Overhaul', () => {
  describe('Workstation Limits & Constants', () => {
    it('has correct workstation progression for all 5 functions', () => {
      expect(DEMAND_CHANNEL_LIMITS).toEqual([1, 2, 3, 4, 5, 6])
      expect(MONETISATION_DESK_LIMITS).toEqual([1, 2, 3, 4, 5, 6])
      expect(RETENTION_BAY_LIMITS).toEqual([1, 2, 3, 4, 5, 6])
      expect(EXPANSION_BAY_LIMITS).toEqual([1, 2, 3, 4, 5, 6])
      expect(OPERATIONS_RACK_LIMITS).toEqual([1, 2, 3, 4, 5, 6])
    })
  })

  describe('Demand Function Overhaul', () => {
    it('applies Demand craft CAC discount and WTP boost upon qualification', () => {
      let baseState = createInitialState(100)
      const rawSignal: DemandSignal = {
        id: 'test-sig-1',
        title: 'Test Lead',
        segment: 'creator',
        signalRationale: 'High intent prospect',
        acquisitionCostCents: 5000,
        estimatedWtpCents: 10000,
        expiryTick: 500,
      }
      baseState.demandSignals = [rawSignal]
      baseState.cashCents = 100000

      // Rank 0 craft qualification
      baseState.fleet.demand.craftRank = 0
      const qualifiedRank0 = gameReducer(baseState, {
        type: 'demand.triage',
        signalId: rawSignal.id,
        decision: 'qualify',
      })
      const oppRank0 = qualifiedRank0.qualifiedOpportunities[0]
      expect(oppRank0).toBeDefined()
      // CAC spent should be full 5000 cents ($50)
      expect(baseState.cashCents - qualifiedRank0.cashCents).toBe(5000)
      expect(oppRank0.estimatedWtpCents).toBe(10000)

      // Rank 3 craft qualification: 36% discount on CAC (12% per rank) and 60% WTP boost (20% per rank)
      let craftedState = createInitialState(100)
      craftedState.demandSignals = [{ ...rawSignal, id: 'test-sig-crafted' }]
      craftedState.cashCents = 100000
      craftedState.fleet.demand.craftRank = 3

      const qualifiedRank3 = gameReducer(craftedState, {
        type: 'demand.triage',
        signalId: 'test-sig-crafted',
        decision: 'qualify',
      })
      const oppRank3 = qualifiedRank3.qualifiedOpportunities[0]
      expect(oppRank3).toBeDefined()
      // Expected CAC = 5000 * (1 - 0.36) = 3200
      expect(craftedState.cashCents - qualifiedRank3.cashCents).toBe(3200)
      // Expected WTP = 10000 * (1 + 0.60) = 16000
      expect(oppRank3.estimatedWtpCents).toBe(16000)
    })

    it('batch triages multiple channel signals in a single action', () => {
      let state = createInitialState(200)
      state.cashCents = 500000
      state.demandSignals = [
        {
          id: 'batch-sig-1',
          title: 'Lead 1',
          segment: 'creator',
          signalRationale: 'High volume lead',
          acquisitionCostCents: 1000,
          estimatedWtpCents: 8000,
          expiryTick: 500,
        },
        {
          id: 'batch-sig-2',
          title: 'Lead 2',
          segment: 'team',
          signalRationale: 'High value team prospect',
          acquisitionCostCents: 2000,
          estimatedWtpCents: 15000,
          expiryTick: 500,
        },
      ]

      state = gameReducer(state, { type: 'demand.batch_triage' })

      // Both signals should be processed
      expect(state.demandSignals.length).toBe(0)
      expect(state.qualifiedOpportunities.length).toBe(2)
      expect(state.pipelineStage).toBe('product')
      expect(state.activeFunction).toBe('product')
    })
  })

  describe('Monetisation Function Overhaul', () => {
    it('applies Monetisation craft multiplier to signed ARR', () => {
      let state = createInitialState(300)
      state.currentActivation = {
        id: 'act-test',
        title: 'Enterprise AI Suite',
        targetSegment: 'enterprise',
        speedFit: 1.0,
        collabFit: 1.0,
        controlFit: 1.0,
        overallFit: 1.0,
        defectExposure: 0.05,
        timestampTick: 100,
      }
      state.systemCapabilities = { speed: 1.0, collaboration: 1.0, control: 1.0 }
      state.postedPriceMonthlyCents = 10000
      state.fleet.monetisation.craftRank = 2 // 1.45x multiplier

      const stateAfter = gameReducer(state, {
        type: 'monetisation.commit_price',
        rating: 'good',
      })

      const newAccount = stateAfter.accounts[0]
      expect(newAccount).toBeDefined()
      // base ARR = 10000 * 12 = 120000 cents
      // with craftRank 2 (1.45x) -> 120000 * 1.45 = 174000 cents
      const actualArr = (newAccount.baseMrrCents + newAccount.addonMrrCents) * 12
      expect(actualArr).toBe(174000)
    })
  })

  describe('Retention Function Overhaul', () => {
    it('applies Retention craft SLA armor to health recovery during squash hit', () => {
      let state = createInitialState(400)
      const testAccount = {
        id: 'acc-ret-1',
        name: 'Acme Corp',
        segment: 'enterprise' as const,
        baseMrrCents: 10000,
        addonMrrCents: 0,
        health: 40,
        ageTicks: 100,
        addonSlotsUsed: 0,
        isThreatened: true,
        threatDeadlineTick: 200,
        threatReason: 'Incident SLA Breach',
        unpaidGraceTicks: 0,
        delinquent: false,
        lastCollectionAttemptTick: null,
        fit: 0.8,
        overpricing: 0,
        defects: 0,
        serviceRemainderCents: 0,
      }
      state.accounts = [testAccount]
      state.retentionIncidents = [
        {
          id: 'threat-acc-ret-1',
          accountId: 'acc-ret-1',
          accountName: 'Acme Corp',
          title: 'Incident SLA Breach',
          category: 'executive',
          urgencyTicks: 100,
          maxUrgencyTicks: 100,
          consequence: 'Churn',
          hp: 1, // 1 hit left to clear
          maxHp: 4,
          threatType: 'piggy',
        },
      ]

      // Rank 2 craft: craftHealthBonusPct = 35 * (1 + 0.35 * 2) = 35 * 1.7 = 59.5 => +59.5 health
      state.fleet.retention.craftRank = 2

      const nextState = gameReducer(state, {
        type: 'retention.squash_hit',
        incidentId: 'threat-acc-ret-1',
        accountId: 'acc-ret-1',
        damage: 1,
        costCents: 0,
      })

      const updatedAccount = nextState.accounts.find(a => a.id === 'acc-ret-1')
      expect(updatedAccount).toBeDefined()
      expect(updatedAccount!.isThreatened).toBe(false)
      // 40 + 59.5 = 99.5
      expect(updatedAccount!.health).toBeGreaterThan(95)
    })
  })

  describe('Expansion Function Overhaul', () => {
    it('multiplies order ARR reward by expansion craft yield', () => {
      let state = createInitialState(500)
      const testAccount = {
        id: 'acc-exp-1',
        name: 'Nexus Corp',
        segment: 'enterprise' as const,
        baseMrrCents: 20000,
        addonMrrCents: 0,
        health: 90,
        ageTicks: 200,
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
      }
      state.accounts = [testAccount]
      state.expansionOrders = [
        {
          id: 'exp-order-1',
          accountId: 'acc-exp-1',
          accountName: 'Nexus Corp',
          chain: 'intelligence',
          targetTier: 1,
          rewardArrCents: 100000,
          rewardCashCents: 20000,
        },
      ]
      // Grid with matching item
      state.mergeGrid = Array(16).fill(null)
      state.mergeGrid[0] = {
        id: 'item-1',
        chain: 'intelligence',
        tier: 1,
      }

      // Rank 1 craft: craftMult = 2 -> rewardMultiplier = 1 + 0.20 * (2 - 1) = 1.20x (+20% ARR)
      state.fleet.expansion.craftRank = 1
      state.fleet.expansion.luckRank = 0

      const nextState = gameReducer(state, {
        type: 'expansion.fulfill_order',
        orderId: 'exp-order-1',
      })

      const updatedAccount = nextState.accounts.find(a => a.id === 'acc-exp-1')
      expect(updatedAccount).toBeDefined()
      // base rewardArrCents 100000 * 1.20 = 120000 cents/yr => addonMrrCents = 120000 / 12 = 10000
      expect(updatedAccount!.addonMrrCents).toBe(10000)
    })
  })

  describe('Operations Function Overhaul', () => {
    it('scales cash rebate and strain flush by operations craft rank on cash out', () => {
      let state = createInitialState(600)
      state.cashCents = 10000
      state.operations.strainBacklog = 20
      state.operations.contextRot = 0.5

      state.activeScratchCard = {
        id: 'card-test-ops',
        type: 'apple_tree',
        name: 'Apple Orchard Rig',
        subtitle: 'Test Rig',
        pods: [],
        bankedCashCents: 10000, // $100
        bankedStrainRelief: 8,
        bankedRotRelief: 0.2,
        isBusted: false,
        claimed: false,
      }

      // Operations Craft Rank 2: multiplier = 1 + 0.25 * 2 = 1.50x
      state.fleet.operations.craftRank = 2

      const nextState = gameReducer(state, {
        type: 'operations.cash_out_card',
      })

      // Cash rebate: 10000 initial + round(10000 * 1.50) = 25000
      expect(nextState.cashCents).toBe(25000)
      // Strain flushed: 20 - (8 * 1.5) = 20 - 12 = 8
      expect(nextState.operations.strainBacklog).toBe(8)
      // Context rot: 0.5 - (0.2 * 1.5) = 0.5 - 0.3 = 0.2
      expect(Math.abs(nextState.operations.contextRot - 0.2)).toBeLessThan(0.001)
      expect(nextState.activeScratchCard!.claimed).toBe(true)
    })

    it('scales diagnostic ticket racks from 1 to 6 with operations scale rank', () => {
      let state = createInitialState(700)
      state.cashCents = 10_000_000
      expect(state.activeTickets?.length || 1).toBe(1)

      // Upgrade scale from rank 0 to rank 1 -> 2 racks
      state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: 'operations', axis: 'scale' })
      expect(state.activeTickets?.length).toBe(2)

      // Advance clock tick to let synchronization ensure 2 tickets
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
      expect(state.activeTickets?.length).toBe(2)
      expect(state.activeTickets![0].stationIndex).toBe(0)
      expect(state.activeTickets![1].stationIndex).toBe(1)
    })

    it('manually scratches a diagnostic ticket sector and claims banked telemetry', () => {
      let state = createInitialState(701)
      state.fleet.operations.scaleRank = 0
      state.operations.strainBacklog = 15
      state.operations.contextRot = 0.4

      const initialTicket = state.activeTickets?.[0]
      expect(initialTicket).toBeDefined()
      expect(initialTicket!.pods.length).toBe(3)

      // Scratch sector 0 (Compute Core)
      state = gameReducer(state, {
        type: 'operations.scratch_ticket',
        stationIndex: 0,
        podIndex: 0,
      })

      const ticketAfter = state.activeTickets![0]
      expect(ticketAfter.pods[0].isScratched).toBe(true)

      // Claim the ticket
      const beforeCash = state.cashCents
      state = gameReducer(state, {
        type: 'operations.claim_ticket',
        stationIndex: 0,
      })

      // Cash should increase by banked amount (or 0 if was hazard/none)
      expect(state.cashCents).toBeGreaterThanOrEqual(beforeCash)
      // New ticket generated in station 0
      expect(state.activeTickets![0].id).not.toBe(ticketAfter.id)
    })
  })

  describe('Monetisation Multi-Desk & Batch Close', () => {
    it('scales deal desks from 1 to 6 and allows batch closing', () => {
      let state = createInitialState(800)
      state.cashCents = 10_000_000
      expect(state.activeDealDesks?.length || 1).toBe(1)

      // Upgrade scale from rank 0 -> 1 -> 2 (3 desks)
      state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: 'monetisation', axis: 'scale' })
      state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: 'monetisation', axis: 'scale' })
      expect(state.activeDealDesks?.length).toBe(3)

      // Place activations on desks 0 and 1
      state.activeDealDesks![0].activation = {
        id: 'desk-act-0',
        title: 'Founder Package',
        targetSegment: 'creator',
        speedFit: 1.0,
        collabFit: 1.0,
        controlFit: 1.0,
        overallFit: 1.0,
        defectExposure: 0.01,
        timestampTick: 100,
      }
      state.activeDealDesks![0].postedPriceMonthlyCents = 5000

      state.activeDealDesks![1].activation = {
        id: 'desk-act-1',
        title: 'Mid-Market Suite',
        targetSegment: 'team',
        speedFit: 1.0,
        collabFit: 1.0,
        controlFit: 1.0,
        overallFit: 1.0,
        defectExposure: 0.02,
        timestampTick: 100,
      }
      state.activeDealDesks![1].postedPriceMonthlyCents = 15000

      const accountsBefore = state.accounts.length

      // Batch close all active desks
      state = gameReducer(state, { type: 'monetisation.batch_close' })

      // Both deals should close and convert into customer accounts
      expect(state.accounts.length).toBe(accountsBefore + 2)
    })

    it('commits deal on a specific deal desk with normalized cursor', () => {
      let state = createInitialState(801)
      state.cashCents = 10_000_000
      state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: 'monetisation', axis: 'scale' })
      expect(state.activeDealDesks?.length).toBe(2)

      state.activeDealDesks![1].activation = {
        id: 'desk-act-spec',
        title: 'Specific Desk Deal',
        targetSegment: 'team',
        speedFit: 1.0,
        collabFit: 1.0,
        controlFit: 1.0,
        overallFit: 1.0,
        defectExposure: 0.01,
        timestampTick: 100,
      }
      state.activeDealDesks![1].postedPriceMonthlyCents = 12000

      const accountsBefore = state.accounts.length
      state = gameReducer(state, {
        type: 'monetisation.commit_desk',
        deskIndex: 1,
        rating: 'perfect',
        normalizedCursor: 0.6,
      })

      expect(state.accounts.length).toBe(accountsBefore + 1)
    })
  })

  describe('Retention Sentinel Bays Expansion', () => {
    it('expands retention shelf capacity from 1 to 6 bays with scale rank', () => {
      expect(RETENTION_BAY_LIMITS[0]).toBe(1)
      expect(RETENTION_BAY_LIMITS[1]).toBe(2)
      expect(RETENTION_BAY_LIMITS[2]).toBe(3)
      expect(RETENTION_BAY_LIMITS[3]).toBe(4)
      expect(RETENTION_BAY_LIMITS[4]).toBe(5)
      expect(RETENTION_BAY_LIMITS[5]).toBe(6)

      let state = createInitialState(900)
      state.fleet.retention.scaleRank = 5 // max rank -> 6 bays
      state.fleet.retention.automateRank = 1 // CS Swarm active

      // Create 6 threatened accounts
      state.accounts = Array.from({ length: 6 }).map((_, i) => ({
        id: `acc-shelf-${i}`,
        name: `Customer ${i}`,
        segment: 'team' as const,
        baseMrrCents: 5000,
        addonMrrCents: 0,
        health: 20,
        ageTicks: 100,
        addonSlotsUsed: 0,
        isThreatened: true,
        threatDeadlineTick: 200,
        threatReason: 'Downtime',
        unpaidGraceTicks: 0,
        delinquent: false,
        lastCollectionAttemptTick: null,
        fit: 0.8,
        overpricing: 0,
        defects: 0,
        serviceRemainderCents: 0,
      }))

      // Advance clock tick with automateRank 1
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })

      // CS Swarm should protect up to 6 bays
      const recoveredAccounts = state.accounts.filter(a => a.health > 20)
      expect(recoveredAccounts.length).toBeGreaterThan(0)
    })
  })

  describe('Expansion Dynamic Matrix & Tier 7 Scaling', () => {
    it('scales grid sizes to 16, 25, 36 based on scale rank', () => {
      expect(EXPANSION_GRID_SIZES).toEqual([16, 16, 25, 25, 36, 36])
      expect(EXPANSION_GRID_DIMS).toEqual([4, 4, 5, 5, 6, 6])

      let state = createInitialState(1000)
      state.cashCents = 100_000_000
      expect(state.mergeGrid!.length).toBe(16)

      // Buy rank 1, then rank 2 -> 25 slots (5x5)
      state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: 'expansion', axis: 'scale' })
      state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: 'expansion', axis: 'scale' })
      expect(state.mergeGrid!.length).toBe(25)

      // Buy rank 3, then rank 4 -> 36 slots (6x6)
      state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: 'expansion', axis: 'scale' })
      state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: 'expansion', axis: 'scale' })
      expect(state.mergeGrid!.length).toBe(36)
    })

    it('merges features up to Tier 7 and fulfills Tier 7 orders', () => {
      let state = createInitialState(1001)
      state.fleet.expansion.scaleRank = 4 // 36 slots
      state.mergeGrid = Array(36).fill(null)

      // Place two Tier 6 Intelligence features
      state.mergeGrid[0] = {
        id: 't6-1',
        chain: 'intelligence',
        tier: 6,
      }
      state.mergeGrid[1] = {
        id: 't6-2',
        chain: 'intelligence',
        tier: 6,
      }

      // Merge slot 0 into slot 1
      state = gameReducer(state, {
        type: 'expansion.merge_grid',
        fromIndex: 0,
        toIndex: 1,
      })

      // Slot 0 is now empty, slot 1 is upgraded to Tier 7!
      expect(state.mergeGrid![0]).toBeNull()
      expect(state.mergeGrid![1]).toBeDefined()
      expect(state.mergeGrid![1]!.tier).toBe(7)
      expect(EXTENDED_TIER_NAMES.intelligence[6]).toBe('Sovereign Superintelligence')

      // Fulfill a Tier 7 order
      state.accounts = [
        {
          id: 'acc-t7',
          name: 'Apex Supercorp',
          segment: 'enterprise' as const,
          baseMrrCents: 50000,
          addonMrrCents: 0,
          health: 100,
          ageTicks: 500,
          addonSlotsUsed: 0,
          isThreatened: false,
          threatDeadlineTick: null,
          threatReason: null,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 1.0,
          overpricing: 0,
          defects: 0,
          serviceRemainderCents: 0,
        },
      ]
      state.expansionOrders = [
        {
          id: 'exp-order-t7',
          accountId: 'acc-t7',
          accountName: 'Apex Supercorp',
          chain: 'intelligence',
          targetTier: 7,
          rewardArrCents: 500000,
          rewardCashCents: 100000,
        },
      ]

      state = gameReducer(state, {
        type: 'expansion.fulfill_order',
        orderId: 'exp-order-t7',
      })

      // The Tier 7 item was consumed to fulfill the order
      expect(state.mergeGrid![1]).toBeNull()
      const updatedAcc = state.accounts.find(a => a.id === 'acc-t7')
      expect(updatedAcc).toBeDefined()
      expect(updatedAcc!.addonMrrCents).toBeGreaterThan(0)
    })
  })
})
