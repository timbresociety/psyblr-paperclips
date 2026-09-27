import { EVOLUTION_TIERS } from '../../engine/constants'
import type { EvolutionTier } from '../../engine/types'

/** 0-based position of a tier in the evolution ladder (garage = 0). */
export function tierIndexOf(tier: EvolutionTier | string): number {
  const i = EVOLUTION_TIERS.findIndex(t => t.tier === tier)
  return i < 0 ? 0 : i
}
