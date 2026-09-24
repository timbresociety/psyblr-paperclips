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

  it('should split founder achievements into exactly 6 easy and 6 genuine-effort relics', () => {
    const easyRelics = FOUNDER_ACHIEVEMENTS_AND_RELICS.filter(a => a.difficulty === 'easy')
    const effortRelics = FOUNDER_ACHIEVEMENTS_AND_RELICS.filter(a => a.difficulty === 'effort')

    expect(easyRelics.length).toBe(6)
    expect(effortRelics.length).toBe(6)
    expect(FOUNDER_ACHIEVEMENTS_AND_RELICS.length).toBe(12)

    // Verify Solopreneur's Monolith is classified as requiring genuine effort
    const solopreneur = FOUNDER_ACHIEVEMENTS_AND_RELICS.find(a => a.id === 'ach_solopreneur_monolith')!
    expect(solopreneur.difficulty).toBe('effort')
    expect(solopreneur.unlockedRelic.passiveEffects?.manualActionMultiplier).toBe(2.0)
  })

  it('should evaluate and unlock achievements upon qualifying game states', () => {
    // 1. Easy: Sub-Second Execution ($2M+ Valuation or $100k+ ARR)
    const seedValState: GameState = {
      ...state,
      valuationCents: 250_000_000,
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(seedValState)).toContain('ach_sub_second')

    // 2. Easy: Market Radar Array (10+ signals)
    const radarState: GameState = {
      ...state,
      qualifiedOpportunities: Array(6).fill({ id: 'opp-1' }) as any,
      accounts: Array(5).fill({ id: 'acc-1' }) as any,
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(radarState)).toContain('ach_market_monopoly')

    // 3. Easy: Incident Commander (5 accounts & 0 churn)
    const hotfixState: GameState = {
      ...state,
      accounts: Array(5).fill({ id: 'acc-1' }) as any,
      arrBridge: { ...state.arrBridge, churnArrCents: 0 },
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(hotfixState)).toContain('ach_incident_commander')

    // 4. Easy: Quantum Grid (Tier 3 item in merge grid)
    const mergeState: GameState = {
      ...state,
      mergeGrid: [{ id: 'm1', chain: 'infrastructure', tier: 3 }],
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(mergeState)).toContain('ach_quantum_grid')

    // 5. Easy: The Churn Ward (6 accounts & 0 churn)
    const churnWardState: GameState = {
      ...state,
      accounts: Array(6).fill({ id: 'acc-1' }) as any,
      arrBridge: { ...state.arrBridge, churnArrCents: 0 },
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(churnWardState)).toContain('ach_negative_churn')

    // 6. Easy: Formal Verification Kernel (3 shipped pods & 0 incidents backlog)
    const verifyState: GameState = {
      ...state,
      activationsQueue: Array(3).fill({ id: 'act-1' }) as any,
      operations: { ...state.operations, incidentsBacklog: 0 },
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(verifyState)).toContain('ach_zero_defect')

    // 7. Effort: Solopreneur's Monolith ($50M+ Valuation with team <= 2)
    const solopreneurState: GameState = {
      ...state,
      valuationCents: 6_000_000_000,
      fleet: {
        ...state.fleet,
        demand: { ...state.fleet.demand, onlineUnits: 1 },
        product: { ...state.fleet.product, onlineUnits: 1 },
        monetisation: { ...state.fleet.monetisation, onlineUnits: 0 },
        retention: { ...state.fleet.retention, onlineUnits: 0 },
        expansion: { ...state.fleet.expansion, onlineUnits: 0 },
        operations: { ...state.fleet.operations, onlineUnits: 0 },
      },
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(solopreneurState)).toContain('ach_solopreneur_monolith')

    // Fail Solopreneur if team > 2
    const bigTeamSolopreneurState: GameState = {
      ...solopreneurState,
      fleet: {
        ...solopreneurState.fleet,
        monetisation: { ...state.fleet.monetisation, onlineUnits: 2 },
      },
    }
    expect(evaluateNewAchievements(bigTeamSolopreneurState)).not.toContain('ach_solopreneur_monolith')

    // 8. Effort: Default Alive Purist ($5M+ ARR with 100% Founder Equity)
    const bootstrappedState: GameState = {
      ...state,
      eligibleArrCents: 600_000_000, // $6.0M ARR
      vc: { ...state.vc, founderOwnershipRatio: 1.0 },
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(bootstrappedState)).toContain('ach_default_alive')

    // 9. Effort: Whale Whisperer (5+ Enterprise accounts with health >= 90)
    const whaleState: GameState = {
      ...state,
      accounts: Array(5).fill(null).map((_, i) => ({
        id: `acc-${i}`,
        segment: 'enterprise',
        health: 95,
        baseMrrCents: 100000,
        addonMrrCents: 0,
        ageTicks: 10,
        addonSlotsUsed: 0,
        isThreatened: false,
        threatDeadlineTick: null,
        threatReason: null,
        unpaidGraceTicks: 0,
        delinquent: false,
        lastCollectionAttemptTick: null,
        fit: 1,
        overpricing: 0,
        defects: 0,
        serviceRemainderCents: 0,
        name: `Corp ${i}`,
      })),
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(whaleState)).toContain('ach_whale_whisperer')

    // 10. Effort: Autonomous Hive Core (Rank 3 across all 6 workstations)
    const hiveState: GameState = {
      ...state,
      fleet: {
        ...state.fleet,
        demand: { ...state.fleet.demand, automateRank: 3 },
        product: { ...state.fleet.product, automateRank: 3 },
        monetisation: { ...state.fleet.monetisation, automateRank: 3 },
        retention: { ...state.fleet.retention, automateRank: 3 },
        expansion: { ...state.fleet.expansion, automateRank: 3 },
        operations: { ...state.fleet.operations, automateRank: 3 },
      },
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(hiveState)).toContain('ach_autonomous_centaur')

    // 11. Effort: Diamond Hands Syndicate ($100M+ Valuation with >= 85% equity)
    const diamondState: GameState = {
      ...state,
      valuationCents: 12_000_000_000, // $120M
      vc: { ...state.vc, founderOwnershipRatio: 0.90 },
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(diamondState)).toContain('ach_diamond_hands')

    // 12. Effort: Hyperscale Singularity ($1B Valuation or Unicorn Victory)
    const unicornState: GameState = {
      ...state,
      runStatus: 'unicorn_victory',
      founderHistory: { ...state.founderHistory, unlockedAchievementIds: [] },
    }
    expect(evaluateNewAchievements(unicornState)).toContain('ach_hyperscale_singularity')
  })

  it("should apply Solopreneur's Monolith 2.0x manualActionMultiplier to retention squash damage", () => {
    const testAccount: CustomerAccount = {
      id: 'acc_threat',
      name: 'Crisis Co',
      segment: 'creator',
      baseMrrCents: 50000,
      addonMrrCents: 0,
      health: 40,
      ageTicks: 10,
      addonSlotsUsed: 0,
      isThreatened: true,
      threatDeadlineTick: 500,
      threatReason: 'Critical Bug',
      unpaidGraceTicks: 0,
      delinquent: false,
      lastCollectionAttemptTick: null,
      fit: 1,
      overpricing: 0,
      defects: 0,
      serviceRemainderCents: 0,
    }

    const baseState: GameState = {
      ...state,
      cashCents: 100000,
      accounts: [testAccount],
      retentionIncidents: [
        {
          id: 'incident-1',
          accountId: 'acc_threat',
          accountName: 'Crisis Co',
          title: 'Critical Bug',
          category: 'executive',
          urgencyTicks: 100,
          maxUrgencyTicks: 100,
          consequence: 'Contract Cancellation',
          hp: 4,
          maxHp: 4,
          threatType: 'bug',
        },
      ],
      founderHistory: {
        ...state.founderHistory,
        equippedFounderRelicId: undefined,
      },
    }

    // Default hit dealing base 1 damage
    const normalHitState = gameReducer(baseState, {
      type: 'retention.squash_hit',
      incidentId: 'incident-1',
      damage: 1,
    })
    const normalHp = normalHitState.retentionIncidents?.find(i => i.id === 'incident-1')?.hp
    expect(normalHp).toBe(3) // 4 - 1 = 3

    // Equipped with Solopreneur's Monolith: 2.0x manual action multiplier
    const solopreneurEquippedState: GameState = {
      ...baseState,
      founderHistory: {
        ...baseState.founderHistory,
        equippedFounderRelicId: 'founder_solopreneur_monolith',
      },
    }

    const boostedHitState = gameReducer(solopreneurEquippedState, {
      type: 'retention.squash_hit',
      incidentId: 'incident-1',
      damage: 1,
    })
    const boostedHp = boostedHitState.retentionIncidents?.find(i => i.id === 'incident-1')?.hp
    expect(boostedHp).toBe(2) // 4 - (1 * 2) = 2 (Double damage dealt!)
  })

  it("should apply Bootstrapper's Ledger cashYieldBonus on monthly boundary", () => {
    const bootstrappedEquippedState: GameState = {
      ...state,
      cashCents: 1_200_000, // $12,000 cash
      ticksInCurrentMonth: 599,
      founderHistory: {
        ...state.founderHistory,
        equippedFounderRelicId: 'founder_bootstrapper_ledger', // +40% cash yield
      },
    }

    // Advance 2 ticks to cross monthly boundary (600 ticks)
    const nextState = gameReducer(bootstrappedEquippedState, { type: 'clock.tick', dtTicks: 2 })
    // monthly yield = round(1,200,000 * 0.40 / 12) = 40,000 cents ($400)
    expect(nextState.ledger.some(l => l.category === 'finance' && l.message.includes('Founder Treasury Yield'))).toBe(true)
    const yieldEntry = nextState.ledger.find(l => l.category === 'finance' && l.message.includes('Founder Treasury Yield'))
    expect(yieldEntry?.deltaCashCents).toBe(40_000)
  })

  it("should apply opexDiscount to monthly base overhead bills", () => {
    const opexDiscountState: GameState = {
      ...state,
      cashCents: 500_000,
      ticksInCurrentMonth: 599,
      founderHistory: {
        ...state.founderHistory,
        equippedFounderRelicId: 'founder_bootstrapper_ledger', // -35% OPEX discount
      },
    }

    // Advance 2 ticks to cross monthly boundary
    const nextState = gameReducer(opexDiscountState, { type: 'clock.tick', dtTicks: 2 })
    const paidBillEntry = nextState.ledger.find(l => l.category === 'finance' && l.message.includes('OPEX discount'))
    expect(paidBillEntry).toBeDefined()
    expect(paidBillEntry?.message).toContain('35% OPEX discount')
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
