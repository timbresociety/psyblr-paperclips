import { describe, it, expect } from 'vitest'
import { calculateLuckVariance, calculateDemandQualification } from '../engine/formulas'
import { LUCK_VARIANCE_CONFIG, SEGMENT_PROFILES } from '../engine/constants'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'
import { DemandSignal } from '../engine/types'

describe('Luck Two-Sided Variance & Customer Profile Qualification', () => {
  describe('calculateLuckVariance Expected Value and Distribution', () => {
    it('returns neutral delta and 1.0 multiplier for Rank 0', () => {
      const resultZero = calculateLuckVariance(0, 0.5)
      expect(resultZero.multiplier).toBe(1.0)
      expect(resultZero.delta).toBe(0)
      expect(resultZero.isPeakPositive).toBe(false)
      expect(resultZero.isExtremeNegative).toBe(false)
    })

    it('matches exact min and max bounds for Tiers 1 through 5', () => {
      // Tier 1: -8% to +10%
      const t1Min = calculateLuckVariance(1, 0.0)
      expect(t1Min.delta).toBeCloseTo(-0.08, 4)
      expect(t1Min.multiplier).toBeCloseTo(0.92, 4)
      const t1Max = calculateLuckVariance(1, 1.0)
      expect(t1Max.delta).toBeCloseTo(0.10, 4)
      expect(t1Max.multiplier).toBeCloseTo(1.10, 4)

      // Tier 2: -12% to +20%
      const t2Min = calculateLuckVariance(2, 0.0)
      expect(t2Min.delta).toBeCloseTo(-0.12, 4)
      expect(t2Min.multiplier).toBeCloseTo(0.88, 4)
      const t2Max = calculateLuckVariance(2, 1.0)
      expect(t2Max.delta).toBeCloseTo(0.20, 4)
      expect(t2Max.multiplier).toBeCloseTo(1.20, 4)

      // Tier 3: -10% to +30%
      const t3Min = calculateLuckVariance(3, 0.0)
      expect(t3Min.delta).toBeCloseTo(-0.10, 4)
      expect(t3Min.multiplier).toBeCloseTo(0.90, 4)
      const t3Max = calculateLuckVariance(3, 1.0)
      expect(t3Max.delta).toBeCloseTo(0.30, 4)
      expect(t3Max.multiplier).toBeCloseTo(1.30, 4)

      // Tier 4: -5% to +40%
      const t4Min = calculateLuckVariance(4, 0.0)
      expect(t4Min.delta).toBeCloseTo(-0.05, 4)
      expect(t4Min.multiplier).toBeCloseTo(0.95, 4)
      const t4Max = calculateLuckVariance(4, 1.0)
      expect(t4Max.delta).toBeCloseTo(0.40, 4)
      expect(t4Max.multiplier).toBeCloseTo(1.40, 4)

      // Tier 5: -2% to +50%
      const t5Min = calculateLuckVariance(5, 0.0)
      expect(t5Min.delta).toBeCloseTo(-0.02, 4)
      expect(t5Min.multiplier).toBeCloseTo(0.98, 4)
      const t5Max = calculateLuckVariance(5, 1.0)
      expect(t5Max.delta).toBeCloseTo(0.50, 4)
      expect(t5Max.multiplier).toBeCloseTo(1.50, 4)
    })

    it('demonstrates slightly positive Expected Value (EV) converging across 50,000 rolls', () => {
      const N = 50000

      // Seeded deterministic sampling
      const expectedEVs = [
        { rank: 1, expectedEV: LUCK_VARIANCE_CONFIG[1].ev }, // +0.010 (+1.0%)
        { rank: 2, expectedEV: LUCK_VARIANCE_CONFIG[2].ev }, // +0.040 (+4.0%)
        { rank: 3, expectedEV: LUCK_VARIANCE_CONFIG[3].ev }, // +0.100 (+10.0%)
        { rank: 4, expectedEV: LUCK_VARIANCE_CONFIG[4].ev }, // +0.175 (+17.5%)
        { rank: 5, expectedEV: LUCK_VARIANCE_CONFIG[5].ev }, // +0.240 (+24.0%)
      ]

      for (const { rank, expectedEV } of expectedEVs) {
        let sumDelta = 0
        for (let i = 0; i < N; i++) {
          // Uniform distribution using step index
          const roll = (i + 0.5) / N
          const res = calculateLuckVariance(rank, roll)
          sumDelta += res.delta
        }
        const empiricalEV = sumDelta / N
        expect(empiricalEV).toBeCloseTo(expectedEV, 3)
      }
    })

    it('correctly sets catalyst jackpot (top 12%) and high friction (bottom 10%) flags', () => {
      const peakRoll = calculateLuckVariance(3, 0.95)
      expect(peakRoll.isPeakPositive).toBe(true)
      expect(peakRoll.isExtremeNegative).toBe(false)

      const frictionRoll = calculateLuckVariance(3, 0.05)
      expect(frictionRoll.isPeakPositive).toBe(false)
      expect(frictionRoll.isExtremeNegative).toBe(true)

      const midRoll = calculateLuckVariance(3, 0.50)
      expect(midRoll.isPeakPositive).toBe(false)
      expect(midRoll.isExtremeNegative).toBe(false)
    })
  })

  describe('Demand Customer Profile Qualification Success Rates', () => {
    it('defines base qualification rates per segment profile in constants', () => {
      expect(SEGMENT_PROFILES.creator.qualificationSuccessRate).toBe(0.90)
      expect(SEGMENT_PROFILES.team.qualificationSuccessRate).toBe(0.70)
      expect(SEGMENT_PROFILES.enterprise.qualificationSuccessRate).toBe(0.40)
    })

    it('first customer always qualifies (100% guarantee)', () => {
      const enterpriseSignal: DemandSignal = {
        id: 'sig_ent_1',
        title: 'Enterprise Pilot',
        segment: 'enterprise',
        estimatedWtpCents: 500000,
        acquisitionCostCents: 350000,
        quote: 'Enterprise requirement',
        signalRationale: 'Urgent SOC2 need',
        expiryTick: 1000
      }

      const res = calculateDemandQualification(
        enterpriseSignal,
        { speed: 0.1, collaboration: 0.1, control: 0.1 },
        0, // craftRank
        0, // luckRank
        true, // isFirstCustomer
        0.999 // high roll that would normally fail
      )

      expect(res.probability).toBe(1.0)
      expect(res.success).toBe(true)
      expect(res.failureReason).toBeUndefined()
    })

    it('enterprise lead fails qualification when roll exceeds probability and supplies reason', () => {
      const enterpriseSignal: DemandSignal = {
        id: 'sig_ent_fail',
        title: 'Enterprise Evaluation',
        segment: 'enterprise',
        estimatedWtpCents: 600000,
        acquisitionCostCents: 300000,
        quote: 'High security enterprise',
        signalRationale: 'Multi-quarter evaluation',
        expiryTick: 1000
      }

      // Base 0.40, balanced capabilities (fit 0.5 -> fitBonus 0), craft 0, luck 0
      const res = calculateDemandQualification(
        enterpriseSignal,
        { speed: 0.5, collaboration: 0.5, control: 0.5 },
        0,
        0,
        false,
        0.75, // Roll > 0.40
        0.5
      )

      expect(res.success).toBe(false)
      expect(res.failureReason).toContain('Enterprise lead disqualified')
      expect(res.failureReason).toContain('SOC2')
    })

    it('craft rank boosts qualification probability (+2% per rank)', () => {
      const teamSignal: DemandSignal = {
        id: 'sig_team_1',
        title: 'Team Evaluation',
        segment: 'team',
        estimatedWtpCents: 150000,
        acquisitionCostCents: 80000,
        quote: 'Collaborative team',
        signalRationale: 'Departmental expansion',
        expiryTick: 1000
      }

      const rank0 = calculateDemandQualification(
        teamSignal,
        { speed: 0.5, collaboration: 0.5, control: 0.5 },
        0,
        0,
        false,
        0.5,
        0.5
      )

      const rank5 = calculateDemandQualification(
        teamSignal,
        { speed: 0.5, collaboration: 0.5, control: 0.5 },
        5, // 5 * 2% = +10%
        0,
        false,
        0.5,
        0.5
      )

      expect(rank5.probability).toBeCloseTo(rank0.probability + 0.10, 4)
    })

    it('luck variance shifts qualification probability up or down', () => {
      const enterpriseSignal: DemandSignal = {
        id: 'sig_ent_2',
        title: 'Enterprise Opportunity',
        segment: 'enterprise',
        estimatedWtpCents: 500000,
        acquisitionCostCents: 150000,
        quote: 'High growth enterprise',
        signalRationale: 'Strategic transformation',
        expiryTick: 1000
      }

      // Rank 3 Luck: max penalty -10%, max bonus +30%
      const unlucky = calculateDemandQualification(
        enterpriseSignal,
        { speed: 0.5, collaboration: 0.5, control: 0.5 },
        0,
        3,
        false,
        0.5,
        0.0 // luck roll 0 -> -10%
      )

      const lucky = calculateDemandQualification(
        enterpriseSignal,
        { speed: 0.5, collaboration: 0.5, control: 0.5 },
        0,
        3,
        false,
        0.5,
        1.0 // luck roll 1 -> +30%
      )

      expect(unlucky.probability).toBeLessThan(lucky.probability)
      expect(lucky.probability - unlucky.probability).toBeCloseTo(0.40, 2)
    })
  })

  describe('Reducer Demand Triage Integration', () => {
    it('charges CAC and discards lead when qualification fails, tracking alerts and ledger', () => {
      let state = createInitialState(1)
      // Force cash
      state.cashCents = 10_000_000
      state.qualifiedOpportunities = []
      state.alerts = []
      state.ledger = []
      state.signalsTriagedCount = 1 // Ensure isFirstCustomer is false
      state.elapsedTicks = 100

      const enterpriseSignal: DemandSignal = {
        id: 'sig_ent_test',
        title: 'Strategic Enterprise Lead',
        segment: 'enterprise',
        estimatedWtpCents: 500_000,
        acquisitionCostCents: 200_000,
        quote: 'Strategic enterprise pilot',
        signalRationale: 'Large corporate deal',
        expiryTick: 1000
      }
      state.demandSignals = [enterpriseSignal]

      // Triage enterprise lead
      state = gameReducer(state, {
        type: 'demand.triage',
        signalId: enterpriseSignal.id,
        decision: 'qualify'
      })

      // Signal must be consumed from demandSignals
      expect(state.demandSignals.some(s => s.id === enterpriseSignal.id)).toBe(false)
      expect(state.signalsTriagedCount).toBe(2)
      expect(state.cashCents).toBeLessThan(10_000_000)
      expect(state.lastTriageOutcome).toBeDefined()
      expect(state.lastTriageOutcome?.signalId).toBe(enterpriseSignal.id)
      expect(state.lastTriageOutcome?.probability).toBeGreaterThan(0)

      const isDisqualified = state.alerts.some(a => a.id.startsWith('triage-fail-'))
      if (isDisqualified) {
        // Disqualified: lead did NOT enter qualified opportunities
        expect(state.qualifiedOpportunities.length).toBe(0)
        expect(state.ledger.some(l => l.id.startsWith('led-disqual-'))).toBe(true)
        expect(state.lastTriageOutcome?.success).toBe(false)
      } else {
        // Qualified: lead entered qualified opportunities
        expect(state.qualifiedOpportunities.length).toBe(1)
        expect(state.lastTriageOutcome?.success).toBe(true)
      }
    })
  })
})
