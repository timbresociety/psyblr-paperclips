import { createInitialState } from '../src/engine/state'
import { gameReducer } from '../src/engine/reducer'

let state = createInitialState(42)
state = { ...state, paused: false }

for (let tick = 0; tick < 200; tick++) {
  // Check Product assembly
  state = gameReducer(state, { type: 'product.place_component', componentId: 'engine-streaming', slot: 'speed' })
  state = gameReducer(state, { type: 'product.place_component', componentId: 'collab-presence', slot: 'collaboration' })
  state = gameReducer(state, { type: 'product.place_component', componentId: 'control-sandbox', slot: 'control' })
  state = gameReducer(state, { type: 'product.verify' })
  state = gameReducer(state, { type: 'product.ship' })

  // Monetisation
  if (state.currentActivation) {
    state = gameReducer(state, { type: 'monetisation.commit_price', normalizedCursor: 0.65, rating: 'perfect' })
    console.log(`Tick ${tick}: signed account! Total accounts: ${state.accounts.length}, ARR: $${(state.contractualArrCents / 100).toLocaleString()}, Val: $${(state.valuationCents / 100).toLocaleString()}`)
  }

  state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })
  if (state.valuationCents >= 100_000_000_000) {
    console.log(`HIT UNICORN AT TICK ${tick}!`)
    break
  }
}
