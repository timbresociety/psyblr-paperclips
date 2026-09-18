import { createInitialState } from '../src/engine/state'
import { gameReducer } from '../src/engine/reducer'
import type { FunctionId, ProgressionAxis } from '../src/engine/types'
import { UPGRADE_RANK_COSTS, UNICORN_VALUATION_CENTS } from '../src/engine/constants'

// Let's test what happens if product.ship has a 20-tick staging cooldown
// and monetisation.commit_price has a 15-tick contract review cooldown
console.log('Testing staging cooldown concept...')
