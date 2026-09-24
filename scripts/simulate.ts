import { createInitialState } from '../src/engine/state'
import { gameReducer } from '../src/engine/reducer'
import type { FunctionId, ProgressionAxis } from '../src/engine/types'
import { UPGRADE_RANK_COSTS, UNICORN_VALUATION_CENTS } from '../src/engine/constants'

interface SimConfig {
  useLuckyCatGimmick: boolean
  maxTicks: number // 10 ticks = 1 second. 7200 ticks = 12 minutes. 9000 ticks = 15 minutes.
  speedMultiplier: number // 1x or 5x (speedrunning in real-time)
  seed: number
  verbose?: boolean
}

interface SimResult {
  reachedUnicorn: boolean
  elapsedTicks: number
  realSecondsAt1x: number
  realMinutesAt1x: number
  realMinutesAt5x: number
  finalValuationCents: number
  finalArrCents: number
  finalCashCents: number
  accountsCount: number
  failureReason?: string
  runStatus: string
}

export function runSimulation(config: SimConfig): SimResult {
  let state = createInitialState(config.seed)
  // Ensure unpaused
  state = { ...state, paused: false }

  const dt = 1 // advance 1 tick at a time for accurate simulation
  let tick = 0

  while (tick < config.maxTicks && state.runStatus === 'running') {
    // 1. Check if quarter review pending -> pick best relic & consumable and close
    if (state.quarterReviewPending) {
      if (state.availableQuarterRelics.length > 0) {
        // Pick relic prioritizing anisotropic sheen, gpu cluster, sovereign grant, auto compiler
        const priority = ['relic-anisotropic-sheen', 'relic-gpu-cluster', 'relic-sovereign-grant', 'relic-auto-compiler', 'relic-algo-pricing', 'relic-negative-churn']
        let chosenRelic = state.availableQuarterRelics[0]
        for (const p of priority) {
          const found = state.availableQuarterRelics.find(r => r.id === p)
          if (found) { chosenRelic = found; break }
        }
        state = gameReducer(state, { type: 'relic.select', relicId: chosenRelic.id })
      }
      if (state.availableQuarterConsumables?.length > 0) {
        const chosenCons = state.availableQuarterConsumables[0]
        state = gameReducer(state, { type: 'consumable.select', consumableId: chosenCons.id })
      }
      state = gameReducer(state, { type: 'quarter.close_review' })
    }

    // 2. Use consumables if advantageous
    if (state.consumablesInventory?.length > 0) {
      for (const cons of state.consumablesInventory) {
        state = gameReducer(state, { type: 'consumable.use', consumableId: cons.id })
      }
    }

    // 3. Gimmick: Spam lucky cat / Speculative LLVM optimizer if enabled
    if (config.useLuckyCatGimmick) {
      // Spam it 5 times every tick!
      for (let i = 0; i < 5; i++) {
        state = gameReducer(state, { type: 'operations.play_lucky_cat' })
      }
    }

    // 4. SPEEDRUNNER STRATEGY ACTIONS:

    // A. Clear operations incidents and strain
    if (state.operations.incidentsBacklog > 0) {
      if (state.operations.diagnosedRootCause) {
        state = gameReducer(state, { type: 'operations.resolve_incident' })
      } else {
        state = gameReducer(state, { type: 'operations.diagnose_cause', cause: 'Prompt Context Drift & Memory Desync' })
        state = gameReducer(state, { type: 'operations.resolve_incident' })
      }
    }
    if (state.operations.strainBacklog > 5) {
      state = gameReducer(state, { type: 'operations.clear_strain' })
    }
    if (state.operations.contextRot > 0.3) {
      state = gameReducer(state, { type: 'operations.cleanse_rot' })
    }

    // B. Address churn threats in Retention
    if (state.activeThreatAccountId) {
      state = gameReducer(state, {
        type: 'retention.intervene',
        accountId: state.activeThreatAccountId,
        interventionType: 'founder_call'
      })
    }
    if (state.retentionEvent?.active) {
      state = gameReducer(state, { type: 'event.resolve_retention' })
    }
    if (state.operationsEvent?.active) {
      state = gameReducer(state, { type: 'event.resolve_operations' })
    }
    if (state.expansionEvent?.active) {
      state = gameReducer(state, { type: 'event.resolve_expansion' })
    }

    // C. Finance: Draw VC if eligible and high growth
    if (!state.vc.accepted && state.eligibleArrCents >= 1_200_000 && state.growthMultiple >= 8) {
      state = gameReducer(state, { type: 'finance.accept_vc_mandate' })
    }

    // D. Fleet Upgrades: Speedrunner buys upgrades as soon as affordable
    // Priorities:
    // 1. Demand Automate 1, Product Automate 1, Monetisation Automate 1, Ops Automate 1
    // 2. Monetisation Craft (multiplies contract ARR!)
    // 3. Product Craft / Scale / Automate
    // 4. Demand Craft / Scale / Automate
    // 5. Operations Scale / Craft to handle load
    const upgradeOrder: Array<{ fn: FunctionId; axis: ProgressionAxis }> = [
      { fn: 'monetisation', axis: 'craft' },
      { fn: 'product', axis: 'automate' },
      { fn: 'demand', axis: 'automate' },
      { fn: 'monetisation', axis: 'automate' },
      { fn: 'operations', axis: 'automate' },
      { fn: 'operations', axis: 'craft' },
      { fn: 'product', axis: 'craft' },
      { fn: 'demand', axis: 'craft' },
      { fn: 'operations', axis: 'scale' },
      { fn: 'product', axis: 'scale' },
      { fn: 'demand', axis: 'scale' },
      { fn: 'monetisation', axis: 'scale' },
      { fn: 'retention', axis: 'automate' },
      { fn: 'expansion', axis: 'automate' },
      { fn: 'expansion', axis: 'craft' },
    ]

    for (const u of upgradeOrder) {
      const currentRank = state.fleet[u.fn]?.[`${u.axis}Rank` as keyof typeof state.fleet[typeof u.fn]] as number ?? 0
      if (currentRank < 4) {
        const cost = UPGRADE_RANK_COSTS[currentRank]
        // Leave at least $1,000 cash reserve to pay bills
        if (state.cashCents >= cost + 100_000) {
          state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: u.fn, axis: u.axis })
        }
      }
    }

    // If scale upgraded, scale up online units if ops capacity allows
    for (const fn of ['demand', 'product', 'monetisation', 'operations'] as FunctionId[]) {
      const f = state.fleet[fn]
      const maxUnits = [1, 2, 4, 8, 16][f.scaleRank]
      if (f.onlineUnits < maxUnits && state.operations.coordinationLoad + 2 <= state.operations.opsCapacity) {
        state = gameReducer(state, { type: 'fleet.set_online_units', functionId: fn, units: f.onlineUnits + 1 })
      }
    }

    // E. Pipeline manual playing if queue is empty or manual speedrun
    // 1. Demand: Qualify best signal if opportunities < 3
    if (state.qualifiedOpportunities.length < 3 && state.demandSignals.length > 0) {
      // Sort signals by estimated WTP descending
      const bestSignal = [...state.demandSignals].sort((a, b) => b.estimatedWtpCents - a.estimatedWtpCents)[0]
      if (bestSignal && state.cashCents >= bestSignal.acquisitionCostCents + 10_000) {
        state = gameReducer(state, {
          type: 'demand.triage',
          signalId: bestSignal.id,
          decision: 'qualify'
        })
      }
    }

    // 2. Product: If components not placed or not verified, assemble and ship
    if (state.activeFunction === 'product' || state.pipelineStage === 'product' || (!state.currentActivation && state.activationsQueue.length === 0)) {
      state = gameReducer(state, { type: 'product.place_component', componentId: 'engine-streaming', slot: 'speed' })
      state = gameReducer(state, { type: 'product.place_component', componentId: 'collab-presence', slot: 'collaboration' })
      state = gameReducer(state, { type: 'product.place_component', componentId: 'control-sandbox', slot: 'control' })
      state = gameReducer(state, { type: 'product.verify' })
      state = gameReducer(state, { type: 'product.ship' })
    }

    // 3. Monetisation: Commit price with perfect timing
    if (state.currentActivation) {
      state = gameReducer(state, {
        type: 'monetisation.commit_price',
        normalizedCursor: 0.65,
        rating: 'perfect'
      })
    }

    // 4. Expansion: If mature account has empty slot and cash available
    if (state.accounts.length > 0) {
      const matureAcc = state.accounts.find(a => a.ageTicks >= 1200 && a.health >= 60 && a.addonSlotsUsed < 2)
      if (matureAcc && state.cashCents >= 50_000) {
        state = gameReducer(state, {
          type: 'expansion.merge_package',
          accountId: matureAcc.id,
          packId: 'pack-seats'
        })
      }
    }

    // F. Advance Clock Tick
    state = gameReducer(state, { type: 'clock.tick', dtTicks: dt })
    tick += dt

    if (tick % 50 === 0 || state.valuationCents >= UNICORN_VALUATION_CENTS) {
      console.log(`[Tick ${tick} (${(tick/10).toFixed(1)}s)] Cash: $${(state.cashCents / 100).toLocaleString()}, ARR: $${(state.contractualArrCents / 100).toLocaleString()}, Val: $${(state.valuationCents / 100).toLocaleString()}, Accs: ${state.accounts.length}`)
    }

    if (state.valuationCents >= UNICORN_VALUATION_CENTS) {
      break
    }
  }

  const reachedUnicorn = state.valuationCents >= UNICORN_VALUATION_CENTS
  const realSecondsAt1x = tick / 10
  const realMinutesAt1x = realSecondsAt1x / 60
  const realMinutesAt5x = realMinutesAt1x / 5

  return {
    reachedUnicorn,
    elapsedTicks: tick,
    realSecondsAt1x,
    realMinutesAt1x,
    realMinutesAt5x,
    finalValuationCents: state.valuationCents,
    finalArrCents: state.contractualArrCents,
    finalCashCents: state.cashCents,
    accountsCount: state.accounts.length,
    failureReason: state.failureReason,
    runStatus: state.runStatus
  }
}

