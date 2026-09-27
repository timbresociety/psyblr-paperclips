import React, { useEffect, useRef, useState } from 'react'
import type { GameState } from '../../engine/types'
import { getActiveEvolutionTier, } from '../../engine/formulas'
import { EVOLUTION_TIERS } from '../../engine/constants'
import { sound } from '../../audio/soundEngine'

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

const TIER_INDEX: Record<string, number> = Object.fromEntries(
  EVOLUTION_TIERS.map((t, i) => [t.tier, i]),
)

/**
 * The one authored tier-up beat (SKY moment). Watches the engine's evolution
 * tier and plays a single celebratory overlay per tier ascension per run —
 * never re-fired by reload of the same tier, never a replayed cinematic.
 */
export function useTierUpBeat(state: GameState) {
  const tierInfo = getActiveEvolutionTier(state)
  const idx = TIER_INDEX[tierInfo.tier] ?? 0
  const [beat, setBeat] = useState<typeof tierInfo | null>(null)
  const seenRef = useRef<number>(-1)

  // initialize from persistent memory (survives reload of a checkpointed run)
  if (seenRef.current === -1) {
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
  }, [idx, state.seed, tierInfo])

  const dismiss = () => setBeat(null)
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
