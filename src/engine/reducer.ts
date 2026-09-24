import type { GameState, CustomerAccount, CustomerSegment, InvoiceSchedule, MandatoryBill, ProductActivation, DemandSignal, QualifiedOpportunity, FunctionId, DebtFacility, MergeItem, ExpansionOrder, CodingPod, ArrBridge, RetentionIncident, ScratchCard, DealDeskState, DemandTriageOutcome } from './types'
import type { GameAction } from './actions'
import {
  TICKS_PER_MONTH,
  TICKS_PER_QUARTER,
  CHURN_THREAT_TTL_TICKS,
  INITIAL_CUSTOMER_HEALTH,
  EXPANSION_MATURITY_TICKS,
  EXPANSION_MIN_HEALTH,
  ADDON_PRICE_FRACTION,
  MAX_ADDON_SLOTS,
  COMPETITION_PER_QUARTER,
  COMPETITION_CAP,
  DEBT_MIN_MRR_CENTS,
  DEBT_CAPACITY_MRR_MULTIPLE,
  DEBT_DEFAULT_TERM_MONTHS,
  VC_MIN_ARR_CENTS,
  VC_GROWTH_TARGET_RATIO,
  VC_PRE_MONEY_ARR_MULTIPLE,
  VC_MAX_RAISE_FRACTION,
  FUNCTION_SPECS,
  BASE_OVERHEAD_MONTHLY_CENTS,
  TIER_BASE_OVERHEAD_MONTHLY_CENTS,
  CRAFT_MULTIPLIERS,
  MONETISATION_CRAFT_MULTIPLIERS,
  SCALE_UNITS,
  AUTOMATE_SPEEDS,
  AUTOMATE_UPKEEP_CENTS,
  EXTRA_UNIT_UPKEEP_CENTS,
  SPECULATIVE_OPTIMIZER_COOLDOWN_TICKS,
  DEMAND_REPLENISH_INTERVAL_TICKS,
  UNICORN_VALUATION_CENTS,
  SEGMENT_PROFILES,
  RELIC_CATALOG,
  CONSUMABLE_CATALOG,
  RELIC_PRICING,
  CONSUMABLE_PRICING,
  MAX_CONSUMABLE_SLOTS,
  QUARTER_REROLL_BASE_COST_CENTS,
  CODING_POD_MODULES,
  ENGINE_ARCHETYPES,
  FOUNDER_ACHIEVEMENTS_AND_RELICS,
  OPERATIONS_RACK_LIMITS,
  RETENTION_BAY_LIMITS,
  MONETISATION_DESK_LIMITS,
  EXPANSION_GRID_SIZES,
  getMaxUnlockedSpeed,
  evaluateNewAchievements,
} from './constants'
import {
  calculateArrTotals,
  calculateGrowthMultiple,
  calculateCapitalQualityFactor,
  calculateValuationCents,
  calculateCustomerConversion,
  calculateOperationsMetrics,
  calculateEconomicBurn,
  calculateCashForecast,
  calculateCustomerHealthDelta,
  calculateMonthlyChurn,
  clamp,
  getActiveEvolutionTier,
  syncProductPods,
  createSocketsForSegment,
  calculateLuckVariance,
  calculateDemandQualification,
  getUpgradeRankCost,
} from './formulas'
import { DeterministicRNG } from './rng'
import { createDynamicDemandSignals, createInitialState, createDefaultScratchCard, createDiagnosticTicket } from './state'

