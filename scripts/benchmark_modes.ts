import { createInitialState } from '../src/engine/state'
import { gameReducer } from '../src/engine/reducer'
import type { GameState, FunctionId, ProgressionAxis } from '../src/engine/types'
import { UPGRADE_RANK_COSTS, UNICORN_VALUATION_CENTS } from '../src/engine/constants'

function simulateMode(mode: 'pure_manual' | 'pure_automation' | 'speedrun_combined', maxTicks: number = 36000) {
  let state = createInitialState(42)
  state = { ...state, paused: false }

  let tick = 0
  let manualDeals = 0
  let autoDeals = 0

  while (tick < maxTicks && state.runStatus === 'running') {
    // Quarter review
    if (state.quarterReviewPending) {
      if (state.availableQuarterRelics.length > 0) {
        state = gameReducer(state, { type: 'relic.select', relicId: state.availableQuarterRelics[0].id })
      }
      state = gameReducer(state, { type: 'quarter.close_review' })
    }

    // Upgrades (for automation and speedrun)
    if (mode === 'pure_automation' || mode === 'speedrun_combined') {
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
    }

    // Manual actions (for pure_manual and speedrun_combined)
    // Assume a human takes at least 20 ticks (2 seconds) between manual actions
    if (mode === 'pure_manual' || mode === 'speedrun_combined') {
      if (tick % 20 === 0) {
        if (state.demandSignals.length > 0 && state.qualifiedOpportunities.length < 2) {
          const sig = state.demandSignals[0]
          if (state.cashCents >= sig.acquisitionCostCents + 10_000) {
            state = gameReducer(state, { type: 'demand.triage', signalId: sig.id, decision: 'qualify' })
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
          const prevAccs = state.accounts.length
          state = gameReducer(state, { type: 'monetisation.commit_price', normalizedCursor: 0.65, rating: 'perfect' })
          if (state.accounts.length > prevAccs) manualDeals++
        }
      }
    }

    // Operations maintenance
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

    const prevAccounts = state.accounts.length
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
    tick += 1

    // Count auto deals
    if (state.accounts.length > prevAccounts && (mode === 'pure_automation' || mode === 'speedrun_combined')) {
      autoDeals += (state.accounts.length - prevAccounts)
    }

    if (mode === 'speedrun_combined' && (tick % 600 === 0 || state.valuationCents >= UNICORN_VALUATION_CENTS)) {
      console.log(`  [${(tick / 600).toFixed(1)}m | Q${state.quarter} M${state.monthInQuarter}] Val: $${(state.valuationCents / 100).toLocaleString()}, ARR: $${(state.contractualArrCents / 100).toLocaleString()}, Cash: $${(state.cashCents / 100).toLocaleString()}, Accs: ${state.accounts.length}`)
    }

    if (state.valuationCents >= UNICORN_VALUATION_CENTS) {
      break
    }
  }

  const reached = state.valuationCents >= UNICORN_VALUATION_CENTS
  console.log(`Mode: ${mode}`)
  console.log(`  Reached $1B: ${reached}`)
  console.log(`  Ticks: ${tick} (${(tick / 10).toFixed(1)}s, ${(tick / 600).toFixed(2)} min at 1x, ${(tick / 3000).toFixed(2)} min at 5x)`)
  console.log(`  Valuation: $${(state.valuationCents / 100).toLocaleString()}`)
  console.log(`  ARR: $${(state.contractualArrCents / 100).toLocaleString()}`)
  console.log(`  Cash: $${(state.cashCents / 100).toLocaleString()}`)
  console.log(`  Total Accounts: ${state.accounts.length} (Manual: ${manualDeals}, Auto: ${autoDeals})`)
  console.log(`  Status: ${state.runStatus} ${state.failureReason ?? ''}`)
  console.log()
}

console.log('--- BENCHMARKING DIFFERENT PLAY MODES ---')
simulateMode('pure_manual', 18000)
simulateMode('pure_automation', 18000)
simulateMode('speedrun_combined', 18000)
