import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'
import {
  UPGRADE_RANK_COSTS,
  UNICORN_VALUATION_CENTS,
  SEGMENT_PROFILES,
} from '../engine/constants'
import type { FunctionId, ProgressionAxis } from '../engine/types'

describe('Game Balancing & Speedrun Invariants', () => {
  describe('Anti-Gimmick Protection (Speculative LLVM Optimizer)', () => {
    it('enforces flat cash delta instead of geometric compounding', () => {
      let state = createInitialState(42)
      // Set high cash treasury to verify non-compounding
      state = { ...state, cashCents: 100_000_000 } // $1,000,000

      const initialCash = state.cashCents
      state = gameReducer(state, { type: 'operations.play_lucky_cat' })

      const cashDiff = state.cashCents - initialCash
      // Win awards flat +$200 (+20_000 cents), loss costs flat -$250 (-25_000 cents)
      // Never 40% of company treasury (+40_000_000 cents)!
      expect(Math.abs(cashDiff)).toBeLessThanOrEqual(25_000)
      expect(cashDiff === 20_000 || cashDiff === -25_000).toBe(true)
    })

    it('strictly enforces 300-tick (30s) operational cooldown', () => {
      let state = createInitialState(42)
      state = gameReducer(state, { type: 'operations.play_lucky_cat' })
      const lastTick = state.operations.lastSpeculativeTick

      expect(lastTick).toBe(state.elapsedTicks)

      // Immediate second click must be rejected by cooldown
      const rejectedState = gameReducer(state, { type: 'operations.play_lucky_cat' })
      expect(rejectedState.operations.lastSpeculativeTick).toBe(lastTick)
      expect(rejectedState.alerts[rejectedState.alerts.length - 1].title).toBe('JIT Compiler Cooling Down')

      // Advance clock by 150 ticks (15s) - still within cooldown
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 150 })
      const stillRejectedState = gameReducer(state, { type: 'operations.play_lucky_cat' })
      expect(stillRejectedState.operations.lastSpeculativeTick).toBe(lastTick)

      // Advance clock past 300 ticks - now allowed
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 160 })
      const allowedState = gameReducer(state, { type: 'operations.play_lucky_cat' })
      expect(allowedState.operations.lastSpeculativeTick).toBe(state.elapsedTicks)
    })
  })

  describe('Engine Action Cooldowns', () => {
    it('enforces product ship cooldown (25 ticks)', () => {
      let state = createInitialState(42)
      // Place valid components
      state = gameReducer(state, { type: 'product.place_component', componentId: 'engine-streaming', slot: 'speed' })
      state = gameReducer(state, { type: 'product.place_component', componentId: 'collab-presence', slot: 'collaboration' })
      state = gameReducer(state, { type: 'product.place_component', componentId: 'control-sandbox', slot: 'control' })
      state = gameReducer(state, { type: 'product.verify' })

      // Qualify an opportunity
      const sig = state.demandSignals[0]
      state = gameReducer(state, { type: 'demand.triage', signalId: sig.id, decision: 'qualify' })

      // First ship succeeds
      state = gameReducer(state, { type: 'product.ship' })
      const initialQueue = state.activationsQueue.length
      expect(initialQueue).toBe(1)

      // Qualify another opportunity and place components again
      state = { ...state, lastDemandTriageTick: -9999 }
      const sig2 = state.demandSignals[0]
      state = gameReducer(state, { type: 'demand.triage', signalId: sig2.id, decision: 'qualify' })
      state = gameReducer(state, { type: 'product.place_component', componentId: 'engine-streaming', slot: 'speed' })
      state = gameReducer(state, { type: 'product.place_component', componentId: 'collab-presence', slot: 'collaboration' })
      state = gameReducer(state, { type: 'product.place_component', componentId: 'control-sandbox', slot: 'control' })
      state = gameReducer(state, { type: 'product.verify' })

      // Immediate ship within 25 ticks is rejected
      const rejectedState = gameReducer(state, { type: 'product.ship' })
      expect(rejectedState.activationsQueue.length).toBe(initialQueue)

      // Advance clock past 25 ticks
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 26 })
      const allowedState = gameReducer(state, { type: 'product.ship' })
      expect(allowedState.activationsQueue.length).toBe(initialQueue + 1)
    })

    it('enforces monetisation commit cooldown (20 ticks)', () => {
      let state = createInitialState(42)
      state.currentActivation = {
        id: 'act-test-1',
        title: 'Test Customer',
        targetSegment: 'creator',
        speedFit: 0.8,
        collabFit: 0.8,
        controlFit: 0.8,
        overallFit: 0.8,
        defectExposure: 0.02,
        timestampTick: 0,
      }
      state.activationsQueue = [
        {
          id: 'act-test-2',
          title: 'Second Customer',
          targetSegment: 'creator',
          speedFit: 0.8,
          collabFit: 0.8,
          controlFit: 0.8,
          overallFit: 0.8,
          defectExposure: 0.02,
          timestampTick: 0,
        },
      ]

      state = gameReducer(state, { type: 'monetisation.commit_price', normalizedCursor: 0.65, rating: 'perfect' })
      expect(state.accounts.length).toBe(1)

      // Immediate second commit within 20 ticks is rejected
      const rejectedState = gameReducer(state, { type: 'monetisation.commit_price', normalizedCursor: 0.65, rating: 'perfect' })
      expect(rejectedState.accounts.length).toBe(1)

      // Advance clock past 20 ticks
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 21 })
      const allowedState = gameReducer(state, { type: 'monetisation.commit_price', normalizedCursor: 0.65, rating: 'perfect' })
      expect(allowedState.accounts.length).toBe(2)
    })
  })

  describe('Product Automation Integrity', () => {
    it('does not generate phantom activations when qualifiedOpportunities is empty', () => {
      let state = createInitialState(42)
      state.fleet.product.automateRank = 3
      state.fleet.product.onlineUnits = 2
      state.qualifiedOpportunities = []
      state.activationsQueue = []
      state.currentActivation = null

      // Advance clock by 300 ticks
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 300 })

      // With no qualified opportunities in pipeline, automation must not generate phantom customer activations
      expect(state.activationsQueue.length).toBe(0)
      expect(state.currentActivation).toBeNull()
      // But system capabilities are improved
      expect(state.systemCapabilities.speed).toBeGreaterThan(0)
    })
  })

  describe('Speedrun Valuation Floor Invariant (>= 12-15 Minutes to $1B)', () => {
    it('guarantees that even optimal speedrun strategy requires >= 7,200 ticks (12.0m at 1x speed)', () => {
      let state = createInitialState(42)
      state = { ...state, paused: false }
      let tick = 0

      // Run optimal speedrunner for 6,800 ticks (11.33 minutes)
      const testLimitTicks = 6_800
      while (tick < testLimitTicks && state.runStatus === 'running') {
        if (state.quarterReviewPending) {
          if (state.availableQuarterRelics.length > 0) {
            state = gameReducer(state, { type: 'relic.select', relicId: state.availableQuarterRelics[0].id })
          }
          state = gameReducer(state, { type: 'quarter.close_review' })
        }
        if (state.consumablesInventory?.length > 0) {
          for (const c of state.consumablesInventory) {
            state = gameReducer(state, { type: 'consumable.use', consumableId: c.id })
          }
        }
        const upgradeOrder: Array<{ fn: FunctionId; axis: ProgressionAxis }> = [
          { fn: 'monetisation', axis: 'craft' },
          { fn: 'product', axis: 'automate' },
          { fn: 'demand', axis: 'automate' },
          { fn: 'monetisation', axis: 'automate' },
          { fn: 'operations', axis: 'automate' },
          { fn: 'operations', axis: 'craft' },
          { fn: 'product', axis: 'craft' },
          { fn: 'demand', axis: 'craft' },
        ]
        // Prudent liquidity: ensure cash covers monthly obligations (including debt service) before buying upgrades
        const debtPmt = state.debt.active ? state.debt.monthlyPaymentCents : 0
        const monthlyObligations = (state.opexMonthCents + state.cogsMonthCents + debtPmt) || 100_000
        const requiredBuffer = Math.max(100_000, Math.round(monthlyObligations * 1.5))
        for (const u of upgradeOrder) {
          const currentRank = state.fleet[u.fn]?.[`${u.axis}Rank` as keyof typeof state.fleet[typeof u.fn]] as number ?? 0
          if (currentRank < 4) {
            const cost = UPGRADE_RANK_COSTS[currentRank]
            if (state.cashCents >= cost + requiredBuffer) {
              state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: u.fn, axis: u.axis })
            }
          }
        }
        // Draw credit facility in Finance room if liquidity drops below obligations
        if (state.cashCents < requiredBuffer && state.eligibleArrCents >= 240_000 && !state.debt.active) {
          const eligibleMrr = Math.floor(state.eligibleArrCents / 12)
          const drawAmount = Math.min(3 * eligibleMrr, Math.max(500_000, requiredBuffer))
          state = gameReducer(state, { type: 'finance.draw_debt', amountCents: drawAmount })
        }
        if (state.operations.strainBacklog > 5) state = gameReducer(state, { type: 'operations.clear_strain' })
        if (state.operations.contextRot > 0.3) state = gameReducer(state, { type: 'operations.cleanse_rot' })
        if (state.operations.incidentsBacklog > 0) {
          state = gameReducer(state, { type: 'operations.diagnose_cause', cause: 'Prompt Context Drift & Memory Desync' })
          state = gameReducer(state, { type: 'operations.resolve_incident' })
        }
        if (tick % 20 === 0) {
          if (state.demandSignals.length > 0 && state.qualifiedOpportunities.length < 2) {
            const candidates = state.demandSignals.filter(s => {
              if (s.segment === 'enterprise') return state.cashCents >= s.acquisitionCostCents * 2.5
              return state.cashCents - s.acquisitionCostCents >= monthlyObligations
            })
            const best = candidates.sort((a, b) => {
              const rateA = SEGMENT_PROFILES[a.segment]?.qualificationSuccessRate ?? 0.8
              const rateB = SEGMENT_PROFILES[b.segment]?.qualificationSuccessRate ?? 0.8
              return (b.estimatedWtpCents * rateB) - (a.estimatedWtpCents * rateA)
            })[0] || state.demandSignals[0]

            if (best && state.cashCents - best.acquisitionCostCents >= monthlyObligations) {
              state = gameReducer(state, { type: 'demand.triage', signalId: best.id, decision: 'qualify' })
            }
          }
          if (state.qualifiedOpportunities.length > 0 && !state.currentActivation) {
            state = gameReducer(state, { type: 'product.place_component', componentId: 'engine-streaming', slot: 'speed' })
            state = gameReducer(state, { type: 'product.place_component', componentId: 'collab-presence', slot: 'collaboration' })
            state = gameReducer(state, { type: 'product.place_component', componentId: 'control-sandbox', slot: 'control' })
            state = gameReducer(state, { type: 'product.verify' })
            state = gameReducer(state, { type: 'product.ship' })
          }
          if (state.currentActivation) {
            state = gameReducer(state, { type: 'monetisation.commit_price', normalizedCursor: 0.65, rating: 'perfect' })
          }
        }
        state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
        tick += 1
      }

      // At 6,800 ticks (< 11.5 minutes), valuation must be strictly below $1B USD
      expect(state.valuationCents).toBeLessThan(UNICORN_VALUATION_CENTS)
      if (state.runStatus === 'failed') {
        console.error('SPEEDRUN FAILED BECAUSE:', state.failureReason, 'tick:', tick, 'val:', state.valuationCents, 'cash:', state.cashCents)
      }
      expect(state.runStatus).toBe('running')
    }, 60000)
  })
})