export function getActiveBuffs(state: GameState) {
  const archetype = ENGINE_ARCHETYPES[state.activeArchetype || 'product_led_machine']
  const equippedRelicEntry = FOUNDER_ACHIEVEMENTS_AND_RELICS.find(
    a => a.relicId === state.founderHistory?.equippedFounderRelicId || a.id === state.founderHistory?.equippedFounderRelicId
  )
  const arch = archetype?.passiveEffects || {}
  const relic = equippedRelicEntry?.unlockedRelic?.passiveEffects || {}

  return {
    productYieldBonus: (arch.productYieldBonus || 0) + (relic.productYieldBonus || 0),
    defectReduction: (arch.defectReduction || 0) + (relic.defectReduction || 0),
    podCapacityBonus: (arch.podCapacityBonus || 0) + (relic.podCapacityBonus || 0),
    demandRateBonus: (arch.demandRateBonus || 0) + (relic.demandRateBonus || 0),
    acquisitionCostDiscount: (arch.acquisitionCostDiscount || 0) + (relic.acquisitionCostDiscount || 0),
    churnResistance: (arch.churnResistance || 0) + (relic.churnResistance || 0),
    expansionBonus: (arch.expansionBonus || 0) + (relic.expansionBonus || 0),
    cashYieldBonus: (arch.cashYieldBonus || 0) + (relic.cashYieldBonus || 0),
    opexDiscount: (arch.opexDiscount || 0) + (relic.opexDiscount || 0),
    opsCapacityBonus: (arch.opsCapacityBonus || 0) + (relic.opsCapacityBonus || 0),
    strainReduction: (arch.strainReduction || 0) + (relic.strainReduction || 0),
    automateSpeedBonus: (arch.automateSpeedBonus || 0) + (relic.automateSpeedBonus || 0),
    manualActionMultiplier: (arch.manualActionMultiplier || 1) * (relic.manualActionMultiplier || 1),
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'run.pause':
      return { ...state, paused: true }

    case 'run.resume':
      return {
        ...state,
        paused: false,
        runStatus: state.runStatus === 'unicorn_victory' ? 'running' : state.runStatus,
        unicornVictoryAcknowledged: state.runStatus === 'unicorn_victory' ? true : state.unicornVictoryAcknowledged,
      }

    case 'run.set_speed': {
      if (action.force || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test')) {
        return { ...state, speedMultiplier: clamp(action.speed, 0.5, 5) }
      }
      const maxSpeed = getMaxUnlockedSpeed(state.founderHistory)
      const targetSpeed = Math.min(action.speed, maxSpeed)
      return { ...state, speedMultiplier: clamp(targetSpeed, 0.5, 5) }
    }

    case 'run.reset': {
      const newlyEarned = evaluateNewAchievements(state)
      const existingUnlocked = state.founderHistory?.unlockedAchievementIds || []
      const mergedAchievements = Array.from(new Set([...existingUnlocked, ...newlyEarned]))

      const fresh = createInitialState(state.seed + 1)
      fresh.founderHistory = {
        ...state.founderHistory,
        totalRuns: state.founderHistory.totalRuns + 1,
        bestValuationCents: Math.max(state.founderHistory.bestValuationCents || 0, state.valuationCents),
        victories: (state.founderHistory.victories || 0) + (state.runStatus === 'unicorn_victory' ? 1 : 0),
        unlockedAchievementIds: mergedAchievements,
        equippedFounderRelicId: state.founderHistory?.equippedFounderRelicId,
      }
      return fresh
    }

    case 'founder.equip_relic': {
      return {
        ...state,
        founderHistory: {
          ...state.founderHistory,
          equippedFounderRelicId: action.relicId || undefined,
        },
      }
    }

    case 'founder.unlock_achievement': {
      const current = state.founderHistory?.unlockedAchievementIds || []
      if (current.includes(action.achievementId)) return state
      return {
        ...state,
        founderHistory: {
          ...state.founderHistory,
          unlockedAchievementIds: [...current, action.achievementId],
        },
      }
    }

    case 'run.set_tier_override':
      return { ...state, themeTierOverride: action.tier }

    case 'attention.switch': {
      const updatedAlerts = state.alerts.map(a =>
        a.targetFunction === action.functionId ? { ...a, acknowledged: true } : a
      )
      return {
        ...state,
        activeFunction: action.functionId,
        alerts: updatedAlerts,
      }
    }

    case 'clock.tick':
      return handleClockTick(state, action.dtTicks ?? 1)

    case 'demand.triage':
      return handleDemandTriage(state, action.signalId, action.decision)

    case 'demand.hyper_triage':
      return handleDemandHyperTriage(state, action.signalId)

    case 'tutorial.complete':
      return { ...state, hasSeenTutorial: true }

    case 'playbook.complete_step': {
      const current = state.playbookCompletedSteps || []
      if (current.includes(action.stepId)) return state
      return { ...state, playbookCompletedSteps: [...current, action.stepId] }
    }

    case 'playbook.dismiss':
      return { ...state, playbookDismissed: true }

    case 'demand.refresh_pool':
      return handleRefreshDemandPool(state)

    case 'demand.batch_triage':
      return handleDemandBatchTriage(state)

    case 'product.place_component': {
      const comp = state.availableComponents.find(c => c.id === action.componentId)
      if (!comp) return state
      return {
        ...state,
        productSlots: {
          ...state.productSlots,
          [action.slot]: comp,
        },
        productVerified: false,
        verificationErrors: [],
      }
    }

    case 'product.remove_component': {
      return {
        ...state,
        productSlots: {
          ...state.productSlots,
          [action.slot]: null,
        },
        productVerified: false,
        verificationErrors: [],
      }
    }

    case 'product.place_bucket': {
      const comp = state.availableComponents.find(c => c.id === action.componentId)
      if (!comp) return state
      const currentBuckets = state.productBuckets ?? {
        write: state.productSlots.speed,
        diff: state.productSlots.collaboration,
        test: state.productSlots.control,
        deploy: null,
      }
      const updatedBuckets = { ...currentBuckets, [action.bucket]: comp }
      const isAllSlotted = Boolean(updatedBuckets.write && updatedBuckets.diff && updatedBuckets.test && updatedBuckets.deploy)

      const updatedSlots = {
        speed: updatedBuckets.write ?? state.productSlots.speed,
        collaboration: updatedBuckets.diff ?? state.productSlots.collaboration,
        control: updatedBuckets.test ?? (updatedBuckets.deploy?.category === 'control' ? updatedBuckets.deploy : state.productSlots.control),
      }

      return {
        ...state,
        productBuckets: updatedBuckets,
        productSlots: updatedSlots,
        productVerified: isAllSlotted && !!state.productTestsPassed,
        verificationErrors: [],
      }
    }

    case 'product.remove_bucket': {
      const currentBuckets = state.productBuckets ?? { write: null, diff: null, test: null, deploy: null }
      const updatedBuckets = { ...currentBuckets, [action.bucket]: null }
      return {
        ...state,
        productBuckets: updatedBuckets,
        productVerified: false,
        verificationErrors: [],
      }
    }

    case 'product.verify': {
      const { speed, collaboration, control } = state.productSlots
      const buckets = state.productBuckets
      const hasBuckets = buckets && (buckets.write || buckets.diff || buckets.test || buckets.deploy)
      const errors: string[] = []

      if (hasBuckets) {
        if (!buckets.write) errors.push('Write bucket is empty.')
        if (!buckets.diff) errors.push('Diff bucket is empty.')
        if (!buckets.test) errors.push('Test bucket is empty.')
        if (!buckets.deploy) errors.push('Deploy bucket is empty.')
      } else {
        if (!speed) errors.push('Speed component is missing.')
        if (!collaboration) errors.push('Collaboration component is missing.')
        if (!control) errors.push('Control component is missing.')
      }

      if (errors.length > 0) {
        return {
          ...state,
          productVerified: false,
          verificationErrors: errors,
          alerts: [
            ...state.alerts,
            {
              id: `err-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Verification Incomplete',
              message: errors.join(' '),
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      return {
        ...state,
        productVerified: true,
        verificationErrors: [],
        alerts: [
          ...state.alerts,
          {
            id: `vfy-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Architecture Verified',
            message: 'Pipeline passed type-safety & contract verification. Ready for shipping.',
            tick: state.elapsedTicks,
          },
        ],
      }
    }

    case 'product.set_stage': {
      return {
        ...state,
        productStage: action.stage,
      }
    }

    case 'product.resolve_diff': {
      return {
        ...state,
        productDiffResolved: true,
        alerts: [
          ...state.alerts,
          {
            id: `diff-res-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Diff Hunks Approved & Merged',
            message: 'Syntax diffs reviewed and clean. Defect risk minimized.',
            tick: state.elapsedTicks,
          },
        ],
      }
    }

    case 'product.run_tests': {
      const currentBuckets = state.productBuckets ?? {
        write: state.productSlots.speed,
        diff: state.productSlots.collaboration,
        test: state.productSlots.control,
        deploy: null,
      }
      const isAllSlotted = Boolean(currentBuckets.write && currentBuckets.diff && currentBuckets.test && currentBuckets.deploy)
      return {
        ...state,
        productTestsPassed: true,
        productVerified: isAllSlotted,
        alerts: [
          ...state.alerts,
          {
            id: `test-pass-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Test Suite Passed',
            message: 'All unit, chaos, and integration assertions green [100% PASS].',
            tick: state.elapsedTicks,
          },
        ],
      }
    }

    case 'product.ship': {
      const lastShip = state.lastProductShipTick ?? -9999
      if (state.elapsedTicks - lastShip < 25) {
        return state
      }
      if (state.qualifiedOpportunities.length === 0) {
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `err-no-demand-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'No Market Demand',
              message: 'Cannot ship release without a qualified customer opportunity. Triage signals in Demand first.',
              tick: state.elapsedTicks,
            },
          ],
        }
      }
      const buckets = state.productBuckets
      const isAllSlotted = buckets ? Boolean(buckets.write && buckets.diff && buckets.test && buckets.deploy) : Boolean(state.productSlots.speed && state.productSlots.collaboration && state.productSlots.control)
      if (!state.productVerified && !isAllSlotted) return state
      const { speed, collaboration, control } = state.productSlots
      const compSpeed = speed || buckets?.write || buckets?.deploy
      const compCollab = collaboration || buckets?.diff
      const compControl = control || buckets?.test || buckets?.deploy
      if (!compSpeed || !compCollab || !compControl) return state

      // Derive capabilities from components
      const newSpeed = clamp(state.systemCapabilities.speed + compSpeed.capabilityBonus * 0.25, 0, 1)
      const newCollab = clamp(state.systemCapabilities.collaboration + compCollab.capabilityBonus * 0.25, 0, 1)
      const newControl = clamp(state.systemCapabilities.control + compControl.capabilityBonus * 0.25, 0, 1)

      const defectExposure = clamp(
        (compSpeed.defectRisk + compCollab.defectRisk + compControl.defectRisk) * (state.productDiffResolved ? 0.25 : 0.5),
        0,
        0.5
      )

      // Fulfill top qualified opportunity
      const [topOpp, ...remainingOpps] = state.qualifiedOpportunities
      const targetSegment = topOpp.segment
      const opportunityTitle = topOpp.title
      const customWtp = topOpp.estimatedWtpCents
      const updatedOpportunities = remainingOpps

      const activation: ProductActivation = {
        id: `act-${state.elapsedTicks}`,
        title: opportunityTitle,
        targetSegment,
        speedFit: newSpeed,
        collabFit: newCollab,
        controlFit: newControl,
        overallFit: (newSpeed + newCollab + newControl) / 3,
        defectExposure,
        timestampTick: state.elapsedTicks,
        customWtpMonthlyCents: customWtp,
      }

      const targetConversion = calculateCustomerConversion(targetSegment, { speed: newSpeed, collaboration: newCollab, control: newControl }, 0)
      const defaultWtp = targetConversion.effectiveWtpMonthlyCents

      return {
        ...state,
        systemCapabilities: { speed: newSpeed, collaboration: newCollab, control: newControl },
        productSlots: { speed: null, collaboration: null, control: null },
        productBuckets: { write: null, diff: null, test: null, deploy: null },
        productVerified: false,
        lastProductShipTick: state.elapsedTicks,
        qualifiedOpportunities: updatedOpportunities,
        activationsQueue: [...state.activationsQueue, activation],
        currentActivation: state.currentActivation ?? activation,
        postedPriceMonthlyCents: state.currentActivation ? state.postedPriceMonthlyCents : defaultWtp,
        pricingCursor: 0.5,
        pipelineStage: 'monetisation',
        activeFunction: 'monetisation',
        alerts: [
          ...state.alerts,
          {
            id: `ship-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Build Shipped to Staging',
            message: `Activation created for ${targetSegment.toUpperCase()} segment. Pricing decision required in Monetisation.`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-ship-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'product',
            message: `Shipped architecture update. Target: ${targetSegment.toUpperCase()}. Defect risk: ${Math.round(defectExposure * 100)}%.`,
          },
        ],
      }
    }

    case 'product.fill_socket': {
      const { podId, socketIndex, primitive } = action
      const scaleRank = state.fleet.product.scaleRank || 0
      const craftRank = state.fleet.product.craftRank || 0
      const luckRank = state.fleet.product.luckRank || 0
      const pods = syncProductPods(state.productPods, state.qualifiedOpportunities, scaleRank, craftRank)

      const pod = pods.find(p => p.id === podId)
      if (!pod) return state

      const targetSocket = pod.sockets[socketIndex]
      if (!targetSocket || targetSocket.filled) return state
      if (targetSocket.type !== primitive) return state

      const updatedSockets = pod.sockets.map((s, idx) =>
        idx === socketIndex ? { ...s, filled: true } : s
      )

      // Luck variance roll
      const rng = new DeterministicRNG(state.seed + state.elapsedTicks + socketIndex * 17)
      const luck = calculateLuckVariance(luckRank, rng.nextFloat())
      const isCrit = luckRank > 0 && luck.isPeakPositive && updatedSockets.some(s => !s.filled)

      const finalSockets = isCrit
        ? updatedSockets.map(s => ({ ...s, filled: true }))
        : updatedSockets

      const allFilled = finalSockets.every(s => s.filled)

      const updatedPod: CodingPod = {
        ...pod,
        sockets: finalSockets,
        isVerified: allFilled,
        isReadyToShip: allFilled,
        isAlphaFeature: pod.isAlphaFeature || (luckRank > 0 && (luck.isPeakPositive || (luck.delta > 0 && rng.nextFloat() < 0.15))),
      }

      // Capability boost scaled by craftRank, luck variance, and manual action multiplier
      const activeBuffs = getActiveBuffs(state)
      const craftMult = CRAFT_MULTIPLIERS[craftRank] || 1
      const manualMultiplier = activeBuffs.manualActionMultiplier || 1
      const capBoost = 0.012 * Math.min(craftMult, 3) * luck.multiplier * manualMultiplier
      const newCaps = {
        speed: clamp(state.systemCapabilities.speed + (primitive === 'prompt' || primitive === 'deploy' ? capBoost : 0), 0, 1),
        collaboration: clamp(state.systemCapabilities.collaboration + (primitive === 'diff' ? capBoost : 0), 0, 1),
        control: clamp(state.systemCapabilities.control + (primitive === 'test' || primitive === 'deploy' ? capBoost : 0), 0, 1),
      }

      const updatedPods = pods.map(p => p.id === podId ? updatedPod : p)

      return {
        ...state,
        systemCapabilities: newCaps,
        productPods: updatedPods,
        alerts: isCrit ? [
          ...state.alerts,
          {
            id: `crit-${state.elapsedTicks}`,
            tone: 'info',
            title: '1-Shot Compile Breakthrough!',
            message: `Luck triggered instant synthesis for ${pod.moduleName}! All sockets verified.`,
            tick: state.elapsedTicks,
          },
        ] : state.alerts,
      }
    }

    case 'product.auto_fill_primitive': {
      const scaleRank = state.fleet.product.scaleRank || 0
      const craftRank = state.fleet.product.craftRank || 0
      const pods = syncProductPods(state.productPods, state.qualifiedOpportunities, scaleRank, craftRank)

      for (const pod of pods) {
        const sIdx = pod.sockets.findIndex(s => !s.filled && s.type === action.primitive)
        if (sIdx !== -1) {
          return gameReducer({ ...state, productPods: pods }, {
            type: 'product.fill_socket',
            podId: pod.id,
            socketIndex: sIdx,
            primitive: action.primitive,
          })
        }
      }
      return {
        ...state,
        productPods: pods,
      }
    }

    case 'product.verify_pod': {
      const pods = state.productPods ?? []
      const pod = pods.find(p => p.id === action.podId)
      if (!pod || !pod.sockets.every(s => s.filled)) return state

      return {
        ...state,
        productPods: pods.map(p => p.id === action.podId ? { ...p, isVerified: true, isReadyToShip: true } : p),
      }
    }

    case 'product.ship_pod': {
      const pods = state.productPods ?? []
      const pod = pods.find(p => p.id === action.podId)
      if (!pod || !pod.isReadyToShip) return state

      const craftRank = state.fleet.product.craftRank || 0
      const luckRank = state.fleet.product.luckRank || 0
      const craftMult = CRAFT_MULTIPLIERS[craftRank] || 1
      const activeBuffs = getActiveBuffs(state)
      const yieldMult = 1 + (activeBuffs.productYieldBonus || 0)
      const luck = calculateLuckVariance(luckRank)
      const hasAutoCompiler = state.activeRelics.some(r => r.id === 'relic-auto-compiler')
      const hasFeatureFlags = state.activeRelics.some(r => r.id === 'relic-feature-flags')
      const compilerYield = hasAutoCompiler ? 1.20 : 1.0
      const bonusCap = 0.04 * Math.min(craftMult, 3) * yieldMult * luck.multiplier * compilerYield

      const newCaps = {
        speed: clamp(state.systemCapabilities.speed + (pod.leadSegment === 'creator' ? bonusCap * 1.5 : bonusCap), 0, 1),
        collaboration: clamp(state.systemCapabilities.collaboration + (pod.leadSegment === 'team' ? bonusCap * 1.5 : bonusCap), 0, 1),
        control: clamp(state.systemCapabilities.control + (pod.leadSegment === 'enterprise' ? bonusCap * 1.5 : bonusCap), 0, 1),
      }

      const baseWtp = pod.isAlphaFeature ? pod.leadWtpCents * 2 : pod.leadWtpCents
      const defectReduction = activeBuffs.defectReduction || 0
      const defectExposure = clamp((0.02 - 0.004 * craftRank) * (1 - defectReduction) * (hasAutoCompiler ? 0.50 : 1.0) * (hasFeatureFlags ? 0.60 : 1.0) * Math.max(0.8, 1 - luck.delta), 0.001, 0.05)

      const activation: ProductActivation = {
        id: `act-${state.elapsedTicks}-${pod.id}`,
        title: pod.leadTitle,
        targetSegment: pod.leadSegment,
        speedFit: newCaps.speed,
        collabFit: newCaps.collaboration,
        controlFit: newCaps.control,
        overallFit: (newCaps.speed + newCaps.collaboration + newCaps.control) / 3,
        defectExposure,
        timestampTick: state.elapsedTicks,
        customWtpMonthlyCents: baseWtp,
      }

      const targetConversion = calculateCustomerConversion(pod.leadSegment, newCaps, 0)
      const defaultWtp = pod.isAlphaFeature ? Math.round(baseWtp) : targetConversion.effectiveWtpMonthlyCents

      const remainingOpps = [...state.qualifiedOpportunities]
      const oppIdx = remainingOpps.findIndex(o => o.id === pod.opportunityId)
      if (oppIdx !== -1) {
        remainingOpps.splice(oppIdx, 1)
      }

      const nextOpp = remainingOpps.shift()
      const mod = CODING_POD_MODULES[pod.slotIndex % CODING_POD_MODULES.length]
      const nextSegment = nextOpp?.segment ?? mod.segmentAffinity

      const refilledPod: CodingPod = {
        id: `pod-${pod.slotIndex}-${nextOpp?.id ?? 'idle'}-${state.elapsedTicks}`,
        slotIndex: pod.slotIndex,
        opportunityId: nextOpp?.id,
        leadTitle: nextOpp?.title ?? `Awaiting Qualified Lead`,
        leadSegment: nextSegment,
        leadWtpCents: nextOpp?.estimatedWtpCents ?? 15_000,
        moduleName: mod.moduleName,
        categoryTag: mod.categoryTag,
        codeSnippet: mod.codeSnippet,
        linesAdded: Math.round(mod.baseLinesAdded * (1 + 0.25 * craftRank) * luck.multiplier),
        linesRemoved: mod.baseLinesRemoved,
        sockets: createSocketsForSegment(nextSegment),
        isVerified: false,
        isReadyToShip: false,
      }

      const updatedPods = pods.map(p => p.id === action.podId ? refilledPod : p)
      const hasActiveOppsRemaining = remainingOpps.length > 0 || updatedPods.some(p => Boolean(p.opportunityId))
      const shouldSwitchToMonetisation = !hasActiveOppsRemaining

      return {
        ...state,
        systemCapabilities: newCaps,
        productPods: updatedPods,
        qualifiedOpportunities: remainingOpps,
        activationsQueue: [...state.activationsQueue, activation],
        currentActivation: state.currentActivation ?? activation,
        postedPriceMonthlyCents: state.currentActivation ? state.postedPriceMonthlyCents : defaultWtp,
        pricingCursor: 0.5,
        pipelineStage: shouldSwitchToMonetisation ? 'monetisation' : state.pipelineStage,
        activeFunction: shouldSwitchToMonetisation ? 'monetisation' : state.activeFunction,
        lastProductShipTick: state.elapsedTicks,
        alerts: [
          ...state.alerts,
          {
            id: `ship-pod-${state.elapsedTicks}`,
            tone: 'info',
            title: `${pod.moduleName} Shipped to Production!`,
            message: `Release built for ${pod.leadSegment.toUpperCase()} customer (${pod.leadTitle}). Activation queued for Monetisation.`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-pod-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'product',
            message: `Shipped ${pod.moduleName} for ${pod.leadSegment.toUpperCase()}. Quality: Verified.`,
          },
        ],
      }
    }

    case 'monetisation.set_slider': {
      const normalized = clamp(action.normalizedCursor, 0, 1)
      const activation = state.currentActivation
      if (!activation) {
        return {
          ...state,
          pricingCursor: normalized,
        }
      }
      const targetWtp = calculateCustomerConversion(activation.targetSegment, state.systemCapabilities, 0).effectiveWtpMonthlyCents
      // 0.0 is 0.5x WTP, 0.5 is 1.0x WTP (perfect sweet spot), 1.0 is 1.8x WTP
      const multiplier = 0.5 + normalized * 1.3
      const postedPrice = Math.round(targetWtp * multiplier)

      return {
        ...state,
        pricingCursor: normalized,
        postedPriceMonthlyCents: postedPrice,
      }
    }

    case 'monetisation.commit_price': {
      if (!state.currentActivation && !state.activeDealDesks?.[0]?.activation) return state
      return handleMonetisationCommit(state, action)
    }

    case 'monetisation.commit_desk': {
      return handleMonetisationCommit(state, {
        rating: action.rating,
        deskIndex: action.deskIndex,
        normalizedCursor: action.normalizedCursor,
      })
    }

    case 'monetisation.batch_close': {
      return handleMonetisationBatchClose(state)
    }

    case 'retention.intervene': {
      const account = state.accounts.find(a => a.id === action.accountId)
      if (!account || (!account.isThreatened && account.health >= 80)) return state

      const activeBuffs = getActiveBuffs(state)
      const manualMultiplier = activeBuffs.manualActionMultiplier || 1
      let costCents = 2_000 // $20
      let healthBoost = Math.round(35 * manualMultiplier)
      let label = 'Emergency Hotfix'

      if (action.interventionType === 'founder_call') {
        costCents = 1_000 // $10 founder travel / coffee
        healthBoost = Math.round(45 * manualMultiplier)
        label = 'Founder 1-on-1 Call'
      } else if (action.interventionType === 'concession') {
        costCents = 5_000 // $50 concession credit
        healthBoost = Math.round(60 * manualMultiplier)
        label = 'SLA Concession & Billing Credit'
      }

      if (state.cashCents < costCents) {
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `alert-cash-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Insufficient Cash',
              message: `Need $${costCents / 100} to execute ${label}.`,
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      const updatedAccounts = state.accounts.map(a => {
        if (a.id === action.accountId) {
          return {
            ...a,
            health: Math.min(100, a.health + healthBoost),
            isThreatened: false,
            threatDeadlineTick: null,
            threatReason: null,
          }
        }
        return a
      })

      const savedArr = (account.baseMrrCents + account.addonMrrCents) * 12

      const remainingIncidents = (state.retentionIncidents ?? []).filter(
        i => i.accountId !== action.accountId && i.id !== `threat-${action.accountId}`
      )
      const nextRetentionEvent = state.retentionEvent?.accountId === action.accountId ? null : state.retentionEvent

      return {
        ...state,
        cashCents: state.cashCents - costCents,
        accounts: updatedAccounts,
        activeThreatAccountId: null,
        retentionIncidents: remainingIncidents,
        retentionEvent: nextRetentionEvent,
        retentionSavedArrCents: state.retentionSavedArrCents + savedArr,
        alerts: [
          ...state.alerts,
          {
            id: `ret-saved-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Account Churn Averted',
            message: `${label} applied to ${account.name}. Saved $${Math.round(savedArr / 100).toLocaleString()}/yr ARR.`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-ret-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'retention',
            message: `Averted churn for ${account.name} using ${label}. Saved $${Math.round(savedArr / 100).toLocaleString()}/yr ARR.`,
            deltaCashCents: -costCents,
          },
        ],
      }
    }

    case 'retention.squash_problem': {
      const incidents = state.retentionIncidents ?? []
      const target = incidents.find(i => i.id === action.incidentId)
      const targetAccount = state.accounts.find(a => a.id === target?.accountId || a.id === action.incidentId || a.isThreatened)

      // Squashing costs minimal cash ($5 / 500 cents)
      const costCents = 500
      if (state.cashCents < costCents) return state

      const updatedAccounts = state.accounts.map(a => {
        if (targetAccount && a.id === targetAccount.id) {
          return {
            ...a,
            health: Math.min(100, a.health + 25),
            isThreatened: false,
            threatDeadlineTick: null,
            threatReason: null,
          }
        }
        return a
      })

      const remainingIncidents = incidents.filter(i => i.id !== action.incidentId)
      const savedArr = targetAccount ? (targetAccount.baseMrrCents + targetAccount.addonMrrCents) * 12 : 12_000
      const title = target?.title ?? 'Critical Churn Risk'
      const accName = targetAccount?.name ?? target?.accountName ?? 'Customer Account'

      return {
        ...state,
        cashCents: state.cashCents - costCents,
        accounts: updatedAccounts,
        retentionIncidents: remainingIncidents,
        activeThreatAccountId: null,
        retentionSavedArrCents: state.retentionSavedArrCents + savedArr,
        alerts: [
          ...state.alerts,
          {
            id: `squash-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Problem Squashed!',
            message: `Squashed "${title}" on ${accName}. Account health restored.`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-sq-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'retention',
            message: `Squashed urgent outage "${title}" for ${accName}. Saved $${Math.round(savedArr / 100).toLocaleString()}/yr ARR.`,
            deltaCashCents: -costCents,
          },
        ],
      }
    }

    case 'retention.squash_hit': {
      const toolCost = action.costCents ?? 0
      if (state.cashCents < toolCost) {
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `alert-cash-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Insufficient Cash',
              message: `Need $${toolCost / 100} to swing the Heavy Sledgehammer.`,
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      const incidents = [...(state.retentionIncidents ?? [])]
      // 1. Locate target account (from action.accountId, action.incidentId, or matching existing incident)
      const targetAccount = state.accounts.find(
        a => (action.accountId && a.id === action.accountId) ||
             a.id === action.incidentId ||
             `threat-${a.id}` === action.incidentId ||
             (action.incidentId && action.incidentId.includes(a.id))
      ) || (incidents.find(i => i.id === action.incidentId)?.accountId
            ? state.accounts.find(a => a.id === incidents.find(i => i.id === action.incidentId)?.accountId)
            : null) || state.accounts.find(a => a.isThreatened) || state.accounts[0]

      // 2. Locate or instantiate target incident
      let targetIndex = incidents.findIndex(
        i => i.id === action.incidentId ||
             (targetAccount && i.accountId === targetAccount.id) ||
             (action.accountId && i.accountId === action.accountId)
      )

      const isThreat = Boolean(
        targetAccount?.isThreatened ||
        (targetAccount && targetAccount.health < 65) ||
        (targetIndex >= 0 && incidents[targetIndex]?.consequence === 'Contract Cancellation')
      )

      let target: RetentionIncident
      if (targetIndex >= 0) {
        target = { ...incidents[targetIndex] }
      } else {
        target = {
          id: action.incidentId || (targetAccount ? `threat-${targetAccount.id}` : `threat-${state.elapsedTicks}`),
          accountId: targetAccount?.id ?? 'acc-0',
          accountName: targetAccount?.name ?? 'Customer Account',
          title: targetAccount?.threatReason || (targetAccount && targetAccount.health < 50 ? 'Severe Latency Degradation' : (isThreat ? 'Executive Churn Risk' : 'Customer SLA Preventive Care')),
          category: 'executive',
          urgencyTicks: isThreat ? 120 : 0,
          maxUrgencyTicks: 120,
          consequence: isThreat ? 'Contract Cancellation' : 'Customer Care',
          hp: 4,
          maxHp: 4,
          threatType: targetAccount && targetAccount.health < 50 ? 'bug' : 'piggy',
        }
        if (isThreat) {
          incidents.push(target)
          targetIndex = incidents.length - 1
        }
      }

      // If target account is already at 100% SLA health with no active threat, no squash/care is needed
      if (targetAccount && !targetAccount.isThreatened && targetAccount.health >= 100 && targetIndex < 0) {
        return state
      }

      const activeBuffs = getActiveBuffs(state)
      const manualMultiplier = activeBuffs.manualActionMultiplier || 1
      const retentionCraftRank = state.fleet?.retention?.craftRank ?? 0
      const retentionLuckRank = state.fleet?.retention?.luckRank ?? 0
      const luck = calculateLuckVariance(retentionLuckRank)
      const currentHp = target.hp ?? 4
      const craftDamageMultiplier = 1 + (retentionCraftRank >= 2 ? 1 : 0)
      const dmg = Math.round((action.damage ?? 1) * craftDamageMultiplier * manualMultiplier)
      const nextHp = isThreat ? currentHp - dmg : 0
      const newCombo = (state.retentionCombo ?? 0) + 1
      const craftHealthBonus = Math.round(35 * (1 + 0.35 * retentionCraftRank) * luck.multiplier * manualMultiplier)

      if (nextHp <= 0) {
        // Fully squashed/shattered!
        const updatedAccounts = state.accounts.map(a => {
          if (targetAccount && a.id === targetAccount.id) {
            return {
              ...a,
              health: Math.min(100, Math.max(a.health, 40) + craftHealthBonus),
              isThreatened: false,
              threatDeadlineTick: null,
              threatReason: null,
            }
          }
          return a
        })
        const remainingIncidents = incidents.filter(
          i => i.id !== target.id && (!targetAccount || i.accountId !== targetAccount.id)
        )
        const savedArr = targetAccount
          ? (targetAccount.baseMrrCents + targetAccount.addonMrrCents) * 12
          : 12_000
        const nextRetentionEvent = state.retentionEvent?.accountId === targetAccount?.id ? null : state.retentionEvent

        let viralSignals = state.demandSignals || []
        const isViralAdvocate = retentionLuckRank > 0 && luck.isPeakPositive
        if (isViralAdvocate && targetAccount) {
          const viralSig: DemandSignal = {
            id: `sig-viral-${state.elapsedTicks}-${Math.floor(Math.random() * 1000)}`,
            segment: targetAccount.segment,
            title: `Viral Referral: ${targetAccount.name}`,
            quote: 'Their customer reliability is exceptional! Recommended to executive network.',
            signalRationale: 'High-intent organic word-of-mouth with $0 acquisition CAC.',
            estimatedWtpCents: Math.round(targetAccount.baseMrrCents * 1.5),
            acquisitionCostCents: 0,
            expiryTick: state.elapsedTicks + 400,
          }
          viralSignals = [...viralSignals, viralSig]
        }

        return {
          ...state,
          cashCents: state.cashCents - toolCost,
          accounts: updatedAccounts,
          retentionIncidents: remainingIncidents,
          retentionCombo: newCombo,
          activeThreatAccountId: null,
          retentionEvent: nextRetentionEvent,
          retentionSavedArrCents: state.retentionSavedArrCents + savedArr,
          demandSignals: viralSignals,
          alerts: [
            ...state.alerts.filter(al => !(al.id.startsWith('threat-alert-') && (targetAccount ? al.id.includes(targetAccount.id) : true))),
            {
              id: `squash-hit-${state.elapsedTicks}`,
              tone: 'info',
              title: isViralAdvocate ? `🌟 Customer Advocacy Triggered! (${newCombo}x Combo)` : `Problem Squashed! (${newCombo}x Combo)`,
              message: targetAccount && targetAccount.isThreatened
                ? `Squashed churn threat! Saved $${Math.round(savedArr / 100).toLocaleString()}/yr ARR.${isViralAdvocate ? ' Delighted customer spawned $0 CAC referral in Demand!' : ''}`
                : `Preventive care applied to ${targetAccount?.name || 'Customer'}! +${craftHealthBonus}% SLA Health.${isViralAdvocate ? ' Delighted customer spawned $0 CAC referral in Demand!' : ''}`,
              tick: state.elapsedTicks,
              targetFunction: 'retention',
              actionLabel: 'View Retention [4]',
            },
          ],
        }
      } else {
        // Took damage: update HP in incidents!
        incidents[targetIndex] = { ...target, hp: nextHp }
        return {
          ...state,
          cashCents: state.cashCents - toolCost,
          retentionIncidents: incidents,
          retentionCombo: newCombo,
        }
      }
    }

    case 'retention.tool_surge': {
      if (action.tool === 'coffee') {
        const costCents = 2_000
        if (state.cashCents < costCents) return state
        // Squashes all active incidents and restores all accounts
        const updatedAccounts = state.accounts.map(a => ({
          ...a,
          health: Math.min(100, a.health + 40),
          isThreatened: false,
          threatDeadlineTick: null,
          threatReason: null,
        }))
        return {
          ...state,
          cashCents: state.cashCents - costCents,
          accounts: updatedAccounts,
          retentionIncidents: [],
          retentionEvent: null,
          activeThreatAccountId: null,
          retentionCombo: (state.retentionCombo ?? 0) + 3,
          alerts: [
            ...state.alerts.filter(al => !al.id.startsWith('threat-alert-')),
            {
              id: `coffee-${state.elapsedTicks}`,
              tone: 'info',
              title: 'Coffee Surge Activated!',
              message: 'Room-wide caffeine wave cleared all threatened bugs!',
              tick: state.elapsedTicks,
              targetFunction: 'retention',
              actionLabel: 'View Retention [4]',
            },
          ],
        }
      } else if (action.tool === 'mallet') {
        // Heavy Mallet hits active incident for 5 damage ($10 cost)
        const costCents = 1_000
        if (state.cashCents < costCents) return state
        const incidents = state.retentionIncidents ?? []
        const threatened = state.accounts.find(a => a.isThreatened || a.health < 65)
        const targetId = incidents[0]?.id || (threatened ? `threat-${threatened.id}` : null)
        if (targetId) {
          return gameReducer(state, {
            type: 'retention.squash_hit',
            incidentId: targetId,
            damage: 5,
            costCents,
          })
        }
      }
      return state
    }

    case 'expansion.merge_package': {
      const account = state.accounts.find(a => a.id === action.accountId)
      const pack = state.expansionAddonPacks.find(p => p.id === action.packId)
      if (!account || account.delinquent || account.addonSlotsUsed >= MAX_ADDON_SLOTS) return state

      if (account.ageTicks < EXPANSION_MATURITY_TICKS) {
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `exp-age-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Account Not Mature for Expansion',
              message: `${account.name} active age is ${Math.floor(account.ageTicks / 10)}s. Must be active for at least 120s (2 months / 1,200 ticks) before expansion.`,
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      if (account.health < EXPANSION_MIN_HEALTH) {
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `exp-health-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Account Health Too Low',
              message: `${account.name} health is ${Math.round(account.health)}%. Must be at least ${EXPANSION_MIN_HEALTH}% to accept expansion proposals.`,
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      // Addon price is floor(base_price * 0.25) per BALANCE.md
      const calculatedAddonMrrCents = Math.floor(account.baseMrrCents * ADDON_PRICE_FRACTION)
      const deployCostCents = pack ? pack.costCents : Math.round(calculatedAddonMrrCents * 1.2)
      const packTitle = pack ? pack.title : 'Enterprise Add-on Module'

      if (state.cashCents < deployCostCents) {
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `exp-cash-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Deployment Cash Required',
              message: `Need $${(deployCostCents / 100).toLocaleString()} to deploy ${packTitle}.`,
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      const updatedAccounts = state.accounts.map(a => {
        if (a.id === action.accountId) {
          return {
            ...a,
            addonMrrCents: a.addonMrrCents + calculatedAddonMrrCents,
            addonSlotsUsed: a.addonSlotsUsed + 1,
            health: Math.min(100, a.health + 5), // expansion deepens customer integration
          }
        }
        return a
      })

      const addedArr = calculatedAddonMrrCents * 12
      const { contractualArrCents, eligibleArrCents } = calculateArrTotals(updatedAccounts)
      const tempState: GameState = { ...state, accounts: updatedAccounts, cashCents: state.cashCents - deployCostCents }
      const economicBurn = calculateEconomicBurn(tempState)
      const cashForecast = calculateCashForecast(tempState)
      const capQuality = calculateCapitalQualityFactor(economicBurn.burnRatio, cashForecast.shortfallFraction)
      const gMultiple = calculateGrowthMultiple(state.arrBridge.openingArrCents, contractualArrCents, state.elapsedTicks)
      const val = calculateValuationCents(eligibleArrCents, gMultiple, capQuality)

      return {
        ...state,
        cashCents: state.cashCents - deployCostCents,
        accounts: updatedAccounts,
        contractualArrCents,
        eligibleArrCents,
        growthMultiple: gMultiple,
        capitalQualityFactor: capQuality,
        shortfallFraction: cashForecast.shortfallFraction,
        burnRatio: economicBurn.burnRatio,
        cogsMonthCents: economicBurn.cogsMonthCents,
        opexMonthCents: economicBurn.opexMonthCents,
        interestMonthCents: economicBurn.interestMonthCents,
        earnedRevenueMonthCents: economicBurn.earnedRevenueMonthCents,
        forecastObligationsCents: cashForecast.forecastObligationsCents,
        forecastExpectedCollectionsCents: cashForecast.forecastExpectedCollectionsCents,
        peakNegativeCashCents: cashForecast.peakNegativeCashCents,
        valuationCents: val,
        arrBridge: {
          ...state.arrBridge,
          expansionArrCents: state.arrBridge.expansionArrCents + addedArr,
        },
        alerts: [
          ...state.alerts,
          {
            id: `exp-success-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Addon Expansion Signed',
            message: `${packTitle} merged into ${account.name}. +$${(addedArr / 100).toLocaleString()}/yr ARR.`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-exp-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'expansion',
            message: `Expanded account ${account.name} with ${packTitle}. +$${(addedArr / 100).toLocaleString()}/yr ARR.`,
            deltaCashCents: -deployCostCents,
            deltaArrCents: addedArr,
          },
        ],
      }
    }

    case 'expansion.spawn_item': {
      const maxGridSize = EXPANSION_GRID_SIZES[state.fleet?.expansion?.scaleRank ?? 0] || 16
      const grid = state.mergeGrid ? [...state.mergeGrid] : Array(maxGridSize).fill(null)
      while (grid.length < maxGridSize) {
        grid.push(null)
      }
      const emptyIndex = grid.findIndex(cell => cell === null)
      if (emptyIndex === -1) {
        return {
          ...state,
          mergeGrid: grid,
          alerts: [
            ...state.alerts,
            {
              id: `exp-full-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Merge Board Full',
              message: 'Merge existing features together to free up board space.',
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      const hasZeroCopy = state.activeRelics.some(r => r.id === 'relic-sub-pod-buffer')
      const spawnCostCents = hasZeroCopy ? 0 : 1_500 // $0 if Zero-Copy Micro-Pods active, else $15 compute
      if (state.cashCents < spawnCostCents) {
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `exp-cash-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Compute Budget Depleted',
              message: 'Need $15 compute budget to synthesize feature block.',
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      const hasQuantumAnnealing = state.activeRelics.some(r => r.id === 'relic-quantum-annealing')
      const chain = action.chain ?? (['intelligence', 'infrastructure', 'security'] as const)[Math.floor(Math.random() * 3)]
      const newItem: MergeItem = {
        id: `feat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        chain,
        tier: hasQuantumAnnealing ? 2 : 1,
      }

      const nextGrid = [...grid]
      nextGrid[emptyIndex] = newItem

      return {
        ...state,
        cashCents: state.cashCents - spawnCostCents,
        mergeGrid: nextGrid,
      }
    }

    case 'expansion.merge_grid': {
      const maxGridSize = EXPANSION_GRID_SIZES[state.fleet?.expansion?.scaleRank ?? 0] || 16
      const grid = state.mergeGrid ? [...state.mergeGrid] : Array(maxGridSize).fill(null)
      while (grid.length < maxGridSize) {
        grid.push(null)
      }
      const source = grid[action.fromIndex]
      const target = grid[action.toIndex]

      if (!source || action.fromIndex === action.toIndex) return state

      // If target is empty, move source item to the empty slot
      if (!target) {
        const nextGrid = [...grid]
        nextGrid[action.toIndex] = source
        nextGrid[action.fromIndex] = null
        return {
          ...state,
          mergeGrid: nextGrid,
        }
      }

      if (source.chain !== target.chain || source.tier !== target.tier) return state
      if (source.tier >= 7) return state

      const upgradedTier = (source.tier + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7
      const upgradedItem: MergeItem = {
        id: `feat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        chain: source.chain,
        tier: upgradedTier,
      }

      const nextGrid = [...grid]
      nextGrid[action.fromIndex] = null
      nextGrid[action.toIndex] = upgradedItem

      return {
        ...state,
        mergeGrid: nextGrid,
        alerts: [
          ...state.alerts,
          {
            id: `merge-${state.elapsedTicks}`,
            tone: 'info',
            title: `Tier ${upgradedTier} Feature Synthesized!`,
            message: `Merged into Tier ${upgradedTier} ${source.chain.toUpperCase()} module. Ticket size multiplied!`,
            tick: state.elapsedTicks,
          },
        ],
      }
    }

    case 'expansion.fulfill_order': {
      const orders = state.expansionOrders ?? []
      const order = orders.find(o => o.id === action.orderId)
      if (!order) return state

      const maxGridSize = EXPANSION_GRID_SIZES[state.fleet?.expansion?.scaleRank ?? 0] || 16
      const grid = state.mergeGrid ? [...state.mergeGrid] : Array(maxGridSize).fill(null)
      const matchingIndex = grid.findIndex(item => item && item.chain === order.chain && item.tier >= order.targetTier)
      if (matchingIndex === -1) {
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `order-missing-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Missing Required Feature',
              message: `Merge features until you have a Tier ${order.targetTier} ${order.chain.toUpperCase()} module.`,
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      const nextGrid = [...grid]
      nextGrid[matchingIndex] = null

      const accountFound = state.accounts.some(a => a.id === order.accountId)
      if (!accountFound) {
        return state
      }

      const activeBuffs = getActiveBuffs(state)
      const manualMult = activeBuffs.manualActionMultiplier || 1
      const expansionCraftRank = state.fleet?.expansion?.craftRank ?? 0
      const expansionLuckRank = state.fleet?.expansion?.luckRank ?? 0
      const craftMult = CRAFT_MULTIPLIERS[expansionCraftRank] || 1
      const luck = calculateLuckVariance(expansionLuckRank)
      const isLuckyDouble = expansionLuckRank > 0 && luck.isPeakPositive
      const rewardMultiplier = (1 + 0.20 * (craftMult - 1)) * luck.multiplier * (isLuckyDouble ? 2.0 : 1.0) * (1 + (activeBuffs.expansionBonus || 0)) * (1 + (manualMult - 1) * 0.25)
      const finalRewardArr = Math.round(order.rewardArrCents * rewardMultiplier)
      const finalRewardCash = Math.round(order.rewardCashCents * luck.multiplier * (isLuckyDouble ? 2.0 : 1.0) * manualMult)

      const updatedAccounts = state.accounts.map(a => {
        if (a.id === order.accountId) {
          return {
            ...a,
            addonMrrCents: a.addonMrrCents + Math.round(finalRewardArr / 12),
            addonSlotsUsed: Math.min(2, a.addonSlotsUsed + 1),
            health: Math.min(100, a.health + 10),
          }
        }
        return a
      })

      const remainingOrders = orders.filter(o => o.id !== action.orderId)
      const eligibleAccounts = updatedAccounts.filter(a => a.addonSlotsUsed < 2 && !a.delinquent && a.health >= 50)
      const nextExpansionOrders = [...remainingOrders]

      if (eligibleAccounts.length > 0) {
        const chains: Array<'intelligence' | 'infrastructure' | 'security'> = ['intelligence', 'infrastructure', 'security']
        const randomChain = chains[Math.floor(Math.random() * chains.length)]
        const randomTier = Math.min(7, Math.floor(Math.random() * (2 + (state.fleet?.expansion?.scaleRank ?? 0))) + 2) as 1 | 2 | 3 | 4 | 5 | 6 | 7
        const candidateAccount = eligibleAccounts[Math.floor(Math.random() * eligibleAccounts.length)]
        const rewardArr = Math.round(candidateAccount.baseMrrCents * 12 * (0.25 * randomTier))

        const newOrder: ExpansionOrder = {
          id: `ord-${Date.now()}`,
          accountId: candidateAccount.id,
          accountName: candidateAccount.name,
          chain: randomChain,
          targetTier: randomTier,
          rewardArrCents: Math.max(20_000, rewardArr),
          rewardCashCents: Math.round(rewardArr * 0.15),
        }
        nextExpansionOrders.push(newOrder)
      }

      const hasNeuralDistillation = state.activeRelics.some(r => r.id === 'relic-neural-distillation')
      const updatedCapabilities = hasNeuralDistillation ? {
        speed: clamp(state.systemCapabilities.speed * 1.05, 0, 1),
        collaboration: clamp(state.systemCapabilities.collaboration * 1.05, 0, 1),
        control: clamp(state.systemCapabilities.control * 1.05, 0, 1),
      } : state.systemCapabilities

      return {
        ...state,
        cashCents: state.cashCents + finalRewardCash,
        contractualArrCents: state.contractualArrCents + finalRewardArr,
        eligibleArrCents: state.eligibleArrCents + finalRewardArr,
        systemCapabilities: updatedCapabilities,
        accounts: updatedAccounts,
        mergeGrid: nextGrid,
        expansionOrders: nextExpansionOrders,
        expansionEvent: null,
        arrBridge: {
          ...state.arrBridge,
          expansionArrCents: state.arrBridge.expansionArrCents + finalRewardArr,
        },
        alerts: [
          ...state.alerts.filter(al => !al.id.startsWith('exp-event-')),
          {
            id: `order-done-${state.elapsedTicks}`,
            tone: 'info',
            title: isLuckyDouble ? '⚡ Quantum Expansion Delivered (2X Bonus Reward)!' : 'Expansion Contract Closed!',
            message: `Delivered Tier ${order.targetTier} ${order.chain} package to ${order.accountName}. +$${(finalRewardArr / 100).toLocaleString()}/yr ARR!`,
            tick: state.elapsedTicks,
            targetFunction: 'expansion',
            actionLabel: 'View Expansion [5]',
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-order-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'expansion',
            message: `Expanded ${order.accountName} ticket with Tier ${order.targetTier} ${order.chain}. +$${(order.rewardArrCents / 100).toLocaleString()}/yr ARR, +$${(order.rewardCashCents / 100).toLocaleString()} cash.`,
            deltaCashCents: order.rewardCashCents,
            deltaArrCents: order.rewardArrCents,
          },
        ],
      }
    }

    case 'expansion.discard_item': {
      const grid = state.mergeGrid ?? Array(16).fill(null)
      if (action.index < 0 || action.index >= grid.length || !grid[action.index]) return state
      const nextGrid = [...grid]
      nextGrid[action.index] = null
      return {
        ...state,
        mergeGrid: nextGrid,
      }
    }

    case 'operations.scratch_evidence': {
      const newPct = clamp(state.operations.scratchedEvidencePct + action.amount, 0, 1)
      let diagnosed = state.operations.diagnosedRootCause
      if (newPct >= 0.75 && !diagnosed) {
        diagnosed = state.operations.incidentsBacklog > 0
          ? 'Inference Gateway Memory Leak'
          : 'Agent Prompt Drift & Vector Desync'
      }
      return {
        ...state,
        operations: {
          ...state.operations,
          scratchedEvidencePct: newPct,
          diagnosedRootCause: diagnosed,
        },
      }
    }

    case 'operations.diagnose_cause': {
      return {
        ...state,
        operations: {
          ...state.operations,
          diagnosedRootCause: action.cause,
        },
      }
    }

    case 'operations.resolve_incident': {
      if (state.operations.incidentsBacklog <= 0) return state
      return {
        ...state,
        operations: {
          ...state.operations,
          incidentsBacklog: Math.max(0, state.operations.incidentsBacklog - 1),
          scratchedEvidencePct: 0,
          diagnosedRootCause: null,
        },
        alerts: [
          ...state.alerts,
          {
            id: `ops-res-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Incident Resolved',
            message: 'Root cause patched. Service reliability restored.',
            tick: state.elapsedTicks,
            targetFunction: 'operations',
            actionLabel: 'View Operations [6]',
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-ops-res-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'ops',
            message: 'Founder diagnosed and cleared critical infrastructure incident.',
          },
        ],
      }
    }

    case 'operations.clear_strain': {
      if (state.operations.strainBacklog <= 0) return state
      return {
        ...state,
        operations: {
          ...state.operations,
          strainBacklog: Math.max(0, state.operations.strainBacklog - 8),
        },
        alerts: [
          ...state.alerts,
          {
            id: `ops-strain-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Coordination Backlog Drained',
            message: 'Refactored worker handoffs. System latency restored.',
            tick: state.elapsedTicks,
            targetFunction: 'operations',
            actionLabel: 'View Operations [6]',
          },
        ],
      }
    }

    case 'operations.cleanse_rot': {
      return {
        ...state,
        operations: {
          ...state.operations,
          contextRot: Math.max(0, state.operations.contextRot - 0.25),
        },
        alerts: [
          ...state.alerts,
          {
            id: `ops-rot-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Context Rot Cleansed',
            message: 'Purged drifted prompt chains and re-seeded agent instructions.',
            tick: state.elapsedTicks,
            targetFunction: 'operations',
            actionLabel: 'View Operations [6]',
          },
        ],
      }
    }

    case 'operations.play_lucky_cat': {
      const lastTick = state.operations.lastSpeculativeTick ?? -9999
      const ticksSinceLast = state.elapsedTicks - lastTick
      if (ticksSinceLast < SPECULATIVE_OPTIMIZER_COOLDOWN_TICKS) {
        const remainingSec = Math.ceil((SPECULATIVE_OPTIMIZER_COOLDOWN_TICKS - ticksSinceLast) / 10)
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `lucky-cd-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'JIT Compiler Cooling Down',
              message: `Speculative LLVM compiler is optimizing pipeline bytecode. Available in ${remainingSec}s.`,
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      const runs = (state.operations.speculativeRunsCount ?? 0) + 1
      const rng = new DeterministicRNG(state.seed + state.elapsedTicks + runs * 7919)
      const roll = rng.nextFloat()
      const odds = state.operations.luckOptimizerOdds
      const winChance = odds.winChance ?? 0.60
      const rebateCents = odds.rebateCents ?? 20_000 // $200 flat efficiency rebate
      const penaltyCents = odds.penaltyCents ?? 25_000 // $250 flat repair fee

      if (roll <= winChance) {
        // High upside win: strain relief, rot purge, modest flat efficiency rebate
        return {
          ...state,
          cashCents: state.cashCents + rebateCents,
          operations: {
            ...state.operations,
            strainBacklog: Math.max(0, state.operations.strainBacklog - 8),
            contextRot: Math.max(0, state.operations.contextRot - 0.15),
            lastSpeculativeTick: state.elapsedTicks,
            speculativeRunsCount: runs,
          },
          alerts: [
            ...state.alerts,
            {
              id: `lucky-win-${state.elapsedTicks}`,
              tone: 'info',
              title: 'Speculative Compilation Succeeded',
              message: `JIT optimization compiled with 0 defects! Drained 8 strain, purged 15% rot, +$${(rebateCents / 100).toLocaleString()} token rebate.`,
              tick: state.elapsedTicks,
            },
          ],
          ledger: [
            ...state.ledger,
            {
              id: `led-luck-${state.elapsedTicks}`,
              tick: state.elapsedTicks,
              category: 'ops',
              message: `Speculative JIT optimization succeeded. -8 strain, -15% rot, +$${(rebateCents / 100).toLocaleString()} rebate.`,
              deltaCashCents: rebateCents,
            },
          ],
        }
      } else {
        // Explicit downside penalty: strain penalty, uncaught exception (+1 incident), flat repair cost
        return {
          ...state,
          cashCents: Math.max(0, state.cashCents - penaltyCents),
          operations: {
            ...state.operations,
            strainBacklog: state.operations.strainBacklog + 12,
            contextRot: Math.min(1.0, state.operations.contextRot + 0.05),
            incidentsBacklog: state.operations.incidentsBacklog + 1,
            lastSpeculativeTick: state.elapsedTicks,
            speculativeRunsCount: runs,
          },
          alerts: [
            ...state.alerts,
            {
              id: `lucky-loss-${state.elapsedTicks}`,
              tone: 'critical',
              title: 'Speculative Optimization Failed',
              message: `Speculative compilation threw uncaught exceptions! +12 Strain, +1 Incident, -$${(penaltyCents / 100).toLocaleString()} hotfix costs.`,
              tick: state.elapsedTicks,
            },
          ],
          ledger: [
            ...state.ledger,
            {
              id: `led-luck-fail-${state.elapsedTicks}`,
              tick: state.elapsedTicks,
              category: 'ops',
              message: `Speculative compilation crash. +12 strain, +1 incident, -$${(penaltyCents / 100).toLocaleString()} hotfix.`,
              deltaCashCents: -penaltyCents,
            },
          ],
        }
      }
    }

    case 'operations.scratch_pod': {
      const card = state.activeScratchCard
      if (!card || card.claimed || card.isBusted) return state
      const pod = card.pods.find(p => p.id === action.podId)
      if (!pod || pod.isScratched) return state

      const updatedPods = card.pods.map(p => (p.id === action.podId ? { ...p, isScratched: true } : p))

      if (pod.isNegative) {
        // BUSTED by Thermal Fault or Panic!
        const penaltyStrain = pod.rewardType === 'penalty' ? pod.rewardValue : 6
        const penaltyIncident = pod.rewardType === 'incident' ? pod.rewardValue : 0

        return {
          ...state,
          operations: {
            ...state.operations,
            strainBacklog: state.operations.strainBacklog + penaltyStrain,
            incidentsBacklog: state.operations.incidentsBacklog + penaltyIncident,
          },
          activeScratchCard: {
            ...card,
            pods: updatedPods,
            isBusted: true,
            bankedCashCents: 0,
            bankedStrainRelief: 0,
            bankedRotRelief: 0,
            bankedLuckDelta: 0,
          },
          alerts: [
            ...state.alerts,
            {
              id: `scratch-bust-${state.elapsedTicks}`,
              tone: 'critical',
              title: pod.symbol === 'skull' ? 'Circuit Breaker Tripped (Kernel Panic)!' : 'Thermal Fault Overload!',
              message: `Hit an overload trap: +${penaltyStrain} Strain${penaltyIncident ? ' & +1 Incident' : ''}! Banked recovery metrics were lost. Commit telemetry earlier next time!`,
              tick: state.elapsedTicks,
              targetFunction: 'operations',
              actionLabel: 'View Operations [6]',
            },
          ],
        }
      }

      // Positive telemetry sector
      const addedCash = pod.rewardType === 'cash' ? pod.rewardValue : (pod.symbol === 'golden_apple' ? 50_000 : 0)
      const addedStrain = pod.rewardType === 'strain' ? pod.rewardValue : (pod.symbol === 'golden_apple' ? 15 : 0)
      const addedRot = pod.rewardType === 'rot' ? pod.rewardValue : 0
      const addedLuck = pod.symbol === 'golden_apple' ? 10 : 5
      const isGolden = pod.symbol === 'golden_apple'

      const newBankedCash = (card.bankedCashCents ?? 0) + addedCash
      const newBankedStrain = (card.bankedStrainRelief ?? 0) + addedStrain
      const newBankedRot = (card.bankedRotRelief ?? 0) + addedRot
      const newBankedLuck = (card.bankedLuckDelta ?? 0) + addedLuck

      // Synergy: Golden Core in Operations verifies and primes first Product pod for immediate shipping!
      let nextProductPods = state.productPods
      if (isGolden && nextProductPods && nextProductPods.length > 0) {
        nextProductPods = nextProductPods.map((p, idx) => {
          if (idx === 0) {
            const filledSockets = p.sockets.map(s => ({ ...s, filled: true }))
            return { ...p, sockets: filledSockets, isVerified: true, isReadyToShip: true }
          }
          return p
        })
      }

      return {
        ...state,
        productPods: nextProductPods,
        operations: {
          ...state.operations,
          scratchedEvidencePct: Math.min(1, state.operations.scratchedEvidencePct + 0.15),
          diagnosedRootCause: isGolden
            ? 'Inference Gateway Memory Leak'
            : state.operations.diagnosedRootCause,
        },
        activeScratchCard: {
          ...card,
          pods: updatedPods,
          bankedCashCents: newBankedCash,
          bankedStrainRelief: newBankedStrain,
          bankedRotRelief: newBankedRot,
          bankedLuckDelta: newBankedLuck,
        },
        alerts: [
          ...state.alerts,
          {
            id: `scratch-bank-${state.elapsedTicks}-${action.podId}`,
            tone: 'info',
            title: isGolden ? 'TPU Super Core Probed!' : 'Healthy Cluster Sector Probed!',
            message: `${pod.label}. Banked into telemetry patch. Click "Commit Recovery & Cash Out" to apply to infrastructure!`,
            tick: state.elapsedTicks,
            targetFunction: 'operations',
            actionLabel: 'View Operations [6]',
          },
        ],
      }
    }

    case 'operations.cash_out_card': {
      const card = state.activeScratchCard
      if (!card || card.claimed || card.isBusted) return state
      const cash = card.bankedCashCents ?? 0
      const strain = card.bankedStrainRelief ?? 0
      const rot = card.bankedRotRelief ?? 0
      const incidentsCleared = card.pods.filter(p => p.isScratched && p.rewardType === 'incident' && !p.isNegative).length

      const opsCraftRank = state.fleet?.operations?.craftRank ?? 0
      const opsLuckRank = state.fleet?.operations?.luckRank ?? 0
      const craftMultiplier = 1 + 0.25 * opsCraftRank
      const luck = calculateLuckVariance(opsLuckRank)
      const finalCash = Math.round(cash * craftMultiplier * luck.multiplier)
      const finalStrain = Math.round(strain * craftMultiplier * luck.multiplier)
      const finalRot = Math.min(1, rot * craftMultiplier * luck.multiplier)

      return {
        ...state,
        cashCents: state.cashCents + finalCash,
        operations: {
          ...state.operations,
          strainBacklog: Math.max(0, state.operations.strainBacklog - finalStrain),
          contextRot: Math.max(0, state.operations.contextRot - finalRot),
          incidentsBacklog: Math.max(0, state.operations.incidentsBacklog - incidentsCleared),
        },
        operationsEvent: null,
        activeScratchCard: {
          ...card,
          claimed: true,
        },
        alerts: [
          ...state.alerts.filter(al => !al.id.startsWith('ops-event-')),
          {
            id: `cashout-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Cluster Recovery Patch Committed!',
            message: `Banked +$${(finalCash / 100).toLocaleString()} compute rebate${opsCraftRank > 0 ? ` (+${Math.round((craftMultiplier - 1) * 100)}% Craft bonus)` : ''}, drained -${finalStrain} strain, and purged rot!`,
            tick: state.elapsedTicks,
            targetFunction: 'operations',
            actionLabel: 'View Operations [6]',
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-co-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'ops',
            message: `Committed node recovery patch: +$${(finalCash / 100).toLocaleString()}, -${finalStrain} strain.`,
            deltaCashCents: finalCash,
          },
        ],
      }
    }

    case 'operations.claim_card': {
      const card = state.activeScratchCard
      if (!card) return state
      return {
        ...state,
        activeScratchCard: { ...card, claimed: true },
      }
    }

    case 'operations.new_card': {
      const luckRank = state.fleet?.operations?.luckRank ?? 0
      return {
        ...state,
        activeScratchCard: createDefaultScratchCard(action.cardType ?? 'apple_tree', luckRank),
      }
    }

    case 'operations.reject_ticket': {
      const luckRank = state.fleet?.operations?.luckRank ?? 0
      const scaleRank = state.fleet?.operations?.scaleRank ?? 0
      const maxRacks = OPERATIONS_RACK_LIMITS[scaleRank] || 1
      let tickets = state.activeTickets ? [...state.activeTickets] : [createDiagnosticTicket(0, luckRank)]
      while (tickets.length < maxRacks) {
        tickets.push(createDiagnosticTicket(tickets.length, luckRank))
      }
      const ticketIndex = action.stationIndex ?? action.ticketIndex ?? 0
      const ticket = tickets[ticketIndex]
      if (!ticket) return state

      const freshTicket = createDiagnosticTicket(ticketIndex, luckRank)
      tickets[ticketIndex] = freshTicket

      return {
        ...state,
        activeTickets: tickets,
        activeScratchCard: ticketIndex === 0 ? freshTicket : (state.activeScratchCard ?? freshTicket),
        alerts: [
          ...state.alerts,
          {
            id: `ticket-reject-${state.elapsedTicks}-${ticketIndex}`,
            tone: 'info',
            title: `Rack 0${ticketIndex + 1} Ticket Rejected`,
            message: 'Hazard telemetry safely discarded before activation. Fresh diagnostic ticket queued.',
            tick: state.elapsedTicks,
            targetFunction: 'operations',
            actionLabel: 'View Operations [6]',
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-reject-${state.elapsedTicks}-${ticketIndex}`,
            tick: state.elapsedTicks,
            category: 'ops',
            message: `Founder rejected Rack 0${ticketIndex + 1} ticket before redemption. Zero penalty incurred.`,
          },
        ],
      }
    }

    case 'operations.scratch_ticket': {
      const luckRank = state.fleet?.operations?.luckRank ?? 0
      const scaleRank = state.fleet?.operations?.scaleRank ?? 0
      const maxRacks = OPERATIONS_RACK_LIMITS[scaleRank] || 1
      let tickets = state.activeTickets ? [...state.activeTickets] : [createDiagnosticTicket(0, luckRank)]
      while (tickets.length < maxRacks) {
        tickets.push(createDiagnosticTicket(tickets.length, luckRank))
      }
      const ticketIndex = action.stationIndex ?? action.ticketIndex ?? 0
      const ticket = tickets[ticketIndex]
      if (!ticket || ticket.claimed || ticket.isBusted) return state

      const targetPodIndex = action.podIndex !== undefined
        ? action.podIndex
        : ticket.pods.findIndex(p => !p.isScratched)

      if (targetPodIndex === -1 || targetPodIndex >= ticket.pods.length) return state
      const pod = ticket.pods[targetPodIndex]
      if (pod.isScratched) return state

      const updatedPods = ticket.pods.map((p, idx) => (idx === targetPodIndex ? { ...p, isScratched: true } : p))

      if (pod.isNegative) {
        // BUSTED by Thermal Fault, Memory Leak, or Kernel Panic!
        const penaltyStrain = pod.rewardType === 'penalty' ? (pod.rewardValue as number) : (pod.rewardType === 'strain' ? (pod.rewardValue as number) : 6)
        const penaltyRot = pod.rewardType === 'rot' ? (pod.rewardValue as number) : 0
        const penaltyIncident = pod.rewardType === 'incident' ? (pod.rewardValue as number) : 0

        const updatedTicket: ScratchCard = {
          ...ticket,
          pods: updatedPods,
          isBusted: true,
          bankedCashCents: 0,
          bankedStrainRelief: 0,
          bankedRotRelief: 0,
          bankedLuckDelta: 0,
        }
        tickets[ticketIndex] = updatedTicket

        return {
          ...state,
          operations: {
            ...state.operations,
            strainBacklog: state.operations.strainBacklog + penaltyStrain,
            contextRot: Math.min(1.0, state.operations.contextRot + penaltyRot),
            incidentsBacklog: state.operations.incidentsBacklog + penaltyIncident,
          },
          activeTickets: tickets,
          activeScratchCard: ticketIndex === 0 ? updatedTicket : (state.activeScratchCard ?? updatedTicket),
          alerts: [
            ...state.alerts,
            {
              id: `ticket-bust-${state.elapsedTicks}-${ticketIndex}`,
              tone: 'critical',
              title: pod.symbol === 'skull'
                ? 'Memory Leak Fault Tripped!'
                : pod.symbol === 'panic'
                ? 'Kernel Panic Overload Tripped!'
                : 'Thermal Fault Overload!',
              message: `Rack 0${ticketIndex + 1} tripped a fault: +${penaltyStrain} Strain${penaltyRot ? ` & +${Math.round(penaltyRot * 100)}% Rot` : ''}${penaltyIncident ? ' & +1 Incident' : ''}! Reject negative tickets before opening to avoid cluster faults.`,
              tick: state.elapsedTicks,
              targetFunction: 'operations',
              actionLabel: 'View Operations [6]',
            },
          ],
          ledger: [
            ...state.ledger,
            {
              id: `led-bust-${state.elapsedTicks}-${ticketIndex}`,
              tick: state.elapsedTicks,
              category: 'ops',
              message: `Rack 0${ticketIndex + 1} overload fault: +${penaltyStrain} strain${penaltyIncident ? ', +1 incident' : ''}.`,
            },
          ],
        }
      }

      // Positive telemetry sector
      const activeBuffs = getActiveBuffs(state)
      const manualMult = activeBuffs.manualActionMultiplier || 1
      const addedCash = Math.round((pod.rewardType === 'cash' ? (pod.rewardValue as number) : (pod.symbol === 'golden_apple' ? 50_000 : 0)) * manualMult)
      const addedStrain = Math.round((pod.rewardType === 'strain' ? (pod.rewardValue as number) : (pod.symbol === 'golden_apple' ? 15 : 0)) * manualMult)
      const addedRot = Number(((pod.rewardType === 'rot' ? (pod.rewardValue as number) : 0) * manualMult).toFixed(2))
      const addedLuck = pod.symbol === 'golden_apple' ? 10 : 5
      const isGolden = pod.symbol === 'golden_apple'

      const newBankedCash = (ticket.bankedCashCents ?? 0) + addedCash
      const newBankedStrain = (ticket.bankedStrainRelief ?? 0) + addedStrain
      const newBankedRot = (ticket.bankedRotRelief ?? 0) + addedRot
      const newBankedLuck = (ticket.bankedLuckDelta ?? 0) + addedLuck

      let nextProductPods = state.productPods
      if (isGolden && nextProductPods && nextProductPods.length > 0) {
        nextProductPods = nextProductPods.map((p, idx) => {
          if (idx === 0) {
            const filledSockets = p.sockets.map(s => ({ ...s, filled: true }))
            return { ...p, sockets: filledSockets, isVerified: true, isReadyToShip: true }
          }
          return p
        })
      }

      const updatedTicket: ScratchCard = {
        ...ticket,
        pods: updatedPods,
        bankedCashCents: newBankedCash,
        bankedStrainRelief: newBankedStrain,
        bankedRotRelief: newBankedRot,
        bankedLuckDelta: newBankedLuck,
      }
      tickets[ticketIndex] = updatedTicket

      return {
        ...state,
        productPods: nextProductPods,
        operations: {
          ...state.operations,
          scratchedEvidencePct: Math.min(1, state.operations.scratchedEvidencePct + 0.15),
          diagnosedRootCause: isGolden ? 'Inference Gateway Memory Leak' : state.operations.diagnosedRootCause,
        },
        activeTickets: tickets,
        activeScratchCard: ticketIndex === 0 ? updatedTicket : (state.activeScratchCard ?? updatedTicket),
        alerts: [
          ...state.alerts,
          {
            id: `ticket-scratched-${state.elapsedTicks}-${ticketIndex}`,
            tone: 'info',
            title: isGolden ? 'TPU Supercore Probed!' : 'Diagnostic Sector Probed!',
            message: `${pod.label}. Commit or claim to apply recovery telemetry to your cluster!`,
            tick: state.elapsedTicks,
            targetFunction: 'operations',
            actionLabel: 'View Operations [6]',
          },
        ],
      }
    }

    case 'operations.redeem_ticket':
    case 'operations.claim_ticket': {
      const luckRank = state.fleet?.operations?.luckRank ?? 0
      const scaleRank = state.fleet?.operations?.scaleRank ?? 0
      const maxRacks = OPERATIONS_RACK_LIMITS[scaleRank] || 1
      let tickets = state.activeTickets ? [...state.activeTickets] : [createDiagnosticTicket(0, luckRank)]
      while (tickets.length < maxRacks) {
        tickets.push(createDiagnosticTicket(tickets.length, luckRank))
      }
      const ticketIndex = action.stationIndex ?? action.ticketIndex ?? 0
      const ticket = tickets[ticketIndex]
      if (!ticket) return state

      const freshTicket = createDiagnosticTicket(ticketIndex, luckRank)

      // If ticket was busted, just issue fresh ticket to clear fault
      if (ticket.isBusted) {
        tickets[ticketIndex] = freshTicket
        return {
          ...state,
          activeTickets: tickets,
          activeScratchCard: ticketIndex === 0 ? freshTicket : (state.activeScratchCard ?? freshTicket),
        }
      }

      // If ticket has not been scratched yet, redeem outcome directly
      const outcome = ticket.pods[0]
      if (outcome && !outcome.isScratched) {
        outcome.isScratched = true
        if (outcome.isNegative) {
          // Fault tripped on direct redemption
          const penaltyStrain = outcome.rewardType === 'penalty' ? (outcome.rewardValue as number) : (outcome.rewardType === 'strain' ? (outcome.rewardValue as number) : 6)
          const penaltyRot = outcome.rewardType === 'rot' ? (outcome.rewardValue as number) : 0
          const penaltyIncident = outcome.rewardType === 'incident' ? (outcome.rewardValue as number) : 0

          tickets[ticketIndex] = {
            ...ticket,
            pods: [outcome],
            isBusted: true,
          }
          return {
            ...state,
            operations: {
              ...state.operations,
              strainBacklog: state.operations.strainBacklog + penaltyStrain,
              contextRot: Math.min(1.0, state.operations.contextRot + penaltyRot),
              incidentsBacklog: state.operations.incidentsBacklog + penaltyIncident,
            },
            activeTickets: tickets,
            activeScratchCard: ticketIndex === 0 ? tickets[ticketIndex] : (state.activeScratchCard ?? tickets[ticketIndex]),
            alerts: [
              ...state.alerts,
              {
                id: `ticket-bust-${state.elapsedTicks}-${ticketIndex}`,
                tone: 'critical',
                title: outcome.symbol === 'skull'
                  ? 'Memory Leak Fault Tripped!'
                  : outcome.symbol === 'panic'
                  ? 'Kernel Panic Overload Tripped!'
                  : 'Thermal Fault Overload!',
                message: `Rack 0${ticketIndex + 1} tripped a fault: +${penaltyStrain} Strain${penaltyRot ? ` & +${Math.round(penaltyRot * 100)}% Rot` : ''}${penaltyIncident ? ' & +1 Incident' : ''}!`,
                tick: state.elapsedTicks,
                targetFunction: 'operations',
                actionLabel: 'View Operations [6]',
              },
            ],
          }
        } else {
          // Positive outcome directly redeemed
          const addedCash = outcome.rewardType === 'cash' ? (outcome.rewardValue as number) : (outcome.symbol === 'golden_apple' ? 50_000 : 0)
          const addedStrain = outcome.rewardType === 'strain' ? (outcome.rewardValue as number) : (outcome.symbol === 'golden_apple' ? 15 : 0)
          const addedRot = outcome.rewardType === 'rot' ? (outcome.rewardValue as number) : 0
          ticket.bankedCashCents = addedCash
          ticket.bankedStrainRelief = addedStrain
          ticket.bankedRotRelief = addedRot
        }
      }

      const cash = ticket.bankedCashCents ?? 0
      const strain = ticket.bankedStrainRelief ?? 0
      const rot = ticket.bankedRotRelief ?? 0
      const incidentsCleared = ticket.pods.filter(p => p.isScratched && p.rewardType === 'incident' && !p.isNegative).length

      const opsCraftRank = state.fleet?.operations?.craftRank ?? 0
      const craftMultiplier = 1 + 0.25 * opsCraftRank
      const luck = calculateLuckVariance(luckRank)
      const finalCash = Math.round(cash * craftMultiplier * luck.multiplier)
      const finalStrain = Math.round(strain * craftMultiplier * luck.multiplier)
      const finalRot = Math.min(1, rot * craftMultiplier * luck.multiplier)

      tickets[ticketIndex] = freshTicket

      return {
        ...state,
        cashCents: state.cashCents + finalCash,
        operations: {
          ...state.operations,
          strainBacklog: Math.max(0, state.operations.strainBacklog - finalStrain),
          contextRot: Math.max(0, state.operations.contextRot - finalRot),
          incidentsBacklog: Math.max(0, state.operations.incidentsBacklog - incidentsCleared),
        },
        activeTickets: tickets,
        activeScratchCard: ticketIndex === 0 ? freshTicket : (state.activeScratchCard ?? freshTicket),
        alerts: [
          ...state.alerts,
          {
            id: `claim-ticket-${state.elapsedTicks}-${ticketIndex}`,
            tone: 'info',
            title: `Rack 0${ticketIndex + 1} Telemetry Banked!`,
            message: `Banked +$${(finalCash / 100).toLocaleString()} compute rebate, drained -${finalStrain} strain, and purged rot! Next ticket drawn.`,
            tick: state.elapsedTicks,
            targetFunction: 'operations',
            actionLabel: 'View Operations [6]',
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-claim-${state.elapsedTicks}-${ticketIndex}`,
            tick: state.elapsedTicks,
            category: 'ops',
            message: `Banked Rack 0${ticketIndex + 1} recovery ticket: +$${(finalCash / 100).toLocaleString()}, -${finalStrain} strain.`,
            deltaCashCents: finalCash,
          },
        ],
      }
    }

    case 'operations.batch_scratch_all': {
      const luckRank = state.fleet?.operations?.luckRank ?? 0
      const scaleRank = state.fleet?.operations?.scaleRank ?? 0
      const maxRacks = OPERATIONS_RACK_LIMITS[scaleRank] || 1
      let tickets = state.activeTickets ? [...state.activeTickets] : [createDiagnosticTicket(0, luckRank)]
      while (tickets.length < maxRacks) {
        tickets.push(createDiagnosticTicket(tickets.length, luckRank))
      }
      const opsCraftRank = state.fleet?.operations?.craftRank ?? 0
      const craftMultiplier = 1 + 0.25 * opsCraftRank
      const luck = calculateLuckVariance(luckRank)

      let totalCash = 0
      let totalStrainRelief = 0
      let totalRotRelief = 0
      let totalIncidentsCleared = 0
      let addedPenaltyStrain = 0
      let addedPenaltyRot = 0
      let addedPenaltyIncidents = 0

      const nextTickets = tickets.map((t, idx) => {
        if (t.isBusted) {
          return createDiagnosticTicket(idx, luckRank)
        }
        let ticketBusted = false
        let bankedCash = t.bankedCashCents ?? 0
        let bankedStrain = t.bankedStrainRelief ?? 0
        let bankedRot = t.bankedRotRelief ?? 0
        let incidentsInTicket = 0

        for (const pod of t.pods) {
          if (pod.isNegative) {
            ticketBusted = true
            const penaltyStrain = pod.rewardType === 'penalty' ? (pod.rewardValue as number) : (pod.rewardType === 'strain' ? (pod.rewardValue as number) : 6)
            const penaltyRot = pod.rewardType === 'rot' ? (pod.rewardValue as number) : 0
            const penaltyIncident = pod.rewardType === 'incident' ? (pod.rewardValue as number) : 0
            addedPenaltyStrain += penaltyStrain
            addedPenaltyRot += penaltyRot
            addedPenaltyIncidents += penaltyIncident
            break
          } else {
            bankedCash += pod.rewardType === 'cash' ? (pod.rewardValue as number) : (pod.symbol === 'golden_apple' ? 50_000 : 0)
            bankedStrain += pod.rewardType === 'strain' ? (pod.rewardValue as number) : (pod.symbol === 'golden_apple' ? 15 : 0)
            bankedRot += pod.rewardType === 'rot' ? (pod.rewardValue as number) : 0
            if (pod.rewardType === 'incident') incidentsInTicket++
          }
        }

        if (ticketBusted) {
          return {
            ...t,
            isBusted: true,
            pods: t.pods.map(p => ({ ...p, isScratched: true })),
            bankedCashCents: 0,
            bankedStrainRelief: 0,
            bankedRotRelief: 0,
          }
        }

        totalCash += Math.round(bankedCash * craftMultiplier * luck.multiplier)
        totalStrainRelief += Math.round(bankedStrain * craftMultiplier * luck.multiplier)
        totalRotRelief += Math.min(1, bankedRot * craftMultiplier * luck.multiplier)
        totalIncidentsCleared += incidentsInTicket

        return createDiagnosticTicket(idx, luckRank)
      })

      return {
        ...state,
        cashCents: state.cashCents + totalCash,
        operations: {
          ...state.operations,
          strainBacklog: Math.max(0, state.operations.strainBacklog - totalStrainRelief + addedPenaltyStrain),
          contextRot: clamp(state.operations.contextRot - totalRotRelief + addedPenaltyRot, 0, 1),
          incidentsBacklog: Math.max(0, state.operations.incidentsBacklog - totalIncidentsCleared + addedPenaltyIncidents),
        },
        activeTickets: nextTickets,
        activeScratchCard: nextTickets[0],
        alerts: [
          ...state.alerts,
          {
            id: `batch-ops-${state.elapsedTicks}`,
            tone: addedPenaltyStrain > 0 ? 'warning' : 'info',
            title: 'Batch Telemetry Scratched & Claimed!',
            message: `Processed ${tickets.length} diagnostic racks: +$${(totalCash / 100).toLocaleString()} cash, -${totalStrainRelief} strain${addedPenaltyStrain > 0 ? ` (${addedPenaltyStrain} penalty strain incurred)` : ''}.`,
            tick: state.elapsedTicks,
            targetFunction: 'operations',
            actionLabel: 'View Operations [6]',
          },
        ],
      }
    }

    case 'fleet.buy_upgrade': {
      const currentFleet = state.fleet[action.functionId]
      const currentRank = currentFleet[`${action.axis}Rank`]
      if (currentRank >= 5) return state

      const hasSyndicate = state.activeRelics.some(r => r.id === 'relic-syndicate')
      const cost = getUpgradeRankCost(currentRank, hasSyndicate)
      if (state.cashCents < cost) {
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `upg-cash-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Insufficient Capital',
              message: `Upgrading ${action.functionId} ${action.axis} to Rank ${currentRank + 1} requires $${(cost / 100).toLocaleString()}.${hasSyndicate ? ' (35% Syndicate Discount Applied)' : ''}`,
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      const updatedFleet = {
        ...state.fleet,
        [action.functionId]: {
          ...currentFleet,
          [`${action.axis}Rank`]: currentRank + 1,
        },
      }

      let updatedGrid = state.mergeGrid
      let updatedTickets = state.activeTickets
      let updatedDesks = state.activeDealDesks

      if (action.axis === 'scale') {
        if (action.functionId === 'expansion') {
          const newGridSize = EXPANSION_GRID_SIZES[currentRank + 1] || 16
          updatedGrid = state.mergeGrid ? [...state.mergeGrid] : Array(newGridSize).fill(null)
          while (updatedGrid.length < newGridSize) {
            updatedGrid.push(null)
          }
        } else if (action.functionId === 'operations') {
          const newRacks = OPERATIONS_RACK_LIMITS[currentRank + 1] || 1
          const opsLuck = state.fleet?.operations?.luckRank ?? 0
          updatedTickets = state.activeTickets ? [...state.activeTickets] : [createDiagnosticTicket(0, opsLuck)]
          while (updatedTickets.length < newRacks) {
            updatedTickets.push(createDiagnosticTicket(updatedTickets.length, opsLuck))
          }
        } else if (action.functionId === 'monetisation') {
          const newDesks = MONETISATION_DESK_LIMITS[currentRank + 1] || 1
          updatedDesks = state.activeDealDesks ? [...state.activeDealDesks] : [
            { id: 'desk-0', deskIndex: 0, activation: null, postedPriceMonthlyCents: 4_000, status: 'idle' }
          ]
          while (updatedDesks.length < newDesks) {
            const idx = updatedDesks.length
            updatedDesks.push({
              id: `desk-${idx}`,
              deskIndex: idx,
              activation: null,
              postedPriceMonthlyCents: 4_000,
              status: 'idle',
            })
          }
        }
      }

      return {
        ...state,
        cashCents: state.cashCents - cost,
        fleet: updatedFleet,
        mergeGrid: updatedGrid,
        activeTickets: updatedTickets,
        activeDealDesks: updatedDesks,
        activeScratchCard: updatedTickets?.[0] ?? state.activeScratchCard,
        alerts: [
          ...state.alerts,
          {
            id: `upg-succ-${state.elapsedTicks}`,
            tone: 'info',
            title: `${action.functionId.toUpperCase()} Upgraded`,
            message: `${action.axis.toUpperCase()} advanced to Rank ${currentRank + 1}.`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-upg-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'finance',
            message: `Deployed Rank ${currentRank + 1} ${action.axis.toUpperCase()} upgrade in ${action.functionId}.`,
            deltaCashCents: -cost,
          },
        ],
      }
    }

    case 'fleet.set_online_units': {
      const currentFleet = state.fleet[action.functionId]
      const hasHoldingSwarm = state.activeRelics.some(r => r.id === 'relic-holding-swarm')
      const maxUnits = SCALE_UNITS[currentFleet.scaleRank] * (hasHoldingSwarm ? 2 : 1)
      const targetUnits = clamp(action.units, 0, maxUnits)

      return {
        ...state,
        fleet: {
          ...state.fleet,
          [action.functionId]: {
            ...currentFleet,
            onlineUnits: targetUnits,
          },
        },
      }
    }

    case 'finance.draw_debt': {
      if (state.eligibleArrCents < DEBT_MIN_MRR_CENTS * 12) {
        return {
          ...state,
          alerts: [
            ...state.alerts,
            {
              id: `debt-ineligible-${state.elapsedTicks}`,
              tone: 'warning',
              title: 'Credit Facility Ineligible',
              message: `Requires at least $${((DEBT_MIN_MRR_CENTS * 12) / 100).toLocaleString()}/yr eligible ARR ($100/mo MRR) to draw debt facility.`,
              tick: state.elapsedTicks,
            },
          ],
        }
      }

      const eligibleMrr = Math.floor(state.eligibleArrCents / 12)
      const maxBorrow = Math.max(0, DEBT_CAPACITY_MRR_MULTIPLE * eligibleMrr - state.debt.principalCents)
      const amount = Math.min(action.amountCents, maxBorrow)
      if (amount <= 0) return state

      const newPrincipal = state.debt.principalCents + amount
      const monthlyInterest = Math.floor((newPrincipal * 1800) / 120000)
      const monthlyPrincipal = Math.ceil(newPrincipal / DEBT_DEFAULT_TERM_MONTHS)
      const monthlyPmt = monthlyInterest + monthlyPrincipal

      const tempState: GameState = {
        ...state,
        cashCents: state.cashCents + amount,
        debt: {
          ...state.debt,
          active: true,
          principalCents: newPrincipal,
          monthsRemaining: DEBT_DEFAULT_TERM_MONTHS,
          monthlyPaymentCents: monthlyPmt,
          nextPaymentDueTick: state.elapsedTicks + TICKS_PER_MONTH,
          totalBorrowedCents: state.debt.totalBorrowedCents + amount,
        },
      }
      const economicBurn = calculateEconomicBurn(tempState)
      const cashForecast = calculateCashForecast(tempState)
      const capQuality = calculateCapitalQualityFactor(economicBurn.burnRatio, cashForecast.shortfallFraction)
      const gMultiple = calculateGrowthMultiple(state.arrBridge.openingArrCents, state.contractualArrCents, state.elapsedTicks)
      const val = calculateValuationCents(state.eligibleArrCents, gMultiple, capQuality)

      return {
        ...tempState,
        capitalQualityFactor: capQuality,
        shortfallFraction: cashForecast.shortfallFraction,
        burnRatio: economicBurn.burnRatio,
        cogsMonthCents: economicBurn.cogsMonthCents,
        opexMonthCents: economicBurn.opexMonthCents,
        interestMonthCents: economicBurn.interestMonthCents,
        earnedRevenueMonthCents: economicBurn.earnedRevenueMonthCents,
        forecastObligationsCents: cashForecast.forecastObligationsCents,
        forecastExpectedCollectionsCents: cashForecast.forecastExpectedCollectionsCents,
        peakNegativeCashCents: cashForecast.peakNegativeCashCents,
        valuationCents: val,
        alerts: [
          ...state.alerts,
          {
            id: `debt-draw-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Credit Facility Drawn',
            message: `+$${(amount / 100).toLocaleString()} deposited into company accounts. Monthly payment: $${(monthlyPmt / 100).toLocaleString()}.`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-debt-draw-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'finance',
            message: `Drew $${(amount / 100).toLocaleString()} debt from facility. Principal: $${(newPrincipal / 100).toLocaleString()}.`,
            deltaCashCents: amount,
          },
        ],
      }
    }

    case 'finance.repay_debt': {
      const amount = Math.min(action.amountCents, state.cashCents, state.debt.principalCents)
      if (amount <= 0) return state

      const remaining = state.debt.principalCents - amount
      const tempState: GameState = {
        ...state,
        cashCents: state.cashCents - amount,
        debt: {
          ...state.debt,
          active: remaining > 0,
          principalCents: remaining,
          monthsRemaining: remaining > 0 ? state.debt.monthsRemaining : 0,
          monthlyPaymentCents: remaining > 0 ? Math.ceil(remaining / Math.max(1, state.debt.monthsRemaining)) + Math.floor((remaining * 1800) / 120000) : 0,
          totalRepaidCents: state.debt.totalRepaidCents + amount,
        },
      }
      const economicBurn = calculateEconomicBurn(tempState)
      const cashForecast = calculateCashForecast(tempState)
      const capQuality = calculateCapitalQualityFactor(economicBurn.burnRatio, cashForecast.shortfallFraction)
      const gMultiple = calculateGrowthMultiple(state.arrBridge.openingArrCents, state.contractualArrCents, state.elapsedTicks)
      const val = calculateValuationCents(state.eligibleArrCents, gMultiple, capQuality)

      return {
        ...tempState,
        capitalQualityFactor: capQuality,
        shortfallFraction: cashForecast.shortfallFraction,
        burnRatio: economicBurn.burnRatio,
        cogsMonthCents: economicBurn.cogsMonthCents,
        opexMonthCents: economicBurn.opexMonthCents,
        interestMonthCents: economicBurn.interestMonthCents,
        earnedRevenueMonthCents: economicBurn.earnedRevenueMonthCents,
        forecastObligationsCents: cashForecast.forecastObligationsCents,
        forecastExpectedCollectionsCents: cashForecast.forecastExpectedCollectionsCents,
        peakNegativeCashCents: cashForecast.peakNegativeCashCents,
        valuationCents: val,
        ledger: [
          ...state.ledger,
          {
            id: `led-debt-repay-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'finance',
            message: `Repaid $${(amount / 100).toLocaleString()} debt principal early.`,
            deltaCashCents: -amount,
          },
        ],
      }
    }

    case 'finance.accept_vc_mandate': {
      if (state.vc.accepted || state.eligibleArrCents < VC_MIN_ARR_CENTS) return state // $12k ARR min

      const hasPreIpo = state.activeRelics.some(r => r.id === 'relic-pre-ipo-distortion')
      const hasVotingProxy = state.founderHistory?.equippedFounderRelicId === 'founder_voting_proxy'
      const vcMultiple = (hasPreIpo ? 8 : VC_PRE_MONEY_ARR_MULTIPLE) * (hasVotingProxy ? 1.35 : 1.0)
      const preMoney = Math.round(state.eligibleArrCents * vcMultiple)
      const raise = Math.round(preMoney * VC_MAX_RAISE_FRACTION)
      const postMoney = preMoney + raise
      const rawDilution = 1 - (preMoney / postMoney)
      const shieldedDilution = rawDilution * (hasVotingProxy ? 0.30 : 1.0)
      const newOwnership = state.vc.founderOwnershipRatio * (1 - shieldedDilution)
      const targetArr = Math.round(state.eligibleArrCents * (1 + VC_GROWTH_TARGET_RATIO)) // +50% growth required

      return {
        ...state,
        cashCents: state.cashCents + raise,
        vc: {
          accepted: true,
          mandateIntervalTicks: TICKS_PER_QUARTER,
          nextDeadlineTick: state.elapsedTicks + TICKS_PER_QUARTER,
          requiredGrowthRatio: VC_GROWTH_TARGET_RATIO,
          baselineArrCents: state.eligibleArrCents,
          founderOwnershipRatio: newOwnership,
          totalCapitalRaisedCents: state.vc.totalCapitalRaisedCents + raise,
        },
        alerts: [
          ...state.alerts,
          {
            id: `vc-term-${state.elapsedTicks}`,
            tone: 'critical',
            title: 'VC Term Sheet Executed',
            message: `Raised $${(raise / 100).toLocaleString()} for ${Math.round((1 - newOwnership) * 100)}% equity. MANDATE: Must reach $${(targetArr / 100).toLocaleString()}/yr ARR by next quarter!`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-vc-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'finance',
            message: `Accepted Series A VC mandate. Injected $${(raise / 100).toLocaleString()} cash. Growth target: +50%.`,
            deltaCashCents: raise,
          },
        ],
      }
    }

    case 'quarter.close_review':
      return {
        ...state,
        quarterReviewPending: false,
        paused: false,
        quarterReviewRerolls: 0,
      }

    case 'archetype.select': {
      const archetype = ENGINE_ARCHETYPES[action.archetypeId]
      if (!archetype) return state
      return {
        ...state,
        activeArchetype: action.archetypeId,
        alerts: [
          ...state.alerts,
          {
            id: `archetype-select-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Active Engine Archetype Set',
            message: `${archetype.name}: ${archetype.buffsSummary}`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-archetype-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'founder',
            message: `Engine Archetype: ${archetype.name}`,
            deltaCashCents: 0,
          },
        ],
      }
    }

    case 'relic.select': {
      const relic = state.availableQuarterRelics.find(r => r.id === action.relicId)
      if (!relic) return state
      const cost = relic.costCents ?? RELIC_PRICING[relic.rarity] ?? 0
      if (state.cashCents < cost) return state

      const remainingAvailable = state.availableQuarterRelics.filter(r => r.id !== action.relicId)
      const remainingLocked = (state.lockedQuarterRelicIds || []).filter(id => id !== action.relicId)

      let nextCaps = state.systemCapabilities
      if (relic.id === 'relic-dark-fiber') {
        nextCaps = {
          ...nextCaps,
          speed: Math.min(1.0, nextCaps.speed + 0.40),
        }
      }

      return {
        ...state,
        cashCents: state.cashCents - cost,
        activeRelics: [...state.activeRelics, relic],
        availableQuarterRelics: remainingAvailable,
        lockedQuarterRelicIds: remainingLocked,
        systemCapabilities: nextCaps,
        alerts: [
          ...state.alerts,
          {
            id: `relic-pick-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Relic Acquired',
            message: `${relic.name}: ${relic.effectSummary}`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-relic-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'quarter',
            message: `Equipped Relic: ${relic.name} (-$${Math.round(cost / 100).toLocaleString()}).`,
            deltaCashCents: -cost,
          },
        ],
      }
    }

    case 'relic.lock': {
      const currentLocked = state.lockedQuarterRelicIds || []
      const isLocked = currentLocked.includes(action.relicId)
      const nextLocked = isLocked
        ? currentLocked.filter(id => id !== action.relicId)
        : [...currentLocked, action.relicId]
      return {
        ...state,
        lockedQuarterRelicIds: nextLocked,
      }
    }

    case 'consumable.select': {
      const item = (state.availableQuarterConsumables || []).find(c => c.id === action.consumableId) || CONSUMABLE_CATALOG.find(c => c.id === action.consumableId)
      if (!item) return state
      const currentInv = state.consumablesInventory || []
      if (currentInv.length >= MAX_CONSUMABLE_SLOTS) return state
      const cost = item.costCents ?? CONSUMABLE_PRICING[item.rarity] ?? 0
      if (state.cashCents < cost) return state

      const remainingAvailable = (state.availableQuarterConsumables || []).filter(c => c.id !== action.consumableId)
      const remainingLocked = (state.lockedQuarterConsumableIds || []).filter(id => id !== action.consumableId)

      return {
        ...state,
        cashCents: state.cashCents - cost,
        consumablesInventory: [...currentInv, item],
        availableQuarterConsumables: remainingAvailable,
        lockedQuarterConsumableIds: remainingLocked,
        alerts: [
          ...state.alerts,
          {
            id: `cons-pick-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Tactical Founder Power Acquired',
            message: `${item.name}: ${item.effectSummary}`,
            tick: state.elapsedTicks,
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-cons-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'quarter',
            message: `Acquired Consumable: ${item.name} (-$${Math.round(cost / 100).toLocaleString()}).`,
            deltaCashCents: -cost,
          },
        ],
      }
    }

    case 'consumable.lock': {
      const currentLocked = state.lockedQuarterConsumableIds || []
      const isLocked = currentLocked.includes(action.consumableId)
      const nextLocked = isLocked
        ? currentLocked.filter(id => id !== action.consumableId)
        : [...currentLocked, action.consumableId]
      return {
        ...state,
        lockedQuarterConsumableIds: nextLocked,
      }
    }

    case 'quarter.reroll': {
      const rerollCost = QUARTER_REROLL_BASE_COST_CENTS * Math.max(1, Math.floor(state.quarter / 2))
      if (state.cashCents < rerollCost) return state

      const rerollCount = (state.quarterReviewRerolls || 0) + 1
      const rng = new DeterministicRNG(state.seed + state.elapsedTicks * 37 + rerollCount * 997)
      const lockedRelicIds = new Set(state.lockedQuarterRelicIds || [])
      const keptRelics = state.availableQuarterRelics.filter(r => lockedRelicIds.has(r.id))
      const unownedRelics = RELIC_CATALOG.filter(r =>
        !state.activeRelics.some(ar => ar.id === r.id) &&
        !keptRelics.some(kr => kr.id === r.id)
      )
      const shuffledRelics = [...unownedRelics].sort(() => rng.nextFloat() - 0.5)
      const neededRelics = Math.max(0, 3 - keptRelics.length)
      const nextRelics = [...keptRelics, ...shuffledRelics.slice(0, neededRelics)]

      const lockedConsIds = new Set(state.lockedQuarterConsumableIds || [])
      const keptConsumables = (state.availableQuarterConsumables || []).filter(c => lockedConsIds.has(c.id))
      const currentConsInvIds = (state.consumablesInventory || []).map(c => c.id)
      const unownedConsumables = CONSUMABLE_CATALOG.filter(c =>
        !currentConsInvIds.includes(c.id) &&
        !keptConsumables.some(kc => kc.id === c.id)
      )
      const shuffledConsumables = [...unownedConsumables].sort(() => rng.nextFloat() - 0.5)
      const neededConsumables = Math.max(0, 2 - keptConsumables.length)
      const nextConsumables = [...keptConsumables, ...shuffledConsumables.slice(0, neededConsumables)]

      return {
        ...state,
        cashCents: state.cashCents - rerollCost,
        availableQuarterRelics: nextRelics,
        availableQuarterConsumables: nextConsumables,
        quarterReviewRerolls: rerollCount,
        ledger: [
          ...state.ledger,
          {
            id: `led-reroll-${state.elapsedTicks}-${rerollCount}`,
            tick: state.elapsedTicks,
            category: 'quarter',
            message: `Board Review Offers Re-rolled (-$${Math.round(rerollCost / 100).toLocaleString()}).`,
            deltaCashCents: -rerollCost,
          },
        ],
      }
    }

    case 'consumable.use': {
      const currentInv = state.consumablesInventory || []
      const idx = currentInv.findIndex(c => c.id === action.consumableId)
      if (idx === -1) return state
      const consumable = currentInv[idx]
      const updatedInv = currentInv.filter((_, i) => i !== idx)
      let nextState: GameState = { ...state, consumablesInventory: updatedInv }
      const t = state.elapsedTicks

      switch (consumable.actionType) {
        case 'hn_blitz': {
          const fresh = createDynamicDemandSignals(state.valuationCents, t).slice(0, 4)
          const newOpps: QualifiedOpportunity[] = fresh.map(s => ({
            id: `opp-hn-${t}-${s.id}`,
            signalId: s.id,
            segment: s.segment,
            title: `[HN Frontpage] ${s.title}`,
            quote: s.quote,
            estimatedWtpCents: Math.round(s.estimatedWtpCents * 1.5),
            qualifiedTick: t,
          }))
          nextState = {
            ...nextState,
            qualifiedOpportunities: [...newOpps, ...nextState.qualifiedOpportunities],
            pipelineStage: 'product',
            activeFunction: 'product',
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-hn-${t}`,
                tone: 'info',
                title: 'Hacker News Viral Surge!',
                message: '4 pre-qualified opportunities flooded the Product pipeline at $0 CAC!',
                tick: t,
              },
            ],
            ledger: [
              ...nextState.ledger,
              {
                id: `led-hn-${t}`,
                tick: t,
                category: 'demand',
                message: 'Deployed Hacker News Frontpage Blitz: +4 pre-qualified leads at $0 CAC.',
              },
            ],
          }
          break
        }
        case 'emergency_safe': {
          const bonus = Math.max(5_000_000, Math.round(state.eligibleArrCents * 0.15))
          nextState = {
            ...nextState,
            cashCents: nextState.cashCents + bonus,
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-safe-${t}`,
                tone: 'info',
                title: 'YC Emergency SAFE Wired',
                message: `+$${Math.round(bonus / 100).toLocaleString()} non-dilutive liquidity injected into company treasury!`,
                tick: t,
              },
            ],
            ledger: [
              ...nextState.ledger,
              {
                id: `led-safe-${t}`,
                tick: t,
                category: 'finance',
                message: `Executed YC Emergency SAFE Note: +$${Math.round(bonus / 100).toLocaleString()} cash injected.`,
                deltaCashCents: bonus,
              },
            ],
          }
          break
        }
        case 'war_room': {
          nextState = {
            ...nextState,
            warRoomTicksRemaining: 300, // 30s
            warRoomSpeedMultiplier: 4.0,
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-war-${t}`,
                tone: 'info',
                title: 'War Room Overclock Active!',
                message: 'All worker speeds overclocked to 400% for the next 30 seconds!',
                tick: t,
              },
            ],
          }
          break
        }
        case 'exec_golf': {
          let collectedSum = 0
          const updatedInvoices = nextState.pendingInvoices.map(inv => {
            if (!inv.collected) {
              collectedSum += inv.amountCents
              return { ...inv, collected: true }
            }
            return inv
          })
          let restoredArr = 0
          for (const acc of nextState.accounts) {
            if (acc.delinquent) {
              restoredArr += (acc.baseMrrCents + acc.addonMrrCents) * 12
            }
          }
          const updatedAccounts = nextState.accounts.map(acc => ({
            ...acc,
            delinquent: false,
            health: Math.min(100, acc.health + 30),
          }))
          nextState = {
            ...nextState,
            cashCents: nextState.cashCents + collectedSum,
            pendingInvoices: updatedInvoices,
            accounts: updatedAccounts,
            eligibleArrCents: nextState.eligibleArrCents + restoredArr,
            arrBridge: {
              ...nextState.arrBridge,
              restorationArrCents: nextState.arrBridge.restorationArrCents + restoredArr,
            },
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-golf-${t}`,
                tone: 'info',
                title: 'Executive Backchannel Resolved Disputes',
                message: `Cured all delinquencies and collected $${(collectedSum / 100).toLocaleString()} pending cash!`,
                tick: t,
              },
            ],
          }
          break
        }
        case 'kernel_purge': {
          nextState = {
            ...nextState,
            operations: {
              ...nextState.operations,
              contextRot: 0,
              strainBacklog: 0,
              incidentsBacklog: 0,
            },
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-purge-${t}`,
                tone: 'info',
                title: 'Zero-Day Kernel Memory Purged',
                message: '100% of context rot and system strain cleared. Systems running at peak stability.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'defense_rfp': {
          const enterpriseArr = Math.max(250_000_00, Math.round(state.eligibleArrCents * 0.10))
          const enterpriseMrr = Math.ceil(enterpriseArr / 12)
          const acct: CustomerAccount = {
            id: `acc-gov-${t}`,
            name: 'Defense Sovereign AI Agency',
            segment: 'enterprise',
            baseMrrCents: enterpriseMrr,
            addonMrrCents: 0,
            health: 100,
            ageTicks: 0,
            addonSlotsUsed: 0,
            isThreatened: false,
            threatDeadlineTick: null,
            threatReason: null,
            unpaidGraceTicks: 0,
            delinquent: false,
            lastCollectionAttemptTick: null,
            fit: 1.0,
            overpricing: 0,
            defects: 0,
            serviceRemainderCents: 0,
          }
          const newArr = enterpriseMrr * 12
          const firstInvoice: InvoiceSchedule = {
            id: `inv-gov-${t}`,
            accountId: acct.id,
            amountCents: enterpriseMrr,
            dueTick: t + 60,
            collected: false,
            collectionAttempts: 0,
          }
          nextState = {
            ...nextState,
            accounts: [...nextState.accounts, acct],
            pendingInvoices: [...nextState.pendingInvoices, firstInvoice],
            contractualArrCents: nextState.contractualArrCents + newArr,
            eligibleArrCents: nextState.eligibleArrCents + newArr,
            arrBridge: {
              ...nextState.arrBridge,
              newArrCents: nextState.arrBridge.newArrCents + newArr,
            },
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-def-${t}`,
                tone: 'info',
                title: 'Sovereign Defense Contract Secured!',
                message: 'Locked in $250,000/yr ARR with immediate procurement authorization.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'tech_raid': {
          const updatedFleet = { ...nextState.fleet }
          for (const fn of Object.keys(updatedFleet) as FunctionId[]) {
            updatedFleet[fn] = {
              ...updatedFleet[fn],
              accumulatedWorkCredits: updatedFleet[fn].accumulatedWorkCredits + 3000,
            }
          }
          nextState = {
            ...nextState,
            fleet: updatedFleet,
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-raid-${t}`,
                tone: 'info',
                title: 'Competitor Tech Raided!',
                message: '+3,000 work credits deployed across all 6 departments.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'debt_bridge': {
          nextState = {
            ...nextState,
            debt: {
              ...nextState.debt,
              active: false,
              principalCents: 0,
              monthsRemaining: 0,
              monthlyPaymentCents: 0,
            },
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-debt-free-${t}`,
                tone: 'info',
                title: 'Debt Facility Fully Forgiven!',
                message: 'Venture Debt converted into non-repayable strategic equity grant.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'competitor_raid': {
          const addedArr = 100_000_00 // $100k/yr
          nextState = {
            ...nextState,
            contractualArrCents: nextState.contractualArrCents + addedArr,
            eligibleArrCents: nextState.eligibleArrCents + addedArr,
            arrBridge: {
              ...nextState.arrBridge,
              newArrCents: nextState.arrBridge.newArrCents + addedArr,
            },
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-comp-raid-${t}`,
                tone: 'info',
                title: 'Competitor Siphoned!',
                message: 'Poached key accounts from legacy SaaS: +$100,000/yr ARR added instantly.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'supercluster_burst': {
          nextState = {
            ...nextState,
            warRoomTicksRemaining: 250, // 25s
            warRoomSpeedMultiplier: 5.0, // 5x all swarm actions
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-burst-${t}`,
                tone: 'info',
                title: 'Supercluster Overclock Engaged!',
                message: '5x all swarm actions for the next 25 seconds.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'patent_shield': {
          nextState = {
            ...nextState,
            patentShieldTicksRemaining: 450, // 45s
            retentionIncidents: [],
            activeThreatAccountId: null,
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-shield-${t}`,
                tone: 'info',
                title: 'Patent Shield Deployed',
                message: 'All current incidents neutralized and legal liabilities deflected for 45s.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'secondary_sale': {
          const liquidity = 200_000_000 // $2,000,000
          nextState = {
            ...nextState,
            cashCents: nextState.cashCents + liquidity,
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-sec-sale-${t}`,
                tone: 'info',
                title: 'Secondary Founder Equity Sale Completed',
                message: '+$2,000,000 in immediate liquid capital wired to company accounts.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'bullseye_lock': {
          nextState = {
            ...nextState,
            bullseyeStrikesRemaining: (nextState.bullseyeStrikesRemaining || 0) + 5,
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-bullseye-${t}`,
                tone: 'info',
                title: 'Pricing Engine Calibrated',
                message: 'Next 5 Monetisation deal closures are guaranteed 100% Bullseye strikes (+50% ARR).',
                tick: t,
              },
            ],
          }
          break
        }
        case 'matrix_purge': {
          const grid = nextState.mergeGrid ?? Array(16).fill(null)
          const upgradedGrid = grid.map(item => item ? { ...item, tier: Math.min(5, item.tier + 1) } : null)
          nextState = {
            ...nextState,
            mergeGrid: upgradedGrid,
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-matrix-purge-${t}`,
                tone: 'info',
                title: 'Quantum Grid Super-Synthesis Completed',
                message: 'All modules on the 4x4 matrix upgraded by +1 Tier simultaneously!',
                tick: t,
              },
            ],
          }
          break
        }
        case 'enterprise_pilot': {
          const enterpriseArr = 200_000_00 // $200k/yr
          const mrr = Math.round(enterpriseArr / 12)
          const newEnterpriseAcc: CustomerAccount = {
            id: `acc-ent-${t}`,
            name: 'Fortune 50 Global Enterprise',
            segment: 'enterprise',
            baseMrrCents: mrr,
            addonMrrCents: 0,
            health: 100,
            ageTicks: 0,
            addonSlotsUsed: 0,
            isThreatened: false,
            threatDeadlineTick: null,
            threatReason: null,
            unpaidGraceTicks: 0,
            delinquent: false,
            lastCollectionAttemptTick: null,
            fit: 1.0,
            overpricing: 0,
            defects: 0,
            serviceRemainderCents: 0,
          }
          nextState = {
            ...nextState,
            accounts: [...nextState.accounts, newEnterpriseAcc],
            contractualArrCents: nextState.contractualArrCents + enterpriseArr,
            eligibleArrCents: nextState.eligibleArrCents + enterpriseArr,
            arrBridge: {
              ...nextState.arrBridge,
              newArrCents: nextState.arrBridge.newArrCents + enterpriseArr,
            },
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-ent-pilot-${t}`,
                tone: 'info',
                title: 'Fortune 50 Signed & Deployed!',
                message: 'Expedited deployment locked: +$200,000/yr recurring ARR.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'talent_blitz': {
          const updatedFleet = { ...nextState.fleet }
          for (const fn of Object.keys(updatedFleet) as FunctionId[]) {
            updatedFleet[fn] = {
              ...updatedFleet[fn],
              craftRank: Math.min(5, updatedFleet[fn].craftRank + 1),
            }
          }
          nextState = {
            ...nextState,
            fleet: updatedFleet,
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-talent-${t}`,
                tone: 'info',
                title: 'Elite AI Researchers Onboarded',
                message: '+1 Craft rank applied across all 6 company departments.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'debt_forgiveness': {
          nextState = {
            ...nextState,
            debt: {
              ...nextState.debt,
              active: false,
              principalCents: 0,
              monthsRemaining: 0,
              monthlyPaymentCents: 0,
            },
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-forgive-${t}`,
                tone: 'info',
                title: 'Debt Jubilee Accord Executed',
                message: '100% of outstanding debt principal and accrued interest forgiven.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'viral_podcast': {
          const fresh = createDynamicDemandSignals(nextState.valuationCents, t).slice(0, 8)
          nextState = {
            ...nextState,
            demandSignals: [...fresh, ...nextState.demandSignals],
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-podcast-${t}`,
                tone: 'info',
                title: 'Podcast Viral Inbound Spike!',
                message: '8 high-WTP market signals flooded into the Demand queue.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'incident_nuke': {
          nextState = {
            ...nextState,
            operations: {
              ...nextState.operations,
              strainBacklog: 0,
              contextRot: 0,
              incidentsBacklog: 0,
            },
            retentionIncidents: [],
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-nuke-${t}`,
                tone: 'info',
                title: 'Global Failover Complete',
                message: 'Zero strain, zero rot, all incidents purged.',
                tick: t,
              },
            ],
          }
          break
        }
        case 'valuation_pump': {
          const valBump = 25_000_000_00 // $25M
          nextState = {
            ...nextState,
            valuationCents: nextState.valuationCents + valBump,
            quarterValuationBoostMultiple: (nextState.quarterValuationBoostMultiple || 0) + 5.0,
            alerts: [
              ...nextState.alerts,
              {
                id: `alert-val-pump-${t}`,
                tone: 'info',
                title: 'Wall Street Research Upgrade',
                message: 'Pre-money valuation upgraded by +$25,000,000 and granted +5.0x Growth Multiple boost on next review!',
                tick: t,
              },
            ],
          }
          break
        }
      }
      return nextState
    }

    case 'pipeline.advance':
      return {
        ...state,
        pipelineStage: action.target,
        activeFunction: action.target,
      }

    case 'event.resolve_retention': {
      const hasAntiFragile = state.activeRelics.some(r => r.id === 'relic-anti-fragile')
      const valBonus = hasAntiFragile ? Math.round(state.valuationCents * 0.05) : 0
      const targetAccountId = state.retentionEvent?.accountId
      const updatedAccounts = state.accounts.map(a => {
        if (a.id === targetAccountId || a.isThreatened || a.health < 50) {
          return {
            ...a,
            health: Math.max(a.health, 85),
            isThreatened: false,
            threatDeadlineTick: null,
            threatReason: null,
          }
        }
        return a
      })
      const remainingIncidents = (state.retentionIncidents ?? []).filter(
        i => i.accountId !== targetAccountId && !updatedAccounts.some(a => a.id === i.accountId && !a.isThreatened)
      )
      return {
        ...state,
        accounts: updatedAccounts,
        retentionEvent: null,
        retentionIncidents: remainingIncidents,
        activeThreatAccountId: null,
        valuationCents: state.valuationCents + valBonus,
        activeFunction: state.activeFunction,
        alerts: [
          ...state.alerts.filter(al => !al.id.startsWith('threat-alert-')),
          {
            id: `ret-res-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Retention Event Resolved',
            message: 'Customer accounts stabilized and SLA violations neutralized.',
            tick: state.elapsedTicks,
            targetFunction: 'retention',
            actionLabel: 'View Retention [4]',
          },
        ],
      }
    }

    case 'event.resolve_expansion': {
      const evt = state.expansionEvent
      let updatedAccounts = [...state.accounts]
      let newCash = state.cashCents

      if (evt) {
        newCash += evt.rewardCashCents
        const targetAcc = updatedAccounts.find(a => a.name === evt.accountName) || updatedAccounts[0]
        if (targetAcc) {
          const addonMrr = Math.round(evt.rewardArrCents / 12)
          updatedAccounts = updatedAccounts.map(a =>
            a.id === targetAcc.id
              ? {
                  ...a,
                  addonMrrCents: a.addonMrrCents + addonMrr,
                  addonSlotsUsed: Math.min(2, a.addonSlotsUsed + 1),
                  health: Math.min(100, a.health + 15),
                }
              : a
          )
        }
      }

      const { contractualArrCents, eligibleArrCents } = calculateArrTotals(updatedAccounts)
      const gMultiple = calculateGrowthMultiple(state.arrBridge.openingArrCents, contractualArrCents, state.elapsedTicks)
      const economicBurn = calculateEconomicBurn({ ...state, accounts: updatedAccounts, cashCents: newCash })
      const cashForecast = calculateCashForecast({ ...state, accounts: updatedAccounts, cashCents: newCash })
      const capQuality = calculateCapitalQualityFactor(economicBurn.burnRatio, cashForecast.shortfallFraction)
      const val = calculateValuationCents(eligibleArrCents, gMultiple, capQuality)

      return {
        ...state,
        cashCents: newCash,
        accounts: updatedAccounts,
        contractualArrCents,
        eligibleArrCents,
        valuationCents: val,
        expansionEvent: null,
        activeFunction: state.activeFunction,
        alerts: [
          ...state.alerts.filter(al => !al.id.startsWith('exp-event-')),
          {
            id: `exp-res-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Expansion RFP Completed!',
            message: evt
              ? `Contract add-on locked for ${evt.accountName}: +$${Math.round(evt.rewardArrCents / 100).toLocaleString()}/yr ARR and +$${Math.round(evt.rewardCashCents / 100).toLocaleString()} deployment bonus claimed.`
              : 'Contract add-on attached and expansion bonus claimed.',
            tick: state.elapsedTicks,
            targetFunction: 'expansion',
            actionLabel: 'View Expansion [5]',
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-exp-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'expansion',
            message: evt
              ? `Completed expansion RFP for ${evt.accountName}: +$${Math.round(evt.rewardArrCents / 100).toLocaleString()}/yr ARR.`
              : 'Completed expansion RFP.',
            deltaCashCents: evt?.rewardCashCents,
            deltaArrCents: evt?.rewardArrCents,
          },
        ],
      }
    }

    case 'event.resolve_operations': {
      const hasAntiFragile = state.activeRelics.some(r => r.id === 'relic-anti-fragile')
      const valBonus = hasAntiFragile ? Math.round(state.valuationCents * 0.05) : 0
      const currentStrain = state.operations.strainBacklog
      const purgedStrain = currentStrain * 0.75

      return {
        ...state,
        operations: {
          ...state.operations,
          strainBacklog: Math.max(0, Math.round((currentStrain - purgedStrain) * 10) / 10),
          contextRot: Math.max(0, Math.round((state.operations.contextRot - 0.35) * 100) / 100),
          incidentsBacklog: 0,
          lastFailoverTick: state.elapsedTicks,
        },
        operationsEvent: null,
        valuationCents: state.valuationCents + valBonus,
        activeFunction: state.activeFunction,
        alerts: [
          ...state.alerts.filter(al => !al.id.startsWith('ops-event-')),
          {
            id: `ops-res-${state.elapsedTicks}`,
            tone: 'info',
            title: 'Cluster Failover Completed!',
            message: `Emergency failover purged ${purgedStrain.toFixed(1)} strain pts and cleansed context rot. Pipeline velocity restored.`,
            tick: state.elapsedTicks,
            targetFunction: 'operations',
            actionLabel: 'View Operations [6]',
          },
        ],
        ledger: [
          ...state.ledger,
          {
            id: `led-failover-${state.elapsedTicks}`,
            tick: state.elapsedTicks,
            category: 'ops',
            message: `Executed cluster failover. Purged ${purgedStrain.toFixed(1)} node strain points.`,
          },
        ],
      }
    }

    case 'alerts.dismiss': {
      return {
        ...state,
        alerts: state.alerts.filter(a => a.id !== action.alertId),
      }
    }

    case 'alerts.clear_all': {
      return {
        ...state,
        alerts: [],
      }
    }

    default:
      return state
  }
}

// --------------------------------------------------------------------------
// HELPER ROUTINES
// --------------------------------------------------------------------------

function handleDemandTriage(state: GameState, signalId: string, decision: 'qualify' | 'reject', ignoreCooldown = false): GameState {
  const lastTriage = state.lastDemandTriageTick ?? -9999
  if (!ignoreCooldown && state.elapsedTicks - lastTriage < 10) return state

  const signal = state.demandSignals.find(s => s.id === signalId)
  if (!signal) return state

  const remaining = state.demandSignals.filter(s => s.id !== signalId)

  if (decision === 'reject') {
    return {
      ...state,
      lastDemandTriageTick: state.elapsedTicks,
      demandSignals: remaining,
      activeSignalId: remaining.length > 0 ? remaining[0].id : null,
      signalsTriagedCount: state.signalsTriagedCount + 1,
      alerts: [
        ...state.alerts,
        {
          id: `triage-rej-${state.elapsedTicks}`,
          tone: 'info',
          title: 'Signal Discarded',
          message: `Passed on ${signal.segment.toUpperCase()} opportunity. Capital preserved.`,
          tick: state.elapsedTicks,
        },
      ],
    }
  }

  // Qualify decision with Segment Profile Success Rate, Craft, and Luck Variance
  const demandCraftRank = state.fleet?.demand?.craftRank ?? 0
  const demandLuckRank = state.fleet?.demand?.luckRank ?? 0
  const isFirstCustomer = (state.accounts.length === 0 && state.signalsTriagedCount === 0)

  const rng = new DeterministicRNG(state.seed + state.elapsedTicks * 31 + state.signalsTriagedCount * 17)
  const roll = rng.nextFloat()
  const luckRoll = rng.nextFloat()

  const qual = calculateDemandQualification(
    signal,
    state.systemCapabilities,
    demandCraftRank,
    demandLuckRank,
    isFirstCustomer,
    roll,
    luckRoll,
    false
  )

  const activeBuffs = getActiveBuffs(state)
  const cacDiscount = Math.min(0.5, activeBuffs.acquisitionCostDiscount || 0)
  const effectiveCac = Math.round(qual.effectiveCac * (1 - cacDiscount))

  if (state.cashCents < effectiveCac) {
    return {
      ...state,
      alerts: [
        ...state.alerts,
        {
          id: `cac-fail-${state.elapsedTicks}`,
          tone: 'warning',
          title: 'Insufficient Acquisition Cash',
          message: `Need $${(effectiveCac / 100).toFixed(0)} to qualify this opportunity.`,
          tick: state.elapsedTicks,
        },
      ],
    }
  }

  const remainingCash = state.cashCents - effectiveCac
  const signalSegment = signal.segment || 'creator'

  if (!qual.success) {
    // Qualification Failed! Discard signal, deduct CAC, alert user.
    const failOutcome: DemandTriageOutcome = {
      id: `outcome-${state.elapsedTicks}-${signal.id}`,
      signalId: signal.id,
      title: signal.title || 'Prospect',
      segment: signalSegment,
      success: false,
      probability: qual.probability,
      failureReason: qual.failureReason,
      effectiveCac: effectiveCac,
      effectiveWtp: qual.effectiveWtp,
      isHyper: false,
      isLuckyWhale: qual.isLuckyWhale,
      luckVariancePct: Math.round(qual.luckVariance.delta * 100),
      tick: state.elapsedTicks,
    }

    return {
      ...state,
      lastDemandTriageTick: state.elapsedTicks,
      lastTriageOutcome: failOutcome,
      cashCents: remainingCash,
      demandSignals: remaining,
      activeSignalId: remaining.length > 0 ? remaining[0].id : null,
      signalsTriagedCount: state.signalsTriagedCount + 1,
      alerts: [
        ...state.alerts,
        {
          id: `triage-fail-${state.elapsedTicks}`,
          tone: 'warning',
          title: `${signalSegment.toUpperCase()} Lead Disqualified`,
          message: qual.failureReason || `Lead failed qualification (${Math.round(qual.probability * 100)}% chance). Lost $${(effectiveCac / 100).toFixed(0)} CAC.`,
          tick: state.elapsedTicks,
        },
      ],
      ledger: [
        ...state.ledger,
        {
          id: `led-disqual-${state.elapsedTicks}`,
          tick: state.elapsedTicks,
          category: 'demand',
          message: `Disqualified ${signalSegment.toUpperCase()} lead (${signal.title || 'Prospect'}). Lost $${(effectiveCac / 100).toFixed(0)} CAC.`,
          deltaCashCents: -effectiveCac,
        },
      ],
    }
  }

  // Qualification Succeeded!
  const manualMult = activeBuffs.manualActionMultiplier || 1
  const boostedWtp = Math.round(qual.effectiveWtp * (1 + (manualMult - 1) * 0.25))
  const newOpp: QualifiedOpportunity = {
    id: `opp-${state.elapsedTicks}-${signal.id}`,
    signalId: signal.id,
    segment: signalSegment,
    title: qual.isLuckyWhale ? `[WHALE INBOUND] ${signal.title || 'Prospect'}` : (signal.title || 'Prospect'),
    quote: signal.quote || signal.signalRationale || 'High potential lead',
    estimatedWtpCents: boostedWtp,
    qualifiedTick: state.elapsedTicks,
  }

  const allOpps = [newOpp, ...state.qualifiedOpportunities]
  const scaleRank = state.fleet.product.scaleRank || 0
  const craftRank = state.fleet.product.craftRank || 0
  const pods = syncProductPods(state.productPods, allOpps, scaleRank, craftRank)

  const luckVariancePct = Math.round(qual.luckVariance.delta * 100)
  const luckText = luckVariancePct !== 0 ? ` (${luckVariancePct > 0 ? `+${luckVariancePct}%` : `${luckVariancePct}%`} Luck Variance)` : ''

  const successOutcome: DemandTriageOutcome = {
    id: `outcome-${state.elapsedTicks}-${signal.id}`,
    signalId: signal.id,
    title: signal.title || 'Prospect',
    segment: signalSegment,
    success: true,
    probability: qual.probability,
    effectiveCac: qual.effectiveCac,
    effectiveWtp: qual.effectiveWtp,
    isHyper: false,
    isLuckyWhale: qual.isLuckyWhale,
    luckVariancePct,
    tick: state.elapsedTicks,
  }

  return {
    ...state,
    lastDemandTriageTick: state.elapsedTicks,
    lastTriageOutcome: successOutcome,
    cashCents: remainingCash,
    qualifiedOpportunities: allOpps,
    productPods: pods,
    demandSignals: remaining,
    activeSignalId: remaining.length > 0 ? remaining[0].id : null,
    signalsTriagedCount: state.signalsTriagedCount + 1,
    pipelineStage: 'product',
    activeFunction: 'product',
    alerts: [
      ...state.alerts,
      {
        id: `triage-qual-${state.elapsedTicks}`,
        tone: 'info',
        title: qual.isLuckyWhale ? '🐋 Lucky Whale Signal Qualified ($0 CAC)!' : 'Opportunity Qualified',
        message: qual.isLuckyWhale
          ? `Lucky catalyst! Captured $${Math.round(qual.effectiveWtp / 100)}/mo Whale opportunity at $0 CAC!`
          : `Spent $${(qual.effectiveCac / 100).toFixed(0)} CAC (${Math.round(qual.probability * 100)}% Success Rate${luckText}). Opportunity queued for Product assembly.`,
        tick: state.elapsedTicks,
      },
    ],
    ledger: [
      ...state.ledger,
      {
        id: `led-qual-${state.elapsedTicks}`,
        tick: state.elapsedTicks,
        category: 'demand',
        message: `Qualified ${signalSegment.toUpperCase()} signal (${signal.title || 'Prospect'}).`,
        deltaCashCents: -qual.effectiveCac,
      },
    ],
  }
}

function handleDemandHyperTriage(state: GameState, signalId: string): GameState {
  const signal = state.demandSignals.find(s => s.id === signalId)
  if (!signal) return state

  const demandCraftRank = state.fleet?.demand?.craftRank ?? 0
  const demandLuckRank = state.fleet?.demand?.luckRank ?? 0
  const isFirstCustomer = (state.accounts.length === 0 && state.signalsTriagedCount === 0)

  const rng = new DeterministicRNG(state.seed + state.elapsedTicks * 7 + state.signalsTriagedCount)
  const roll = rng.nextFloat()
  const luckRoll = rng.nextFloat()

  const qual = calculateDemandQualification(
    signal,
    state.systemCapabilities,
    demandCraftRank,
    demandLuckRank,
    isFirstCustomer,
    roll,
    luckRoll,
    true // isHyper
  )

  if (state.cashCents < qual.effectiveCac) {
    return {
      ...state,
      alerts: [
        ...state.alerts,
        {
          id: `hyper-cac-fail-${state.elapsedTicks}`,
          tone: 'warning',
          title: 'Insufficient Cash for Hyper 2X',
          message: `Hyper 2X requires $${Math.round(qual.effectiveCac / 100)} liquid cash.`,
          tick: state.elapsedTicks,
        },
      ],
    }
  }

  const remaining = state.demandSignals.filter(s => s.id !== signalId)
  const signalSegment = signal.segment || 'creator'

  if (!qual.success) {
    const failOutcome: DemandTriageOutcome = {
      id: `outcome-${state.elapsedTicks}-${signal.id}`,
      signalId: signal.id,
      title: signal.title || 'Prospect',
      segment: signalSegment,
      success: false,
      probability: qual.probability,
      failureReason: qual.failureReason,
      effectiveCac: qual.effectiveCac,
      effectiveWtp: qual.effectiveWtp,
      isHyper: true,
      isLuckyWhale: qual.isLuckyWhale,
      luckVariancePct: Math.round(qual.luckVariance.delta * 100),
      tick: state.elapsedTicks,
    }

    return {
      ...state,
      lastDemandTriageTick: state.elapsedTicks,
      lastTriageOutcome: failOutcome,
      cashCents: state.cashCents - qual.effectiveCac,
      demandSignals: remaining,
      activeSignalId: remaining.length > 0 ? remaining[0].id : null,
      signalsTriagedCount: state.signalsTriagedCount + 1,
      alerts: [
        ...state.alerts,
        {
          id: `hyper-triage-fail-${state.elapsedTicks}`,
          tone: 'warning',
          title: `${signalSegment.toUpperCase()} Hyper 2X Disqualified`,
          message: qual.failureReason || `Hyper 2X lead failed qualification (${Math.round(qual.probability * 100)}% chance). Lost $${Math.round(qual.effectiveCac / 100)} CAC.`,
          tick: state.elapsedTicks,
        },
      ],
      ledger: [
        ...state.ledger,
        {
          id: `led-hyper-fail-${state.elapsedTicks}`,
          tick: state.elapsedTicks,
          category: 'demand',
          message: `Disqualified Hyper 2X ${signalSegment.toUpperCase()} lead (${signal.title}). Lost $${Math.round(qual.effectiveCac / 100)} CAC.`,
          deltaCashCents: -qual.effectiveCac,
        },
      ],
    }
  }

  const newOpp: QualifiedOpportunity = {
    id: `opp-hyper-${state.elapsedTicks}-${signal.id}`,
    signalId: signal.id,
    segment: signal.segment,
    title: qual.isLuckyWhale ? `[HYPER WHALE 3X] ${signal.title}` : `[HYPER 2X] ${signal.title}`,
    quote: signal.quote || signal.signalRationale,
    estimatedWtpCents: qual.effectiveWtp,
    qualifiedTick: state.elapsedTicks,
  }

  const allOpps = [newOpp, ...state.qualifiedOpportunities]
  const scaleRank = state.fleet.product.scaleRank || 0
  const craftRank = state.fleet.product.craftRank || 0
  const pods = syncProductPods(state.productPods, allOpps, scaleRank, craftRank)

  const successOutcome: DemandTriageOutcome = {
    id: `outcome-${state.elapsedTicks}-${signal.id}`,
    signalId: signal.id,
    title: signal.title || 'Prospect',
    segment: signalSegment,
    success: true,
    probability: qual.probability,
    effectiveCac: qual.effectiveCac,
    effectiveWtp: qual.effectiveWtp,
    isHyper: true,
    isLuckyWhale: qual.isLuckyWhale,
    luckVariancePct: Math.round(qual.luckVariance.delta * 100),
    tick: state.elapsedTicks,
  }

  return {
    ...state,
    lastDemandTriageTick: state.elapsedTicks,
    lastTriageOutcome: successOutcome,
    cashCents: state.cashCents - qual.effectiveCac,
    qualifiedOpportunities: allOpps,
    productPods: pods,
    demandSignals: remaining,
    activeSignalId: remaining.length > 0 ? remaining[0].id : null,
    signalsTriagedCount: state.signalsTriagedCount + 1,
    pipelineStage: 'product',
    activeFunction: 'product',
    alerts: [
      ...state.alerts,
      {
        id: `triage-hyper-${state.elapsedTicks}`,
        tone: 'info',
        title: qual.isLuckyWhale ? '🚀 HYPER WHALE 3X Activated!' : 'HYPER 2X Activated!',
        message: `Invested $${Math.round(qual.effectiveCac / 100)} CAC (${Math.round(qual.probability * 100)}% Success Rate). Supercharged lead ($${Math.round(qual.effectiveWtp / 100)}/mo WTP) routed to Product!`,
        tick: state.elapsedTicks,
      },
    ],
    ledger: [
      ...state.ledger,
      {
        id: `led-hyper-${state.elapsedTicks}`,
        tick: state.elapsedTicks,
        category: 'demand',
        message: `Hyper 2X qualified ${signal.title} ($${Math.round(qual.effectiveWtp / 100)}/mo WTP).`,
        deltaCashCents: -qual.effectiveCac,
      },
    ],
  }
}

function handleDemandBatchTriage(state: GameState): GameState {
  if (!state.demandSignals || state.demandSignals.length === 0) return state

  let currentState = state
  const signals = [...state.demandSignals]
  let qualifiedAny = false

  for (const signal of signals) {
    const demandCraftRank = currentState.fleet?.demand?.craftRank ?? 0
    const cacDiscount = Math.min(0.60, 0.12 * demandCraftRank)
    const rawAcqCost = signal.acquisitionCostCents ?? 0
    const effectiveCac = Math.round(rawAcqCost * (1 - cacDiscount))

    if (currentState.cashCents >= effectiveCac) {
      currentState = handleDemandTriage(currentState, signal.id, 'qualify', true)
      qualifiedAny = true
    }
  }

  if (qualifiedAny) {
    currentState = {
      ...currentState,
      alerts: [
        ...currentState.alerts,
        {
          id: `batch-triage-${currentState.elapsedTicks}`,
          tone: 'info',
          title: 'All Active Channels Triaged',
          message: 'All eligible signals qualified and routed to autonomous Product Pods!',
          tick: currentState.elapsedTicks,
        },
      ],
    }
  }

  return currentState
}

function handleRefreshDemandPool(state: GameState): GameState {
  const lastReplenish = state.lastDemandReplenishTick ?? -9999
  if (state.elapsedTicks - lastReplenish < 60) return state

  const fresh = createDynamicDemandSignals(state.valuationCents, state.elapsedTicks)

  return {
    ...state,
    lastDemandReplenishTick: state.elapsedTicks,
    demandSignals: fresh,
    activeSignalId: fresh[0].id,
    alerts: [
      ...state.alerts,
      {
        id: `sig-ref-${state.elapsedTicks}`,
        tone: 'info',
        title: 'Channels Refreshed',
        message: 'New market signals detected across search and developer communities.',
        tick: state.elapsedTicks,
      },
    ],
  }
}

function handleMonetisationCommit(
  state: GameState,
  action?: { normalizedCursor?: number; rating?: 'perfect' | 'good' | 'hazard'; deskIndex?: number; isBatch?: boolean }
): GameState {
  const deskIndex = action?.deskIndex ?? 0
  const desks = state.activeDealDesks ? [...state.activeDealDesks] : [{
    id: 'desk-0',
    deskIndex: 0,
    activation: null,
    postedPriceMonthlyCents: 4_000,
    status: 'idle' as const,
  }]
  const targetDesk = desks[deskIndex]
  const activation = (action?.deskIndex !== undefined && targetDesk?.activation) ? targetDesk.activation : state.currentActivation
  if (!activation) return state

  const lastCommit = state.lastMonetisationCommitTick ?? -9999
  if (!action?.isBatch && state.elapsedTicks - lastCommit < 20) {
    return state
  }

  let postedPrice = (action?.deskIndex !== undefined && targetDesk?.postedPriceMonthlyCents !== undefined)
    ? targetDesk.postedPriceMonthlyCents
    : state.postedPriceMonthlyCents

  if (action?.normalizedCursor !== undefined) {
    const targetWtp = calculateCustomerConversion(activation.targetSegment, state.systemCapabilities, 0).effectiveWtpMonthlyCents
    const multiplier = 0.5 + clamp(action.normalizedCursor, 0, 1) * 1.3
    postedPrice = Math.round(targetWtp * multiplier)
  }

  const conversionResult = calculateCustomerConversion(
    activation.targetSegment,
    state.systemCapabilities,
    postedPrice,
    state.competitionFactor
  )

  const hasAlgoPricing = state.activeRelics.some(r => r.id === 'relic-algo-pricing')
  const effectiveExpectedWtp = hasAlgoPricing
    ? Math.round(conversionResult.effectiveWtpMonthlyCents * 1.35)
    : conversionResult.effectiveWtpMonthlyCents

  const rng = new DeterministicRNG(state.seed + state.elapsedTicks + deskIndex)
  const roll = rng.nextFloat()
  const isFirstCustomer = state.accounts.length === 0

  const hasBullseyeLock = (state.bullseyeStrikesRemaining || 0) > 0
  const isPerfect = hasBullseyeLock || action?.rating === 'perfect' || (state.pricingCursor >= 0.55 && state.pricingCursor <= 0.72)
  const isGood = action?.rating === 'good' || (state.pricingCursor >= 0.35 && state.pricingCursor < 0.55)

  const hasSoc2 = state.activeRelics.some(r => r.id === 'relic-soc2-fasttrack')
  const enterpriseConvProb = (hasSoc2 && activation.targetSegment === 'enterprise')
    ? Math.min(1.0, conversionResult.conversionProbability * 3)
    : conversionResult.conversionProbability

  const dealSucceeded = isPerfect
    ? true // Perfect Bullseye timing guarantees conversion!
    : isGood
    ? (roll <= 0.95) // Good timing succeeds 95% of the time!
    : isFirstCustomer
    ? (postedPrice <= effectiveExpectedWtp * 1.6 || roll <= 0.85)
    : (hasAlgoPricing ? (postedPrice <= effectiveExpectedWtp * 1.2 || roll <= 0.95) : (roll <= enterpriseConvProb))

  // Dequeue this activation and prepare the next one in queue
  const rawQueue = state.activationsQueue.filter(a => a.id !== activation.id)
  const nextActivation = rawQueue.length > 0 ? rawQueue[0] : null
  const remainingQueue = nextActivation ? rawQueue.slice(1) : []
  const nextDefaultWtp = nextActivation
    ? calculateCustomerConversion(nextActivation.targetSegment, state.systemCapabilities, 0, state.competitionFactor).effectiveWtpMonthlyCents
    : 4_000

  // Update desks
  desks[deskIndex] = {
    ...(targetDesk ?? { id: `desk-${deskIndex}`, deskIndex }),
    activation: nextActivation,
    postedPriceMonthlyCents: nextDefaultWtp,
    status: nextActivation ? 'negotiating' : 'idle',
    rating: action?.rating,
  }

  const nextCurrentActivation = deskIndex === 0 ? nextActivation : (desks[0]?.activation ?? null)
  const nextPostedPrice = deskIndex === 0 ? nextDefaultWtp : (desks[0]?.postedPriceMonthlyCents ?? state.postedPriceMonthlyCents)

  if (!dealSucceeded) {
    // Deal lost due to price mismatch or low capability fit
    return {
      ...state,
      lastMonetisationCommitTick: state.elapsedTicks,
      activationsQueue: remainingQueue,
      activeDealDesks: desks,
      currentActivation: nextCurrentActivation,
      postedPriceMonthlyCents: nextPostedPrice,
      pricingCursor: 0.5,
      pipelineStage: nextCurrentActivation ? 'monetisation' : (state.qualifiedOpportunities.length > 0 ? 'product' : 'demand'),
      activeFunction: nextCurrentActivation ? 'monetisation' : (state.qualifiedOpportunities.length > 0 ? 'product' : 'demand'),
      alerts: [
        ...state.alerts,
        {
          id: `deal-lost-${state.elapsedTicks}-${deskIndex}`,
          tone: 'warning',
          title: `Deal Lost on Desk 0${deskIndex + 1}`,
          message: `Customer passed. Price was $${(postedPrice / 100).toLocaleString()}/mo vs expected $${(conversionResult.effectiveWtpMonthlyCents / 100).toLocaleString()}/mo.`,
          tick: state.elapsedTicks,
        },
      ],
      ledger: [
        ...state.ledger,
        {
          id: `led-lost-${state.elapsedTicks}-${deskIndex}`,
          tick: state.elapsedTicks,
          category: 'monetisation',
          message: `Lost ${activation.targetSegment.toUpperCase()} deal on Desk 0${deskIndex + 1} (Price: $${(postedPrice / 100).toLocaleString()}/mo, WTP: $${(conversionResult.effectiveWtpMonthlyCents / 100).toLocaleString()}/mo).`,
        },
      ],
    }
  }

  // SUCCESSFUL CONTRACT SIGNING
  const customerNames: Record<string, string[]> = {
    creator: ['VibeStudio LLC', 'SyntaxPod Media', 'AutonomousSolos Inc', 'HyperStack Studio', 'PromptLab Works'],
    team: ['StripeFlow Technologies', 'LinearNext AI', 'VectorScale Labs', 'OmniFlow Cloud', 'KubeMesh Systems'],
    enterprise: ['Apex Financial Cloud', 'Novartis GenSec', 'Consolidated Logistics', 'Sovereign Bank AI', 'AetherGlobal Telecom'],
  }
  const pool = customerNames[activation.targetSegment]
  const customerName = pool[Math.floor(rng.nextFloat() * pool.length)]

  const targetBasePrice = activation.customWtpMonthlyCents ? Math.round(activation.customWtpMonthlyCents * conversionResult.fit) : postedPrice
  const effectiveWtp = activation.customWtpMonthlyCents ? targetBasePrice : conversionResult.effectiveWtpMonthlyCents
  const overpricing = Math.max(0, postedPrice / Math.max(1, effectiveWtp) - 1)

  // Apply Craft multiplier to contract packaging & multi-seat yield, plus bonus on perfect strike
  const craftMultiplier = MONETISATION_CRAFT_MULTIPLIERS[state.fleet.monetisation?.craftRank ?? 0] || 1.0
  const enterpriseACVMultiplier = (hasSoc2 && activation.targetSegment === 'enterprise') ? 1.50 : 1.0
  const bonusMultiplier = (hasBullseyeLock ? 1.50 : (isPerfect ? 1.20 : 1.0)) * enterpriseACVMultiplier
  const monetisationLuckRank = state.fleet.monetisation?.luckRank ?? 0
  const luck = calculateLuckVariance(monetisationLuckRank, rng.nextFloat())
  const isLuckyWhaleContract = monetisationLuckRank > 0 && luck.isPeakPositive
  const whaleMultiplier = isLuckyWhaleContract ? 1.35 : 1.0
  const activeBuffs = getActiveBuffs(state)
  const manualMult = (action?.normalizedCursor !== undefined || action?.rating) ? (activeBuffs.manualActionMultiplier || 1) : 1
  const manualCommitBoost = 1 + (manualMult - 1) * 0.20
  const scaledPrice = Math.round(targetBasePrice * craftMultiplier * bonusMultiplier * luck.multiplier * whaleMultiplier * manualCommitBoost)
  const upfrontAdvanceCents = isLuckyWhaleContract ? Math.round(scaledPrice * 6) : 0

  const newAccount: CustomerAccount = {
    id: `acc-${state.elapsedTicks}-${deskIndex}-${Math.floor(rng.nextFloat() * 1000)}`,
    name: customerName,
    segment: activation.targetSegment,
    baseMrrCents: scaledPrice,
    addonMrrCents: 0,
    health: INITIAL_CUSTOMER_HEALTH, // 70/100
    ageTicks: 0,
    addonSlotsUsed: 0,
    isThreatened: false,
    threatDeadlineTick: null,
    threatReason: null,
    unpaidGraceTicks: 0,
    delinquent: false,
    lastCollectionAttemptTick: null,
    fit: conversionResult.fit,
    overpricing,
    defects: activation.defectExposure,
    serviceRemainderCents: 0,
  }

  const updatedAccounts = [...state.accounts, newAccount]
  const { contractualArrCents, eligibleArrCents } = calculateArrTotals(updatedAccounts)
  const newArr = scaledPrice * 12

  // Schedule first monthly invoice collection in arrears
  const hasStealthMoat = state.activeRelics.some(r => r.id === 'relic-stealth-moat')
  const hasZkProofs = state.activeRelics.some(r => r.id === 'relic-zk-proofs')
  let delayTicks = SEGMENT_PROFILES[activation.targetSegment].collectionDelayTicks
  if (activation.targetSegment === 'enterprise') {
    if (hasStealthMoat) delayTicks = 60 // 6s instead of 24s
    if (hasZkProofs) delayTicks = Math.max(10, Math.round(delayTicks / 4)) // 4x faster
  }
  const initialInvoice: InvoiceSchedule = {
    id: `inv-${state.elapsedTicks}-${newAccount.id}`,
    accountId: newAccount.id,
    amountCents: scaledPrice,
    dueTick: state.elapsedTicks + delayTicks,
    collected: false,
    collectionAttempts: 0,
  }

  const tempState: GameState = {
    ...state,
    cashCents: state.cashCents + upfrontAdvanceCents,
    accounts: updatedAccounts,
    pendingInvoices: [...state.pendingInvoices, initialInvoice],
  }
  const economicBurn = calculateEconomicBurn(tempState)
  const cashForecast = calculateCashForecast(tempState)
  const capQuality = calculateCapitalQualityFactor(economicBurn.burnRatio, cashForecast.shortfallFraction)
  const gMultiple = calculateGrowthMultiple(state.arrBridge.openingArrCents, contractualArrCents, state.elapsedTicks)
  const val = calculateValuationCents(eligibleArrCents, gMultiple, capQuality)

  return {
    ...state,
    lastMonetisationCommitTick: state.elapsedTicks,
    cashCents: state.cashCents + upfrontAdvanceCents,
    accounts: updatedAccounts,
    pendingInvoices: [...state.pendingInvoices, initialInvoice],
    contractualArrCents,
    eligibleArrCents,
    growthMultiple: gMultiple,
    capitalQualityFactor: capQuality,
    shortfallFraction: cashForecast.shortfallFraction,
    burnRatio: economicBurn.burnRatio,
    cogsMonthCents: economicBurn.cogsMonthCents,
    opexMonthCents: economicBurn.opexMonthCents,
    interestMonthCents: economicBurn.interestMonthCents,
    earnedRevenueMonthCents: economicBurn.earnedRevenueMonthCents,
    forecastObligationsCents: cashForecast.forecastObligationsCents,
    forecastExpectedCollectionsCents: cashForecast.forecastExpectedCollectionsCents,
    peakNegativeCashCents: cashForecast.peakNegativeCashCents,
    valuationCents: val,
    activationsQueue: remainingQueue,
    activeDealDesks: desks,
    currentActivation: nextCurrentActivation,
    postedPriceMonthlyCents: nextPostedPrice,
    pricingCursor: 0.5,
    bullseyeStrikesRemaining: hasBullseyeLock ? Math.max(0, (state.bullseyeStrikesRemaining || 0) - 1) : state.bullseyeStrikesRemaining,
    pipelineStage: nextCurrentActivation ? 'monetisation' : (state.qualifiedOpportunities.length > 0 ? 'product' : 'demand'),
    activeFunction: nextCurrentActivation ? 'monetisation' : (state.qualifiedOpportunities.length > 0 ? 'product' : 'demand'),
    lastSignedContract: {
      customerName,
      segment: activation.targetSegment,
      monthlyArrCents: newArr,
      tick: state.elapsedTicks,
    },
    arrBridge: {
      ...state.arrBridge,
      newArrCents: state.arrBridge.newArrCents + newArr,
    },
    alerts: [
      ...state.alerts,
      {
        id: `deal-signed-${state.elapsedTicks}-${deskIndex}`,
        tone: 'info',
        title: hasBullseyeLock ? '🎯 Guaranteed Bullseye Strike (+50% ARR Bonus)!' : (isPerfect ? '🎯 Bullseye Contract Signed (+20% ARR Bonus)!' : (deskIndex > 0 ? `Desk 0${deskIndex + 1} Contract Signed!` : 'Annual Contract Signed!')),
        message: `${customerName} signed at $${(scaledPrice / 100).toLocaleString()}/mo (+$${(newArr / 100).toLocaleString()}/yr ARR). Cash collects in ${delayTicks / 10}s.`,
        tick: state.elapsedTicks,
      },
    ],
    ledger: [
      ...state.ledger,
      {
        id: `led-signed-${state.elapsedTicks}-${deskIndex}`,
        tick: state.elapsedTicks,
        category: 'monetisation',
        message: `Signed ${customerName} (${activation.targetSegment.toUpperCase()}) on Desk 0${deskIndex + 1} for +$${(newArr / 100).toLocaleString()}/yr ARR.`,
        deltaArrCents: newArr,
      },
    ],
  }
}

function handleMonetisationBatchClose(state: GameState): GameState {
  let currentState = state
  const count = currentState.activeDealDesks?.length ?? 0
  for (let i = 0; i < count; i++) {
    const currentDesk = currentState.activeDealDesks?.[i]
    if (currentDesk?.activation) {
      currentState = handleMonetisationCommit(currentState, { deskIndex: i, rating: 'good', isBatch: true })
    }
  }
  return currentState
}


function handleClockTick(state: GameState, dtTicks: number): GameState {
  if (state.paused || state.runStatus !== 'running' || state.quarterReviewPending) return state

  const activeBuffs = getActiveBuffs(state)
  const newElapsed = state.elapsedTicks + dtTicks
  let newCash = state.cashCents
  let accounts = [...state.accounts]
  let pendingInvoices = [...state.pendingInvoices]
  let mandatoryBills = [...state.mandatoryBills]
  let alerts = [...state.alerts]
  let ledger = [...state.ledger]
  let monthInQuarter = state.monthInQuarter
  let quarter = state.quarter
  let ticksInCurrentMonth = state.ticksInCurrentMonth + dtTicks
  let quarterReviewPending: boolean = state.quarterReviewPending
  let availableQuarterRelics = state.availableQuarterRelics
  let availableQuarterConsumables = state.availableQuarterConsumables || []
  let lockedQuarterRelicIds = state.lockedQuarterRelicIds ? [...state.lockedQuarterRelicIds] : []
  let lockedQuarterConsumableIds = state.lockedQuarterConsumableIds ? [...state.lockedQuarterConsumableIds] : []
  let quarterReviewRerolls = state.quarterReviewRerolls || 0
  let warRoomTicksRemaining = Math.max(0, (state.warRoomTicksRemaining || 0) - dtTicks)
  let warRoomSpeedMultiplier = warRoomTicksRemaining > 0 ? (state.warRoomSpeedMultiplier || 4.0) : 1.0
  let patentShieldTicksRemaining = Math.max(0, (state.patentShieldTicksRemaining || 0) - dtTicks)
  let bullseyeStrikesRemaining = state.bullseyeStrikesRemaining || 0
  let quarterValuationBoostMultiple = state.quarterValuationBoostMultiple || 0
  let contextRot = state.operations.contextRot
  let strainBacklog = state.operations.strainBacklog
  let incidents = state.operations.incidentsBacklog
  let retentionEvent = state.retentionEvent
  let expansionEvent = state.expansionEvent
  let operationsEvent = state.operationsEvent
  let qualifiedOpportunities = [...state.qualifiedOpportunities]
  let activationsQueue = [...state.activationsQueue]
  let currentActivation = state.currentActivation
  let demandSignals = [...state.demandSignals]
  let lastDemandReplenishTick = state.lastDemandReplenishTick ?? 0
  let activeThreatId = state.activeThreatAccountId
  let expansionOrders = state.expansionOrders ? [...state.expansionOrders] : []
  let retentionSavedArrCents = state.retentionSavedArrCents || 0
  let currentIncidents = (state.retentionIncidents ?? []).map(i => ({
    ...i,
    urgencyTicks: Math.max(0, i.urgencyTicks - dtTicks),
  }))

  const opsScale = state.fleet.operations?.scaleRank ?? 0
  const opsLuck = state.fleet.operations?.luckRank ?? 0
  const maxRacks = OPERATIONS_RACK_LIMITS[opsScale] || 1
  let currentTickets: ScratchCard[] = state.activeTickets ? [...state.activeTickets] : [createDiagnosticTicket(0, opsLuck)]
  while (currentTickets.length < maxRacks) {
    currentTickets.push(createDiagnosticTicket(currentTickets.length, opsLuck))
  }
  if (currentTickets.length > maxRacks) {
    currentTickets = currentTickets.slice(0, maxRacks)
  }

  // relic-ops-telemetry: reveals 1 negative hazard pod safely
  if (state.activeRelics.some(r => r.id === 'relic-ops-telemetry')) {
    currentTickets = currentTickets.map(ticket => {
      const hazardPod = ticket.pods.find(p => p.isNegative && !p.isScratched)
      if (hazardPod && !ticket.isBusted) {
        return {
          ...ticket,
          pods: ticket.pods.map(p => p.id === hazardPod.id ? { ...p, isScratched: true, label: `[Telemetry Safe Deflect] ${p.label}` } : p)
        }
      }
      return ticket
    })
  }

  const monScale = state.fleet.monetisation?.scaleRank ?? 0
  const maxDesks = MONETISATION_DESK_LIMITS[monScale] || 1
  let currentDesks: DealDeskState[] = state.activeDealDesks ? [...state.activeDealDesks] : [{
    id: 'desk-0',
    deskIndex: 0,
    activation: null,
    postedPriceMonthlyCents: 4_000,
    status: 'idle',
  }]
  while (currentDesks.length < maxDesks) {
    const idx = currentDesks.length
    currentDesks.push({
      id: `desk-${idx}`,
      deskIndex: idx,
      activation: null,
      postedPriceMonthlyCents: 4_000,
      status: 'idle',
    })
  }
  if (currentDesks.length > maxDesks) {
    currentDesks = currentDesks.slice(0, maxDesks)
  }

  const expScale = state.fleet.expansion?.scaleRank ?? 0
  const targetGridSize = EXPANSION_GRID_SIZES[expScale] || 16
  let mergeGrid = state.mergeGrid ? [...state.mergeGrid] : Array(targetGridSize).fill(null)
  while (mergeGrid.length < targetGridSize) {
    mergeGrid.push(null)
  }
  if (mergeGrid.length > targetGridSize) {
    mergeGrid = mergeGrid.slice(0, targetGridSize)
  }

  let debtPrincipal = state.debt.principalCents
  let debtMonthsRemaining = state.debt.monthsRemaining
  let debtActive = state.debt.active
  let debtMonthlyPayment = state.debt.monthlyPaymentCents
  let vcBaselineArrCents = state.vc.baselineArrCents
  let vcNextDeadlineTick = state.vc.nextDeadlineTick
  let competitionFactor = state.competitionFactor ?? 0.10

  // Sync idle deal desks from currentActivation / activationsQueue
  if (currentDesks[0] && !currentDesks[0].activation && currentActivation) {
    currentDesks[0].activation = currentActivation
    currentDesks[0].status = 'negotiating'
    currentDesks[0].postedPriceMonthlyCents = state.postedPriceMonthlyCents
  }

  const assignedIds = new Set(currentDesks.map(d => d.activation?.id).filter(Boolean))

  for (let d = 0; d < currentDesks.length; d++) {
    if (!currentDesks[d].activation) {
      const nextAct = activationsQueue.find(a => !assignedIds.has(a.id))
      if (nextAct) {
        currentDesks[d].activation = nextAct
        currentDesks[d].status = 'negotiating'
        currentDesks[d].postedPriceMonthlyCents = calculateCustomerConversion(nextAct.targetSegment, state.systemCapabilities, 0, competitionFactor).effectiveWtpMonthlyCents
        assignedIds.add(nextAct.id)
      }
    }
  }
  currentActivation = currentDesks[0]?.activation ?? (activationsQueue.length > 0 ? activationsQueue[0] : null)

  let arrBridgeNew = state.arrBridge.newArrCents
  let arrBridgeExpansion = state.arrBridge.expansionArrCents
  let arrBridgeContraction = state.arrBridge.contractionArrCents
  let arrBridgeChurn = state.arrBridge.churnArrCents
  let arrBridgeDelinquencyLoss = state.arrBridge.delinquencyLossArrCents
  let arrBridgeRestoration = state.arrBridge.restorationArrCents
  let openingArr = state.arrBridge.openingArrCents
  let auditedArrBridge: ArrBridge | null = state.auditedArrBridge ?? null

  const rng = new DeterministicRNG(state.seed + newElapsed)

  // 1. RESOLVE INVOICE COLLECTIONS IN ARREARS
  const updatedInvoices: InvoiceSchedule[] = []
  for (const inv of pendingInvoices) {
    if (!inv.collected && newElapsed >= inv.dueTick) {
      const acc = accounts.find(a => a.id === inv.accountId)
      const hasDirectDebit = state.activeRelics.some(r => r.id === 'relic-direct-debit')
      const hasStealthMoat = state.activeRelics.some(r => r.id === 'relic-stealth-moat')
      const baseProb = acc ? SEGMENT_PROFILES[acc.segment].collectionProbability : 0.95
      const prob = (hasDirectDebit || (hasStealthMoat && acc?.segment === 'enterprise')) ? 1.0 : baseProb
      const roll = rng.nextFloat()

      if (roll <= prob) {
        // Collected!
        newCash += inv.amountCents
        updatedInvoices.push({ ...inv, collected: true })
        alerts.push({
          id: `coll-${newElapsed}-${inv.id}`,
          tone: 'info',
          title: 'Cash Collected',
          message: `+$${(inv.amountCents / 100).toLocaleString()} invoice payment collected from ${acc?.name ?? 'customer'}.`,
          tick: newElapsed,
        })
        ledger.push({
          id: `led-coll-${newElapsed}-${inv.id}`,
          tick: newElapsed,
          category: 'finance',
          message: `Collected invoice of $${(inv.amountCents / 100).toLocaleString()} from ${acc?.name ?? 'customer'}.`,
          deltaCashCents: inv.amountCents,
        })

        // If account was delinquent, restore eligibility
        if (acc && acc.delinquent) {
          accounts = accounts.map(a => a.id === acc.id ? { ...a, delinquent: false, unpaidGraceTicks: 0 } : a)
          const restoredArr = (acc.baseMrrCents + acc.addonMrrCents) * 12
          arrBridgeRestoration += restoredArr
          alerts.push({
            id: `restored-${newElapsed}-${acc.id}`,
            tone: 'info',
            title: 'Account Restored to Good Standing',
            message: `${acc.name} cured delinquency. Restored $${(restoredArr / 100).toLocaleString()}/yr eligible ARR.`,
            tick: newElapsed,
          })
        }
      } else {
        // Payment failed/delayed
        if (inv.collectionAttempts < 3) {
          updatedInvoices.push({
            ...inv,
            dueTick: newElapsed + 120, // retry in 12s
            collectionAttempts: inv.collectionAttempts + 1,
          })
          alerts.push({
            id: `pay-retry-${newElapsed}`,
            tone: 'warning',
            title: 'Payment Retry Scheduled',
            message: `Invoice collection for ${acc?.name} delayed. Retrying in 12s (Attempt ${inv.collectionAttempts + 1}/3).`,
            tick: newElapsed,
          })
        } else {
          // Mark delinquent
          if (acc && !acc.delinquent) {
            accounts = accounts.map(a => a.id === acc.id ? { ...a, delinquent: true } : a)
            const lostArr = (acc.baseMrrCents + acc.addonMrrCents) * 12
            arrBridgeDelinquencyLoss += lostArr
            alerts.push({
              id: `delinq-${newElapsed}-${acc.id}`,
              tone: 'critical',
              title: 'Account Delinquent',
              message: `${acc.name} missed 3 payment attempts. Temporarily excluded from eligible ARR (-$${(lostArr / 100).toLocaleString()}/yr ARR).`,
              tick: newElapsed,
            })
          }
        }
      }
    } else {
      updatedInvoices.push(inv)
    }
  }

  // 2. CHECK MONTHLY BOUNDARY (Every 600 ticks = 60s)
  while (ticksInCurrentMonth >= TICKS_PER_MONTH) {
    ticksInCurrentMonth -= TICKS_PER_MONTH
    monthInQuarter += 1
    const nextDueTick = newElapsed

    // relic-debt-arbitrage: 12% annualized yield on unspent cash reserves every month (1% per month)
    if (state.activeRelics.some(r => r.id === 'relic-debt-arbitrage') && newCash > 0) {
      const monthlyYield = Math.round(newCash * 0.01)
      if (monthlyYield > 0) {
        newCash += monthlyYield
        ledger.push({
          id: `led-debt-arb-${newElapsed}-${monthInQuarter}`,
          tick: newElapsed,
          category: 'finance',
          message: `Treasury Arbitrage Yield: +$${(monthlyYield / 100).toLocaleString()} (1% monthly yield).`,
          deltaCashCents: monthlyYield,
        })
      }
    }

    // Founder Relic / Archetype Treasury Yield on unspent cash reserves every month
    if ((activeBuffs.cashYieldBonus ?? 0) > 0 && newCash > 0) {
      const monthlyYield = Math.round((newCash * activeBuffs.cashYieldBonus) / 12)
      if (monthlyYield > 0) {
        newCash += monthlyYield
        ledger.push({
          id: `led-treasury-yield-${newElapsed}-${monthInQuarter}`,
          tick: newElapsed,
          category: 'finance',
          message: `Founder Treasury Yield: +$${(monthlyYield / 100).toLocaleString()} (${Math.round(activeBuffs.cashYieldBonus * 100)}% annualized yield).`,
          deltaCashCents: monthlyYield,
        })
      }
    }

    const opexDiscountMult = 1 - Math.min(0.8, activeBuffs.opexDiscount || 0)

    // Enqueue Base Overhead Bill (scaled by evolution tier & OPEX discount) for upcoming month
    const activeTier = getActiveEvolutionTier(state).tier
    const hasFreeOverhead = state.activeRelics.some(r => r.id === 'relic-immortal-balance')
    const rawTierOverhead = hasFreeOverhead ? 0 : (TIER_BASE_OVERHEAD_MONTHLY_CENTS[activeTier] ?? BASE_OVERHEAD_MONTHLY_CENTS)
    const tierOverhead = Math.round(rawTierOverhead * opexDiscountMult)
    if (tierOverhead > 0) {
      mandatoryBills.push({
        id: `bill-overhead-${newElapsed}-${monthInQuarter}`,
        category: 'base_overhead',
        amountCents: tierOverhead,
        dueTick: nextDueTick,
        label: `Monthly Fixed Overhead (${activeTier.toUpperCase()} Tier)${opexDiscountMult < 1 ? ` (${Math.round((1 - opexDiscountMult) * 100)}% OPEX discount)` : ''}`,
      })
    }

    // Enqueue Cloud Infrastructure & Model Inference COGS in Growth/Ethereal tiers
    if (activeTier === 'growth' || activeTier === 'ethereal') {
      const cogsFraction = activeTier === 'ethereal' ? 0.15 : 0.10
      const infraComputeCents = Math.round(((state.eligibleArrCents * cogsFraction) / 12) * opexDiscountMult)
      if (infraComputeCents > 0) {
        mandatoryBills.push({
          id: `bill-cogs-${newElapsed}-${monthInQuarter}`,
          category: 'infrastructure_cogs',
          amountCents: infraComputeCents,
          dueTick: nextDueTick,
          label: `Cloud Cluster, Ingress & Model Inference COGS (${activeTier.toUpperCase()})`,
        })
      }
    }

    // Enqueue Agent Compute Upkeep Bills (relic-gpu-cluster waives automate upkeep)
    const hasGpuCluster = state.activeRelics.some(r => r.id === 'relic-gpu-cluster')
    let totalAgentUpkeep = 0
    for (const fn of ['demand', 'product', 'monetisation', 'retention', 'expansion', 'operations'] as const) {
      const f = state.fleet[fn]
      if (f.automateRank > 0 && !hasGpuCluster) {
        totalAgentUpkeep += AUTOMATE_UPKEEP_CENTS[f.automateRank] * f.onlineUnits
      }
      if (f.onlineUnits > 1) {
        totalAgentUpkeep += (f.onlineUnits - 1) * EXTRA_UNIT_UPKEEP_CENTS
      }
    }
    if (totalAgentUpkeep > 0) {
      const discountedAgentUpkeep = Math.round(totalAgentUpkeep * opexDiscountMult)
      mandatoryBills.push({
        id: `bill-compute-${newElapsed}-${monthInQuarter}`,
        category: 'agent_compute',
        amountCents: discountedAgentUpkeep,
        dueTick: nextDueTick,
        label: `Autonomous Agent Cluster Compute & Tokens${opexDiscountMult < 1 ? ` (${Math.round((1 - opexDiscountMult) * 100)}% OPEX discount)` : ''}`,
      })
    }

    // Enqueue Debt Payment if active
    if (debtActive && debtPrincipal > 0) {
      const monthlyInterest = Math.floor((debtPrincipal * 1800) / 120000)
      const principalPortion = Math.ceil(debtPrincipal / Math.max(1, debtMonthsRemaining))
      const totalDue = monthlyInterest + principalPortion
      debtMonthlyPayment = totalDue

      mandatoryBills.push({
        id: `bill-debt-${newElapsed}-${monthInQuarter}`,
        category: 'debt_principal',
        amountCents: totalDue,
        dueTick: nextDueTick,
        label: `Monthly Debt Payment ($${(principalPortion / 100).toLocaleString()} principal + $${(monthlyInterest / 100).toLocaleString()} interest)`,
      })
    }

    // Generate monthly invoices for recurring accounts
    for (const acc of accounts) {
      if (!acc.delinquent) {
        const mrr = acc.baseMrrCents + acc.addonMrrCents
        const delay = SEGMENT_PROFILES[acc.segment].collectionDelayTicks
        updatedInvoices.push({
          id: `inv-month-${newElapsed}-${acc.id}-${monthInQuarter}`,
          accountId: acc.id,
          amountCents: mrr,
          dueTick: newElapsed + delay,
          collected: false,
          collectionAttempts: 0,
        })
      }
    }

    // Check Quarter Boundary (Every 3 months = 1,800 ticks)
    if (monthInQuarter > 3) {
      monthInQuarter = 1
      quarter += 1

      // Advance competition (+0.025 per quarter, capped at 0.85)
      competitionFactor = Math.min(COMPETITION_CAP, competitionFactor + COMPETITION_PER_QUARTER)

      // VC Mandate verification & Eligible ARR totals
      const currentArrTotals = calculateArrTotals(accounts)
      const currentEligible = currentArrTotals.eligibleArrCents

      if (state.vc.accepted) {
        const targetArr = Math.round(vcBaselineArrCents * (1 + state.vc.requiredGrowthRatio))
        if (currentEligible < targetArr) {
          return {
            ...state,
            elapsedTicks: newElapsed,
            cashCents: newCash,
            runStatus: 'failed',
            failureReason: `VC Mandate Default: Missed required quarterly ARR target of $${(targetArr / 100).toLocaleString()}/yr. Current: $${(currentEligible / 100).toLocaleString()}/yr. Board dissolved management.`,
          }
        }
        // Met VC target! Reset baseline for next quarter
        vcBaselineArrCents = currentEligible
        vcNextDeadlineTick = newElapsed + TICKS_PER_QUARTER
        alerts.push({
          id: `vc-success-${newElapsed}`,
          tone: 'info',
          title: 'VC Quarterly Target Met!',
          message: `Achieved $${(currentEligible / 100).toLocaleString()}/yr ARR. Board ratified progress; next quarterly target is $${(Math.round(currentEligible * 1.5) / 100).toLocaleString()}/yr ARR.`,
          tick: newElapsed,
        })
        ledger.push({
          id: `led-vc-milestone-${newElapsed}`,
          tick: newElapsed,
          category: 'finance',
          message: `Met VC mandate with $${(currentEligible / 100).toLocaleString()}/yr ARR. Baseline rolled over.`,
        })
      }

      // Snapshot audited ARR bridge for completed quarter before rolling over
      auditedArrBridge = {
        openingArrCents: openingArr,
        newArrCents: arrBridgeNew,
        expansionArrCents: arrBridgeExpansion,
        contractionArrCents: arrBridgeContraction,
        churnArrCents: arrBridgeChurn,
        delinquencyLossArrCents: arrBridgeDelinquencyLoss,
        restorationArrCents: arrBridgeRestoration,
        closingArrCents: currentEligible,
      }

      // Roll over ARR bridge for the new quarter
      openingArr = currentEligible
      arrBridgeNew = 0
      arrBridgeExpansion = 0
      arrBridgeContraction = 0
      arrBridgeChurn = 0
      arrBridgeDelinquencyLoss = 0
      arrBridgeRestoration = 0

      // Offer fresh relics and consumables with deterministic RNG shuffle, preserving locked items across quarters
      quarterReviewPending = true
      const lockedRelicSet = new Set(lockedQuarterRelicIds)
      const keptRelics = availableQuarterRelics.filter(r =>
        lockedRelicSet.has(r.id) && !state.activeRelics.some(ar => ar.id === r.id)
      )
      const unownedRelics = RELIC_CATALOG.filter(r =>
        !state.activeRelics.some(ar => ar.id === r.id) &&
        !keptRelics.some(kr => kr.id === r.id)
      )
      const shuffledRelics = [...unownedRelics].sort(() => rng.nextFloat() - 0.5)
      const neededRelics = Math.max(0, 3 - keptRelics.length)
      availableQuarterRelics = [...keptRelics, ...shuffledRelics.slice(0, neededRelics)]
      lockedQuarterRelicIds = keptRelics.map(r => r.id)

      const lockedConsSet = new Set(lockedQuarterConsumableIds)
      const currentConsIds = (state.consumablesInventory || []).map(c => c.id)
      const keptConsumables = availableQuarterConsumables.filter(c =>
        lockedConsSet.has(c.id) && !currentConsIds.includes(c.id)
      )
      const unownedConsumables = CONSUMABLE_CATALOG.filter(c =>
        !currentConsIds.includes(c.id) &&
        !keptConsumables.some(kc => kc.id === c.id)
      )
      const shuffledConsumables = [...unownedConsumables].sort(() => rng.nextFloat() - 0.5)
      const neededConsumables = Math.max(0, 2 - keptConsumables.length)
      availableQuarterConsumables = [...keptConsumables, ...shuffledConsumables.slice(0, neededConsumables)]
      lockedQuarterConsumableIds = keptConsumables.map(c => c.id)
      quarterReviewRerolls = 0

      // Sovereign Compute Grant relic: +$15,000 cash grant
      if (state.activeRelics.some(r => r.id === 'relic-sovereign-grant')) {
        newCash += 1_500_000 // $15k
        alerts.push({
          id: `grant-${newElapsed}`,
          tone: 'info',
          title: 'Sovereign AI Compute Grant Awarded',
          message: '+$15,000 liquid capital wired from Sovereign AI Infrastructure Reserve!',
          tick: newElapsed,
        })
      }

      // Classified Defense Exclusivity relic: +$250,000 recurring grant
      if (state.activeRelics.some(r => r.id === 'relic-defense-monopoly')) {
        const defenseGrant = 25_000_000 // $250,000
        newCash += defenseGrant
        alerts.push({
          id: `defense-grant-${newElapsed}`,
          tone: 'info',
          title: 'Classified Defense Exclusivity Grant',
          message: '+$250,000 recurring government AI research grant wired to company treasury!',
          tick: newElapsed,
        })
        ledger.push({
          id: `led-def-grant-${newElapsed}`,
          tick: newElapsed,
          category: 'finance',
          message: 'Classified Defense Exclusivity: +$250,000 research grant received.',
          deltaCashCents: defenseGrant,
        })
      }

      // Self-Healing Architecture relic: auto-heal 1 incident per quarter
      if (state.activeRelics.some(r => r.id === 'relic-circuit-breaker')) {
        incidents = Math.max(0, incidents - 1)
        alerts.push({
          id: `cb-heal-${newElapsed}`,
          tone: 'info',
          title: 'Circuit Breaker Auto-Heal',
          message: 'Self-healing watchdog daemon automatically resolved 1 operational incident!',
          tick: newElapsed,
        })
      }

      // Viral Flywheel Monolith relic: Every 10 active customers compound ARR by +3%
      if (state.activeRelics.some(r => r.id === 'relic-viral-monolith')) {
        const activeCount = accounts.filter(a => !a.delinquent).length
        const viralBonus = Math.floor(activeCount / 10) * 0.03
        if (viralBonus > 0) {
          let compoundArr = 0
          accounts = accounts.map(a => {
            if (!a.delinquent) {
              const extraMrr = Math.round(a.baseMrrCents * viralBonus)
              compoundArr += extraMrr * 12
              return { ...a, baseMrrCents: a.baseMrrCents + extraMrr }
            }
            return a
          })
          if (compoundArr > 0) {
            arrBridgeExpansion += compoundArr
            alerts.push({
              id: `viral-mono-${newElapsed}`,
              tone: 'info',
              title: 'Viral Flywheel Monolith Compounding!',
              message: `+${(viralBonus * 100).toFixed(0)}% ARR compounding added $${(compoundArr / 100).toLocaleString()}/yr ARR across active accounts!`,
              tick: newElapsed,
            })
          }
        }
      }

      // Reset consumable quarter valuation boost multiple after review is generated
      quarterValuationBoostMultiple = 0

      // Negative Net Churn relic: +5% ARR expansion on healthy accounts
      if (state.activeRelics.some(r => r.id === 'relic-negative-churn')) {
        let expansionSum = 0
        accounts = accounts.map(a => {
          if (a.health >= 70 && !a.delinquent) {
            const extraMrr = Math.max(500, Math.round(a.baseMrrCents * 0.05))
            expansionSum += extraMrr * 12
            return { ...a, baseMrrCents: a.baseMrrCents + extraMrr }
          }
          return a
        })
        if (expansionSum > 0) {
          arrBridgeExpansion += expansionSum
          alerts.push({
            id: `neg-churn-${newElapsed}`,
            tone: 'info',
            title: 'Negative Net Churn Flywheel Active!',
            message: `+$${(expansionSum / 100).toLocaleString()}/yr expansion ARR generated across satisfied accounts.`,
            tick: newElapsed,
          })
        }
      }
    }
  }

  // 3. PROACTIVE RUNWAY RISK MONITORING & SETTLEMENT OF MANDATORY BILLS
  for (const bill of mandatoryBills) {
    const ticksUntilDue = bill.dueTick - newElapsed
    if (ticksUntilDue > 0 && ticksUntilDue <= 220 && newCash < bill.amountCents) {
      const hasRecentRunwayAlert = alerts.some(
        a => a.id.startsWith(`runway-risk-${bill.id}`) && newElapsed - a.tick < 100
      )
      if (!hasRecentRunwayAlert) {
        alerts.push({
          id: `runway-risk-${bill.id}-${newElapsed}`,
          tone: 'critical',
          title: '🚨 CRITICAL RUNWAY ALERT',
          message: `Mandatory bill '${bill.label}' of $${(bill.amountCents / 100).toLocaleString()} due in ${Math.ceil(ticksUntilDue / 10)}s! Liquid cash ($${Math.max(0, Math.round(newCash / 100)).toLocaleString()}) cannot cover this. Draw debt in Finance [7] or cash out in Operations [6] to prevent shutdown!`,
          tick: newElapsed,
          targetFunction: 'finance',
          actionLabel: 'Draw Liquidity [7]',
        })
      }
    }
  }

  // Settle due bills (can trigger insolvency failure if cash cannot cover)
  const remainingBills: MandatoryBill[] = []
  for (const bill of mandatoryBills) {
    if (newElapsed >= bill.dueTick) {
      if (newCash < bill.amountCents) {
        // INSOLVENCY GAME OVER
        return {
          ...state,
          elapsedTicks: newElapsed,
          cashCents: newCash,
          runStatus: 'failed',
          failureReason: `Insolvency: Company failed to pay mandatory bill '${bill.label}' of $${(bill.amountCents / 100).toLocaleString()} when due.`,
          alerts: [
            ...alerts,
            {
              id: `fail-insolvent-${newElapsed}`,
              tone: 'critical',
              title: 'INVOLUNTARY LIQUIDATION',
              message: `Defaulted on mandatory obligation: ${bill.label}. Company shut down.`,
              tick: newElapsed,
            },
          ],
        }
      } else {
        newCash -= bill.amountCents
        ledger.push({
          id: `led-bill-${newElapsed}-${bill.id}`,
          tick: newElapsed,
          category: 'finance',
          message: `Paid mandatory bill: ${bill.label}.`,
          deltaCashCents: -bill.amountCents,
        })

        // If debt bill, amortize principal!
        if (bill.category === 'debt_principal' && debtActive) {
          const principalPortion = Math.ceil(debtPrincipal / Math.max(1, debtMonthsRemaining))
          debtPrincipal = Math.max(0, debtPrincipal - principalPortion)
          debtMonthsRemaining = Math.max(0, debtMonthsRemaining - 1)
          if (debtPrincipal <= 0 || debtMonthsRemaining <= 0) {
            debtActive = false
            debtPrincipal = 0
            debtMonthsRemaining = 0
            debtMonthlyPayment = 0
            alerts.push({
              id: `debt-cleared-${newElapsed}`,
              tone: 'info',
              title: 'Debt Facility Fully Repaid!',
              message: 'All scheduled principal and interest obligations paid in full.',
              tick: newElapsed,
            })
          }
        }

        alerts.push({
          id: `paid-${newElapsed}-${bill.id}`,
          tone: 'info',
          title: 'Obligation Paid',
          message: `Paid $${(bill.amountCents / 100).toLocaleString()} for ${bill.label}.`,
          tick: newElapsed,
        })
      }
    } else {
      remainingBills.push(bill)
    }
  }

  // 4. UPDATE OPERATIONS & STRAIN MECHANICS
  const hasSelfHealing = state.activeRelics.some(r => r.id === 'relic-circuit-breaker')
  const opsMetrics = calculateOperationsMetrics(
    state.fleet,
    strainBacklog,
    contextRot,
    hasSelfHealing
  )

  // Strain accumulation if coordination load exceeds capacity
  // relic-hyper-concurrency: Operations cluster strain generation reduced by 60% across all functions
  const hasHyperConcurrency = state.activeRelics.some(r => r.id === 'relic-hyper-concurrency')
  const strainReductionMult = (hasHyperConcurrency ? 0.40 : 1.0) * (1 - Math.min(0.8, activeBuffs.strainReduction || 0))
  if (opsMetrics.instantOverload > 0) {
    strainBacklog += (((opsMetrics.coordinationLoad - opsMetrics.opsCapacity) / 600) * dtTicks) * strainReductionMult
  }

  // 4b. ORGANIC INBOUND DEMAND REPLENISHMENT
  const demandSpeedBoost = (1 + 0.3 * (state.fleet.demand.automateRank || 0)) * (1 + (activeBuffs.demandRateBonus || 0))
  const replenishInterval = Math.round(DEMAND_REPLENISH_INTERVAL_TICKS / demandSpeedBoost)
  const hasColdOutreach = state.activeRelics.some(r => r.id === 'relic-cold-outreach')
  const maxDemandSignals = hasColdOutreach ? 8 : 6
  if (newElapsed - lastDemandReplenishTick >= replenishInterval) {
    if (demandSignals.length < maxDemandSignals) {
      let fresh = createDynamicDemandSignals(state.valuationCents, newElapsed)
      if (state.activeRelics.some(r => r.id === 'relic-tam-expansion')) {
        fresh = fresh.map(s => ({ ...s, estimatedWtpCents: Math.round(s.estimatedWtpCents * 1.25) }))
      }
      const needed = maxDemandSignals - demandSignals.length
      const existingTitles = new Set(demandSignals.map(s => s.title))
      const available = fresh.filter(s => !existingTitles.has(s.title))
      const pool = available.length > 0 ? available : fresh
      const rng = new DeterministicRNG(state.seed + newElapsed * 31)
      const shuffled = [...pool].sort(() => rng.nextFloat() - 0.5)
      const toAdd = shuffled.slice(0, Math.min(needed, hasColdOutreach ? 5 : 3))
      demandSignals = [...demandSignals, ...toAdd]
      lastDemandReplenishTick = newElapsed
    }
  }

  // relic-open-source: 1 free pre-qualified lead every 150 ticks (15s) at $0 CAC
  if (state.activeRelics.some(r => r.id === 'relic-open-source') && newElapsed % 150 < dtTicks && qualifiedOpportunities.length < 50) {
    qualifiedOpportunities.push({
      id: `oss-lead-${newElapsed}`,
      signalId: `sig-oss-${newElapsed}`,
      segment: 'creator',
      title: '[GitHub Trending] Viral Open Source Inbound Lead',
      quote: 'Found project on GitHub trending repo (24k stars). Direct developer adoption.',
      estimatedWtpCents: 15_000,
      qualifiedTick: newElapsed,
    })
    alerts.push({
      id: `alert-oss-${newElapsed}`,
      tone: 'info',
      title: 'Organic Open Source Lead Arrived',
      message: 'Viral GitHub repo delivered 1 pre-qualified opportunity at $0 CAC!',
      tick: newElapsed,
    })
  }

  // relic-customer-advocacy: Every 20 active paying customers organically delivers 1 pre-qualified lead every 200 ticks (20s)
  if (state.activeRelics.some(r => r.id === 'relic-customer-advocacy') && newElapsed % 200 < dtTicks && qualifiedOpportunities.length < 50) {
    const activePayingCount = accounts.filter(a => !a.delinquent).length
    if (activePayingCount >= 20) {
      qualifiedOpportunities.push({
        id: `advocacy-lead-${newElapsed}`,
        signalId: `sig-adv-${newElapsed}`,
        segment: 'team',
        title: '[Advocacy Viral Loop] Customer Community Referral',
        quote: 'Recommended in private developer Discord by active enterprise customer.',
        estimatedWtpCents: 45_000,
        qualifiedTick: newElapsed,
      })
      alerts.push({
        id: `alert-adv-${newElapsed}`,
        tone: 'info',
        title: 'Net Promoter Lead Inbound',
        message: 'Active paying accounts generated an organic peer recommendation at $0 CAC!',
        tick: newElapsed,
      })
    }
  }

  // Synergy: Word-of-Mouth Inbound Engine (Retention ➔ Demand)
  // When customer fleet has >= 90% average health with 0 churn threats, customers generate viral word-of-mouth
  const isPristineFleet = accounts.length >= 3 && accounts.every(a => a.health >= 90 && !a.isThreatened && !a.delinquent)
  if (isPristineFleet && newElapsed % 450 < dtTicks && qualifiedOpportunities.length < 50) {
    const womSegment: CustomerSegment = state.valuationCents > 50_000_000 ? 'enterprise' : 'team'
    const womWtp = womSegment === 'enterprise' ? 120_000 : 35_000
    qualifiedOpportunities.push({
      id: `wom-opp-${newElapsed}`,
      signalId: `sig-wom-${newElapsed}`,
      segment: womSegment,
      title: `[Word-of-Mouth] ${womSegment === 'enterprise' ? 'Sovereign Bank AI' : 'LinearNext AI'} (Client Referral)`,
      quote: 'Referred by satisfied customer with 100% SLA uptime. Ready for immediate deployment.',
      estimatedWtpCents: womWtp,
      qualifiedTick: newElapsed,
    })
    alerts.push({
      id: `alert-wom-${newElapsed}`,
      tone: 'info',
      title: 'Viral Word-of-Mouth Referral Inbound!',
      message: 'Your 90%+ fleet health generated a high-intent referral at $0 CAC!',
      tick: newElapsed,
    })
  }

  // 5. FLEET AUTOMATION WORK ACCUMULATION
  const updatedFleet = { ...state.fleet }
  let systemCapabilities = { ...state.systemCapabilities }
  let productPods = state.productPods ? [...state.productPods] : undefined

  const hasShadowFleet = state.activeRelics.some(r => r.id === 'relic-shadow-fleet')
  const economicBurnCurrent = calculateEconomicBurn(state)
  const isSurvivalMode = hasShadowFleet && economicBurnCurrent.economicDeficitMonthCents > 0 && (newCash / economicBurnCurrent.economicDeficitMonthCents) < 6

  const functionKeys: FunctionId[] = ['demand', 'product', 'monetisation', 'retention', 'expansion', 'operations']
  for (const fn of functionKeys) {
    const f = { ...updatedFleet[fn] }
    if (f.automateRank > 0 && f.onlineUnits > 0) {
      const baseSpeed = AUTOMATE_SPEEDS[f.automateRank]
      const hasSingularity = state.activeRelics.some(r => r.id === 'relic-singularity-supercore')
      const relicBoost = (state.activeRelics.some(r => r.id === 'relic-gpu-cluster') ? 1.25 : 1.0)
        * (hasSingularity ? 2.0 : 1.0)
        * (isSurvivalMode ? 2.5 : 1.0)
        * (1 + (activeBuffs.automateSpeedBonus || 0))
      const warRoomMult = warRoomTicksRemaining > 0 ? warRoomSpeedMultiplier : 1.0
      // Synergy: Clean Cluster Sub-Millisecond Synchrony (+30% velocity when cluster is pristine)
      const cleanClusterMult = (contextRot < 0.05 && strainBacklog <= 0.1) ? 1.30 : 1.0
      const effectiveSpeed = baseSpeed * relicBoost * opsMetrics.speedFactor * warRoomMult * cleanClusterMult
      const manualSec = FUNCTION_SPECS[fn].manualSeconds || 4
      const progressDelta = ((effectiveSpeed * f.onlineUnits) / manualSec) * (dtTicks / 10)
      f.accumulatedWorkCredits += progressDelta

      if (f.accumulatedWorkCredits >= 1) {
        const attempts = Math.floor(f.accumulatedWorkCredits)
        f.accumulatedWorkCredits -= attempts

        // Rot accumulation from auto attempts
        let rotDelta = attempts * (0.0008 + 0.0004 * f.automateRank) * (1 + 0.5 * opsMetrics.excessStrain)
        if (state.activeRelics.some(r => r.id === 'relic-vibe-coder')) rotDelta *= 0.50
        contextRot = clamp(contextRot + rotDelta, 0, 1)

        if (fn === 'operations') {
          // Ops maintenance output: drains strain and cleanses rot
          strainBacklog = Math.max(0, strainBacklog - attempts * 5.0)
          contextRot = Math.max(0, contextRot - attempts * 0.05)
          if (incidents > 0 && rng.nextFloat() < 0.3 * attempts) {
            incidents = Math.max(0, incidents - 1)
          }

          // Queue automations: agents blindly open and redeem tickets across active rack stations regardless of outcome
          const opsCraftRank = f.craftRank || 0
          const craftMultiplier = 1 + 0.25 * opsCraftRank
          const luck = calculateLuckVariance(f.luckRank, rng.nextFloat())
          const stationsToProcess = Math.min(attempts, currentTickets.length)
          for (let s = 0; s < stationsToProcess; s++) {
            const tIdx = s % currentTickets.length
            const ticket = currentTickets[tIdx]
            if (ticket.isBusted) {
              currentTickets[tIdx] = createDiagnosticTicket(tIdx, opsLuck)
              continue
            }
            const pod = ticket.pods[0]
            if (pod) {
              if (pod.isNegative) {
                if (patentShieldTicksRemaining > 0) {
                  alerts.push({
                    id: `ticket-deflect-daemon-${newElapsed}-${tIdx}`,
                    tone: 'info',
                    title: 'Patent Shield Deflected Fault!',
                    message: `Autonomous diagnostic agent deflected negative hazard in Rack 0${tIdx + 1}!`,
                    tick: newElapsed,
                  })
                } else {
                  // Autonomous daemons blindly process tickets without inspecting: trips fault overload!
                  const penaltyStrain = (pod.rewardType === 'penalty' ? (pod.rewardValue as number) : (pod.rewardType === 'strain' ? (pod.rewardValue as number) : 6)) * (hasHyperConcurrency ? 0.40 : 1.0)
                  const penaltyRot = pod.rewardType === 'rot' ? (pod.rewardValue as number) : 0
                  const penaltyIncident = pod.rewardType === 'incident' ? (pod.rewardValue as number) : 0

                  strainBacklog += penaltyStrain
                  contextRot = clamp(contextRot + penaltyRot, 0, 1)
                  incidents += penaltyIncident

                  alerts.push({
                    id: `ticket-bust-daemon-${newElapsed}-${tIdx}`,
                    tone: 'critical',
                    title: pod.symbol === 'skull'
                      ? 'Daemon Tripped Memory Leak!'
                      : pod.symbol === 'panic'
                      ? 'Daemon Tripped Kernel Panic!'
                      : 'Daemon Tripped Thermal Overload!',
                    message: `Diagnostic agent in Rack 0${tIdx + 1} opened a negative hazard ticket without inspecting: +${penaltyStrain} Strain${penaltyRot ? ` & +${Math.round(penaltyRot * 100)}% Rot` : ''}${penaltyIncident ? ' & +1 Incident' : ''}! Upgrade Luck to purge hazards from ticket stream.`,
                    tick: newElapsed,
                    targetFunction: 'operations',
                    actionLabel: 'View Operations [6]',
                  })
                }
              } else {
                // Positive telemetry ticket successfully redeemed by agent
                const addedCash = pod.rewardType === 'cash' ? (pod.rewardValue as number) : (pod.symbol === 'golden_apple' ? 50_000 : 0)
                const addedStrain = pod.rewardType === 'strain' ? (pod.rewardValue as number) : (pod.symbol === 'golden_apple' ? 15 : 0)
                const addedRot = pod.rewardType === 'rot' ? (pod.rewardValue as number) : 0
                const finalCash = Math.round(addedCash * craftMultiplier * luck.multiplier)
                const finalStrain = Math.round(addedStrain * craftMultiplier * luck.multiplier)
                const finalRot = Math.min(1, addedRot * craftMultiplier * luck.multiplier)

                newCash += finalCash
                strainBacklog = Math.max(0, strainBacklog - finalStrain)
                contextRot = Math.max(0, contextRot - finalRot)

                if (pod.symbol === 'golden_apple' && productPods && productPods.length > 0) {
                  productPods = productPods.map((p, pIdx) => {
                    if (pIdx === 0) {
                      const filledSockets = p.sockets.map(s => ({ ...s, filled: true }))
                      return { ...p, sockets: filledSockets, isVerified: true, isReadyToShip: true }
                    }
                    return p
                  })
                }
              }
              // Draw next fresh ticket into this rack
              currentTickets[tIdx] = createDiagnosticTicket(tIdx, opsLuck)
            }
          }
        } else if (fn === 'product') {
          // Product capability gain: +0.02 per output scaled by craft and luck variance
          const craftMult = CRAFT_MULTIPLIERS[f.craftRank] || 1
          const luck = calculateLuckVariance(f.luckRank, rng.nextFloat())
          const hasAutoCompiler = state.activeRelics.some(r => r.id === 'relic-auto-compiler')
          const hasFeatureFlags = state.activeRelics.some(r => r.id === 'relic-feature-flags')
          const compilerMult = hasAutoCompiler ? 1.20 : 1.0
          const capGain = 0.02 * attempts * (craftMult > 2 ? 1.5 : 1) * luck.multiplier * compilerMult
          systemCapabilities = {
            speed: clamp(systemCapabilities.speed + capGain, 0, 1),
            collaboration: clamp(systemCapabilities.collaboration + capGain, 0, 1),
            control: clamp(systemCapabilities.control + capGain, 0, 1),
          }

          // Sync pods with scale and craft
          const scaleRank = f.scaleRank || 0
          const craftRank = f.craftRank || 0
          productPods = syncProductPods(productPods, qualifiedOpportunities, scaleRank, craftRank)

          // Automated workers stream tokens into open sockets
          let socketsToFill = attempts * (f.automateRank >= 2 ? 2 : 1)
          for (let pIdx = 0; pIdx < productPods.length && socketsToFill > 0; pIdx++) {
            const pod = productPods[pIdx]
            const openSockets = pod.sockets.filter(s => !s.filled)
            if (openSockets.length > 0) {
              const updatedSockets = pod.sockets.map(s => {
                if (!s.filled && socketsToFill > 0) {
                  socketsToFill--
                  return { ...s, filled: true }
                }
                return s
              })
              const allFilled = updatedSockets.every(s => s.filled)
              productPods[pIdx] = {
                ...pod,
                sockets: updatedSockets,
                isVerified: allFilled,
                isReadyToShip: allFilled,
              }
            }
          }

          // At automateRank >= 3, automatically ship ready pods ONLY IF they have an opportunity!
          if (f.automateRank >= 3 && qualifiedOpportunities.length > 0) {
            for (let pIdx = 0; pIdx < productPods.length; pIdx++) {
              const pod = productPods[pIdx]
              if (pod.isReadyToShip && pod.opportunityId && qualifiedOpportunities.length > 0) {
                const autoActivation: ProductActivation = {
                  id: `act-pod-auto-${newElapsed}-${pIdx}-${Math.floor(rng.nextFloat() * 1000)}`,
                  title: pod.leadTitle,
                  targetSegment: pod.leadSegment,
                  speedFit: systemCapabilities.speed,
                  collabFit: systemCapabilities.collaboration,
                  controlFit: systemCapabilities.control,
                  overallFit: (systemCapabilities.speed + systemCapabilities.collaboration + systemCapabilities.control) / 3,
                  defectExposure: clamp((0.02 - 0.004 * f.craftRank) * (hasAutoCompiler ? 0.50 : 1.0) * (hasFeatureFlags ? 0.60 : 1.0), 0.001, 0.05),
                  timestampTick: newElapsed,
                  customWtpMonthlyCents: pod.leadWtpCents,
                }
                activationsQueue.push(autoActivation)
                if (!currentActivation) {
                  currentActivation = autoActivation
                }

                // Remove this opportunity
                const oppIdx = qualifiedOpportunities.findIndex(o => o.id === pod.opportunityId)
                if (oppIdx !== -1) {
                  qualifiedOpportunities.splice(oppIdx, 1)
                } else if (qualifiedOpportunities.length > 0) {
                  qualifiedOpportunities.shift()
                }

                // Refill pod from remaining opportunities or idle template
                const nextOpp = qualifiedOpportunities[0]
                const mod = CODING_POD_MODULES[pod.slotIndex % CODING_POD_MODULES.length]
                const nextSegment = nextOpp?.segment ?? mod.segmentAffinity
                productPods[pIdx] = {
                  id: `pod-${pod.slotIndex}-${nextOpp?.id ?? 'idle'}-${newElapsed}`,
                  slotIndex: pod.slotIndex,
                  opportunityId: nextOpp?.id,
                  leadTitle: nextOpp?.title ?? `Awaiting Qualified Lead`,
                  leadSegment: nextSegment,
                  leadWtpCents: nextOpp?.estimatedWtpCents ?? 15_000,
                  moduleName: mod.moduleName,
                  categoryTag: mod.categoryTag,
                  codeSnippet: mod.codeSnippet,
                  linesAdded: Math.round(mod.baseLinesAdded * (1 + 0.25 * f.craftRank)),
                  linesRemoved: mod.baseLinesRemoved,
                  sockets: createSocketsForSegment(nextSegment),
                  isVerified: false,
                  isReadyToShip: false,
                }
              }
            }
          }
        } else if (fn === 'demand') {
          // Automated demand fleet qualifies signals
          const craftMult = CRAFT_MULTIPLIERS[f.craftRank] || 1
          const signalsToProcess = Math.min(attempts * craftMult, demandSignals.length, 3)
          const hasSiliconMafia = state.activeRelics.some(r => r.id === 'relic-silicon-mafia') && f.onlineUnits >= 16
          for (let s = 0; s < signalsToProcess; s++) {
            const signal = demandSignals[0]
            if (signal) {
              const qual = calculateDemandQualification(
                signal,
                systemCapabilities,
                f.craftRank || 0,
                f.luckRank || 0,
                false,
                rng.nextFloat(),
                rng.nextFloat(),
                false
              )
              if (newCash >= qual.effectiveCac + 10_000) {
                newCash -= qual.effectiveCac
                demandSignals.shift()
                if (qual.success) {
                  const oppCount = hasSiliconMafia ? 2 : 1
                  for (let i = 0; i < oppCount; i++) {
                    qualifiedOpportunities.push({
                      id: `opp-auto-${newElapsed}-${signal.id}-${i}`,
                      signalId: signal.id,
                      segment: signal.segment,
                      title: qual.isLuckyWhale ? `[WHALE INBOUND] ${signal.title}` : signal.title,
                      quote: signal.quote || signal.signalRationale,
                      estimatedWtpCents: qual.effectiveWtp,
                      qualifiedTick: newElapsed,
                    })
                  }
                }
              }
            }
          }
        } else if (fn === 'monetisation') {
          // Automated monetisation closes activations across deal desks with luck variance
          const craftMult = MONETISATION_CRAFT_MULTIPLIERS[f.craftRank] || 1.0
          const luck = calculateLuckVariance(f.luckRank, rng.nextFloat())
          const deskDealsToClose = Math.min(attempts, currentDesks.length)
          const hasAlgoPricing = state.activeRelics.some(r => r.id === 'relic-algo-pricing')
          const hasSoc2 = state.activeRelics.some(r => r.id === 'relic-soc2-fasttrack')
          let closedThisTick = 0
          for (let d = 0; d < currentDesks.length && closedThisTick < deskDealsToClose; d++) {
            const desk = currentDesks[d]
            const act = desk.activation
            if (act) {
              closedThisTick++
              const conv = calculateCustomerConversion(act.targetSegment, systemCapabilities, 0, competitionFactor)
              let unitPrice = act.customWtpMonthlyCents ? Math.round(act.customWtpMonthlyCents * conv.fit) : conv.effectiveWtpMonthlyCents
              if (hasAlgoPricing) unitPrice = Math.round(unitPrice * 1.35)
              if (hasSoc2 && act.targetSegment === 'enterprise') unitPrice = Math.round(unitPrice * 1.50)
              const scaledMonthly = Math.round(unitPrice * craftMult * luck.multiplier)
              const annualArr = scaledMonthly * 12

              const names: Record<string, string[]> = {
                creator: ['VibeStudio LLC', 'SyntaxPod Media', 'AutonomousSolos Inc', 'HyperStack Studio', 'PromptLab Works'],
                team: ['StripeFlow Technologies', 'LinearNext AI', 'VectorScale Labs', 'OmniFlow Cloud', 'KubeMesh Systems'],
                enterprise: ['Apex Financial Cloud', 'Novartis GenSec', 'Consolidated Logistics', 'Sovereign Bank AI', 'AetherGlobal Telecom'],
              }
              const pool = names[act.targetSegment]
              const custName = pool[Math.floor(rng.nextFloat() * pool.length)]

              const autoAccount: CustomerAccount = {
                id: `acc-auto-${newElapsed}-${d}-${Math.floor(rng.nextFloat() * 1000)}`,
                name: custName,
                segment: act.targetSegment,
                baseMrrCents: scaledMonthly,
                addonMrrCents: 0,
                health: INITIAL_CUSTOMER_HEALTH,
                ageTicks: 0,
                addonSlotsUsed: 0,
                isThreatened: false,
                threatDeadlineTick: null,
                threatReason: null,
                unpaidGraceTicks: 0,
                delinquent: false,
                lastCollectionAttemptTick: null,
                fit: conv.fit,
                overpricing: 0,
                defects: act.defectExposure,
                serviceRemainderCents: 0,
              }
              accounts.push(autoAccount)
              arrBridgeNew += annualArr

              let delay = SEGMENT_PROFILES[act.targetSegment].collectionDelayTicks
              if (act.targetSegment === 'enterprise') {
                if (state.activeRelics.some(r => r.id === 'relic-zk-proofs')) {
                  delay = Math.round(delay / 4)
                } else if (state.activeRelics.some(r => r.id === 'relic-stealth-moat')) {
                  delay = 60
                }
              }
              updatedInvoices.push({
                id: `inv-auto-${newElapsed}-${autoAccount.id}`,
                accountId: autoAccount.id,
                amountCents: scaledMonthly,
                dueTick: newElapsed + delay,
                collected: false,
                collectionAttempts: 0,
              })

              const nextAct = activationsQueue.shift() || null
              currentDesks[d] = {
                ...desk,
                activation: nextAct,
                status: nextAct ? 'negotiating' : 'idle',
                postedPriceMonthlyCents: nextAct
                  ? calculateCustomerConversion(nextAct.targetSegment, systemCapabilities, 0, competitionFactor).effectiveWtpMonthlyCents
                  : 4_000,
              }
            }
          }
          currentActivation = currentDesks[0]?.activation ?? null
        } else if (fn === 'retention') {
          // Automated retention protects threatened accounts across shelf bays with luck variance
          const maxBays = RETENTION_BAY_LIMITS[f.scaleRank || 0] || 1
          const craftMult = 1 + 0.35 * (f.craftRank || 0)
          const luck = calculateLuckVariance(f.luckRank, rng.nextFloat())
          let interventionsDone = 0
          for (let aIdx = 0; aIdx < accounts.length && interventionsDone < maxBays; aIdx++) {
            const acc = accounts[aIdx]
            if (acc.isThreatened && newCash >= 2_000) {
              newCash -= 2_000
              interventionsDone++
              accounts[aIdx] = {
                ...acc,
                health: Math.min(100, acc.health + Math.round(45 * craftMult * luck.multiplier)),
                isThreatened: false,
                threatDeadlineTick: null,
                threatReason: null,
              }
              if (activeThreatId === acc.id) activeThreatId = null
              const savedArr = (acc.baseMrrCents + acc.addonMrrCents) * 12
              retentionSavedArrCents += savedArr
              if (retentionEvent?.accountId === acc.id) {
                retentionEvent = null
              }
              currentIncidents = currentIncidents.filter(i => i.accountId !== acc.id && i.id !== `threat-${acc.id}`)
              alerts = alerts.filter(al => !(al.id.startsWith('threat-alert-') && (al.id.includes(acc.id) || al.message.includes(acc.name))))
              alerts.push({
                id: `auto-ret-${newElapsed}-${acc.id}`,
                tone: 'info',
                title: 'Swarm Saved Account',
                message: `Autonomous CS Swarm defended ${acc.name} on shelf bay. Saved $${Math.round(savedArr / 100).toLocaleString()}/yr ARR.`,
                tick: newElapsed,
              })
            }
          }
        } else if (fn === 'expansion') {
          // Autonomous Merge & Supply Engine with luck variance
          const craftMult = CRAFT_MULTIPLIERS[f.craftRank] || 1
          const luck = calculateLuckVariance(f.luckRank, rng.nextFloat())

          // 1. Swarm fulfills matching customer supply demands on the matrix
          if (expansionOrders.length > 0) {
            for (let oIdx = expansionOrders.length - 1; oIdx >= 0; oIdx--) {
              const order = expansionOrders[oIdx]
              const matchIdx = mergeGrid.findIndex(item => item && item.chain === order.chain && item.tier >= order.targetTier)
              if (matchIdx !== -1) {
                mergeGrid[matchIdx] = null
                const rewardArr = Math.round(order.rewardArrCents * (1 + 0.15 * (craftMult - 1)) * luck.multiplier)
                newCash += Math.round(order.rewardCashCents * luck.multiplier)
                arrBridgeExpansion += rewardArr

                const targetAcc = accounts.find(a => a.id === order.accountId)
                if (targetAcc) {
                  accounts = accounts.map(a => a.id === order.accountId ? {
                    ...a,
                    addonMrrCents: a.addonMrrCents + Math.round(rewardArr / 12),
                    addonSlotsUsed: Math.min(2, a.addonSlotsUsed + 1),
                    health: Math.min(100, a.health + 10),
                  } : a)
                }

                if (state.activeRelics.some(r => r.id === 'relic-neural-distillation')) {
                  systemCapabilities = {
                    speed: clamp(systemCapabilities.speed * 1.05, 0, 1),
                    collaboration: clamp(systemCapabilities.collaboration * 1.05, 0, 1),
                    control: clamp(systemCapabilities.control * 1.05, 0, 1),
                  }
                }

                alerts.push({
                  id: `auto-exp-${newElapsed}-${order.id}`,
                  tone: 'info',
                  title: 'Swarm Delivered Feature Upsell',
                  message: `Swarm delivered Tier ${order.targetTier} ${order.chain.toUpperCase()} to ${order.accountName} (+$${Math.round(rewardArr / 100).toLocaleString()}/yr ARR).`,
                  tick: newElapsed,
                })

                expansionOrders.splice(oIdx, 1)
              }
            }
          }

          // 2. If automateRank >= 2, swarm auto-merges matching pairs on the grid
          if (f.automateRank >= 2) {
            let mergedCount = 0
            const maxMerges = f.automateRank >= 4 ? 4 : 2
            const gridLen = mergeGrid.length
            for (let i = 0; i < gridLen && mergedCount < maxMerges; i++) {
              const itemA = mergeGrid[i]
              if (!itemA || itemA.tier >= 7) continue
              for (let j = i + 1; j < gridLen && mergedCount < maxMerges; j++) {
                const itemB = mergeGrid[j]
                if (itemB && itemA.chain === itemB.chain && itemA.tier === itemB.tier) {
                  mergeGrid[i] = {
                    id: `item-auto-merge-${newElapsed}-${i}`,
                    chain: itemA.chain,
                    tier: (itemA.tier + 1) as any,
                  }
                  mergeGrid[j] = null
                  mergedCount++
                  break
                }
              }
            }
          }

          // 3. If automateRank >= 1 and orders exist, swarm synthesizes required Tier 1 features
          if (f.automateRank >= 1 && expansionOrders.length > 0 && newCash >= 15_000) {
            const emptyIdx = mergeGrid.findIndex(c => c === null)
            if (emptyIdx !== -1) {
              const neededChain = expansionOrders[0].chain
              const hasQuantumAnnealing = state.activeRelics.some(r => r.id === 'relic-quantum-annealing')
              const hasZeroCopy = state.activeRelics.some(r => r.id === 'relic-sub-pod-buffer')
              if (!hasZeroCopy) {
                newCash -= 1_500
              }
              mergeGrid[emptyIdx] = {
                id: `feat-auto-${newElapsed}-${emptyIdx}`,
                chain: neededChain,
                tier: hasQuantumAnnealing ? 2 : 1,
              }
            }
          }

          // 4. Background addon packs attachment for mature accounts
          for (let aIdx = 0; aIdx < accounts.length; aIdx++) {
            const acc = accounts[aIdx]
            if (acc.addonSlotsUsed < 2 && acc.health >= 60 && !acc.delinquent && acc.ageTicks >= 1200) {
              const pack = state.expansionAddonPacks[Math.min(acc.addonSlotsUsed, state.expansionAddonPacks.length - 1)]
              if (pack && newCash >= pack.costCents + 25_000) {
                newCash -= pack.costCents
                const addonMrr = Math.round(pack.addonMrrCents * craftMult * luck.multiplier)
                accounts[aIdx] = {
                  ...acc,
                  addonSlotsUsed: acc.addonSlotsUsed + 1,
                  addonMrrCents: acc.addonMrrCents + addonMrr,
                }
                arrBridgeExpansion += addonMrr * 12
                break
              }
            }
          }
        }
      }
    }
    updatedFleet[fn] = f
  }

  // 6. HEALTH & CHURN TRACKING
  let comboReset = false
  const updatedAccountsFinal = accounts.map(a => {
    const fit = a.fit ?? 0.6
    const overpricing = a.overpricing ?? 0
    const defects = a.defects ?? 0
    const care = a.isThreatened ? 0 : 0.05
    const healthDelta = calculateCustomerHealthDelta(fit, defects, overpricing, care, incidents) * (dtTicks / 600)
    let health = clamp(a.health + healthDelta, 0, 100)

    let isThreatened = a.isThreatened
    let threatDeadline = a.threatDeadlineTick
    let threatReason = a.threatReason

    // relic-algorithmic-upsell: Accounts with health < 60% automatically receive +20 health triage without founder cost
    if (state.activeRelics.some(r => r.id === 'relic-algorithmic-upsell') && health < 60 && !a.delinquent) {
      health = Math.min(100, health + 20)
    }

    // Auto-cure if customer health is restored to nominal (health >= 65)
    if (isThreatened && health >= 65) {
      isThreatened = false
      threatDeadline = null
      threatReason = null
      if (activeThreatId === a.id) {
        activeThreatId = null
      }
      currentIncidents = currentIncidents.filter(i => i.accountId !== a.id && i.id !== `threat-${a.id}`)
      if (retentionEvent?.accountId === a.id) {
        retentionEvent = null
      }
      alerts = alerts.filter(al => !(al.id.startsWith('threat-alert-') && (al.id.includes(a.id) || al.message.includes(a.name))))
    }

    // Churn threat evaluation:
    // Only compromised accounts (health < 65) face churn threats.
    // Critical degradation (health < 40) triggers immediate churn threat.
    // Moderate degradation (health < 65) faces probabilistic churn threat based on monthly churn curve.
    // Healthy accounts (health >= 65, including 100%) NEVER face churn threats.
    // Patent shield deflections suppress all churn threats!
    const monthlyChurn = calculateMonthlyChurn(health, overpricing, defects, competitionFactor) * (1 - Math.min(0.8, activeBuffs.churnResistance || 0))
    const tickChurnProb = 1 - Math.pow(1 - monthlyChurn, dtTicks / 600)

    if (patentShieldTicksRemaining <= 0 && !isThreatened && health < 65 && (health < 40 || rng.nextFloat() < tickChurnProb)) {
      isThreatened = true
      threatDeadline = newElapsed + CHURN_THREAT_TTL_TICKS // 120 ticks = 12s
      threatReason = health < 40 ? 'Severe defect exposure & latency' : 'Competitive pressure & pricing mismatch'
      activeThreatId = a.id
      if (!currentIncidents.some(i => i.accountId === a.id)) {
        currentIncidents.push({
          id: `inc-${a.id}-${newElapsed}`,
          accountId: a.id,
          accountName: a.name,
          title: threatReason,
          category: 'executive',
          urgencyTicks: CHURN_THREAT_TTL_TICKS,
          maxUrgencyTicks: CHURN_THREAT_TTL_TICKS,
          consequence: 'Contract Cancellation',
          hp: 4,
          maxHp: 4,
          threatType: 'piggy',
        })
      }
      alerts.push({
        id: `threat-alert-${newElapsed}-${a.id}`,
        tone: 'critical',
        title: 'Customer Churn Imminent!',
        message: `${a.name} ($${(((a.baseMrrCents + a.addonMrrCents) * 12) / 100).toLocaleString()}/yr ARR) is threatening cancellation in 12s!`,
        tick: newElapsed,
        targetFunction: 'retention',
        actionLabel: 'Defend in Retention [4]',
      })
    }

    // Check threat expiration -> churn!
    const expiredIncident = currentIncidents.find(i => (i.accountId === a.id || i.id === a.id) && i.urgencyTicks <= 0 && i.consequence !== 'Customer Care')
    if ((isThreatened && threatDeadline && newElapsed >= threatDeadline) || (isThreatened && expiredIncident)) {
      isThreatened = false
      threatDeadline = null
      threatReason = null
      health = 0 // customer churned
      currentIncidents = currentIncidents.filter(i => i.accountId !== a.id && i.id !== a.id)
      if (activeThreatId === a.id) {
        activeThreatId = null
      }
      comboReset = true
      const lostArr = (a.baseMrrCents + a.addonMrrCents) * 12
      arrBridgeChurn += lostArr
      alerts.push({
        id: `churn-${newElapsed}-${a.id}`,
        tone: 'critical',
        title: 'Customer Churned',
        message: `${a.name} cancelled contract. Lost $${(lostArr / 100).toLocaleString()}/yr ARR.`,
        tick: newElapsed,
        targetFunction: 'retention',
        actionLabel: 'View Retention [4]',
      })
      ledger.push({
        id: `led-churn-${newElapsed}-${a.id}`,
        tick: newElapsed,
        category: 'retention',
        message: `Account ${a.name} churned. -$${(lostArr / 100).toLocaleString()}/yr ARR.`,
        deltaArrCents: -lostArr,
      })
    }

    return {
      ...a,
      ageTicks: a.ageTicks + dtTicks,
      health,
      isThreatened,
      threatDeadlineTick: threatDeadline,
      threatReason,
    }
  }).filter(a => a.health > 0) // drop completely churned accounts

  // Clean up any expired incidents
  currentIncidents = currentIncidents.filter(i => i.urgencyTicks > 0)

  if (activeThreatId && !updatedAccountsFinal.some(a => a.id === activeThreatId && a.isThreatened)) {
    activeThreatId = updatedAccountsFinal.find(a => a.isThreatened)?.id ?? null
  }

  // 6b. EVENT MINIGAME TRIGGERS (Retention, Expansion, Operations)
  // Clear retentionEvent if the threatened account has churned or been cured
  if (retentionEvent && !updatedAccountsFinal.some(a => a.id === retentionEvent?.accountId && a.isThreatened)) {
    retentionEvent = null
  }

  if (!retentionEvent && updatedAccountsFinal.length > 0) {
    const threatened = updatedAccountsFinal.find(a => a.isThreatened)
    if (threatened) {
      retentionEvent = {
        active: true,
        accountId: threatened.id,
        accountName: threatened.name,
        reason: threatened.threatReason || 'Defect escalation and latency SLA violation',
        deadlineTick: threatened.threatDeadlineTick || (newElapsed + 250),
        savedArrCents: (threatened.baseMrrCents + threatened.addonMrrCents) * 12,
      }
    }
  }

  // Maintain expansion orders: filter out churned accounts, and generate orders for eligible accounts
  let updatedExpansionOrders = expansionOrders.filter(o =>
    updatedAccountsFinal.some(a => a.id === o.accountId)
  )

  if (!expansionEvent && updatedAccountsFinal.length >= 2 && newElapsed % 500 < dtTicks && rng.nextFloat() < 0.40) {
    const candidate = updatedAccountsFinal.find(a => a.health >= 60 && a.addonSlotsUsed < 2 && !a.delinquent)
    if (candidate) {
      const rewardArr = Math.round(candidate.baseMrrCents * 12 * 0.4)
      const rfpOrderId = `exp-rfp-${newElapsed}`
      expansionEvent = {
        active: true,
        orderId: rfpOrderId,
        accountName: candidate.name,
        chain: 'infrastructure',
        targetTier: 2,
        rewardArrCents: rewardArr,
        rewardCashCents: Math.round(rewardArr * 0.15),
      }
      if (!updatedExpansionOrders.some(o => o.accountId === candidate.id)) {
        updatedExpansionOrders = [
          ...updatedExpansionOrders,
          {
            id: rfpOrderId,
            accountId: candidate.id,
            accountName: candidate.name,
            chain: 'infrastructure',
            targetTier: 2,
            rewardArrCents: rewardArr,
            rewardCashCents: Math.round(rewardArr * 0.15),
          },
        ]
      }
      alerts.push({
        id: `exp-event-${newElapsed}`,
        tone: 'info',
        title: 'EXPANSION RFP RECEIVED',
        message: `${candidate.name} requested infrastructure expansion (+$${(rewardArr / 100).toLocaleString()}/yr ARR). Fulfill via Merge & Supply!`,
        tick: newElapsed,
        targetFunction: 'expansion',
        actionLabel: 'Fulfill in Expansion [5]',
      })
    }
  }

  const timeSinceFailover = newElapsed - (state.operations.lastFailoverTick ?? -9999)
  if (patentShieldTicksRemaining <= 0 && !operationsEvent && timeSinceFailover > 450 && (strainBacklog > 18.0 || contextRot > 0.75 || incidents > 2)) {
    operationsEvent = {
      active: true,
      title: strainBacklog > 18.0 ? 'Cluster Thermal Throttling' : 'Context Drift Advisory',
      severity: strainBacklog > 25.0 ? 'critical' : 'warning',
      incidentType: strainBacklog > 18.0 ? 'strain_spike' : 'rot_drift',
      strainPenalty: 2.0,
      rotPenalty: 0.05,
    }
    alerts.push({
      id: `ops-event-${newElapsed}`,
      tone: 'warning',
      title: 'OPERATIONS MAINTENANCE ADVISORY',
      message: strainBacklog > 18.0
        ? `Cluster strain backlog at ${strainBacklog.toFixed(1)} pts. Execute cluster recovery in Operations to restore pipeline velocity.`
        : `Context drift elevated (${Math.round(contextRot * 100)}%). Purge memory in Operations to maintain customer retention stability.`,
      tick: newElapsed,
      targetFunction: 'operations',
      actionLabel: 'Diagnose in Operations [6]',
    })
  }

  if (updatedAccountsFinal.length > 0 && updatedExpansionOrders.length < 2 && (newElapsed % 300 < dtTicks || updatedExpansionOrders.length === 0)) {
    const existingOrderAccountIds = new Set(updatedExpansionOrders.map(o => o.accountId))
    const eligibleAccounts = updatedAccountsFinal.filter(a =>
      a.addonSlotsUsed < 2 &&
      !a.delinquent &&
      a.health >= 50 &&
      !existingOrderAccountIds.has(a.id)
    )
    if (eligibleAccounts.length > 0) {
      const chains: Array<'intelligence' | 'infrastructure' | 'security'> = ['intelligence', 'infrastructure', 'security']
      const randomChain = chains[Math.floor(rng.nextFloat() * chains.length)]
      const randomTier = Math.min(4, Math.floor(rng.nextFloat() * 2) + 2)
      const candidateAccount = eligibleAccounts[Math.floor(rng.nextFloat() * eligibleAccounts.length)]
      const rewardArr = Math.round(candidateAccount.baseMrrCents * 12 * (0.25 * randomTier) * (1 + (activeBuffs.expansionBonus || 0)))
      const newOrder: ExpansionOrder = {
        id: `ord-${newElapsed}-${candidateAccount.id.slice(-4)}`,
        accountId: candidateAccount.id,
        accountName: candidateAccount.name,
        chain: randomChain,
        targetTier: randomTier,
        rewardArrCents: Math.max(20_000, rewardArr),
        rewardCashCents: Math.round(rewardArr * 0.15),
      }
      updatedExpansionOrders = [...updatedExpansionOrders, newOrder]
    }
  }

  // 7. AGGREGATE ARR, CAPITAL QUALITY & VALUATION
  const updatedDebt: DebtFacility = {
    ...state.debt,
    active: debtActive,
    principalCents: debtPrincipal,
    monthsRemaining: debtMonthsRemaining,
    monthlyPaymentCents: debtMonthlyPayment,
  }

  const { contractualArrCents, eligibleArrCents } = calculateArrTotals(updatedAccountsFinal)

  const tempState: GameState = {
    ...state,
    elapsedTicks: newElapsed,
    cashCents: newCash,
    accounts: updatedAccountsFinal,
    pendingInvoices: updatedInvoices,
    mandatoryBills: remainingBills,
    debt: updatedDebt,
    fleet: updatedFleet,
    systemCapabilities,
    competitionFactor,
  }

  const economicBurn = calculateEconomicBurn(tempState)
  const cashForecast = calculateCashForecast(tempState)
  const capitalQuality = calculateCapitalQualityFactor(economicBurn.burnRatio, cashForecast.shortfallFraction)

  const isSolopreneurLean = Object.values(state.fleet).reduce((sum, f) => sum + f.onlineUnits, 0) <= 3
  const solopreneurBoost = (state.founderHistory?.equippedFounderRelicId === 'founder_solopreneur_monolith' && isSolopreneurLean) ? 0.35 : 0
  const relicDistortion = (state.activeRelics.some(r => r.id === 'relic-anisotropic-sheen') ? 0.4 : 0) + quarterValuationBoostMultiple + solopreneurBoost
  const growthMultiple = calculateGrowthMultiple(
    openingArr,
    contractualArrCents,
    newElapsed,
    relicDistortion
  )
  const valuation = calculateValuationCents(eligibleArrCents, growthMultiple, capitalQuality)

  // 8. UNICORN VICTORY CHECK & ACHIEVEMENT EVALUATION
  let runStatus: GameState['runStatus'] = state.runStatus
  let updatedFounderHistory = state.founderHistory

  if (valuation >= UNICORN_VALUATION_CENTS && runStatus === 'running' && !state.unicornVictoryAcknowledged) {
    runStatus = 'unicorn_victory'
    alerts.push({
      id: `unicorn-win-${newElapsed}`,
      tone: 'info',
      title: 'UNICORN MILESTONE ACHIEVED!',
      message: `SoloUnicorn valuation reached $${(valuation / 100).toLocaleString()}! You built a $1B machine as a 1-person founder.`,
      tick: newElapsed,
    })
  }

  // Real-time evaluation of meta-progression achievements
  const isNewVictory = runStatus === 'unicorn_victory'
  const newAchievements = evaluateNewAchievements({
    ...state,
    valuationCents: valuation,
    eligibleArrCents,
    quarter,
    runStatus,
  })
  if (newAchievements.length > 0 || isNewVictory) {
    const existingUnlocked = state.founderHistory?.unlockedAchievementIds || []
    updatedFounderHistory = {
      ...state.founderHistory,
      victories: (state.founderHistory?.victories || 0) + (isNewVictory ? 1 : 0),
      bestValuationCents: Math.max(state.founderHistory?.bestValuationCents || 0, valuation),
      unlockedAchievementIds: Array.from(new Set([...existingUnlocked, ...newAchievements])),
    }
  }

  return {
    ...state,
    elapsedTicks: newElapsed,
    cashCents: newCash,
    monthInQuarter,
    quarter,
    ticksInCurrentMonth,
    quarterReviewPending,
    availableQuarterRelics,
    availableQuarterConsumables,
    lockedQuarterRelicIds,
    lockedQuarterConsumableIds,
    quarterReviewRerolls,
    warRoomTicksRemaining,
    warRoomSpeedMultiplier,
    patentShieldTicksRemaining,
    bullseyeStrikesRemaining,
    quarterValuationBoostMultiple,
    retentionEvent,
    expansionEvent,
    operationsEvent,
    expansionOrders: updatedExpansionOrders,
    mergeGrid,
    runStatus,
    accounts: updatedAccountsFinal,
    pendingInvoices: updatedInvoices,
    mandatoryBills: remainingBills,
    activeThreatAccountId: activeThreatId,
    retentionIncidents: currentIncidents,
    retentionSavedArrCents,
    retentionCombo: comboReset ? 0 : (state.retentionCombo ?? 0),
    contractualArrCents,
    eligibleArrCents,
    growthMultiple,
    capitalQualityFactor: capitalQuality,
    shortfallFraction: cashForecast.shortfallFraction,
    competitionFactor,
    burnRatio: economicBurn.burnRatio,
    cogsMonthCents: economicBurn.cogsMonthCents,
    opexMonthCents: economicBurn.opexMonthCents,
    interestMonthCents: economicBurn.interestMonthCents,
    earnedRevenueMonthCents: economicBurn.earnedRevenueMonthCents,
    forecastObligationsCents: cashForecast.forecastObligationsCents,
    forecastExpectedCollectionsCents: cashForecast.forecastExpectedCollectionsCents,
    peakNegativeCashCents: cashForecast.peakNegativeCashCents,
    valuationCents: valuation,
    operations: {
      ...state.operations,
      opsCapacity: opsMetrics.opsCapacity,
      coordinationLoad: opsMetrics.coordinationLoad,
      instantOverload: opsMetrics.instantOverload,
      strainBacklog,
      contextRot,
      incidentsBacklog: incidents,
    },
    fleet: updatedFleet,
    systemCapabilities,
    demandSignals,
    lastDemandReplenishTick,
    qualifiedOpportunities,
    productPods: productPods ?? state.productPods,
    activeTickets: currentTickets,
    activeScratchCard: currentTickets[0] ?? state.activeScratchCard,
    activeDealDesks: currentDesks,
    activationsQueue,
    currentActivation,
    debt: updatedDebt,
    vc: {
      ...state.vc,
      baselineArrCents: vcBaselineArrCents,
      nextDeadlineTick: vcNextDeadlineTick,
    },
    arrBridge: {
      openingArrCents: openingArr,
      newArrCents: arrBridgeNew,
      expansionArrCents: arrBridgeExpansion,
      contractionArrCents: arrBridgeContraction,
      churnArrCents: arrBridgeChurn,
      delinquencyLossArrCents: arrBridgeDelinquencyLoss,
      restorationArrCents: arrBridgeRestoration,
      closingArrCents: eligibleArrCents,
    },
    auditedArrBridge,
    founderHistory: updatedFounderHistory,
    alerts: alerts.filter(a => (newElapsed - a.tick) <= 600).slice(-20), // prune alerts older than 60s, keep latest 20
    ledger: ledger.slice(-50), // keep latest 50 entries
  }
}
