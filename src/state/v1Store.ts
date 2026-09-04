/**
 * V1 Canonical State Bridge & Store
 * Product Truth: company_sim_v1/product_final.md
 * Implementation Contract: company_sim_v1/AGENTS.md
 */

import { create } from 'zustand';
import type {
  CompanyState,
  HoldingCompanyState,
  RoomId,
  ProductPieceType,
  FounderHistoryId,
  MoneyCents,
  VibeCodingStage,
} from '../sim/types';
import {
  createInitialCompanyState,
  executeMonthlyCashClose,
  executeQuarterClose,
  beginNextQuarter,
  UNICORN_VALUATION_CENTS,
} from '../sim/engine';
import { calcValuation } from '../sim/valuation';
import { formatMoney } from '../sim/math';
import { MILESTONES, type MilestoneDef } from '../data/milestones';
import type { AgentLogEntry } from '../ui/shell/LiveAgentTerminalStream';
import { SeededRng } from '../sim/rng';
import { createMarketingCard, resolveMarketingSwipe } from '../sim/rooms/marketing';
import { mergePieceIntoSlot } from '../sim/rooms/product';
import { createMonetizationOpportunity, type PricingZone } from '../sim/rooms/monetization';
import { createRetentionThreat, updateRetentionBattlefield } from '../sim/rooms/retention';
import { createExpansionAccount } from '../sim/rooms/expansion';
import { createOperationsIncident } from '../sim/rooms/operations';
import { calcLocLimit, executeFinancingRound } from '../sim/capital';
import { calcStrainDetails } from '../sim/complexity';
import { ALL_UPGRADES, type UpgradeDefinition } from '../content/upgrades';
import type { SituationArchetype } from '../content/situations';
import { saveActiveRun, loadActiveRun, saveSettings, loadSettings, type GameSettings } from '../pwa/db';
import { soundEngine } from '../audio/soundEffects';

export interface V1StoreState {
  // Core Company & Holding State
  company: CompanyState;
  holding: HoldingCompanyState;
  seed: number;
  rng: SeededRng;

  // Active Onboarding Step (Q1 to Q5)
  onboardingStep:
    | 'q1_marketing'
    | 'q1_product'
    | 'q1_monetization'
    | 'q1_cash'
    | 'q2_retention'
    | 'q2_operations'
    | 'q3_automation'
    | 'q4_capital'
    | 'q5_open_roguelite'
    | 'completed';

  // Intermission / Modals State
  activeModal:
    | 'none'
    | 'intermission_review'
    | 'intermission_commitment'
    | 'intermission_shop'
    | 'intermission_capital'
    | 'situation'
    | 'holding_company'
    | 'settings'
    | 'unicorn'
    | 'game_over';

  activeSituation: SituationArchetype | null;
  shopOfferedUpgrades: UpgradeDefinition[];
  shopLockedUpgradeIds: string[];
  shopRerollCount: number;
  shopPurchasedCount: number;
  shopAgentUpgradesPurchased: number;
  settings: GameSettings;

  // Actions
  init: () => Promise<void>;
  resetGame: () => Promise<void>;
  tick: (deltaMs: number) => void;
  switchRoom: (room: RoomId) => void;
  executeSwipe: (action: 'LEFT' | 'RIGHT' | 'UP') => void;
  executeMerge: (slotId: string, piece: ProductPieceType) => void;
  executeEarlyDeploy: (slotId: string) => void;
  executePricingTap: (zone: PricingZone, milliGu: number) => void;
  executeAimRetention: (threatId: string | null) => void;
  executeFireLaser: (threatId: string) => void;
  executePackExpansion: (fitScore: number, expansionArrMilliGu: number, churnThreatMilliGu: number) => void;
  executeDiagnoseIncident: (isCorrect: boolean) => void;
  buyDemandCampaign: (tier: 'blitz' | 'surge' | 'outbound') => boolean;
  buyProductSprint: (tier?: 'boost' | 'ship_all') => boolean;

  // Intermission & Capital Actions
  selectGrowthCommitment: (commitment: number) => void;
  toggleLockUpgrade: (upgradeId: string) => void;
  buyUpgrade: (upgradeId: string) => boolean;
  rerollShop: () => void;
  buyAgentTier: (room: RoomId) => boolean;
  drawLoc: (amountCents: MoneyCents) => void;
  repayLoc: (amountCents: MoneyCents) => void;
  acceptFinancing: (stage: 'preseed' | 'seed' | 'series_a' | 'series_b', raiseCents: MoneyCents) => void;
  finishIntermission: () => void;

  // Situations
  chooseSituationOption: (choiceIndex: 0 | 1) => void;

  // Holding Company
  switchHoldingCompany: (companyId: string) => void;
  launchNewSubsidiary: (history: FounderHistoryId, name: string) => void;

  // Settings
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  closeModal: () => void;
  openModal: (modal: V1StoreState['activeModal']) => void;

  // Milestones & Agent Telemetry Feed
  activeMilestone: MilestoneDef | null;
  dismissMilestone: () => void;
  agentLogs: AgentLogEntry[];
  addAgentLog: (entry: { agent: string; action: string; detail: string; type: AgentLogEntry['type'] }) => void;
  triggerAlignmentEval: () => void;
  toggleRoomOverclock: (room: RoomId) => void;

  // Authentic Vibe Coding & CI/CD Verification Actions
  executeVerifySuite: (slotId: string) => void;
  executeClearVibeDebt: () => void;
}

const agentTimers = {
  marketing: 0,
  product: 0,
  monetization: 0,
  expansion: 0,
  operations: 0,
};

