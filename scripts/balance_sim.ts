import { createInitialState } from '../src/engine/state'
import { gameReducer } from '../src/engine/reducer'
import type { FunctionId, ProgressionAxis } from '../src/engine/types'
import { UPGRADE_RANK_COSTS, UNICORN_VALUATION_CENTS } from '../src/engine/constants'

// Let's test the revised tier thresholds and replenish interval:
// Tier 2: $50k ($5M cents)
// Tier 3: $500k ($50M cents)
// Tier 4: $25M ($2.5B cents)
// Tier 5: $250M ($25B cents)
// Replenish interval: 150 ticks (15s)

function runUltraSpeedrunner(manualIntervalTicks = 10, seed = 42) {
  let state = createInitialState(seed)
  state = { ...state, paused: false }

  let tick = 0

  while (tick < 36000 && state.runStatus === 'running') {
    // 1. Quarter review
    if (state.quarterReviewPending) {
      if (state.availableQuarterRelics.length > 0) {
        state = gameReducer(state, { type: 'relic.select', relicId: state.availableQuarterRelics[0].id })
      }
      state = gameReducer(state, { type: 'quarter.close_review' })
    }

    // 2. Consumables
    if (state.consumablesInventory?.length > 0) {
      for (const c of state.consumablesInventory) {
        state = gameReducer(state, { type: 'consumable.use', consumableId: c.id })
      }
    }

    // 3. Upgrades
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
    for (const u of upgradeOrder) {
      const currentRank = state.fleet[u.fn]?.[`${u.axis}Rank` as keyof typeof state.fleet[typeof u.fn]] as number ?? 0
      if (currentRank < 4) {
        const cost = UPGRADE_RANK_COSTS[currentRank]
        if (state.cashCents >= cost + 100_000) {
          state = gameReducer(state, { type: 'fleet.buy_upgrade', functionId: u.fn, axis: u.axis })
        }
      }
    }

    // 4. Operations
    if (state.operations.strainBacklog > 5) {
      state = gameReducer(state, { type: 'operations.clear_strain' })
    }
    if (state.operations.contextRot > 0.3) {
      state = gameReducer(state, { type: 'operations.cleanse_rot' })
    }
    if (state.operations.incidentsBacklog > 0) {
      state = gameReducer(state, { type: 'operations.diagnose_cause', cause: 'Prompt Context Drift & Memory Desync' })
      state = gameReducer(state, { type: 'operations.resolve_incident' })
    }

    // 5. Ultra speedrunner clicks every manualIntervalTicks (e.g. 10 ticks = 1.0s, or 15 ticks = 1.5s)
    if (tick % manualIntervalTicks === 0) {
      if (state.demandSignals.length > 0 && state.qualifiedOpportunities.length < 2) {
        const best = [...state.demandSignals].sort((a, b) => b.estimatedWtpCents - a.estimatedWtpCents)[0]
        if (best && state.cashCents >= best.acquisitionCostCents + 10_000) {
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

    if (state.valuationCents >= UNICORN_VALUATION_CENTS) {
      break
    }
  }

  const reached = state.valuationCents >= UNICORN_VALUATION_CENTS
  const minsAt1x = (tick / 600).toFixed(2)
  console.log(`Interval ${manualIntervalTicks} ticks (${(manualIntervalTicks/10).toFixed(1)}s): Reached: ${reached}, Ticks: ${tick}, Minutes: ${minsAt1x}m, Q${state.quarter}, Val: $${(state.valuationCents / 100).toLocaleString()}, ARR: $${(state.contractualArrCents / 100).toLocaleString()}`)
  return { reached, tick, minsAt1x, quarter: state.quarter }
}

runUltraSpeedrunner(10) // 1 second
runUltraSpeedrunner(15) // 1.5 seconds
runUltraSpeedrunner(20) // 2.0 seconds
runUltraSpeedrunner(30) // 3.0 seconds
