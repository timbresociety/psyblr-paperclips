import React, { useState, useEffect } from 'react';
import { useGameStore, calcAutonomyInfo } from '../../state/gameStore';
import type { ScreenTab } from '../../types/game';
import {
  Activity,
  Workflow,
  Terminal,
  Users,
  Layers,
  TrendingUp,
  Inbox,
  Building2,
  DollarSign,
  Cpu,
  Zap,
  Volume2,
  VolumeX,
  Command,
  ChevronDown,
  Compass,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { CommandPaletteModal } from '../common/CommandPaletteModal';
import { ResetConfirmModal } from '../common/ResetConfirmModal';
import { soundEngine } from '../../audio/soundEffects';
import { ERAS, getEraConfig } from '../../data/eras';
import { EraUnlockBanner } from '../common/EraUnlockBanner';
import { FloatingParticlesContainer } from '../common/FloatingParticles';
import { getGuidingAttentionPoints } from '../../state/attentionSystem';
import { EraRoadmapModal } from '../common/EraRoadmapModal';
import { Target } from 'lucide-react';

interface MacConsoleShellProps {
  children: React.ReactNode;
}

export const MacConsoleShell: React.FC<MacConsoleShellProps> = ({ children }) => {
  const {
    company,
    companies,
    activeCompanyId,
    switchActiveCompany,
    stage,
    agents,
    activeTab,
    setActiveTab,
    gameSpeed,
    setGameSpeed,
    soundEnabled,
    toggleSound,
    cash,
    arr,
    valuation,
    valuationMultiple,
    focus,
    maxFocus,
    techDebt,
    computeUsed,
    computeCapacity,
    tickets,
    activeEvents,
    tokenBurnPerHour,
    currentEra: rawCurrentEra,
    netArrDeltaPerSec,
    netCashFlowPerSec,
    unattendedPenaltiesActive,
    isInsolvent,
    isComputeOverloaded,
    isEraProgressionBlocked,
    eraProgressionBlockReason
  } = useGameStore();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isSubsidiaryDropdownOpen, setIsSubsidiaryDropdownOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);

  const currentEra = rawCurrentEra || 1;
  const currentEraConfig = getEraConfig(currentEra);
  const attentionPoints = getGuidingAttentionPoints(useGameStore());

  // Auto-switch to available tab if current active tab is locked
  useEffect(() => {
    const isInboxAllowed = activeTab === 'inbox' && (currentEraConfig.unlockedTabs.includes('inbox') || activeEvents.length > 0);
    if (!currentEraConfig.unlockedTabs.includes(activeTab) && !isInboxAllowed) {
      setActiveTab('command');
    }
  }, [currentEra, activeTab, currentEraConfig, setActiveTab, activeEvents.length]);


  if (!company) {
    return <>{children}</>;
  }

  const autonomyInfo = calcAutonomyInfo({ agents, valuation, stage });
  const activeSubsidiary = companies.find((c) => c.id === activeCompanyId) || companies[0];

  const allNavItems: {
    id: ScreenTab;
    label: string;
    icon: React.ElementType;
    iconColor: string;
    hotkey: string;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    { id: 'command', label: 'Command Center', icon: Activity, iconColor: 'text-[#0a84ff]', hotkey: '1' },
    {
      id: 'swarm',
      label: 'Swarm Canvas',
      icon: Workflow,
      iconColor: 'text-[#5e5ce6]',
      hotkey: '2',
      badge: `${agents.length}`,
      badgeColor: 'bg-white/[0.06] text-white/70 border-white/[0.08]'
    },
    {
      id: 'terminal',
      label: 'Live Agent Stream',
      icon: Terminal,
      iconColor: 'text-[#5e5ce6]',
      hotkey: '3',
      badge: 'LIVE',
      badgeColor: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30'
    },
    { id: 'agents', label: 'Agent Workforce', icon: Users, iconColor: 'text-[#5e5ce6]', hotkey: '4', badge: agents.length },
    {
      id: 'product',
      label: 'Product & Architecture',
      icon: Layers,
      iconColor: 'text-[#64d2ff]',
      hotkey: '5',
      badge: `${techDebt.toFixed(0)}%`,
      badgeColor: techDebt > 50 ? 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/25' : techDebt > 25 ? 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/25' : undefined
    },
    { id: 'growth', label: 'Growth & Channels', icon: TrendingUp, iconColor: 'text-[#bf5af2]', hotkey: '6' },
    {
      id: 'customers',
      label: 'Customers & Support',
      icon: Compass,
      iconColor: 'text-[#ff9f0a]',
      hotkey: '7',
      badge: tickets > 0 ? `${Math.ceil(tickets)}` : undefined,
      badgeColor: tickets >= 8 ? 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/25' : 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/25'
    },
    { id: 'finance', label: 'Finance & Capital', icon: DollarSign, iconColor: 'text-[#30d158]', hotkey: '8' },
    {
      id: 'inbox',
      label: 'Executive Inbox',
      icon: Inbox,
      iconColor: unattendedPenaltiesActive ? 'text-[#ff453a]' : 'text-[#ff9f0a]',
      hotkey: '9',
      badge: unattendedPenaltiesActive ? 'DRAINING!' : (activeEvents.length > 0 ? `${activeEvents.length}` : undefined),
      badgeColor: unattendedPenaltiesActive ? 'bg-[#ff453a] text-white font-bold animate-pulse' : 'bg-[#ff9f0a]/20 text-[#ff9f0a] border-[#ff9f0a]/30'
    },
    { id: 'holding', label: 'Holding Portfolio', icon: Building2, iconColor: 'text-[#5e5ce6]', hotkey: '0' }
  ];

  // Progressive disclosure: only show tabs unlocked in this era, or inbox if an active event exists!
  const visibleNavItems = allNavItems.filter(item => 
    currentEraConfig.unlockedTabs.includes(item.id) || (item.id === 'inbox' && activeEvents.length > 0)
  );


  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-[#f5f5f7] overflow-hidden font-sans select-none antialiased">
      {/* Floating Click Particles & Unlock Toast */}
      <FloatingParticlesContainer />
      <EraUnlockBanner />

      {/* 1. Gleb / macOS Frosted Glass Titlebar with 10 Yolomode Pips */}
      <header className="h-12 shrink-0 bg-[#121214]/90 backdrop-blur-2xl border-b border-white/[0.08] flex items-center justify-between px-3 sm:px-4 z-40">
        {/* Left: Window Traffic Lights, Reset & Venture Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 group shrink-0">
            <button
              onClick={() => setIsResetOpen(true)}
              className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] hover:opacity-80 transition-opacity flex items-center justify-center text-[8px] font-bold text-black/70 group-hover:text-black"
              title="Reset Game / Butlerian Jihad"
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity leading-none">×</span>
            </button>
            <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] flex items-center justify-center text-[8px] font-bold text-black/70">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity leading-none">−</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] flex items-center justify-center text-[8px] font-bold text-black/70">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity leading-none">+</span>
            </div>
          </div>

          <div className="h-3.5 w-px bg-white/[0.08] shrink-0" />

          {/* Venture Switcher or Company Title */}
          <div className="flex items-center gap-2 shrink-0">
            {companies.length > 1 ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => { soundEngine.playClick(); setIsSubsidiaryDropdownOpen(!isSubsidiaryDropdownOpen); }}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-colors text-xs font-medium text-white/90 shrink-0"
                >
                  <Building2 className="w-3.5 h-3.5 text-white/60 shrink-0" />
                  <span className="tracking-tight truncate max-w-[120px]">{activeSubsidiary ? activeSubsidiary.name : company.name}</span>
                  <ChevronDown className="w-3 h-3 text-white/40 shrink-0" />
                </button>

                {isSubsidiaryDropdownOpen && (
                  <div className="absolute top-9 left-0 z-50 w-60 rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-3xl border border-white/[0.12] shadow-2xl p-1.5 space-y-1">
                    <span className="text-[10px] font-medium text-white/40 px-2.5 py-1 block uppercase tracking-wider">
                      Active Ventures ({companies.length})
                    </span>
                    {companies.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          switchActiveCompany(c.id);
                          setIsSubsidiaryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                          c.id === activeCompanyId
                            ? 'bg-[#0a84ff] text-white shadow-xs'
                            : 'text-white/80 hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        <span className={`text-[11px] font-mono tabular-nums ${c.id === activeCompanyId ? 'text-white/90' : 'text-[#30d158]'}`}>
                          ${Math.round(c.mrr).toLocaleString()}/mo
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90 tracking-tight">
                <span className="font-mono text-[11px] text-[#0a84ff]">PSYBLR</span>
                <span className="text-white/30">//</span>
                <span className="truncate max-w-[130px]">{company.name}</span>
              </div>
            )}

            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08] flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-status-dot shrink-0" />
              1 Human CEO
            </span>
          </div>
        </div>

        {/* Center: Yolomode-Inspired 10 Level Pips & Era Label (Clickable to open Era Roadmap) */}
        <div
          onClick={() => {
            soundEngine.playClick();
            setIsRoadmapOpen(true);
          }}
          className={`flex items-center gap-2.5 sm:gap-3 cursor-pointer group p-1 sm:px-2 rounded-xl transition-all border ${
            isEraProgressionBlocked
              ? 'bg-[#ff453a]/10 border-[#ff453a]/30 hover:border-[#ff453a]/50'
              : 'hover:bg-white/[0.04] border-transparent hover:border-white/[0.08]'
          }`}
          title={isEraProgressionBlocked ? `⚠️ Advancement Frozen: ${eraProgressionBlockReason}. Click to view Roadmap.` : "Click to view full 10-Era Progression Roadmap"}
        >
          <div className="hidden lg:flex flex-col items-end text-right">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold tracking-tight ${isEraProgressionBlocked ? 'text-[#ff9f0a]' : 'text-white/90 group-hover:text-white'}`}>
                {currentEraConfig.name}
              </span>
              <Target className={`w-3 h-3 ${isEraProgressionBlocked ? 'text-[#ff9f0a]' : 'text-[#0a84ff] opacity-60 group-hover:opacity-100'}`} />
            </div>
            <span className={`text-[10px] font-mono ${isEraProgressionBlocked ? 'text-[#ff453a] font-semibold animate-pulse' : 'text-white/40 group-hover:text-white/60'}`}>
              {isEraProgressionBlocked ? `⚠️ FROZEN: ${eraProgressionBlockReason}` : currentEraConfig.gateConditionDescription}
            </span>
          </div>

          {/* 10 Level Pips */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.08] group-hover:border-white/[0.15]">
            {ERAS.map((era) => {
              const isCurrent = era.id === currentEra;
              const isCompleted = era.id < currentEra;
              return (
                <div
                  key={era.id}
                  title={`${era.name} (Threshold: $${era.arrThreshold.toLocaleString()} ARR) - ${era.gateConditionDescription}`}
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? (isEraProgressionBlocked ? 'w-6 sm:w-7 bg-[#ff9f0a] pip-active shadow-sm' : 'w-6 sm:w-7 bg-[#0a84ff] pip-active shadow-sm')
                      : isCompleted
                      ? 'w-2.5 sm:w-3.5 bg-[#30d158]/80'
                      : 'w-2 sm:w-2.5 bg-white/[0.12]'
                  }`}
                />
              );
            })}
          </div>

          <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${
            isEraProgressionBlocked
              ? 'bg-[#ff453a]/20 text-[#ff453a] border-[#ff453a]/40 font-bold'
              : 'bg-white/[0.06] text-white/70 border-white/[0.08] group-hover:bg-[#0a84ff]/20 group-hover:text-[#0a84ff] group-hover:border-[#0a84ff]/30'
          }`}>
            <span>{currentEra}/10</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </span>
        </div>


        {/* Right: Telemetry & Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Progressive Telemetry: Treasury */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-white/40 text-[11px]">Treasury</span>
            <strong className={`font-mono font-semibold tabular-nums ${isInsolvent ? 'text-[#ff453a] animate-pulse' : 'text-white'}`}>
              ${Math.round(cash).toLocaleString()}
            </strong>
            {isInsolvent && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/40 animate-pulse">
                INSOLVENT
              </span>
            )}
            {!isInsolvent && netCashFlowPerSec !== 0 && (
              <span className={`text-[10px] font-mono ${netCashFlowPerSec < 0 ? 'text-[#ff453a]' : 'text-[#30d158]/80'}`}>
                {netCashFlowPerSec < 0 ? `-$${Math.abs(Math.round(netCashFlowPerSec))}/s` : `+$${Math.round(netCashFlowPerSec)}/s`}
              </span>
            )}
          </div>

          {/* Progressive Telemetry: ARR (Era 2+) */}
          {currentEraConfig.unlockedMetrics.includes('arr') && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-white/40 text-[11px]">ARR</span>
              <strong className={`font-mono font-semibold tabular-nums ${netArrDeltaPerSec < 0 ? 'text-[#ff453a]' : 'text-[#30d158]'}`}>
                ${arr.toLocaleString()}
              </strong>
              {netArrDeltaPerSec !== 0 && (
                <span className={`text-[10px] font-mono font-medium flex items-center gap-0.5 ${netArrDeltaPerSec < 0 ? 'text-[#ff453a] animate-pulse font-bold' : 'text-[#30d158]/80'}`}>
                  {netArrDeltaPerSec < 0 ? `(-$${Math.abs(netArrDeltaPerSec).toLocaleString()}/s 🔻)` : `(+$${netArrDeltaPerSec.toLocaleString()}/s)`}
                </span>
              )}
            </div>
          )}

          {/* Progressive Telemetry: Valuation (Era 7+) */}
          {currentEraConfig.unlockedMetrics.includes('valuation') && (
            <div
              className="hidden xl:flex items-center gap-1.5 text-xs cursor-help"
              title={`Valuation Formula: ARR ($${arr.toLocaleString()}) × Multiple (${valuationMultiple.toFixed(1)}x) = $${valuation.toLocaleString()}`}
            >
              <span className="text-white/40 text-[11px]">Valuation</span>
              <strong className="text-white font-mono font-semibold tabular-nums">
                ${valuation >= 1000000000 ? `${(valuation / 1000000000).toFixed(2)}B` : valuation >= 1000000 ? `${(valuation / 1000000).toFixed(1)}M` : valuation.toLocaleString()}
              </strong>
              <span className="text-[10px] text-[#30d158] font-mono font-medium">({valuationMultiple.toFixed(1)}x ARR)</span>
            </div>
          )}


          {/* Progressive Telemetry: Compute Burn (Era 5+) */}
          {currentEraConfig.unlockedMetrics.includes('compute') && (
            <div className="hidden 2xl:flex items-center gap-1.5 text-xs">
              <span className="text-white/40 text-[11px]">Burn</span>
              <strong className="text-white/80 font-mono font-medium tabular-nums">
                ${tokenBurnPerHour.toFixed(2)}/hr
              </strong>
            </div>
          )}

          {/* Executive Inbox Quick Access Tray */}
          {(activeEvents.length > 0 || currentEraConfig.unlockedTabs.includes('inbox')) && (
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('inbox');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                unattendedPenaltiesActive
                  ? 'bg-[#ff453a] text-white shadow-md font-bold animate-pulse border border-[#ff453a]/50 ring-2 ring-[#ff453a]/30'
                  : activeEvents.length > 0
                  ? 'bg-[#ff9f0a]/20 hover:bg-[#ff9f0a]/30 text-[#ff9f0a] border border-[#ff9f0a]/30'
                  : activeTab === 'inbox'
                  ? 'bg-white/[0.12] text-white'
                  : 'bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08]'
              }`}
              title={unattendedPenaltiesActive ? 'CRITICAL: Active penalties draining Trust and Cash! Open Inbox immediately!' : 'Open Executive Inbox & Decisions (Hotkey 9)'}
            >
              <Inbox className={`w-3.5 h-3.5 ${unattendedPenaltiesActive ? 'text-white' : ''}`} />
              <span className="hidden sm:inline">
                {unattendedPenaltiesActive ? '🚨 Inbox Draining!' : 'Inbox'}
              </span>
              {activeEvents.length > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  unattendedPenaltiesActive ? 'bg-black/60 text-white' : 'bg-white/[0.12] text-white'
                }`}>
                  {activeEvents.length}
                </span>
              )}
            </button>
          )}

          {/* Reset / Butlerian Jihad */}
          <button
            onClick={() => setIsResetOpen(true)}
            className="p-1.5 rounded-lg text-white/40 hover:text-[#ff453a] hover:bg-white/[0.06] transition-colors"
            title="Butlerian Jihad (Reset Game)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>


          {/* Command Prompt Launcher */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-xs border border-white/[0.06] transition-colors"
            title="Open Command Palette (⌘K)"
          >
            <Command className="w-3 h-3 text-white/50" />
            <span className="font-mono text-[11px]">K</span>
          </button>

          {/* Segmented Speed Toggles */}
          <div className="flex items-center rounded-lg bg-black/40 border border-white/[0.06] p-0.5 text-[11px] font-mono">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => { soundEngine.playClick(); setGameSpeed(s); }}
                className={`px-2 py-0.5 rounded-md transition-all font-medium tabular-nums ${
                  gameSpeed === s
                    ? 'bg-white/[0.18] text-white shadow-xs font-semibold'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Audio */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Toggle Audio"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-white/90" /> : <VolumeX className="w-3.5 h-3.5 text-white/30" />}
          </button>
        </div>
      </header>

      {/* 2. Main Workspace (Sidebar + Screen Viewport) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left macOS Sidebar (Progressively populated as Eras advance) */}
        <aside className="w-60 shrink-0 bg-[#121214]/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col justify-between p-3 z-30">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                Autonomous Systems
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-white/50">
                {visibleNavItems.length}/10
              </span>
            </div>

            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const tabAttention = attentionPoints.filter(p => p.tab === item.id);
              const hasAttention = tabAttention.length > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => { soundEngine.playClick(); setActiveTab(item.id); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#0a84ff] text-white shadow-sm font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title={hasAttention ? tabAttention[0].title : undefined}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.iconColor || 'text-white/40'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Red Guiding Attention Dot */}
                    {hasAttention && (
                      <span className="relative flex h-2 w-2" title={tabAttention[0].title}>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff453a] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff453a]" />
                      </span>
                    )}

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30 font-semibold'
                            : item.badgeColor || 'bg-white/[0.06] text-white/60 border-white/[0.08]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span className={`text-[10px] font-mono ${isActive ? 'text-white/70' : 'text-white/25'}`}>
                      {item.hotkey}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>


          {/* Bottom Sidebar HUD: Focus & Progressive Telemetry */}
          <div className="p-3 rounded-2xl bg-[#18181a]/90 border border-white/[0.06] space-y-2.5 shadow-sm">
            {/* Focus Energy (Always Visible) */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/50 flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3 text-[#0a84ff]" /> Founder Focus
                </span>
                <span className="text-[#0a84ff] font-mono font-medium text-[11px] tabular-nums">
                  {Math.round(focus)} / {maxFocus}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0a84ff] transition-all duration-200 rounded-full"
                  style={{ width: `${(focus / maxFocus) * 100}%` }}
                />
              </div>
            </div>

            {/* GPU Cluster Load (Unlocked in Era 5+) */}
            {currentEraConfig.unlockedMetrics.includes('compute') && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/50 flex items-center gap-1 text-[11px]">
                    <Cpu className={`w-3.5 h-3.5 ${isComputeOverloaded ? 'text-[#ff453a] animate-pulse' : 'text-[#64d2ff]'}`} /> GPU Cluster
                  </span>
                  <span className={`font-mono font-medium text-[11px] tabular-nums ${isComputeOverloaded ? 'text-[#ff453a] font-bold' : 'text-white/80'}`}>
                    {computeUsed.toFixed(1)} / {computeCapacity} CU
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 rounded-full ${
                      isComputeOverloaded ? 'bg-[#ff453a]' : 'bg-[#64d2ff]'
                    }`}
                    style={{ width: `${Math.min(100, (computeUsed / Math.max(1, computeCapacity)) * 100)}%` }}
                  />
                </div>
                {isComputeOverloaded && (
                  <p className="text-[10px] text-[#ff453a] mt-1 font-mono leading-tight animate-pulse">
                    ⚠️ Overloaded! Hallucinating bugs & +debt/sec.
                  </p>
                )}
              </div>
            )}

            {/* Autonomy Level (Unlocked in Era 3+) */}
            {currentEra >= 3 && (
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-white/45 flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3 h-3 text-[#5e5ce6]" /> Autonomy
                </span>
                <span className="text-white/90 font-medium text-[11px]">
                  Tier {autonomyInfo.level} ({autonomyInfo.percent}%)
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* Center Main Screen Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#09090b] relative">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Modals */}
      <CommandPaletteModal isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <ResetConfirmModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} />
      <EraRoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
    </div>
  );
};