export const useV1Store = create<V1StoreState>((set, get) => ({
  company: createInitialCompanyState(),
  holding: {
    unlocked: false,
    activeCompanyId: '',
    companies: [],
    portfolioFounderValueCents: 0n,
    unicornCount: 0,
    availableSlots: 2,
  },
  seed: 42,
  rng: new SeededRng(42),
  onboardingStep: 'q1_marketing',
  activeModal: 'none',
  activeSituation: null,
  activeMilestone: null,
  agentLogs: [
    {
      id: 'init_1',
      timestamp: '00:01',
      agent: 'CEO_TERMINAL',
      action: 'SYSTEM_BOOT',
      detail: 'Obsidian hardware cockpit online. 1 Human CEO commanding autonomous swarm.',
      type: 'system',
    },
    {
      id: 'init_2',
      timestamp: '00:02',
      agent: 'CLAUDE_CODE',
      action: 'ENV_STANDBY',
      detail: 'Autonomous dev harness connected. Ready for prompt & pipeline orchestration.',
      type: 'code',
    },
  ],
  shopOfferedUpgrades: [],
  shopLockedUpgradeIds: [],
  shopRerollCount: 0,
  shopPurchasedCount: 0,
  shopAgentUpgradesPurchased: 0,
  settings: {
    soundEnabled: true,
    reducedMotion: false,
    autoLiquidityEnabled: false,
  },

  init: async () => {
    const saved = await loadActiveRun();
    const settings = await loadSettings();
    soundEngine.enabled = settings.soundEnabled;

    if (saved) {
      let modalToOpen: V1StoreState['activeModal'] = saved.state.isBankrupt
        ? 'game_over'
        : saved.state.isIntermission
        ? 'intermission_review'
        : 'none';

      // Check if saved state reached Unicorn without being acknowledged
      if (
        saved.state.valuationCents >= UNICORN_VALUATION_CENTS &&
        !saved.state.unicornAcknowledged
      ) {
        modalToOpen = 'unicorn';
        saved.state.isPaused = true;
      }

      set({
        company: saved.state,
        seed: saved.seed,
        rng: new SeededRng(saved.seed),
        settings,
        onboardingStep: saved.state.quarter >= 5 ? 'completed' : 'q1_marketing',
        activeModal: modalToOpen,
      });
    } else {
      const initial = createInitialCompanyState();
      const seed = Math.floor(Math.random() * 1000000);
      const rng = new SeededRng(seed);

      // Spawn first marketing card for tutorial
      initial.marketing.queue = [createMarketingCard(rng, 'card_tut_1')];

      set({
        company: initial,
        seed,
        rng,
        settings,
      });
    }
  },

  resetGame: async () => {
    try {
      await saveActiveRun(null as any, 0);
      localStorage.clear();
    } catch {}

    const initial = createInitialCompanyState();
    const seed = Math.floor(Math.random() * 1000000);
    const rng = new SeededRng(seed);
    initial.marketing.queue = [createMarketingCard(rng, 'card_tut_1')];

    agentTimers.marketing = 0;
    agentTimers.product = 0;
    agentTimers.monetization = 0;
    agentTimers.expansion = 0;
    agentTimers.operations = 0;

    set({
      company: initial,
      seed,
      rng,
      onboardingStep: 'q1_marketing',
      activeModal: 'none',
      activeSituation: null,
      shopOfferedUpgrades: [],
      shopLockedUpgradeIds: [],
      shopRerollCount: 0,
      shopPurchasedCount: 0,
      shopAgentUpgradesPurchased: 0,
    });
  },

  tick: (deltaMs: number) => {
    const state = get().company;
    if (state.isBankrupt) {
      if (get().activeModal !== 'game_over') {
        set({ activeModal: 'game_over' });
      }
      return;
    }
    if (state.isIntermission || state.isPaused) return;

    const rng = get().rng;
    let nextState = { ...state };
    const nextElapsed = nextState.quarterElapsedMs + deltaMs;
    nextState.quarterElapsedMs = nextElapsed;
    const deltaSec = deltaMs / 1000;

    // 1. Real-time Unicorn Check ($1,000,000,000 Valuation Checkpoint)
    const currentValuation = calcValuation(nextState.arrCents, nextState.valuationMultiple);
    nextState.valuationCents = currentValuation;
    if (currentValuation > nextState.peakValuationCents) {
      nextState.peakValuationCents = currentValuation;
    }

    if (currentValuation >= UNICORN_VALUATION_CENTS && !nextState.unicornAcknowledged) {
      nextState.isPaused = true;
      nextState.unicornQuarter = nextState.quarter;
      nextState.unicornSpeedrunElapsedMs = nextElapsed;
      nextState.unicornAcknowledged = true;
      if (!nextState.achievedMilestones?.includes('ms_unicorn_victory')) {
        nextState.achievedMilestones = [...(nextState.achievedMilestones || []), 'ms_unicorn_victory'];
      }
      soundEngine.playCelebration();
      set({
        company: nextState,
        activeModal: 'unicorn',
      });
      get().addAgentLog({
        agent: 'ORCHESTRATOR',
        action: 'UNICORN_CLIMAX',
        detail: `VALUATION REACHED ${formatMoney(currentValuation)}! 1-Person Unicorn Checkpoint.`,
        type: 'system',
      });
      saveActiveRun(nextState, get().seed);
      return;
    }

    // 2. Real-time Milestone Evaluation
    const achieved = nextState.achievedMilestones || [];
    for (const ms of MILESTONES) {
      if (!achieved.includes(ms.id) && ms.check(nextState)) {
        nextState.achievedMilestones = [...achieved, ms.id];
        set({ activeMilestone: ms });
        soundEngine.playCash();
        get().addAgentLog({
          agent: 'SYSTEM',
          action: 'MILESTONE_UNLOCKED',
          detail: `${ms.bannerTitle} — ${ms.rewardFlavor}`,
          type: 'system',
        });
        break;
      }
    }

    // Decrement penalty locks on product slots
    if (nextState.product.slots.some((s) => s.lockedUntilMs > 0)) {
      nextState.product = {
        ...nextState.product,
        slots: nextState.product.slots.map((s) =>
          s.lockedUntilMs > 0
            ? { ...s, lockedUntilMs: Math.max(0, s.lockedUntilMs - deltaMs) }
            : s
        ),
      };
    }

    // Decrement penalty locks on operations incidents
    if (nextState.operations.incidents.some((inc) => inc.lockedUntilMs > 0)) {
      nextState.operations = {
        ...nextState.operations,
        incidents: nextState.operations.incidents.map((inc) =>
          inc.lockedUntilMs > 0
            ? { ...inc, lockedUntilMs: Math.max(0, inc.lockedUntilMs - deltaMs) }
            : inc
        ),
      };
    }

    // Dynamic Strain & Ops Capacity recalculation
    const hasQueueing = nextState.upgrades.includes('room_operations_queueing');
    const strainInfo = calcStrainDetails(nextState.complexity, nextState.opsCapacity, hasQueueing);
    nextState.strainState = strainInfo.state;
    nextState.strain = nextState.opsCapacity > 0 ? nextState.complexity / nextState.opsCapacity : 0;

    // Insolvency grace period countdown
    if (nextState.cashCents < 0n) {
      nextState.bankruptcyGraceRemainingMs = Math.max(0, nextState.bankruptcyGraceRemainingMs - deltaMs);
      if (nextState.bankruptcyGraceRemainingMs <= 0) {
        nextState.isBankrupt = true;
        nextState.bankruptcyReason = 'insolvency';
        soundEngine.playAlarm();
        set({ company: nextState, activeModal: 'game_over' });
        saveActiveRun(nextState, get().seed);
        return;
      }
    } else if (nextState.bankruptcyGraceRemainingMs < 20_000) {
      nextState.bankruptcyGraceRemainingMs = 20_000;
    }

    // Monthly Cash Close at 50s, 100s, 150s
    const oldElapsed = state.quarterElapsedMs;
    if (oldElapsed < 50_000 && nextElapsed >= 50_000) {
      nextState = executeMonthlyCashClose(nextState, 1);
      soundEngine.playCash();
      if (get().onboardingStep === 'q1_monetization') {
        set({ onboardingStep: 'q1_cash' });
      }
    } else if (oldElapsed < 100_000 && nextElapsed >= 100_000) {
      nextState = executeMonthlyCashClose(nextState, 2);
      soundEngine.playCash();
    } else if (oldElapsed < 150_000 && nextElapsed >= 150_000) {
      nextState = executeMonthlyCashClose(nextState, 3);
      soundEngine.playCash();
    }

    // Spawning Work & Lifecycle Timers
    // 1. Marketing card spawn (cadence & queue capacity scale with marketing agent tier)
    let mkt = { ...nextState.marketing };
    mkt.nextCardTimerSec -= deltaSec;
    const mktTier = nextState.agents.marketing;
    const spawnPacing = [8.0, 5.0, 3.2, 1.8, 0.9][mktTier];
    const maxQueue = [3, 4, 6, 8, 12][mktTier];
    if (mkt.nextCardTimerSec <= 0 && mkt.queue.length < maxQueue) {
      mkt.nextCardTimerSec = spawnPacing;
      mkt.queue = [...mkt.queue, createMarketingCard(rng, `card_${Date.now()}`)];
    }

    // AUTONOMOUS MARKETING AGENT (processes inbound leads)
    if (mktTier > 0 && mkt.queue.length > 0) {
      agentTimers.marketing += deltaSec;
      const isMktOverclocked = nextState.overclockRooms?.marketing ?? false;
      const baseInterval = [999, 4.0, 2.2, 1.2, 0.6][mktTier];
      const interval = isMktOverclocked ? baseInterval * 0.5 : baseInterval;
      const reliability = [0, 0.72, 0.84, 0.90, 0.94][mktTier];

      if (agentTimers.marketing >= interval) {
        agentTimers.marketing = 0;
        const targetCard = mkt.queue[0];
        const isOptimal = Math.random() < reliability;
        let action: 'LEFT' | 'RIGHT' | 'UP';

        if (isOptimal) {
          if (targetCard.scoreQ >= 4 && nextState.cashCents >= nextState.capitalUnitCents / 10n) {
            action = 'UP';
          } else if (targetCard.scoreQ <= 0) {
            action = 'LEFT';
          } else {
            action = 'RIGHT';
          }
        } else {
          action = targetCard.scoreQ <= 0 ? 'RIGHT' : 'LEFT';
        }

        const res = resolveMarketingSwipe(targetCard, action, mkt.comboCount, nextState.capitalUnitCents);
        mkt.queue = mkt.queue.slice(1);
        mkt.comboCount = res.comboCount;
        if (res.isLowQuality) {
          mkt.lowQualityDemandMilliGu += res.demandDeltaMilliGu;
        }
        nextState.demandBacklogMilliGu += res.demandDeltaMilliGu;
        nextState.cashCents += res.cashDeltaCents;
        nextState.totalAutomatedActions += 1;

        if (Math.random() < 0.35) {
          get().addAgentLog({
            agent: 'HAIKU_SCRAPER',
            action: action === 'UP' ? 'PAID_BOOST_DEPLOY' : action === 'RIGHT' ? 'LEAD_QUALIFIED' : 'NOISE_FILTERED',
            detail: `Captured lead (+${res.demandDeltaMilliGu} mGU). Backlog: ${(nextState.demandBacklogMilliGu / 1000).toFixed(1)} GU.`,
            type: 'agent',
          });
        }
      }
    }
    nextState.marketing = mkt;

    // 2. Product piece spawn timer (every 2.5s)
    let prod = { ...nextState.product };
    prod.nextPieceTimerSec -= deltaSec;
    if (prod.nextPieceTimerSec <= 0) {
      prod.nextPieceTimerSec = 2.5;
    }

    // AUTONOMOUS PRODUCT AGENT (assembles, verifies, and ships features across multiple slots)
    const prodTier = nextState.agents.product;
    if (prodTier > 0) {
      agentTimers.product += deltaSec;
      const isProdOverclocked = nextState.overclockRooms?.product ?? false;
      const baseInterval = [999, 3.5, 1.8, 0.9, 0.45][prodTier];
      const interval = isProdOverclocked ? baseInterval * 0.5 : baseInterval;
      const reliability = [0, 0.72, 0.84, 0.90, 0.94][prodTier];

      // Auto-pull backlogged demand into request slots (parallel pulls based on tier)
      if (nextState.demandBacklogMilliGu >= 1000) {
        const maxPulls = Math.min(prodTier, Math.floor(nextState.demandBacklogMilliGu / 1000));
        for (let p = 0; p < maxPulls; p++) {
          const availableSlot = prod.slots.find((s) => {
            if (s.requirements && s.requirements.length > 0) {
              return (s.filledIndices || []).length === 0;
            }
            return s.state === 'REQUEST' && !s.hasPrompt && !s.hasDiff;
          });
          if (availableSlot && nextState.demandBacklogMilliGu >= 1000) {
            nextState.demandBacklogMilliGu -= 1000;
            if (availableSlot.requirements && availableSlot.requirements.length > 0) {
              const firstReq = availableSlot.requirements[0];
              const { nextSlot } = mergePieceIntoSlot(availableSlot, firstReq, nextState.capitalUnitCents);
              const idx = prod.slots.findIndex((s) => s.id === availableSlot.id);
              if (idx !== -1) prod.slots[idx] = nextSlot;
            } else {
              availableSlot.hasPrompt = true;
            }
          }
        }
      }

      if (agentTimers.product >= interval) {
        agentTimers.product = 0;
        // Process up to prodTier slots concurrently
        const activeSlots = prod.slots.filter((s) => s.state !== 'SHIPPED').slice(0, prodTier);
        activeSlots.forEach((activeSlot) => {
          if (activeSlot.requirements && activeSlot.requirements.length > 0) {
            const filled = activeSlot.filledIndices || [];
            const isAllFilled = filled.length >= activeSlot.requirements.length;

            if (isAllFilled) {
              const { nextSlot, resolution } = mergePieceIntoSlot(activeSlot, 'DEPLOY', nextState.capitalUnitCents);
              const idx = prod.slots.findIndex((s) => s.id === activeSlot.id);
              if (idx !== -1) prod.slots[idx] = nextSlot;
              if (resolution.activationDeltaMilliGu > 0) nextState.activationBacklogMilliGu += resolution.activationDeltaMilliGu;
              nextState.totalAutomatedActions += 1;
              if (Math.random() < 0.4) {
                get().addAgentLog({
                  agent: 'CLAUDE_CODE',
                  action: 'FEATURE_DEPLOYED',
                  detail: `Slot ${activeSlot.id} shipped to production. +${resolution.activationDeltaMilliGu} mGU activation.`,
                  type: 'agent',
                });
              }
            } else {
              const shipEarlyRoll = filled.length > 0 && Math.random() > reliability;
              if (shipEarlyRoll) {
                const { nextSlot, resolution } = mergePieceIntoSlot(activeSlot, 'DEPLOY', nextState.capitalUnitCents);
                const idx = prod.slots.findIndex((s) => s.id === activeSlot.id);
                if (idx !== -1) prod.slots[idx] = nextSlot;
                if (resolution.activationDeltaMilliGu > 0) nextState.activationBacklogMilliGu += resolution.activationDeltaMilliGu;
                if (resolution.churnThreatDeltaMilliGu > 0) nextState.churnThreatMilliGu += resolution.churnThreatDeltaMilliGu;
                nextState.totalAutomatedActions += 1;
                get().addAgentLog({
                  agent: 'CLAUDE_CODE',
                  action: 'EARLY_SHIP_YOLO',
                  detail: `Early ship invoked without test suite! Churn threat +${resolution.churnThreatDeltaMilliGu} mGU.`,
                  type: 'system',
                });
              } else {
                const nextUnfilledIdx = activeSlot.requirements.findIndex((_, i) => !filled.includes(i));
                if (nextUnfilledIdx !== -1) {
                  const nextPiece = activeSlot.requirements[nextUnfilledIdx];
                  const { nextSlot, resolution } = mergePieceIntoSlot(activeSlot, nextPiece, nextState.capitalUnitCents);
                  const idx = prod.slots.findIndex((s) => s.id === activeSlot.id);
                  if (idx !== -1) prod.slots[idx] = nextSlot;
                  if (resolution.activationDeltaMilliGu > 0) nextState.activationBacklogMilliGu += resolution.activationDeltaMilliGu;
                  nextState.totalAutomatedActions += 1;
                }
              }
            }
          } else {
            if (activeSlot.state === 'REQUEST') {
              if (!activeSlot.hasPrompt) {
                activeSlot.hasPrompt = true;
              } else if (!activeSlot.hasDiff) {
                activeSlot.hasDiff = true;
                activeSlot.state = 'IMPLEMENTATION';
              }
            } else if (activeSlot.state === 'IMPLEMENTATION') {
              const shipEarlyRoll = Math.random() > reliability;
              if (shipEarlyRoll) {
                activeSlot.state = 'SHIPPED';
                nextState.activationBacklogMilliGu += 1000;
                nextState.churnThreatMilliGu += 250;
                activeSlot.state = 'REQUEST';
                activeSlot.hasPrompt = false;
                activeSlot.hasDiff = false;
                activeSlot.hasTest = false;
                nextState.totalAutomatedActions += 1;
              } else {
                activeSlot.hasTest = true;
                activeSlot.state = 'VERIFIED';
              }
            } else if (activeSlot.state === 'VERIFIED') {
              activeSlot.state = 'SHIPPED';
              nextState.activationBacklogMilliGu += 1000;
              activeSlot.state = 'REQUEST';
              activeSlot.hasPrompt = false;
              activeSlot.hasDiff = false;
              activeSlot.hasTest = false;
              nextState.totalAutomatedActions += 1;
            }
          }
        });
      }
    }
    nextState.product = prod;

    // 3. Monetization opportunity generation from Activation backlog
    let mon = { ...nextState.monetization };
    if (!mon.currentOpportunity && nextState.activationBacklogMilliGu >= 1000) {
      nextState.activationBacklogMilliGu -= 1000;
      mon.currentOpportunity = createMonetizationOpportunity(rng, `opp_${Date.now()}`);
    }

    // AUTONOMOUS PRICING AGENT (captures contracts and mints ARR)
    const monTier = nextState.agents.monetization;
    if (monTier > 0 && mon.currentOpportunity) {
      agentTimers.monetization += deltaSec;
      const isMonOverclocked = nextState.overclockRooms?.monetization ?? false;
      const baseInterval = [999, 3.0, 1.8, 0.9, 0.45][monTier];
      const interval = isMonOverclocked ? baseInterval * 0.5 : baseInterval;
      const reliability = [0, 0.72, 0.84, 0.90, 0.94][monTier];

      if (agentTimers.monetization >= interval) {
        agentTimers.monetization = 0;
        const isReliable = Math.random() < reliability;
        const gainedMilliGu = isReliable ? (Math.random() < 0.4 ? 1500 : 1000) : 500;
        const newArrCents = (nextState.growthUnitCents * BigInt(gainedMilliGu)) / 1000n;
        nextState.arrCents += newArrCents;
        nextState.currentQuarterNewCustomerArrCents += newArrCents;
        mon.currentOpportunity = null;
        nextState.totalAutomatedActions += 1;

        get().addAgentLog({
          agent: 'SONNET_SALES_ENGINE',
          action: 'CONTRACT_PRICED',
          detail: `Negotiated +$${(Number(newArrCents) / 100).toLocaleString()} ARR. Multiple: ${nextState.growthUnitCents > 0n ? '10x' : '0x'}. Total ARR: $${(Number(nextState.arrCents) / 100).toLocaleString()}`,
          type: 'agent',
        });
      }
    }
    nextState.monetization = mon;

    // 4. Retention threat battlefield update & active generation (UNBLOCK RETENTION)
    let ret = { ...nextState.retention };

    // Convert accumulated churn threat backlog into active battlefield threats
    if (nextState.churnThreatMilliGu >= 250 && ret.threats.length < 6) {
      if (nextState.churnThreatMilliGu >= 1000) {
        ret.threats = [...ret.threats, createRetentionThreat(rng, `threat_${Date.now()}`, 'S3', 'major_incident')];
        nextState.churnThreatMilliGu -= 1000;
      } else if (nextState.churnThreatMilliGu >= 500) {
        ret.threats = [...ret.threats, createRetentionThreat(rng, `threat_${Date.now()}`, 'S2', 'code_bug')];
        nextState.churnThreatMilliGu -= 500;
      } else {
        ret.threats = [...ret.threats, createRetentionThreat(rng, `threat_${Date.now()}`, 'S1', 'support_ticket')];
        nextState.churnThreatMilliGu -= 250;
      }
    }

    // Periodic account renewal churn pressure (from Q2 onwards as ARR scales)
    if (nextState.quarter >= 2 && ret.threats.length < 4 && Math.random() < 0.007) {
      const sev = Math.random() < 0.25 ? 'S2' : 'S1';
      ret.threats = [...ret.threats, createRetentionThreat(rng, `renewal_${Date.now()}`, sev, 'contract_renewal')];
    }

    const isFounderInRetention = nextState.activeRoom === 'retention';
    const supportAgentTier = nextState.agents.retention;
    const isRetOverclocked = nextState.overclockRooms?.retention ?? false;
    const battle = updateRetentionBattlefield(
      ret.threats,
      deltaSec * (isRetOverclocked ? 1.8 : 1.0),
      ret.founderAimThreatId,
      ret.founderTurretFireTimerSec,
      isFounderInRetention,
      supportAgentTier
    );
    ret.threats = battle.remainingThreats;
    ret.founderTurretFireTimerSec = battle.newTurretCooldownSec;
    if (battle.churnedMilliGu > 0) {
      const churnCents = (nextState.growthUnitCents * BigInt(battle.churnedMilliGu)) / 1000n;
      nextState.currentQuarterChurnedArrCents += churnCents;
      soundEngine.playAlarm();
    }
    nextState.retention = ret;

    // 5. Operations Incident Leaks
    let ops = { ...nextState.operations };
    if (ops.incidents.length === 0 && nextState.quarter >= 2 && Math.random() < 0.002) {
      ops.incidents = [createOperationsIncident(rng, `inc_${Date.now()}`, 'S1')];
    }

    // AUTONOMOUS OPERATIONS AGENT (scans & patches system leaks)
    const opsTier = nextState.agents.operations;
    if (opsTier > 0 && ops.incidents.length > 0) {
      agentTimers.operations += deltaSec;
      const isOpsOverclocked = nextState.overclockRooms?.operations ?? false;
      const baseInterval = [999, 5.0, 3.0, 1.8, 0.9][opsTier];
      const interval = isOpsOverclocked ? baseInterval * 0.5 : baseInterval;
      if (agentTimers.operations >= interval) {
        agentTimers.operations = 0;
        ops.incidents = [];
        soundEngine.playTicketResolved();
        nextState.totalAutomatedActions += 1;
        get().addAgentLog({
          agent: 'SRE_HEALING_AGENT',
          action: 'PATCH_RESOLVED',
          detail: 'Incident patched and stabilized. Zero drift detected in thermal telemetry.',
          type: 'agent',
        });
      }
    }
    nextState.operations = ops;

    // 6. Expansion Account Spawning & Autonomous Upsell (UNBLOCK EXPANSION)
    let exp = { ...nextState.expansion };
    if (nextState.quarter >= 2 && exp.accounts.length < 3) {
      const currentTimer =
        typeof exp.nextAccountTimerSec === 'number'
          ? exp.nextAccountTimerSec
          : exp.accounts.length === 0
          ? 0
          : 16.0;
      exp.nextAccountTimerSec = currentTimer - deltaSec;
      if (exp.nextAccountTimerSec <= 0) {
        exp.nextAccountTimerSec = 16.0;
        exp.accounts = [...exp.accounts, createExpansionAccount(rng, `acc_${Date.now()}_${Math.random()}`)];
      }
    }

    // AUTONOMOUS EXPANSION AGENT (packs accounts)
    const expTier = nextState.agents.expansion;
    if (expTier > 0 && exp.accounts.length > 0) {
      agentTimers.expansion += deltaSec;
      const isExpOverclocked = nextState.overclockRooms?.expansion ?? false;
      const baseInterval = [999, 12.0, 7.0, 4.0, 2.0][expTier];
      const interval = isExpOverclocked ? baseInterval * 0.5 : baseInterval;
      if (agentTimers.expansion >= interval) {
        agentTimers.expansion = 0;
        const targetAccount = exp.accounts[0];
        const archMult = targetAccount?.archetypeMultiplier ?? 1.8;
        const fitScore = 3 + (Math.random() < [0, 0.72, 0.84, 0.90, 0.94][expTier] ? 2 : 0);
        const baseYieldMilliGu = fitScore >= 5 ? 1800 : 1000;
        const yieldMilliGu = Math.round(baseYieldMilliGu * archMult);
        const expansionArr = (nextState.growthUnitCents * BigInt(yieldMilliGu)) / 1000n;
        nextState.arrCents += expansionArr;
        nextState.currentQuarterExpansionArrCents += expansionArr;
        exp.accounts = exp.accounts.slice(1);
        nextState.totalAutomatedActions += 1;
        get().addAgentLog({
          agent: 'EXPANSION_LLM',
          action: 'ACCOUNT_UPSELL_CLOSED',
          detail: `Pack expansion committed: +$${(Number(expansionArr) / 100).toLocaleString()} ARR.`,
          type: 'agent',
        });
      }
    }
    nextState.expansion = exp;

    // Update compute load and safety drift based on active agents and overclocking
    const totalAgents = (Object.values(nextState.agents) as number[]).reduce((a, b) => a + b, 0);
    const overclockCount = Object.values(nextState.overclockRooms || {}).filter(Boolean).length;
    nextState.computeLoadBps = Math.min(10000, totalAgents * 1250 + overclockCount * 1800);

    // Dynamic Vibe Coding Evolution Stage
    let nextStage: VibeCodingStage = 'manual';
    if (nextState.valuationCents >= UNICORN_VALUATION_CENTS || totalAgents >= 9) {
      nextStage = 'sovereign';
    } else if (totalAgents >= 4) {
      nextStage = 'swarm';
    } else if (totalAgents >= 1 || overclockCount > 0) {
      nextStage = 'yolo';
    } else if (nextState.quarter >= 2 || nextState.product.slots.some((s) => s.hasPrompt || s.hasDiff)) {
      nextStage = 'prompter';
    }
    nextState.vibeCodingStage = nextStage;

    // Real API Token Burn Rate & Runway Consumption
    const rawBurnRate =
      (nextState.agents.marketing * 120 +
        nextState.agents.product * 280 +
        nextState.agents.monetization * 200 +
        nextState.agents.retention * 120 +
        nextState.agents.operations * 120 +
        nextState.agents.expansion * 150) *
      (overclockCount > 0 ? 1.5 : 1.0);
    const burnRateCents = BigInt(Math.round(rawBurnRate));
    nextState.tokenBurnRateCentsPerSec = burnRateCents;

    if (burnRateCents > 0n) {
      const burnTick = (burnRateCents * BigInt(Math.max(1, Math.round(deltaSec * 100)))) / 100n;
      nextState.cashCents = nextState.cashCents > burnTick ? nextState.cashCents - burnTick : 0n;
      nextState.totalTokensBurnedCents = (nextState.totalTokensBurnedCents || 0n) + burnTick;
    }

    // Active Agent Archetypes
    nextState.activeAgentArchetypes = {
      claudeCode: nextState.agents.product,
      geminiFlash: nextState.agents.marketing,
      sonnetSales: nextState.agents.monetization,
      deepseekSre: nextState.agents.retention + nextState.agents.operations,
    };

    // Vibe Debt & Hallucination pressure
    if (nextState.vibeDebt && nextState.vibeDebt > 55 && Math.random() < 0.008) {
      nextState.churnThreatMilliGu = (nextState.churnThreatMilliGu || 0) + 250;
    }

    if (overclockCount > 0) {
      // Overclocking adds subtle complexity strain and degrades safety index over time
      nextState.complexity += deltaSec * 0.02 * overclockCount;
      const currentSafety = typeof nextState.safetyIndex === 'number' && !isNaN(nextState.safetyIndex) ? nextState.safetyIndex : 96;
      nextState.safetyIndex = Math.max(15, Math.round(currentSafety - deltaSec * 0.25 * overclockCount));
    } else if (typeof nextState.safetyIndex !== 'number' || isNaN(nextState.safetyIndex)) {
      nextState.safetyIndex = 96;
    }

    // Quarter Close Check (150s)
    if (nextElapsed >= 150_000) {
      nextState = executeQuarterClose(nextState);

      if (nextState.isBankrupt) {
        soundEngine.playAlarm();
        set({
          company: nextState,
          activeModal: 'game_over',
        });
        saveActiveRun(nextState, get().seed);
        return;
      }

      soundEngine.playCelebration();

      // Offer 3 cards, retaining locked cards from previous quarter
      const lockedIds = get().shopLockedUpgradeIds;
      const lockedCards = get().shopOfferedUpgrades.filter(
        (u) => lockedIds.includes(u.id) && !nextState.upgrades.includes(u.id)
      );
      const remainingNeeded = Math.max(0, 3 - lockedCards.length);

      const availableCards = ALL_UPGRADES.filter(
        (u) => !nextState.upgrades.includes(u.id) && !lockedCards.some((lc) => lc.id === u.id)
      );
      const shuffled = rng.shuffle(availableCards);
      const offered = [...lockedCards, ...shuffled.slice(0, remainingNeeded)];

      // Check if Quarter Close hit $1B Valuation!
      if (nextState.valuationCents >= UNICORN_VALUATION_CENTS && !nextState.unicornAcknowledged) {
        nextState.isPaused = true;
        nextState.unicornQuarter = nextState.quarter;
        nextState.unicornSpeedrunElapsedMs = nextElapsed;
        set({
          company: nextState,
          activeModal: 'unicorn',
          shopOfferedUpgrades: offered,
          shopRerollCount: 0,
          shopPurchasedCount: 0,
          shopAgentUpgradesPurchased: 0,
        });
        get().addAgentLog({
          agent: 'ORCHESTRATOR',
          action: 'UNICORN_CLIMAX',
          detail: `Valuation reached ${formatMoney(nextState.valuationCents)} at Q${nextState.quarter} close!`,
          type: 'system',
        });
        saveActiveRun(nextState, get().seed);
        return;
      }

      set({
        company: nextState,
        activeModal: 'intermission_review',
        shopOfferedUpgrades: offered,
        shopRerollCount: 0,
        shopPurchasedCount: 0,
        shopAgentUpgradesPurchased: 0,
      });
      saveActiveRun(nextState, get().seed);
      return;
    }

    set({ company: nextState });
  },

  switchRoom: (room: RoomId) => {
    soundEngine.playClick();
    set((s) => ({ company: { ...s.company, activeRoom: room } }));
  },

  executeSwipe: (action: 'LEFT' | 'RIGHT' | 'UP') => {
    const { company, onboardingStep } = get();
    const card = company.marketing.queue[0];
    if (!card) return;

    const res = resolveMarketingSwipe(
      card,
      action,
      company.marketing.comboCount,
      company.capitalUnitCents
    );

    const remainingQueue = company.marketing.queue.slice(1);
    const nextDemandBacklog = company.demandBacklogMilliGu + res.demandDeltaMilliGu;

    let nextStep = onboardingStep;
    if (onboardingStep === 'q1_marketing' && res.demandDeltaMilliGu > 0) {
      nextStep = 'q1_product';
    }

    set({
      company: {
        ...company,
        demandBacklogMilliGu: nextDemandBacklog,
        cashCents: company.cashCents + res.cashDeltaCents,
        marketing: {
          ...company.marketing,
          queue: remainingQueue,
          comboCount: res.comboCount,
          lowQualityDemandMilliGu: company.marketing.lowQualityDemandMilliGu + (res.isLowQuality ? res.demandDeltaMilliGu : 0),
        },
      },
      onboardingStep: nextStep,
    });
  },

  executeMerge: (slotId: string, piece: ProductPieceType) => {
    const { company, onboardingStep } = get();
    const slot = company.product.slots.find((s) => s.id === slotId);
    if (!slot) return;

    const { nextSlot, resolution } = mergePieceIntoSlot(slot, piece, company.capitalUnitCents);
    const nextSlots = company.product.slots.map((s) => (s.id === slotId ? nextSlot : s));

    let nextStep = onboardingStep;
    if (onboardingStep === 'q1_product' && resolution.isShipped) {
      nextStep = 'q1_monetization';
    }

    const nextDemandBacklog = resolution.isShipped
      ? Math.max(0, company.demandBacklogMilliGu - 1000)
      : company.demandBacklogMilliGu;

    set({
      company: {
        ...company,
        demandBacklogMilliGu: nextDemandBacklog,
        activationBacklogMilliGu: company.activationBacklogMilliGu + resolution.activationDeltaMilliGu,
        churnThreatMilliGu: company.churnThreatMilliGu + resolution.churnThreatDeltaMilliGu,
        product: {
          ...company.product,
          slots: nextSlots,
        },
      },
      onboardingStep: nextStep,
    });
  },

  executeEarlyDeploy: (slotId: string) => {
    const current = get().company;
    const newDebt = Math.min(100, (current.vibeDebt || 0) + 18);
    set({
      company: {
        ...current,
        vibeDebt: newDebt,
        recentVibecodingEvents: [
          {
            id: `ev_${Date.now()}`,
            timestampMs: current.quarterElapsedMs,
            stage: current.vibeCodingStage,
            title: '⚡ YOLO DEPLOY TO PRODUCTION',
            detail: `Shipped without CI/CD verification. Vibe Debt rose to ${newDebt}%.`,
            type: 'deploy',
          },
          ...(current.recentVibecodingEvents || []).slice(0, 19),
        ],
      },
    });
    get().executeMerge(slotId, 'DEPLOY');
  },

  executeVerifySuite: (slotId: string) => {
    const current = get().company;
    const cleanDebt = Math.max(0, (current.vibeDebt || 0) - 25);
    set({
      company: {
        ...current,
        vibeDebt: cleanDebt,
        recentVibecodingEvents: [
          {
            id: `ev_${Date.now()}`,
            timestampMs: current.quarterElapsedMs,
            stage: current.vibeCodingStage,
            title: '✓ CI/CD REGRESSION SUITE VERIFIED',
            detail: `All unit tests passed cleanly. Vibe Debt purged to ${cleanDebt}%.`,
            type: 'win',
          },
          ...(current.recentVibecodingEvents || []).slice(0, 19),
        ],
      },
    });
    get().executeMerge(slotId, 'DEPLOY');
  },

  executeClearVibeDebt: () => {
    const current = get().company;
    const costCents = current.growthUnitCents / 4n; // 0.25 GU
    if (current.cashCents < costCents) return;
    set({
      company: {
        ...current,
        cashCents: current.cashCents - costCents,
        vibeDebt: 0,
        safetyIndex: 100,
        complexity: Math.max(0, current.complexity - 0.4),
        recentVibecodingEvents: [
          {
            id: `ev_${Date.now()}`,
            timestampMs: current.quarterElapsedMs,
            stage: current.vibeCodingStage,
            title: 'SYNTHETIC REGRESSION SUITE COMPLETE',
            detail: 'All context rot, phantom dependencies, and prompt drift eliminated.',
            type: 'win',
          },
          ...(current.recentVibecodingEvents || []).slice(0, 19),
        ],
      },
    });
    soundEngine.playTicketResolved();
  },

  executePricingTap: (_zone: PricingZone, milliGu: number) => {
    const { company, onboardingStep } = get();
    const newArrCents = (company.growthUnitCents * BigInt(milliGu)) / 1000n;
    const nextArr = company.arrCents + newArrCents;
    const nextValuation = calcValuation(nextArr, company.valuationMultiple);

    get().addAgentLog({
      agent: 'FOUNDER_CEO',
      action: 'PRICING_STRIKE',
      detail: `Struck ${_zone} zone: +${formatMoney(newArrCents)} ARR minted.`,
      type: 'monetization',
    });

    const nextState: CompanyState = {
      ...company,
      arrCents: nextArr,
      valuationCents: nextValuation,
      peakValuationCents: nextValuation > company.peakValuationCents ? nextValuation : company.peakValuationCents,
      currentQuarterNewCustomerArrCents: company.currentQuarterNewCustomerArrCents + newArrCents,
      totalManualActions: (company.totalManualActions || 0) + 1,
      monetization: {
        ...company.monetization,
        currentOpportunity: null,
      },
    };

    if (nextValuation >= UNICORN_VALUATION_CENTS && !company.unicornAcknowledged) {
      nextState.isPaused = true;
      nextState.unicornQuarter = company.quarter;
      nextState.unicornSpeedrunElapsedMs = company.quarterElapsedMs;
      soundEngine.playCelebration();
      set({
        company: nextState,
        activeModal: 'unicorn',
        onboardingStep: onboardingStep === 'q1_product' ? 'q1_monetization' : onboardingStep,
      });
      saveActiveRun(nextState, get().seed);
      return;
    }

    set({
      company: nextState,
      onboardingStep: onboardingStep === 'q1_product' ? 'q1_monetization' : onboardingStep,
    });
  },

  executeAimRetention: (threatId: string | null) => {
    set((s) => ({
      company: {
        ...s.company,
        totalManualActions: (s.company.totalManualActions || 0) + 1,
        retention: {
          ...s.company.retention,
          founderAimThreatId: threatId,
        },
      },
    }));
  },

  executeFireLaser: (threatId: string) => {
    const { company } = get();
    const threats = company.retention.threats;
    const targetIndex = threats.findIndex((t) => t.id === threatId);
    if (targetIndex === -1) return;

    const target = threats[targetIndex];
    const nextHp = target.hp - 1;

    let updatedThreats: typeof threats;
    if (nextHp <= 0) {
      updatedThreats = threats.filter((_, idx) => idx !== targetIndex);
    } else {
      updatedThreats = threats.map((t, idx) => (idx === targetIndex ? { ...t, hp: nextHp } : t));
    }

    set({
      company: {
        ...company,
        totalManualActions: (company.totalManualActions || 0) + 1,
        retention: {
          ...company.retention,
          threats: updatedThreats,
        },
      },
    });
  },

  executePackExpansion: (_fitScore: number, expansionArrMilliGu: number, churnThreatMilliGu: number) => {
    const { company, rng } = get();
    const expansionArr = (company.growthUnitCents * BigInt(expansionArrMilliGu)) / 1000n;
    const nextQuarterlyArr = company.currentQuarterExpansionArrCents + expansionArr;
    const nextArr = company.arrCents + expansionArr;
    const nextValuation = calcValuation(nextArr, company.valuationMultiple);

    get().addAgentLog({
      agent: 'FOUNDER_CEO',
      action: 'EXPANSION_PACK',
      detail: `Packed account expansion: +${formatMoney(expansionArr)} ARR.`,
      type: 'monetization',
    });

    // Dequeue the completed account
    const remainingAccounts = company.expansion.accounts.length > 0
      ? company.expansion.accounts.slice(1)
      : [];

    if (remainingAccounts.length === 0) {
      remainingAccounts.push(createExpansionAccount(rng, `acc_${Date.now()}_${Math.random()}`));
    }

    const nextState: CompanyState = {
      ...company,
      arrCents: nextArr,
      valuationCents: nextValuation,
      peakValuationCents: nextValuation > company.peakValuationCents ? nextValuation : company.peakValuationCents,
      currentQuarterExpansionArrCents: nextQuarterlyArr,
      churnThreatMilliGu: company.churnThreatMilliGu + churnThreatMilliGu,
      totalManualActions: (company.totalManualActions || 0) + 1,
      expansion: {
        ...company.expansion,
        accounts: remainingAccounts,
        activeAccountIndex: null,
        quarterlyExpansionArrCents: nextQuarterlyArr,
      },
    };

    if (nextValuation >= UNICORN_VALUATION_CENTS && !company.unicornAcknowledged) {
      nextState.isPaused = true;
      nextState.unicornQuarter = company.quarter;
      nextState.unicornSpeedrunElapsedMs = company.quarterElapsedMs;
      soundEngine.playCelebration();
      set({
        company: nextState,
        activeModal: 'unicorn',
      });
      saveActiveRun(nextState, get().seed);
      return;
    }

    set({ company: nextState });
  },

  executeDiagnoseIncident: (isCorrect: boolean) => {
    const { company } = get();
    if (isCorrect) {
      set({
        company: {
          ...company,
          operations: {
            ...company.operations,
            incidents: [],
          },
        },
      });
    }
  },

  buyDemandCampaign: (tier: 'blitz' | 'surge' | 'outbound') => {
    const { company } = get();
    const costMultiplier = tier === 'blitz' ? 0.5 : tier === 'surge' ? 2.0 : 5.0;
    const demandGain = tier === 'blitz' ? 5000 : tier === 'surge' ? 25000 : 75000;
    const costCents = (company.capitalUnitCents * BigInt(Math.round(costMultiplier * 100))) / 100n;

    if (company.cashCents < costCents) {
      soundEngine.playAlarm();
      return false;
    }

    soundEngine.playCash();
    soundEngine.playDeploy();

    set({
      company: {
        ...company,
        cashCents: company.cashCents - costCents,
        demandBacklogMilliGu: company.demandBacklogMilliGu + demandGain,
      },
    });
    return true;
  },

  buyProductSprint: (tier: 'boost' | 'ship_all' = 'boost') => {
    const { company } = get();
    const costMultiplier = tier === 'ship_all' ? 1.5 : 0.5;
    const costCents = (company.capitalUnitCents * BigInt(Math.round(costMultiplier * 100))) / 100n;

    if (company.cashCents < costCents) {
      soundEngine.playAlarm();
      return false;
    }

    soundEngine.playCash();
    soundEngine.playDeploy();

    let nextActivationBacklog = company.activationBacklogMilliGu;
    let nextDemandBacklog = company.demandBacklogMilliGu;
    let nextChurnThreat = company.churnThreatMilliGu;

    const nextSlots = company.product.slots.map((slot) => {
      if (tier === 'ship_all') {
        const { nextSlot, resolution } = mergePieceIntoSlot(slot, 'DEPLOY', company.capitalUnitCents);
        if (resolution.isShipped) {
          nextActivationBacklog += resolution.activationDeltaMilliGu;
          nextDemandBacklog = Math.max(0, nextDemandBacklog - 1000);
          nextChurnThreat += resolution.churnThreatDeltaMilliGu;
        }
        return nextSlot;
      } else {
        if (slot.requirements && slot.requirements.length > 0) {
          const filled = slot.filledIndices || [];
          const missingIdx = slot.requirements.findIndex((_, idx) => !filled.includes(idx));
          if (missingIdx !== -1) {
            const reqPiece = slot.requirements[missingIdx];
            const { nextSlot, resolution } = mergePieceIntoSlot(slot, reqPiece, company.capitalUnitCents);
            if (resolution.isShipped) {
              nextActivationBacklog += resolution.activationDeltaMilliGu;
              nextDemandBacklog = Math.max(0, nextDemandBacklog - 1000);
            }
            return nextSlot;
          }
        }
        return slot;
      }
    });

    set({
      company: {
        ...company,
        cashCents: company.cashCents - costCents,
        demandBacklogMilliGu: nextDemandBacklog,
        activationBacklogMilliGu: nextActivationBacklog,
        churnThreatMilliGu: nextChurnThreat,
        product: {
          ...company.product,
          slots: nextSlots,
        },
      },
    });
    return true;
  },

  selectGrowthCommitment: (commitment: number) => {
    soundEngine.playDeploy();
    set((s) => ({
      company: {
        ...s.company,
        growthCommitment: commitment,
      },
      activeModal: 'intermission_shop',
    }));
  },

  toggleLockUpgrade: (upgradeId: string) => {
    soundEngine.playClick();
    const currentLocked = get().shopLockedUpgradeIds;
    if (currentLocked.includes(upgradeId)) {
      set({ shopLockedUpgradeIds: currentLocked.filter((id) => id !== upgradeId) });
    } else {
      set({ shopLockedUpgradeIds: [...currentLocked, upgradeId] });
    }
  },

  buyUpgrade: (upgradeId: string) => {
    const { company, shopOfferedUpgrades, shopPurchasedCount, shopLockedUpgradeIds } = get();
    if (shopPurchasedCount >= 2) return false;

    const upgrade = shopOfferedUpgrades.find((u) => u.id === upgradeId);
    if (!upgrade) return false;
    if (company.upgrades.includes(upgrade.id)) return false;

    const priceMultiplier = shopPurchasedCount === 1 ? 1.5 : 1.0;
    const costCents =
      upgrade.costCu === 0
        ? 0n
        : (company.capitalUnitCents * BigInt(Math.round(upgrade.costCu * priceMultiplier * 100))) / 100n;

    if (company.cashCents < costCents && upgrade.costCu > 0) {
      soundEngine.playAlarm();
      return false;
    }

    soundEngine.playCash();
    soundEngine.playCelebration();

    set({
      company: {
        ...company,
        cashCents: company.cashCents - costCents,
        complexity: company.complexity + upgrade.complexity,
        upgrades: [...company.upgrades, upgrade.id],
      },
      shopPurchasedCount: shopPurchasedCount + 1,
      shopLockedUpgradeIds: shopLockedUpgradeIds.filter((id) => id !== upgradeId),
    });
    return true;
  },

  rerollShop: () => {
    const { company, rng, shopRerollCount, shopOfferedUpgrades, shopLockedUpgradeIds } = get();
    const rerollCostCents = company.capitalUnitCents / 2n; // 0.5 CU
    if (company.cashCents < rerollCostCents || shopRerollCount >= 1) {
      soundEngine.playAlarm();
      return;
    }

    soundEngine.playClick();

    // Preserve locked cards in their positions
    const lockedCards = shopOfferedUpgrades.filter((u) => shopLockedUpgradeIds.includes(u.id));
    const lockedIds = lockedCards.map((u) => u.id);

    const availableCards = ALL_UPGRADES.filter(
      (u) => !company.upgrades.includes(u.id) && !lockedIds.includes(u.id)
    );
    const shuffled = rng.shuffle(availableCards);
    const needed = Math.max(0, 3 - lockedCards.length);
    const newCards = shuffled.slice(0, needed);

    set({
      company: {
        ...company,
        cashCents: company.cashCents - rerollCostCents,
      },
      shopOfferedUpgrades: [...lockedCards, ...newCards],
      shopRerollCount: shopRerollCount + 1,
    });
  },

  buyAgentTier: (room: RoomId) => {
    const { company, shopAgentUpgradesPurchased } = get();
    // Cap at 2 agent licenses per quarter to require strategic planning
    if (shopAgentUpgradesPurchased >= 2) {
      soundEngine.playAlarm();
      return false;
    }

    const currentTier = company.agents[room];
    if (currentTier >= 4) return false;

    const nextTier = (currentTier + 1) as 1 | 2 | 3 | 4;
    const incrementCu = [0, 1, 2, 4, 7][nextTier]; // Cumulative install differences
    const costCents = company.capitalUnitCents * BigInt(incrementCu);

    if (company.cashCents < costCents) {
      soundEngine.playAlarm();
      return false;
    }

    soundEngine.playDeploy();
    const newAgents = { ...company.agents, [room]: nextTier };
    const complexityAdded = [0, 1.0, 0.5, 1.5, 2.0][nextTier];

    set({
      company: {
        ...company,
        cashCents: company.cashCents - costCents,
        complexity: company.complexity + complexityAdded,
        agents: newAgents,
      },
      shopAgentUpgradesPurchased: shopAgentUpgradesPurchased + 1,
    });
    return true;
  },

  drawLoc: (amountCents: MoneyCents) => {
    const { company } = get();
    const limit = calcLocLimit(company.arrCents, company.valuationCents);
    const available = limit > company.debtCents ? limit - company.debtCents : 0n;

    if (amountCents <= 0n || amountCents > available) {
      soundEngine.playAlarm();
      return;
    }

    soundEngine.playCash();
    set({
      company: {
        ...company,
        cashCents: company.cashCents + amountCents,
        debtCents: company.debtCents + amountCents,
      },
    });
  },

  repayLoc: (amountCents: MoneyCents) => {
    const { company } = get();
    if (amountCents <= 0n || amountCents > company.cashCents || amountCents > company.debtCents) {
      soundEngine.playAlarm();
      return;
    }

    soundEngine.playCash();
    set({
      company: {
        ...company,
        cashCents: company.cashCents - amountCents,
        debtCents: company.debtCents - amountCents,
      },
    });
  },

  acceptFinancing: (stage: 'preseed' | 'seed' | 'series_a' | 'series_b', raiseCents: MoneyCents) => {
    const { company } = get();
    const round = executeFinancingRound(
      stage,
      company.quarter,
      raiseCents,
      company.valuationCents,
      company.founderHistory,
      company.founderOwnershipBps
    );

    soundEngine.playCelebration();
    soundEngine.playCash();

    set({
      company: {
        ...company,
        cashCents: company.cashCents + raiseCents,
        founderOwnershipBps: round.ownershipAfterBps,
        financingRounds: [...company.financingRounds, round],
      },
    });
  },

  finishIntermission: () => {
    if (get().company.isBankrupt) {
      set({ activeModal: 'game_over' });
      return;
    }
    soundEngine.playDeploy();
    const nextState = beginNextQuarter(get().company);
    set({
      company: nextState,
      activeModal: 'none',
      shopPurchasedCount: 0,
      shopAgentUpgradesPurchased: 0,
    });
    saveActiveRun(nextState, get().seed);
  },

  chooseSituationOption: (choiceIndex: 0 | 1) => {
    const { company, activeSituation } = get();
    if (!activeSituation) return;

    const choice = activeSituation.choices[choiceIndex];
    soundEngine.playClick();

    let cashDelta = 0n;
    if (choice.effect.cashDeltaCu) {
      cashDelta = (company.capitalUnitCents * BigInt(Math.round(choice.effect.cashDeltaCu * 100))) / 100n;
    }

    let demandDelta = choice.effect.demandDeltaMilliGu || 0;
    let threatDelta = choice.effect.retentionThreatDeltaMilliGu || 0;

    set({
      company: {
        ...company,
        cashCents: company.cashCents + cashDelta,
        demandBacklogMilliGu: company.demandBacklogMilliGu + demandDelta,
        churnThreatMilliGu: company.churnThreatMilliGu + threatDelta,
      },
      activeModal: 'none',
      activeSituation: null,
    });
  },

  switchHoldingCompany: (companyId: string) => {
    soundEngine.playClick();
    set((s) => ({
      holding: {
        ...s.holding,
        activeCompanyId: companyId,
      },
    }));
  },

  launchNewSubsidiary: (history: FounderHistoryId, name: string) => {
    soundEngine.playCelebration();
    const newCo = createInitialCompanyState({ history, name });
    set((s) => ({
      holding: {
        ...s.holding,
        companies: [...s.holding.companies, newCo],
        activeCompanyId: newCo.id,
      },
      company: newCo,
      activeModal: 'none',
    }));
  },

  updateSettings: (newSettings: Partial<GameSettings>) => {
    const updated = { ...get().settings, ...newSettings };
    soundEngine.enabled = updated.soundEnabled;
    saveSettings(updated);
    set({ settings: updated });
  },

  dismissMilestone: () => set({ activeMilestone: null }),

  addAgentLog: (entry) => {
    const now = new Date();
    const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: AgentLogEntry = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: timeStr,
      ...entry,
    };
    set((s) => ({
      agentLogs: [newLog, ...s.agentLogs.slice(0, 39)],
    }));
  },

  triggerAlignmentEval: () => {
    const current = get().company;
    const newSafety = Math.min(100, (current.safetyIndex ?? 96) + 15);
    const newComplexity = Math.max(0, current.complexity - 0.4);
    const nextState = {
      ...current,
      safetyIndex: newSafety,
      complexity: newComplexity,
    };
    set({ company: nextState });
    get().addAgentLog({
      agent: 'ALIGNMENT_GUARD',
      action: 'EVALS_COMPLETED',
      detail: `Recursive safety suite verified. Safety: ${newSafety}%, Complexity normalized.`,
      type: 'safety',
    });
  },

  toggleRoomOverclock: (room: RoomId) => {
    const current = get().company;
    const currentOverclock = current.overclockRooms?.[room] ?? false;
    const newOverclock = !currentOverclock;
    const nextState = {
      ...current,
      overclockRooms: {
        ...current.overclockRooms,
        [room]: newOverclock,
      },
      complexity: newOverclock ? current.complexity + 0.3 : Math.max(0, current.complexity - 0.3),
    };
    set({ company: nextState });
    get().addAgentLog({
      agent: 'ORCHESTRATOR',
      action: newOverclock ? 'YOLO_OVERCLOCK' : 'BALANCED_MODE',
      detail: `${room.toUpperCase()} shifted to ${newOverclock ? 'YOLO (2x speed, +complexity)' : 'Standard mode'}.`,
      type: 'system',
    });
  },

  closeModal: () => {
    const current = get().company;
    const isUnicorn = get().activeModal === 'unicorn';
    set({
      activeModal: 'none',
      company: isUnicorn && current.isPaused ? { ...current, isPaused: false } : current,
    });
  },
  openModal: (modal: V1StoreState['activeModal']) => set({ activeModal: modal }),
}));

if (typeof window !== 'undefined') {
  (window as any).useV1Store = useV1Store;
}

