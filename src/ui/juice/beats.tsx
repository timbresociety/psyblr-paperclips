import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { GameState } from '../../engine/types'
import { getActiveEvolutionTier } from '../../engine/formulas'
import { tierIndexOf } from '../hq/tierIndex'
import { sound } from '../../audio/soundEngine'
import './beats.css'

const BEAT_STORE_KEY = 'solounicorn.tierbeats.v1'

interface BeatMemory {
  seed: number
  maxTierIndex: number
}

function readBeatMemory(): BeatMemory | null {
  try {
    const raw = localStorage.getItem(BEAT_STORE_KEY)
    return raw ? (JSON.parse(raw) as BeatMemory) : null
  } catch {
    return null
  }
}

function writeBeatMemory(mem: BeatMemory) {
  try {
    localStorage.setItem(BEAT_STORE_KEY, JSON.stringify(mem))
  } catch {
    /* storage unavailable — beat simply may replay */
  }
}

/**
 * The one authored tier-up beat (SKY moment). Watches the engine's evolution
 * tier and plays a single celebratory overlay per tier ascension per run —
 * never re-fired by reload of the same tier, never a replayed cinematic.
 */
export function useTierUpBeat(state: GameState) {
  const tierInfo = getActiveEvolutionTier(state)
  const idx = tierIndexOf(tierInfo.tier)
  const [beat, setBeat] = useState<typeof tierInfo | null>(null)
  const seenRef = useRef<number>(-1)
  const seedRef = useRef<number | null>(null)

  // Initialize from persistent memory (survives reload of a checkpointed run),
  // and re-initialize whenever the run seed changes — run.reset creates a new
  // run in place without remounting, and its beats must not stay suppressed (#6).
  if (seedRef.current !== state.seed) {
    seedRef.current = state.seed
    const mem = readBeatMemory()
    seenRef.current = mem && mem.seed === state.seed ? mem.maxTierIndex : 0
  }

  useEffect(() => {
    if (tierInfo.isOverridden) return // dev tier walk never fires the beat
    if (idx > seenRef.current) {
      seenRef.current = idx
      writeBeatMemory({ seed: state.seed, maxTierIndex: idx })
      if (idx > 0) {
        setBeat(tierInfo)
        sound.playPowerUp()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tierInfo is a fresh object every tick; idx/isOverridden are the real signals
  }, [idx, state.seed, tierInfo.isOverridden])

  // Stable identity: TierUpBeat's auto-dismiss effect depends on this, and the
  // 10Hz tick re-render must not re-arm the timer every 100ms (#3).
  const dismiss = useCallback(() => setBeat(null), [])
  return { beat, dismiss }
}

export function TierUpBeat({
  beat,
  onDismiss,
}: {
  beat: { tier: string; name: string; subtitle: string }
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, 5200)
    return () => window.clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="beat-overlay" onClick={onDismiss} data-testid="tier-up-beat">
      <div className="beat-backdrop" style={{ backgroundImage: `url(/assets/tiers/backdrop_${beat.tier}.png)` }} />
      <div className="beat-kicker">THE COMPANY ASCENDS</div>
      <div className={`beat-title${beat.tier === 'ethereal' ? ' beat-title--ethereal' : ''}`}>{beat.name}</div>
      <div className="beat-sub">{beat.subtitle}</div>
      <div className="beat-dismiss">CLICK TO CONTINUE</div>
    </div>
  )
}
