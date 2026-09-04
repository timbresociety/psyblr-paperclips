import React, { useEffect } from 'react';
import { useV1Store } from '../../state/v1Store';
import { EconomicHUD } from './EconomicHUD';
import { BottomRoomNav } from './BottomRoomNav';
import { OnboardingBanner } from '../onboarding/OnboardingBanner';

import { MarketingRoomCanvas } from '../../canvas/rooms/MarketingRoomCanvas';
import { ProductRoomCanvas } from '../../canvas/rooms/ProductRoomCanvas';
import { MonetizationRoomCanvas } from '../../canvas/rooms/MonetizationRoomCanvas';
import { RetentionRoomCanvas } from '../../canvas/rooms/RetentionRoomCanvas';
import { ExpansionRoomCanvas } from '../../canvas/rooms/ExpansionRoomCanvas';
import { OperationsRoomCanvas } from '../../canvas/rooms/OperationsRoomCanvas';

import { QuarterReviewModal } from '../intermission/QuarterReviewModal';
import { GrowthCommitmentModal } from '../intermission/GrowthCommitmentModal';
import { UpgradeShopModal } from '../intermission/UpgradeShopModal';
import { CapitalModal } from '../intermission/CapitalModal';
import { SituationModal } from '../modals/SituationModal';
import { HoldingCompanyModal } from '../holding/HoldingCompanyModal';
import { GameOverModal } from '../modals/GameOverModal';
import { UnicornVictoryModal } from '../modals/UnicornVictoryModal';
import { MilestoneNotificationBanner } from '../milestones/MilestoneNotificationBanner';
import type { RoomId } from '../../sim/types';

