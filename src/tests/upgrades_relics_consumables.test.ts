import { describe, it, expect } from 'vitest'
import { gameReducer } from '../engine/reducer'
import { createInitialState } from '../engine/state'
import { getUpgradeRankCost, calculateEconomicBurn } from '../engine/formulas'
import { FunctionId, ProgressionAxis } from '../engine/types'
import { UPGRADE_RANK_COSTS, RELIC_CATALOG, CONSUMABLE_CATALOG } from '../engine/constants'
import {
  FUNCTION_SKILL_TREE_CONFIG,
  getSkillTreeUpgradeInfo,
  getActiveSkillTreeUpgrades,
  OPERATIONAL_FUNCTIONS,
} from '../engine/assets'

describe('Skill Tree Upgrades, Relics, and Consumables Comprehensive Test Suite', () => {
  describe('Skill Tree Upgrades & Silicon Valley Seed Syndicate', () => {
    it('discounts rank costs by 35% with relic-syndicate in getUpgradeRankCost', () => {
      for (let rank = 0; rank < 5; rank++) {
        const fullCost = getUpgradeRankCost(rank, false)
        const discountedCost = getUpgradeRankCost(rank, true)
        expect(discountedCost).toBe(Math.round(fullCost * 0.65))
      }
    })

    it('charges the discounted cost in fleet.buy_upgrade when relic-syndicate is active', () => {
      let state = createInitialState(1)
      const baseCost = UPGRADE_RANK_COSTS[0] // 50_000 ($500)
      const discountedCost = Math.round(baseCost * 0.65) // 32_500 ($325)

      // Equip relic-syndicate
      const syndicateRelic = RELIC_CATALOG.find(r => r.id === 'relic-syndicate')!
      state = {
        ...state,
        cashCents: 200_000,
        activeRelics: [syndicateRelic],
      }

      const initialCash = state.cashCents
      state = gameReducer(state, {
        type: 'fleet.buy_upgrade',
        functionId: 'monetisation',
        axis: 'craft',
      })

      expect(state.fleet.monetisation.craftRank).toBe(1)
      expect(state.cashCents).toBe(initialCash - discountedCost)
    })

    it('charges undiscounted cost in fleet.buy_upgrade when relic-syndicate is NOT active', () => {
      let state = createInitialState(1)
      const baseCost = UPGRADE_RANK_COSTS[0] // 50_000 ($500)
      state = { ...state, cashCents: 200_000, activeRelics: [] }

      const initialCash = state.cashCents
      state = gameReducer(state, {
        type: 'fleet.buy_upgrade',
        functionId: 'monetisation',
        axis: 'craft',
      })

      expect(state.fleet.monetisation.craftRank).toBe(1)
      expect(state.cashCents).toBe(initialCash - baseCost)
    })

    it('supports upgrading all 6 departments and 4 axes up to rank 5', () => {
      let state = createInitialState(1)
      state = { ...state, cashCents: 100_000_000 } // plenty of cash
      const fns: FunctionId[] = ['demand', 'product', 'monetisation', 'retention', 'expansion', 'operations']
      const axes: ProgressionAxis[] = ['craft', 'scale', 'luck', 'automate']

      for (const fn of fns) {
        for (const axis of axes) {
          state = gameReducer(state, {
            type: 'fleet.buy_upgrade',
            functionId: fn,
            axis,
          })
          const rankKey = `${axis}Rank` as const
          expect(state.fleet[fn][rankKey]).toBe(1)
        }
      }
    })
  })

  describe('Quarterly Relics Integration', () => {
    it('relic-holding-swarm doubles maximum worker units from 8 to 16 in fleet.set_online_units', () => {
      let state = createInitialState(1)
      state.fleet.demand.scaleRank = 3 // SCALE_UNITS[3] = 8
      const holdingSwarmRelic = RELIC_CATALOG.find(r => r.id === 'relic-holding-swarm')!

      // Without relic, max units is 8 (at scaleRank 3)
      state = gameReducer(state, {
        type: 'fleet.set_online_units',
        functionId: 'demand',
        units: 12,
      })
      expect(state.fleet.demand.onlineUnits).toBe(8)

      // With relic, max units doubles to 16 (can set to 12)
      state = { ...state, activeRelics: [holdingSwarmRelic] }
      state = gameReducer(state, {
        type: 'fleet.set_online_units',
        functionId: 'demand',
        units: 12,
      })
      expect(state.fleet.demand.onlineUnits).toBe(12)
    })

    it('relic-sub-pod-buffer makes Tier 1 expansion matrix synthesis cost $0 compute', () => {
      let state = createInitialState(1)
      const subPodRelic = RELIC_CATALOG.find(r => r.id === 'relic-sub-pod-buffer')!
      state = { ...state, cashCents: 50_000, activeRelics: [subPodRelic] }

      const startCash = state.cashCents
      state = gameReducer(state, {
        type: 'expansion.spawn_item',
        chain: 'intelligence',
      })

      expect(state.cashCents).toBe(startCash) // $0 cost
      expect((state.mergeGrid ?? []).some(item => item?.chain === 'intelligence' && item.tier === 1)).toBe(true)
    })

    it('relic-quantum-annealing spawns Tier 2 module directly on expansion matrix', () => {
      let state = createInitialState(1)
      const quantumRelic = RELIC_CATALOG.find(r => r.id === 'relic-quantum-annealing')!
      state = { ...state, cashCents: 50_000, activeRelics: [quantumRelic] }

      state = gameReducer(state, {
        type: 'expansion.spawn_item',
        chain: 'security',
      })

      expect((state.mergeGrid ?? []).some(item => item?.chain === 'security' && item.tier === 2)).toBe(true)
    })

    it('relic-dark-fiber grants +0.40 speed capability boost upon acquisition', () => {
      let state = createInitialState(1)
      const darkFiberRelic = RELIC_CATALOG.find(r => r.id === 'relic-dark-fiber')!
      state = {
        ...state,
        cashCents: 10_000_000,
        availableQuarterRelics: [darkFiberRelic],
      }

      const initialSpeed = state.systemCapabilities.speed
      state = gameReducer(state, {
        type: 'relic.select',
        relicId: 'relic-dark-fiber',
      })

      expect(state.systemCapabilities.speed).toBeCloseTo(Math.min(1.0, initialSpeed + 0.40))
    })

    it('relic-debt-arbitrage awards 1% monthly yield on cash reserves at monthly boundary', () => {
      let state = createInitialState(1)
      const debtArbRelic = RELIC_CATALOG.find(r => r.id === 'relic-debt-arbitrage')!
      state = {
        ...state,
        cashCents: 10_000_000, // $100,000
        ticksInCurrentMonth: 599,
        activeRelics: [debtArbRelic],
      }

      // Tick 1 cross monthly boundary (600 ticks)
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
      // Yield is 1% of $100,000 = $1,000 (100,000 cents), minus monthly overhead
      expect(state.ledger.some(l => l.message.includes('Treasury Arbitrage Yield'))).toBe(true)
    })

    it('relic-defense-monopoly awards $250k grant at quarter review boundary', () => {
      let state = createInitialState(1)
      const defRelic = RELIC_CATALOG.find(r => r.id === 'relic-defense-monopoly')!
      state = {
        ...state,
        cashCents: 1_000_000,
        ticksInCurrentMonth: 599,
        monthInQuarter: 3,
        activeRelics: [defRelic],
      }

      const startCash = state.cashCents
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
      // Adds $250,000 (25,000,000 cents)
      expect(state.cashCents).toBeGreaterThan(startCash + 20_000_000)
      expect(state.alerts.some(a => a.title.includes('Classified Defense Exclusivity'))).toBe(true)
    })

    it('relic-circuit-breaker auto-heals 1 operational incident at quarter boundary', () => {
      let state = createInitialState(1)
      const cbRelic = RELIC_CATALOG.find(r => r.id === 'relic-circuit-breaker')!
      state = {
        ...state,
        operations: { ...state.operations, incidentsBacklog: 2 },
        ticksInCurrentMonth: 599,
        monthInQuarter: 3,
        activeRelics: [cbRelic],
      }

      state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
      expect(state.operations.incidentsBacklog).toBe(1)
      expect(state.alerts.some(a => a.title.includes('Circuit Breaker Auto-Heal'))).toBe(true)
    })

    it('relic-viral-monolith compounds ARR by +3% per 10 active customers at quarter boundary', () => {
      let state = createInitialState(1)
      const viralRelic = RELIC_CATALOG.find(r => r.id === 'relic-viral-monolith')!
      const testAccounts = Array.from({ length: 20 }, (_, i) => ({
        id: `acc-${i}`,
        name: `Test Customer ${i}`,
        segment: 'team' as const,
        baseMrrCents: 10_000,
        addonMrrCents: 0,
        health: 90,
        ageTicks: 100,
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
      }))

      state = {
        ...state,
        accounts: testAccounts,
        ticksInCurrentMonth: 599,
        monthInQuarter: 3,
        activeRelics: [viralRelic],
      }

      state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
      // 20 active customers -> Math.floor(20/10)*0.03 = +6% compounding on each account
      expect(state.accounts[0].baseMrrCents).toBe(10_600)
      expect(state.alerts.some(a => a.title.includes('Viral Flywheel Monolith Compounding'))).toBe(true)
    })

    it('relic-immortal-balance waives base monthly overhead bills and opex', () => {
      let state = createInitialState(1)
      const immortalRelic = RELIC_CATALOG.find(r => r.id === 'relic-immortal-balance')!
      state = { ...state, activeRelics: [immortalRelic] }

      const burn = calculateEconomicBurn(state)
      // Tier overhead should be 0 instead of $100/mo (10,000 cents)
      expect(burn.opexMonthCents).toBe(0)
    })

    it('relic-gpu-cluster waives automate upkeep in calculateEconomicBurn and monthly bills', () => {
      let state = createInitialState(1)
      const gpuRelic = RELIC_CATALOG.find(r => r.id === 'relic-gpu-cluster')!
      state.fleet.demand.automateRank = 2
      state.fleet.demand.onlineUnits = 4

      const burnWithoutRelic = calculateEconomicBurn(state)
      state = { ...state, activeRelics: [gpuRelic] }
      const burnWithRelic = calculateEconomicBurn(state)

      expect(burnWithRelic.opexMonthCents).toBeLessThan(burnWithoutRelic.opexMonthCents)
    })

    it('relic-open-source delivers organic inbound leads every 150 ticks ($0 CAC)', () => {
      let state = createInitialState(1)
      const ossRelic = RELIC_CATALOG.find(r => r.id === 'relic-open-source')!
      state = { ...state, elapsedTicks: 149, qualifiedOpportunities: [], activeRelics: [ossRelic] }

      state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
      expect(state.qualifiedOpportunities.length).toBe(1)
      expect(state.qualifiedOpportunities[0].title).toContain('Open Source')
    })

    it('relic-algorithmic-upsell automatically triages accounts with health < 60%', () => {
      let state = createInitialState(1)
      const algoRelic = RELIC_CATALOG.find(r => r.id === 'relic-algorithmic-upsell')!
      state = {
        ...state,
        accounts: [
          {
            id: 'acc-low-health',
            name: 'Struggling Corp',
            segment: 'team',
            baseMrrCents: 5_000,
            addonMrrCents: 0,
            health: 45, // < 60
            ageTicks: 100,
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
        ],
        activeRelics: [algoRelic],
      }

      state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
      // Receives +20 health triage
      expect(state.accounts[0].health).toBeGreaterThanOrEqual(64)
    })
  })

  describe('Tactical Consumables Integration', () => {
    it('cons-bullseye-lock grants 5 guaranteed strikes with +50% ARR bonus and decrements per deal', () => {
      let state = createInitialState(1)
      const bullseyeConsumable = CONSUMABLE_CATALOG.find(c => c.id === 'cons-bullseye-lock')!
      state = { ...state, consumablesInventory: [bullseyeConsumable] }

      // Use consumable
      state = gameReducer(state, {
        type: 'consumable.use',
        consumableId: 'cons-bullseye-lock',
      })
      expect(state.bullseyeStrikesRemaining).toBe(5)

      // Setup an activation on deal desk
      state.currentActivation = {
        id: 'act-1',
        title: 'Enterprise Pilot',
        targetSegment: 'team',
        speedFit: 0.8,
        collabFit: 0.8,
        controlFit: 0.8,
        overallFit: 0.8,
        defectExposure: 0,
        timestampTick: state.elapsedTicks,
        customWtpMonthlyCents: 50_000,
      }
      state.activeDealDesks = [
        {
          id: 'desk-0',
          deskIndex: 0,
          activation: state.currentActivation,
          postedPriceMonthlyCents: 50_000,
          status: 'negotiating',
        },
      ]

      state = gameReducer(state, {
        type: 'monetisation.commit_desk',
        deskIndex: 0,
        rating: 'hazard', // Even with hazard rating, bullseye lock forces success
      })

      // Account signed, strikes decremented from 5 to 4
      expect(state.bullseyeStrikesRemaining).toBe(4)
      expect(state.accounts.length).toBe(1)
      expect(state.alerts.some(a => a.title.includes('Guaranteed Bullseye Strike'))).toBe(true)
    })

    it('cons-patent-shield deflects operational incidents and churn threats for 45s', () => {
      let state = createInitialState(1)
      const shieldConsumable = CONSUMABLE_CATALOG.find(c => c.id === 'cons-patent-shield')!
      state = { ...state, consumablesInventory: [shieldConsumable] }

      state = gameReducer(state, {
        type: 'consumable.use',
        consumableId: 'cons-patent-shield',
      })
      expect(state.patentShieldTicksRemaining).toBe(450)

      // Add a degraded account
      state.accounts = [
        {
          id: 'acc-degraded',
          name: 'Vulnerable Corp',
          segment: 'creator',
          baseMrrCents: 2_000,
          addonMrrCents: 0,
          health: 30, // would normally trigger churn threat immediately
          ageTicks: 100,
          addonSlotsUsed: 0,
          isThreatened: false,
          threatDeadlineTick: null,
          threatReason: null,
          unpaidGraceTicks: 0,
          delinquent: false,
          lastCollectionAttemptTick: null,
          fit: 0.5,
          overpricing: 0.5,
          defects: 0.05,
          serviceRemainderCents: 0,
        },
      ]

      state = gameReducer(state, { type: 'clock.tick', dtTicks: 10 })
      // Suppresses churn threat while shield is active
      expect(state.accounts[0].isThreatened).toBe(false)
      expect(state.patentShieldTicksRemaining).toBe(440)
    })

    it('cons-supercluster-burst engages 5x overclock for 25s', () => {
      let state = createInitialState(1)
      const burstConsumable = CONSUMABLE_CATALOG.find(c => c.id === 'cons-supercluster-burst')!
      state = { ...state, consumablesInventory: [burstConsumable] }

      state = gameReducer(state, {
        type: 'consumable.use',
        consumableId: 'cons-supercluster-burst',
      })
      expect(state.warRoomTicksRemaining).toBe(250)
      expect(state.warRoomSpeedMultiplier).toBe(5.0)

      // Persists across clock tick
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 10 })
      expect(state.warRoomTicksRemaining).toBe(240)
      expect(state.warRoomSpeedMultiplier).toBe(5.0)
    })

    it('cons-matrix-purge upgrades all items on the 4x4 matrix by +1 tier', () => {
      let state = createInitialState(1)
      const purgeConsumable = CONSUMABLE_CATALOG.find(c => c.id === 'cons-matrix-purge')!
      state = {
        ...state,
        consumablesInventory: [purgeConsumable],
        mergeGrid: [
          { id: 'item-1', chain: 'intelligence', tier: 1 },
          { id: 'item-2', chain: 'security', tier: 2 },
          null,
          null,
        ],
      }

      state = gameReducer(state, {
        type: 'consumable.use',
        consumableId: 'cons-matrix-purge',
      })

      expect(state.mergeGrid?.[0]?.tier).toBe(2)
      expect(state.mergeGrid?.[1]?.tier).toBe(3)
      expect(state.mergeGrid?.[2]).toBeNull()
    })

    it('cons-enterprise-pilot signs and deploys Fortune 50 Enterprise account', () => {
      let state = createInitialState(1)
      const pilotConsumable = CONSUMABLE_CATALOG.find(c => c.id === 'cons-enterprise-pilot')!
      state = { ...state, consumablesInventory: [pilotConsumable] }

      state = gameReducer(state, {
        type: 'consumable.use',
        consumableId: 'cons-enterprise-pilot',
      })

      const enterpriseAcc = state.accounts.find(a => a.name.includes('Fortune 50'))
      expect(enterpriseAcc).toBeDefined()
      expect(enterpriseAcc?.segment).toBe('enterprise')
      expect(state.eligibleArrCents).toBeGreaterThanOrEqual(200_000_00)
    })

    it('cons-talent-blitz increases Craft rank across all 6 departments by +1', () => {
      let state = createInitialState(1)
      const talentConsumable = CONSUMABLE_CATALOG.find(c => c.id === 'cons-talent-blitz')!
      state = { ...state, consumablesInventory: [talentConsumable] }

      const fns: FunctionId[] = ['demand', 'product', 'monetisation', 'retention', 'expansion', 'operations']
      for (const fn of fns) {
        expect(state.fleet[fn].craftRank).toBe(0)
      }

      state = gameReducer(state, {
        type: 'consumable.use',
        consumableId: 'cons-talent-blitz',
      })

      for (const fn of fns) {
        expect(state.fleet[fn].craftRank).toBe(1)
      }
    })

    it('cons-valuation-pump bumps valuation and boosts Growth Multiple on next review', () => {
      let state = createInitialState(1)
      const pumpConsumable = CONSUMABLE_CATALOG.find(c => c.id === 'cons-valuation-pump')!
      state = { ...state, consumablesInventory: [pumpConsumable] }

      const initialValuation = state.valuationCents
      state = gameReducer(state, {
        type: 'consumable.use',
        consumableId: 'cons-valuation-pump',
      })

      expect(state.valuationCents).toBeGreaterThan(initialValuation)
      expect(state.quarterValuationBoostMultiple).toBe(5.0)

      // Clocks tick and retains the boost multiple
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
      expect(state.quarterValuationBoostMultiple).toBe(5.0)
    })
  })

  describe('Contextual Skill Tree Upgrades across Functions & Tiers', () => {
    it('defines 120 unique, non-empty upgrades across all 6 operational functions, 4 axes, and 5 tiers', () => {
      const axes: ProgressionAxis[] = ['craft', 'scale', 'automate', 'luck']
      const labelSet = new Set<string>()

      for (const fn of OPERATIONAL_FUNCTIONS) {
        const fnConfig = FUNCTION_SKILL_TREE_CONFIG[fn.id]
        expect(fnConfig).toBeDefined()

        for (const axis of axes) {
          const axisTiers = fnConfig[axis]
          expect(axisTiers).toHaveLength(5)

          for (let tier = 1; tier <= 5; tier++) {
            const info = getSkillTreeUpgradeInfo(fn.id, axis, tier)
            expect(info.label).toBeTruthy()
            expect(info.desc).toBeTruthy()
            expect(info.detail).toBeTruthy()

            // Labels must be unique across all 120 upgrades
            expect(labelSet.has(info.label)).toBe(false)
            labelSet.add(info.label)
          }
        }
      }

      expect(labelSet.size).toBe(120)
    })

    it('ensures same-tier upgrades across functions have distinct, contextual names', () => {
      // E.g. Demand T1 Automate must not match Product T1 Automate
      const demAutoT1 = getSkillTreeUpgradeInfo('demand', 'automate', 1)
      const prdAutoT1 = getSkillTreeUpgradeInfo('product', 'automate', 1)
      const monAutoT1 = getSkillTreeUpgradeInfo('monetisation', 'automate', 1)
      const retAutoT1 = getSkillTreeUpgradeInfo('retention', 'automate', 1)
      const expAutoT1 = getSkillTreeUpgradeInfo('expansion', 'automate', 1)
      const opsAutoT1 = getSkillTreeUpgradeInfo('operations', 'automate', 1)

      expect(demAutoT1.label).toBe('Inbound Lead Cron Daemon')
      expect(prdAutoT1.label).toBe('Continuous Integration Daemon')
      expect(monAutoT1.label).toBe('Quote-to-Cash Daemon')
      expect(retAutoT1.label).toBe('Heartbeat Sentinel Daemon')
      expect(expAutoT1.label).toBe('Seat Limit Notifier Daemon')
      expect(opsAutoT1.label).toBe('Hygiene Janitor Daemon')

      const labels = [
        demAutoT1.label,
        prdAutoT1.label,
        monAutoT1.label,
        retAutoT1.label,
        expAutoT1.label,
        opsAutoT1.label,
      ]
      expect(new Set(labels).size).toBe(6)
    })

    it('getActiveSkillTreeUpgrades populates function-specific names in company rail', () => {
      let state = createInitialState(1)
      state = {
        ...state,
        fleet: {
          ...state.fleet,
          demand: { ...state.fleet.demand, automateRank: 1 },
          product: { ...state.fleet.product, automateRank: 1 },
        },
      }

      const active = getActiveSkillTreeUpgrades(state.fleet)
      const demUpgrade = active.find(u => u.functionId === 'demand' && u.axis === 'automate')
      const prdUpgrade = active.find(u => u.functionId === 'product' && u.axis === 'automate')

      expect(demUpgrade?.name).toBe('Inbound Lead Cron Daemon')
      expect(prdUpgrade?.name).toBe('Continuous Integration Daemon')
      expect(demUpgrade?.name).not.toBe(prdUpgrade?.name)
    })
  })
})

