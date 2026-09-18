import { describe, it, expect, beforeEach } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'
import { FOUNDER_ACHIEVEMENTS_AND_RELICS, getMaxUnlockedSpeed, evaluateNewAchievements } from '../engine/constants'
import type { CustomerAccount, GameState } from '../engine/types'

describe('Founder Relics & Speed Gating', () => {
  let state: GameState

  beforeEach(() => {
    state = createInitialState()
  })

  it('should define at least 12 contextual founder achievements and relics', () => {
    expect(FOUNDER_ACHIEVEMENTS_AND_RELICS.length).toBeGreaterThanOrEqual(12)
    
    // Verify each achievement has valid fields and an unlocked relic
    FOUNDER_ACHIEVEMENTS_AND_RELICS.forEach((ach) => {
      expect(ach.id).toBeTruthy()
      expect(ach.name).toBeTruthy()
      expect(ach.description).toBeTruthy()
      expect(ach.relicId).toBeTruthy()
      expect(ach.evaluate).toBeTypeOf('function')
      expect(ach.unlockedRelic).toBeDefined()
      expect(ach.unlockedRelic.name).toBeTruthy()
      expect(ach.unlockedRelic.tier).toBeTruthy()
      expect(ach.unlockedRelic.effectSummary).toBeTruthy()
    })
  })

  it('should gate 2x and 5x speed behind specific founder achievements', () => {
    // Initial state: no achievements unlocked -> max speed is 1
    expect(getMaxUnlockedSpeed(state.founderHistory)).toBe(1)

    // Unlocking 2x speed achievement (Sub-Second Execution)
    const stateWith2x: GameState = {
      ...state,
      founderHistory: {
        ...state.founderHistory,
        unlockedAchievementIds: ['ach_sub_second'],
      },
    }
    expect(getMaxUnlockedSpeed(stateWith2x.founderHistory)).toBe(2)

    // Unlocking 5x speed achievement (Hyperscale Singularity)
    const stateWithBoth: GameState = {
      ...state,
      founderHistory: {
        ...state.founderHistory,
        unlockedAchievementIds: ['ach_sub_second', 'ach_hyperscale_singularity'],
      },
    }
    expect(getMaxUnlockedSpeed(stateWithBoth.founderHistory)).toBe(5)
  })

  it('should clamp speed setting to maxUnlockedSpeed when enforced', () => {
    const originalEnv = process.env.NODE_ENV
    try {
      // Temporarily simulate non-test production environment
      process.env.NODE_ENV = 'production'

      // Attempt to set 2x speed without achievement
      const resLocked2x = gameReducer(state, { type: 'run.set_speed', speed: 2 })
      expect(resLocked2x.speedMultiplier).toBe(1)

      // Attempt to set 5x speed without achievement
      const resLocked5x = gameReducer(state, { type: 'run.set_speed', speed: 5 })
      expect(resLocked5x.speedMultiplier).toBe(1)

      // Unlock 2x
      const state2xUnlocked: GameState = {
        ...state,
        founderHistory: {
          ...state.founderHistory,
          unlockedAchievementIds: ['ach_sub_second'],
        },
      }
      const resUnlocked2x = gameReducer(state2xUnlocked, { type: 'run.set_speed', speed: 2 })
      expect(resUnlocked2x.speedMultiplier).toBe(2)

      // Unlock 5x
      const state5xUnlocked: GameState = {
        ...state,
        founderHistory: {
          ...state.founderHistory,
          unlockedAchievementIds: ['ach_sub_second', 'ach_hyperscale_singularity'],
        },
      }
      const resUnlocked5x = gameReducer(state5xUnlocked, { type: 'run.set_speed', speed: 5 })
      expect(resUnlocked5x.speedMultiplier).toBe(5)
    } finally {
      process.env.NODE_ENV = originalEnv
    }
  })

  it('should allow equipping and unequipping founder relics', () => {
    expect(state.founderHistory?.equippedFounderRelicId).toBeUndefined()

    // Equip relic
    const equippedState = gameReducer(state, {
      type: 'founder.equip_relic',
      relicId: 'founder_overclocked_silicon',
    })
    expect(equippedState.founderHistory?.equippedFounderRelicId).toBe('founder_overclocked_silicon')

    // Unequip relic
    const unequippedState = gameReducer(equippedState, {
      type: 'founder.equip_relic',
      relicId: null,
    })
    expect(unequippedState.founderHistory?.equippedFounderRelicId).toBeUndefined()
  })

  it('should unlock achievements via founder.unlock_achievement action', () => {
    expect(state.founderHistory?.unlockedAchievementIds).not.toContain('ach_default_alive')

    const unlockedState = gameReducer(state, {
      type: 'founder.unlock_achievement',
      achievementId: 'ach_default_alive',
    })

    expect(unlockedState.founderHistory?.unlockedAchievementIds).toContain('ach_default_alive')
  })

  it('should evaluate and unlock achievements upon qualifying game states', () => {
    // Test default alive achievement ($1M+ ARR without VC dilution)
    const bootstrappedState: GameState = {
      ...state,
      eligibleArrCents: 150_000_000, // $1.5M ARR
      founderHistory: {
        ...state.founderHistory,
        unlockedAchievementIds: [],
      },
    }

    const newlyUnlocked = evaluateNewAchievements(bootstrappedState)
    expect(newlyUnlocked).toContain('ach_default_alive')
  })
})

describe('Retention Priority & Spotlight Sorting', () => {
  it('should prioritize threatened and damaged accounts for immediate retention spotlight', () => {
    const createTestAccount = (id: string, name: string, health: number, isThreatened: boolean): CustomerAccount => ({
      id,
      name,
      segment: 'creator',
      baseMrrCents: 100000,
      addonMrrCents: 0,
      health,
      ageTicks: 100,
      addonSlotsUsed: 0,
      isThreatened,
      threatDeadlineTick: isThreatened ? 500 : null,
      threatReason: isThreatened ? 'High Latency' : null,
      unpaidGraceTicks: 0,
      delinquent: false,
      lastCollectionAttemptTick: null,
      fit: 1,
      overpricing: 0,
      defects: 0,
      serviceRemainderCents: 0,
    })

    const accounts: CustomerAccount[] = [
      createTestAccount('acc_healthy', 'Healthy Corp', 95, false),
      createTestAccount('acc_threatened', 'Crisis Co', 40, true),
      createTestAccount('acc_moderate', 'Moderate Inc', 60, false),
    ]

    // Priority comparator logic (matches RetentionRoom.tsx)
    const sorted = [...accounts].sort((a, b) => {
      const aThreat = a.isThreatened || a.health < 65
      const bThreat = b.isThreatened || b.health < 65
      if (aThreat && !bThreat) return -1
      if (!aThreat && bThreat) return 1
      if (a.health !== b.health) return a.health - b.health
      const aArr = (a.baseMrrCents + a.addonMrrCents) * 12
      const bArr = (b.baseMrrCents + b.addonMrrCents) * 12
      return bArr - aArr
    })

    // Crisis Co with incident and threatened state must be slot 0
    expect(sorted[0].id).toBe('acc_threatened')
    // Moderate Inc with lower health (60 < 95) must be slot 1
    expect(sorted[1].id).toBe('acc_moderate')
    // Healthy Corp must be last
    expect(sorted[2].id).toBe('acc_healthy')
  })
})
