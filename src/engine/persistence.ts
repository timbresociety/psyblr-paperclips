import type { GameState } from './types'
import { createInitialState } from './state'
import { DEFAULT_PRODUCT_COMPONENTS } from './constants'

const STORAGE_KEY = 'solounicorn.checkpoint.v1'

export function saveCheckpoint(state: GameState): boolean {
  try {
    const serialized = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, serialized)
    return true
  } catch (err) {
    console.error('Failed to save checkpoint:', err)
    return false
  }
}

export function loadCheckpoint(): GameState {
  const initial = createInitialState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw) as Partial<GameState>
    if (parsed && parsed.version === 1) {
      return {
        ...initial,
        ...parsed,
        availableComponents: DEFAULT_PRODUCT_COMPONENTS,
        qualifiedOpportunities: parsed.qualifiedOpportunities ?? [],
        themeTierOverride: parsed.themeTierOverride ?? null,
        demandSignals: parsed.demandSignals && parsed.demandSignals.length > 0 ? parsed.demandSignals : initial.demandSignals,
      }
    }
    return initial
  } catch {
    return initial
  }
}

export function clearCheckpoint(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear checkpoint:', err)
  }
}