export const ResponsiveShell: React.FC = () => {
  const {
    company,
    switchRoom,
    executeSwipe,
    executeMerge,
    executeEarlyDeploy,
    executePricingTap,
    executeAimRetention,
    executeFireLaser,
    executePackExpansion,
    executeDiagnoseIncident,
    buyDemandCampaign,
    buyProductSprint,
    executeVerifySuite,
    openModal,
    closeModal,
    activeModal,
    toggleRoomOverclock,
  } = useV1Store();

  // Keyboard navigation for power users & desktop ergonomics
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (isInput) return;

      if (e.key === 'Escape') {
        if (activeModal !== 'none') {
          closeModal();
          return;
        }
      }

      // 1-6 Room switcher
      const roomMap: Record<string, RoomId> = {
        '1': 'marketing',
        '2': 'product',
        '3': 'monetization',
        '4': 'retention',
        '5': 'expansion',
        '6': 'operations',
      };

      if (roomMap[e.key]) {
        e.preventDefault();
        switchRoom(roomMap[e.key]);
        return;
      }

      // 'H' key for Holding Company & Meta-Progression Portfolio
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        if (activeModal === 'holding_company') {
          closeModal();
        } else {
          openModal('holding_company');
        }
        return;
      }

      // 'O' key to toggle YOLO Overclock for the current room
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        toggleRoomOverclock(company.activeRoom);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchRoom, activeModal, closeModal, openModal, toggleRoomOverclock, company.activeRoom]);

  const activeAccount =
    company.expansion.activeAccountIndex !== null &&
    company.expansion.accounts[company.expansion.activeAccountIndex]
      ? company.expansion.accounts[company.expansion.activeAccountIndex]
      : company.expansion.accounts[0] || null;

  const roomMeta: Record<RoomId, { num: string; title: string }> = {
    marketing: { num: '01', title: 'SIGNAL HORIZON RADAR' },
    product: { num: '02', title: 'NEURAL VIBE CODING STUDIO' },
    monetization: { num: '03', title: 'HARMONIC RESONANCE DECK' },
    retention: { num: '04', title: 'MODEL ALIGNMENT FIREWALL' },
    expansion: { num: '05', title: 'SOVEREIGN CLOUD ARCHITECTURE' },
    operations: { num: '06', title: 'GPU COMPUTE & CONTEXT TRIAGE' },
  };
  const activeMeta = roomMeta[company.activeRoom];
  const activeTier = company.agents[company.activeRoom];
  const isOverclocked = company.overclockRooms?.[company.activeRoom] ?? false;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#030307] text-white select-none relative">
      {/* Milkinside Volumetric Neural Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-indigo-600/08 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-10 w-[600px] h-[400px] bg-purple-600/08 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. Sticky Telemetry HUD */}
      <EconomicHUD />

      {/* 2. Onboarding Progressive Guidance (Q1-Q5) */}
      <OnboardingBanner />

      {/* 2b. Intermission Recovery Banner if modal was closed */}
      {company.isIntermission && !company.isBankrupt && activeModal === 'none' && (
        <div className="bg-[#ffd60a]/15 border-b border-[#ffd60a]/30 px-4 py-2 flex items-center justify-between text-xs font-mono animate-pulse">
          <span className="text-[#ffd60a] font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffd60a]" />
            QUARTER {company.quarter} COMPLETE // INTERMISSION IN PROGRESS (SIMULATION PAUSED)
          </span>
          <button
            onClick={() => openModal('intermission_review')}
            className="px-3 py-1 bg-[#ffd60a] text-black font-bold rounded-full hover:bg-[#ffd60a]/90 transition"
          >
            RESUME QUARTER REVIEW →
          </button>
        </div>
      )}

      {/* 2c. Bankruptcy Termination Banner if modal was dismissed */}
      {company.isBankrupt && activeModal === 'none' && (
        <div className="bg-[#ff453a]/20 border-b border-[#ff453a]/50 px-4 py-2 flex items-center justify-between text-xs font-mono animate-pulse">
          <span className="text-[#ff453a] font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff453a]" />
            [CRITICAL] AUTONOMY TERMINATED // {company.bankruptcyReason === 'growth_mandate_missed' ? 'GROWTH MANDATE MISSED' : 'LIQUIDITY INSOLVENT'}
          </span>
          <button
            onClick={() => openModal('game_over')}
            className="px-3 py-1 bg-[#ff453a] text-black font-bold rounded-full hover:bg-[#ff453a]/90 transition"
          >
            VIEW POST-MORTEM →
          </button>
        </div>
      )}

      {/* 3. Main Room Canvas Viewport */}
      <main className="flex-1 relative w-full h-full min-h-0 min-w-0 overflow-hidden flex items-center justify-center p-2 sm:p-4">
        <div className="w-full h-full max-w-5xl max-h-[860px] relative rounded-3xl overflow-hidden border border-white/[0.09] bg-[#06070d]/80 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.85)] flex flex-col">
          {/* Milkinside Spatial Module Header */}
          <div className="h-10 bg-white/[0.02] border-b border-white/[0.06] px-4 flex items-center justify-between text-[11px] font-mono text-white/50 shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  activeTier > 0
                    ? isOverclocked
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-ping'
                      : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse'
                    : 'bg-white/20'
                }`}
              />
              <span className="font-semibold text-white tracking-widest text-[10px] uppercase">
                MODULE {activeMeta.num} · {activeMeta.title}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => toggleRoomOverclock(company.activeRoom)}
                title="Toggle YOLO Overclock (2x velocity, +vibe debt risk) [Hotkey: O]"
                className={`font-mono font-bold text-[9px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                  isOverclocked
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white hover:border-white/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOverclocked ? 'bg-amber-400 animate-ping' : 'bg-white/30'}`} />
                <span>{isOverclocked ? 'YOLO MODE: ENGAGED' : 'YOLO MODE [O]'}</span>
              </button>
              {activeTier > 0 && (
                <span
                  className={`font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] border ${
                    isOverclocked
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  }`}
                >
                  <span>{isOverclocked ? '⚡ SWARM 2X VELOCITY' : `AUTOPILOT (TIER ${activeTier})`}</span>
                </span>
              )}
              <span className="text-white/20 tracking-wider text-[9px] hidden sm:inline font-mono">MILKINSIDE // NEURAL OS</span>
            </div>
          </div>

          {/* Room Canvases */}
          <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden flex">
            {company.activeRoom === 'marketing' && (
              <MarketingRoomCanvas
                card={company.marketing.queue[0] || null}
                comboCount={company.marketing.comboCount}
                agentTier={company.agents.marketing}
                hasTrendRadar={company.upgrades.includes('mkt_trend_radar')}
                demandBacklogMilliGu={company.demandBacklogMilliGu}
                cashCents={company.cashCents}
                capitalUnitCents={company.capitalUnitCents}
                onBuyCampaign={buyDemandCampaign}
                onSwipe={executeSwipe}
                onSwitchToProduct={() => switchRoom('product')}
              />
            )}

            {company.activeRoom === 'product' && (
              <ProductRoomCanvas
                slots={company.product.slots}
                agentTier={company.agents.product}
                demandBacklogMilliGu={company.demandBacklogMilliGu}
                activationBacklogMilliGu={company.activationBacklogMilliGu}
                cashCents={company.cashCents}
                capitalUnitCents={company.capitalUnitCents}
                onBuySprint={buyProductSprint}
                onMerge={executeMerge}
                onEarlyDeploy={executeEarlyDeploy}
                onVerifySuite={executeVerifySuite}
                onSwitchToPricing={() => switchRoom('monetization')}
                onSwitchToMarketing={() => switchRoom('marketing')}
              />
            )}

            {company.activeRoom === 'monetization' && (
              <MonetizationRoomCanvas
                opportunity={company.monetization.currentOpportunity}
                agentTier={company.agents.monetization}
                onTap={executePricingTap}
                onSwitchToProduct={() => switchRoom('product')}
              />
            )}

            {company.activeRoom === 'retention' && (
              <RetentionRoomCanvas
                threats={company.retention.threats}
                agentTier={company.agents.retention}
                onAim={executeAimRetention}
                onFireLaser={executeFireLaser}
              />
            )}

            {company.activeRoom === 'expansion' && (
              <ExpansionRoomCanvas
                account={activeAccount}
                growthUnitCents={company.growthUnitCents}
                agentTier={company.agents.expansion}
                onPackComplete={executePackExpansion}
              />
            )}

            {company.activeRoom === 'operations' && (
              <OperationsRoomCanvas
                incident={
                  company.operations.activeIncidentIndex !== null &&
                  company.operations.incidents[company.operations.activeIncidentIndex]
                    ? company.operations.incidents[company.operations.activeIncidentIndex]
                    : company.operations.incidents[0] || null
                }
                agentTier={company.agents.operations}
                onResolve={executeDiagnoseIncident}
              />
            )}
          </div>
        </div>
      </main>

      {/* 4. Thumb-Friendly Bottom Room Navigation */}
      <BottomRoomNav />

      {/* 5. Modals & Intermission Overlays */}
      <QuarterReviewModal />
      <GrowthCommitmentModal />
      <UpgradeShopModal />
      <CapitalModal />
      <SituationModal />
      <HoldingCompanyModal />
      <GameOverModal />
      <UnicornVictoryModal />
      <MilestoneNotificationBanner />
    </div>
  );
};
