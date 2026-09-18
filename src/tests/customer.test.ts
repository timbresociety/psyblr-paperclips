import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'
import {
  calculateCustomerConversion,
  calculateCustomerHealthDelta,
  calculateMonthlyChurn,
  calculateArrTotals,
} from '../engine/formulas'
import {
  CHURN_THREAT_TTL_TICKS,
  EXPANSION_MATURITY_TICKS,
  EXPANSION_MIN_HEALTH,
  ADDON_PRICE_FRACTION,
  MAX_ADDON_SLOTS,
} from '../engine/constants'
import type { CustomerAccount } from '../engine/types'

describe('Customer Lifecycle, Health Dynamics & Expansion Balance', () => {
  it('calculates customer conversion and enforces 2.0 price-to-WTP hard ceiling', () => {
    // Creator segment: base WTP = $40/mo (4,000 cents), needSpeed 0.7, needCollab 0.2, needControl 0.1
    const capabilities = { speed: 0.8, collaboration: 0.5, control: 0.2 }
    const conversionNormal = calculateCustomerConversion('creator', capabilities, 3_000, 0.1)

    expect(conversionNormal.fit).toBeGreaterThan(0.6)
    expect(conversionNormal.effectiveWtpMonthlyCents).toBeGreaterThan(3_000)
    expect(conversionNormal.conversionProbability).toBeGreaterThan(0.3)
    expect(conversionNormal.conversionProbability).toBeLessThanOrEqual(0.95)

    // At generous discount (e.g. 50% of WTP), conversion jumps above 50%
    const conversionDiscounted = calculateCustomerConversion('creator', capabilities, 1_500, 0.1)
    expect(conversionDiscounted.conversionProbability).toBeGreaterThan(0.5)

    // Overpricing > 2x WTP must instantly drop conversion to exactly 0
    const conversionAbsurdPrice = calculateCustomerConversion(
      'creator',
      capabilities,
      conversionNormal.effectiveWtpMonthlyCents * 2.1,
      0.1
    )
    expect(conversionAbsurdPrice.conversionProbability).toBe(0)
  })

  it('calculates customer health delta with exact weights from BALANCE.md', () => {
    // health_change/month = 12*(fit - 0.6) - 15*defects - 10*overpricing + 8*care - 5*incidents
    const deltaHighFit = calculateCustomerHealthDelta(1.0, 0, 0, 0.05, 0)
    // 12 * (1.0 - 0.6) + 8 * 0.05 = 4.8 + 0.4 = 5.2
    expect(deltaHighFit).toBeCloseTo(5.2, 1)

    const deltaDegraded = calculateCustomerHealthDelta(0.4, 0.2, 0.3, 0, 1)
    // 12 * (0.4 - 0.6) - 15 * 0.2 - 10 * 0.3 + 0 - 5 * 1 = -2.4 - 3.0 - 3.0 - 5 = -13.4
    expect(deltaDegraded).toBeCloseTo(-13.4, 1)
  })

  it('calculates bounded monthly churn rate', () => {
    // Healthy customer (100 health, 0 defects, 0 overpricing, 0.10 competition)
    const churnHealthy = calculateMonthlyChurn(100, 0, 0, 0.10)
    // 0.01 + 0.12*0 + 0.04*0 + 0.05*0 + 0.02*0.1 = 0.012 -> clamped [0.005, 0.35]
    expect(churnHealthy).toBeCloseTo(0.012, 3)

    // Deeply unhealthy customer (0 health, 1.0 defects, 1.0 overpricing, 0.85 competition)
    const churnDisaster = calculateMonthlyChurn(0, 1.0, 1.0, 0.85)
    // 0.01 + 0.12 + 0.04 + 0.05 + 0.017 = 0.237 (clamped <= 0.35)
    expect(churnDisaster).toBeLessThanOrEqual(0.35)
    expect(churnDisaster).toBeGreaterThan(0.20)
  })

  it('triggers 120-tick churn threat and resolves successfully via retention intervention', () => {
    let state = createInitialState(10)
    const mockAccount: CustomerAccount = {
      id: 'acc-threat-1',
      name: 'Vulnerable Corp',
      segment: 'team',
      baseMrrCents: 15_000, // $150/mo
      addonMrrCents: 0,
      addonSlotsUsed: 0,
      health: 30, // low health triggers threat
      ageTicks: 600,
      fit: 0.5,
      overpricing: 0.1,
      defects: 0.1,
      delinquent: false,
      unpaidGraceTicks: 0,
      isThreatened: false,
      threatDeadlineTick: null,
      threatReason: null,
      lastCollectionAttemptTick: null,
      serviceRemainderCents: 0,
    }
    state.accounts = [mockAccount]

    // Advance tick to trigger threat
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 10 })

    const threatenedAcc = state.accounts[0]
    expect(threatenedAcc.isThreatened).toBe(true)
    expect(threatenedAcc.threatDeadlineTick).toBe(state.elapsedTicks + CHURN_THREAT_TTL_TICKS)
    expect(state.activeThreatAccountId).toBe(threatenedAcc.id)

    // Execute retention save (Founder 1-on-1 Call, $10 cost, +45 health)
    const cashBeforeSave = state.cashCents
    state = gameReducer(state, {
      type: 'retention.intervene',
      accountId: threatenedAcc.id,
      interventionType: 'founder_call',
    })

    const savedAcc = state.accounts[0]
    expect(savedAcc.isThreatened).toBe(false)
    expect(savedAcc.threatDeadlineTick).toBeNull()
    expect(savedAcc.health).toBeGreaterThan(60)
    expect(state.cashCents).toBe(cashBeforeSave - 1_000)
    expect(state.activeThreatAccountId).toBeNull()
    // Saved ARR recorded in retentionSavedArrCents, NOT in arrBridge.newArrCents
    expect(state.retentionSavedArrCents).toBe(15_000 * 12)
    expect(state.arrBridge.newArrCents).toBe(0)
  })

  it('allows churn threat to expire when ignored, recording churn ARR and removing customer', () => {
    let state = createInitialState(10)
    const mockAccount: CustomerAccount = {
      id: 'acc-threat-expire',
      name: 'Doomed Client',
      segment: 'team',
      baseMrrCents: 20_000, // $200/mo = $2,400/yr ARR
      addonMrrCents: 0,
      addonSlotsUsed: 0,
      health: 20,
      ageTicks: 800,
      fit: 0.4,
      overpricing: 0.2,
      defects: 0.2,
      delinquent: false,
      unpaidGraceTicks: 0,
      isThreatened: true,
      threatDeadlineTick: state.elapsedTicks + 120,
      threatReason: 'Severe defect exposure',
      lastCollectionAttemptTick: null,
      serviceRemainderCents: 0,
    }
    state.accounts = [mockAccount]
    state.arrBridge.openingArrCents = 240_000
    state.contractualArrCents = 240_000
    state.eligibleArrCents = 240_000

    // Fast-forward past threat deadline (125 ticks)
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 125 })

    expect(state.accounts.length).toBe(0)
    expect(state.arrBridge.churnArrCents).toBe(240_000)
    expect(state.contractualArrCents).toBe(0)
    expect(state.activeThreatAccountId).toBeNull()
  })

  it('strictly enforces all Expansion Room preconditions from BALANCE.md', () => {
    let state = createInitialState(10)

    // Test 1: Immature account (< 1,200 ticks age) rejected
    const youngAccount: CustomerAccount = {
      id: 'acc-young',
      name: 'Young Inc',
      segment: 'enterprise',
      baseMrrCents: 80_000, // $800/mo
      addonMrrCents: 0,
      addonSlotsUsed: 0,
      health: 80,
      ageTicks: 600, // < 1,200 ticks
      fit: 0.9,
      overpricing: 0,
      defects: 0,
      delinquent: false,
      unpaidGraceTicks: 0,
      isThreatened: false,
      threatDeadlineTick: null,
      threatReason: null,
      lastCollectionAttemptTick: null,
      serviceRemainderCents: 0,
    }
    state.accounts = [youngAccount]

    state = gameReducer(state, {
      type: 'expansion.merge_package',
      accountId: 'acc-young',
      packId: 'pack-security-vault',
    })
    expect(state.accounts[0].addonSlotsUsed).toBe(0)
    expect(state.alerts.some(a => a.id.startsWith('exp-age-'))).toBe(true)

    // Test 2: Low health (< 60 health) rejected
    state.accounts[0].ageTicks = EXPANSION_MATURITY_TICKS + 10
    state.accounts[0].health = 50 // < 60
    state = gameReducer(state, {
      type: 'expansion.merge_package',
      accountId: 'acc-young',
      packId: 'pack-security-vault',
    })
    expect(state.accounts[0].addonSlotsUsed).toBe(0)
    expect(state.alerts.some(a => a.id.startsWith('exp-health-'))).toBe(true)

    // Test 3: Fully mature, healthy account succeeds with 25% base MRR pricing
    state.accounts[0].health = EXPANSION_MIN_HEALTH + 10
    state = gameReducer(state, {
      type: 'expansion.merge_package',
      accountId: 'acc-young',
      packId: 'pack-security-vault',
    })

    const expectedAddonMrr = Math.floor(80_000 * ADDON_PRICE_FRACTION) // $200/mo
    expect(state.accounts[0].addonSlotsUsed).toBe(1)
    expect(state.accounts[0].addonMrrCents).toBe(expectedAddonMrr)
    expect(state.arrBridge.expansionArrCents).toBe(expectedAddonMrr * 12)

    // Test 4: Second expansion succeeds
    state = gameReducer(state, {
      type: 'expansion.merge_package',
      accountId: 'acc-young',
      packId: 'pack-ai-assist',
    })
    expect(state.accounts[0].addonSlotsUsed).toBe(2)
    expect(state.accounts[0].addonMrrCents).toBe(expectedAddonMrr * 2)

    // Test 5: Third expansion rejected (max 2 slots per customer)
    state = gameReducer(state, {
      type: 'expansion.merge_package',
      accountId: 'acc-young',
      packId: 'pack-multi-region',
    })
    expect(state.accounts[0].addonSlotsUsed).toBe(MAX_ADDON_SLOTS)
    expect(state.accounts[0].addonMrrCents).toBe(expectedAddonMrr * 2)
  })
})
