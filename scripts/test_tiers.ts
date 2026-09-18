import { createInitialState } from '../src/engine/state'
import { gameReducer } from '../src/engine/reducer'
import type { FunctionId, ProgressionAxis } from '../src/engine/types'
import { UPGRADE_RANK_COSTS, UNICORN_VALUATION_CENTS } from '../src/engine/constants'

// Let's test with revised demand signal thresholds in state.ts
// If Tier 4 is $20M (2_000_000_000) and Tier 5 is $200M (20_000_000_000)
