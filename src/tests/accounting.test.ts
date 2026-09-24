import { describe, it, expect } from 'vitest'
import { createInitialState } from '../engine/state'
import { gameReducer } from '../engine/reducer'
import {
  calculateCapitalQualityFactor,
  calculateEconomicBurn,
  calculateCashForecast,
  reconcileQuarterBridge,
} from '../engine/formulas'
import type { CustomerAccount, InvoiceSchedule } from '../engine/types'

describe('Accounting & Capital Facilities Invariants', () => {
  it('verifies exact ARR bridge arithmetic', () => {
    let state = createInitialState(1)
    expect(state.arrBridge.openingArrCents).toBe(0)

    // Simulate qualified customer
    const sig = state.demandSignals[0]
    state = gameReducer(state, { type: 'demand.triage', signalId: sig.id, decision: 'qualify' })
    state = gameReducer(state, { type: 'product.place_component', componentId: 'engine-streaming', slot: 'speed' })
    state = gameReducer(state, { type: 'product.place_component', componentId: 'collab-presence', slot: 'collaboration' })
    state = gameReducer(state, { type: 'product.place_component', componentId: 'control-sandbox', slot: 'control' })
    state = gameReducer(state, { type: 'product.verify' })
    state = gameReducer(state, { type: 'product.ship' })
    state = gameReducer(state, { type: 'monetisation.commit_price' })

    const newArr = state.arrBridge.newArrCents
    expect(newArr).toBeGreaterThan(0)
    expect(state.contractualArrCents).toBe(newArr)
    expect(state.eligibleArrCents).toBe(newArr)
  })

  it('calculates economic burn ratio and 1,800-tick forward cash forecast', () => {
    let state = createInitialState(1)
    const mockAccount: CustomerAccount = {
      id: 'acc-burn-1',
      name: 'Stable Inc',
      segment: 'team',
      baseMrrCents: 15_000, // $150/mo ($1800/yr ARR)
      addonMrrCents: 3_750, // 25% addon ($37.50/mo)
      addonSlotsUsed: 1,
      health: 80,
      ageTicks: 1500,
      fit: 0.8,
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
    state.accounts = [mockAccount]

    // 1. Check economic burn calculation
    const burn = calculateEconomicBurn(state)
    // Earned revenue: 15,000 + 3,750 = 18,750 cents ($187.50/mo)
    expect(burn.earnedRevenueMonthCents).toBe(18_750)
    // COGS: base team service cost ($18 = 1,800 cents) + 30% for 1 addon (540 cents) = 2,340 cents
    expect(burn.cogsMonthCents).toBe(2_340)
    // OPEX: base overhead ($100 = 10,000 cents)
    expect(burn.opexMonthCents).toBeGreaterThanOrEqual(10_000)
    // Economic deficit = max(0, 2340 + 10000 - 18750) = 0
    expect(burn.economicDeficitMonthCents).toBe(0)
    expect(burn.burnRatio).toBe(0)

    // 2. Check 1,800-tick cash forecast
    const forecast = calculateCashForecast(state)
    expect(forecast.forecastObligationsCents).toBeGreaterThan(0)
    expect(forecast.forecastExpectedCollectionsCents).toBeGreaterThan(0)
    // Starting cash is $1,500 and collections arrive -> no negative cash shortfall
    expect(forecast.peakNegativeCashCents).toBe(0)
    expect(forecast.shortfallFraction).toBe(0)

    // Capital quality factor should be 1.0 (no burn, no shortfall)
    const capQuality = calculateCapitalQualityFactor(burn.burnRatio, forecast.shortfallFraction)
    expect(capQuality).toBe(1.0)
  })

  it('tracks delinquency loss and subsequent restoration in ARR bridge', () => {
    let state = createInitialState(3)
    const customerArrCents = 960_000 // $800/mo = $9,600/yr ARR
    const mockAccount: CustomerAccount = {
      id: 'acc-delinq',
      name: 'Slow Payer LLC',
      segment: 'enterprise',
      baseMrrCents: 80_000,
      addonMrrCents: 0,
      addonSlotsUsed: 0,
      health: 70,
      ageTicks: 1000,
      fit: 0.7,
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
    state.accounts = [mockAccount]
    state.arrBridge.openingArrCents = customerArrCents
    state.contractualArrCents = customerArrCents
    state.eligibleArrCents = customerArrCents

    // Simulate invoice that has already exhausted attempts and fails on attempt 3
    const failingInvoice: InvoiceSchedule = {
      id: 'inv-fail-1',
      accountId: 'acc-delinq',
      amountCents: 80_000,
      dueTick: state.elapsedTicks,
      collected: false,
      collectionAttempts: 3, // at max attempts
    }
    state.pendingInvoices = [failingInvoice]

    // Advance clock to trigger collection failure (roll is 0.9236 > 0.90 for enterprise)
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 1 })

    // Account becomes delinquent and excluded from eligible ARR
    expect(state.accounts[0].delinquent).toBe(true)
    expect(state.arrBridge.delinquencyLossArrCents).toBe(customerArrCents)
    expect(state.contractualArrCents).toBe(customerArrCents) // still contractually active
    expect(state.eligibleArrCents).toBe(0) // temporarily ineligible for score

    // Simulate a successful payment collection later
    const recoveryInvoice: InvoiceSchedule = {
      id: 'inv-recovery-1',
      accountId: 'acc-delinq',
      amountCents: 80_000,
      dueTick: state.elapsedTicks + 10,
      collected: false,
      collectionAttempts: 0,
    }
    state.pendingInvoices = [recoveryInvoice]

    // Fast forward to due tick with a guaranteed collection roll (roll is 0.4480 <= 0.90)
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 10 })

    // Delinquency cured!
    expect(state.accounts[0].delinquent).toBe(false)
    expect(state.arrBridge.restorationArrCents).toBe(customerArrCents)
    expect(state.eligibleArrCents).toBe(customerArrCents)
  })

  it('verifies debt facility borrowing, principal amortization and interest accrual', () => {
    let state = createInitialState(1)
    // Manually set eligible ARR to $24k/yr to qualify for credit
    state.eligibleArrCents = 2_400_000 // $24k ARR = $2k MRR

    // Max borrow is 3x MRR = $6,000 (600,000 cents)
    const initialCash = state.cashCents
    state = gameReducer(state, { type: 'finance.draw_debt', amountCents: 500_000 }) // $5,000

    expect(state.debt.active).toBe(true)
    expect(state.debt.principalCents).toBe(500_000)
    expect(state.cashCents).toBe(initialCash + 500_000)
    expect(state.debt.monthlyPaymentCents).toBeGreaterThan(0)

    // Advance 600 ticks (month boundary) where monthly payment settles
    const cashBeforePayment = state.cashCents
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 600 })

    expect(state.cashCents).toBeLessThan(cashBeforePayment)
    // Principal should be amortized downward by 1/6
    expect(state.debt.principalCents).toBeLessThan(500_000)
    expect(state.debt.monthsRemaining).toBe(5)
  })

  it('verifies VC term sheet dilution and mandate enforcement', () => {
    let state = createInitialState(1)
    state.eligibleArrCents = 2_000_000 // $20,000 ARR

    // Accept VC mandate
    const initialCash = state.cashCents
    state = gameReducer(state, { type: 'finance.accept_vc_mandate' })

    expect(state.vc.accepted).toBe(true)
    // 4x ARR pre-money = $80k, 25% raise = $20k
    expect(state.cashCents).toBe(initialCash + 2_000_000)
    expect(state.vc.founderOwnershipRatio).toBeLessThan(1.0)

    // Advance to quarter boundary without growing ARR -> should fail VC mandate!
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 1801 })
    expect(state.runStatus).toBe('failed')
    expect(state.failureReason).toContain('VC Mandate Default')
  })

  it('snapshots audited ARR bridge at quarter boundary and rolls over bridge for next quarter', () => {
    let state = createInitialState(1)
    state = { ...state, cashCents: 50_000_000 } // Give ample cash so bills do not cause insolvency

    // Sign a new customer in Quarter 1
    const sig = state.demandSignals[0]
    state = gameReducer(state, { type: 'demand.triage', signalId: sig.id, decision: 'qualify' })
    state = gameReducer(state, { type: 'product.place_component', componentId: 'engine-streaming', slot: 'speed' })
    state = gameReducer(state, { type: 'product.place_component', componentId: 'collab-presence', slot: 'collaboration' })
    state = gameReducer(state, { type: 'product.place_component', componentId: 'control-sandbox', slot: 'control' })
    state = gameReducer(state, { type: 'product.verify' })
    state = gameReducer(state, { type: 'product.ship' })
    state = gameReducer(state, { type: 'monetisation.commit_price' })

    const q1BookedArr = state.arrBridge.newArrCents
    expect(q1BookedArr).toBeGreaterThan(0)
    expect(state.auditedArrBridge).toBeNull()

    // Keep customer healthy so they do not churn before the board review
    state.accounts = state.accounts.map(a => ({
      ...a,
      health: 100,
      fit: 1.0,
      defects: 0,
      overpricing: 0,
    }))

    // Advance 1,800 ticks (3 months) to complete Quarter 1
    for (let t = 0; t < 180; t++) {
      state = gameReducer(state, { type: 'clock.tick', dtTicks: 10 })
    }

    // Quarter review should now be pending for Quarter 1
    expect(state.quarterReviewPending).toBe(true)
    expect(state.quarter).toBe(2)

    // Audited bridge should be captured with Quarter 1's performance
    const audited = state.auditedArrBridge
    expect(audited).not.toBeNull()
    expect(audited!.openingArrCents).toBe(0)
    expect(audited!.newArrCents).toBe(q1BookedArr)
    expect(audited!.closingArrCents).toBe(q1BookedArr)

    // Formula invariant: Opening + New + Expansion - Contraction - Churn - DelinquencyLoss + Restoration === Closing
    const reconciled =
      audited!.openingArrCents +
      audited!.newArrCents +
      audited!.expansionArrCents -
      audited!.contractionArrCents -
      audited!.churnArrCents -
      audited!.delinquencyLossArrCents +
      audited!.restorationArrCents

    expect(reconciled).toBe(audited!.closingArrCents)

    // Next quarter's active bridge should have rolled over openingArr to Q1's closing ARR and reset quarterly deltas to 0
    expect(state.arrBridge.openingArrCents).toBe(audited!.closingArrCents)
    expect(state.arrBridge.newArrCents).toBe(0)
    expect(state.arrBridge.expansionArrCents).toBe(0)
    expect(state.arrBridge.churnArrCents).toBe(0)
  })

  it('verifies exec_golf cures delinquencies and updates eligible ARR and arrBridge.restorationArrCents', () => {
    let state = createInitialState(1)
    const mockAccount: CustomerAccount = {
      id: 'acc-delinq-golf',
      name: 'Delinquent Corp',
      segment: 'enterprise',
      baseMrrCents: 50_000,
      addonMrrCents: 10_000,
      addonSlotsUsed: 1,
      health: 20,
      ageTicks: 1000,
      fit: 0.7,
      overpricing: 0,
      defects: 0,
      delinquent: true,
      unpaidGraceTicks: 100,
      isThreatened: false,
      threatDeadlineTick: null,
      threatReason: null,
      lastCollectionAttemptTick: null,
      serviceRemainderCents: 0,
    }
    const annualArr = (mockAccount.baseMrrCents + mockAccount.addonMrrCents) * 12 // 720,000 cents
    state.accounts = [mockAccount]
    state.contractualArrCents = annualArr
    state.eligibleArrCents = 0
    state.arrBridge.delinquencyLossArrCents = annualArr

    // Add exec_golf consumable
    state.consumablesInventory = [
      {
        id: 'c-golf',
        name: 'Executive Golf Outing',
        rarity: 'rare',
        flavor: 'Cure all unpaid invoices',
        icon: 'Landmark',
        actionType: 'exec_golf',
        effectSummary: 'Cure delinquencies',
      },
    ]

    state = gameReducer(state, { type: 'consumable.use', consumableId: 'c-golf' })

    expect(state.accounts[0].delinquent).toBe(false)
    expect(state.eligibleArrCents).toBe(annualArr)
    expect(state.arrBridge.restorationArrCents).toBe(annualArr)
  })

  it('reconstructs audited ARR bridge from accounts for legacy saves paused mid-review', () => {
    let state = createInitialState(1)
    state.quarter = 5 // Reviewing Quarter 4
    state.quarterReviewPending = true
    state.auditedArrBridge = null

    // Exact state from user's bug report: bridge was wiped to 0 and opening set to ending ARR
    const totalArr = 729_231_00 // $729,231
    state.eligibleArrCents = totalArr
    state.contractualArrCents = totalArr
    state.arrBridge = {
      openingArrCents: totalArr,
      newArrCents: 0,
      expansionArrCents: 0,
      contractionArrCents: 0,
      churnArrCents: 0,
      delinquencyLossArrCents: 0,
      restorationArrCents: 0,
      closingArrCents: totalArr,
    }

    // Two accounts: one older account with an addon, and one new account booked this quarter
    const acc1: CustomerAccount = {
      id: 'acc-old',
      name: 'Existing Client',
      segment: 'enterprise',
      baseMrrCents: 35_000_00, // $35k/mo = $420k/yr
      addonMrrCents: 5_000_00, // $5k/mo = $60k/yr expansion
      addonSlotsUsed: 1,
      health: 80,
      ageTicks: 2500, // signed in prior quarter
      fit: 0.8,
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

    const acc2: CustomerAccount = {
      id: 'acc-new',
      name: 'Q4 Customer',
      segment: 'enterprise',
      baseMrrCents: 20_769_25, // ~$249,231/yr
      addonMrrCents: 0,
      addonSlotsUsed: 0,
      health: 90,
      ageTicks: 600, // signed this quarter
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
    state.accounts = [acc1, acc2]

    const bridge = reconcileQuarterBridge(state)

    // Should not show +$0 for everything!
    expect(bridge.newArrCents).toBe(acc2.baseMrrCents * 12)
    expect(bridge.expansionArrCents).toBe(acc1.addonMrrCents * 12)
    expect(bridge.openingArrCents).toBe(state.eligibleArrCents - bridge.newArrCents - bridge.expansionArrCents)
    expect(bridge.closingArrCents).toBe(state.eligibleArrCents)
  })

  it('strictly triggers insolvency game over when liquid cash cannot pay bills, without auto-debt bailout', () => {
    let state = createInitialState(1)
    // Give company substantial ARR so old auto-debt would have bailed it out
    state.contractualArrCents = 100_000_000 // $1M ARR -> $250k debt facility capacity
    state.eligibleArrCents = 100_000_000
    // But reduce liquid cash to $10.00
    state.cashCents = 1_000 // $10.00

    // Enqueue a mandatory bill of $500.00 due immediately
    state.mandatoryBills = [
      {
        id: 'bill-test-insolvency',
        category: 'base_overhead',
        amountCents: 50_000, // $500.00
        dueTick: state.elapsedTicks + 10,
        label: 'Mandatory Facilities Bill',
      },
    ]

    // Advance 10 ticks so bill matures
    state = gameReducer(state, { type: 'clock.tick', dtTicks: 10 })

    // Run must terminate immediately with failed status
    expect(state.runStatus).toBe('failed')
    expect(state.failureReason).toContain('Insolvency')
    expect(state.failureReason).toContain('Mandatory Facilities Bill')
    // No debt should have been auto-drawn
    expect(state.debt.active).toBe(false)
    expect(state.debt.principalCents).toBe(0)
    // Critical liquidation alert must be registered
    const liquidationAlert = state.alerts.find(a => a.id.startsWith('fail-insolvent-'))
    expect(liquidationAlert).toBeDefined()
    expect(liquidationAlert?.tone).toBe('critical')
  })
})