console.log('--- TEST 1: Speedrunner WITH Lucky Cat exploit ---')
const resExploit = runSimulation({
  useLuckyCatGimmick: true,
  maxTicks: 9000,
  speedMultiplier: 1,
  seed: 42,
  verbose: false,
})
console.log('Exploit Result:', {
  reachedUnicorn: resExploit.reachedUnicorn,
  elapsedTicks: resExploit.elapsedTicks,
  realMinutesAt1x: resExploit.realMinutesAt1x.toFixed(2),
  realMinutesAt5x: resExploit.realMinutesAt5x.toFixed(2),
  finalValuation: `$${(resExploit.finalValuationCents / 100).toLocaleString()}`,
  finalCash: `$${(resExploit.finalCashCents / 100).toLocaleString()}`,
  status: resExploit.runStatus,
})

console.log('\n--- TEST 2: Speedrunner WITHOUT Lucky Cat exploit (Raw current engine) ---')
const resNoExploit = runSimulation({
  useLuckyCatGimmick: false,
  maxTicks: 9000,
  speedMultiplier: 1,
  seed: 42,
  verbose: true,
})
console.log('Raw Engine Result:', {
  reachedUnicorn: resNoExploit.reachedUnicorn,
  elapsedTicks: resNoExploit.elapsedTicks,
  realMinutesAt1x: resNoExploit.realMinutesAt1x.toFixed(2),
  realMinutesAt5x: resNoExploit.realMinutesAt5x.toFixed(2),
  finalValuation: `$${(resNoExploit.finalValuationCents / 100).toLocaleString()}`,
  finalCash: `$${(resNoExploit.finalCashCents / 100).toLocaleString()}`,
  accounts: resNoExploit.accountsCount,
  status: resNoExploit.runStatus,
  failure: resNoExploit.failureReason,
})
