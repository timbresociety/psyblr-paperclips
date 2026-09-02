import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { CommandPaletteModal } from '../common/CommandPaletteModal';
import { ResetConfirmModal } from '../common/ResetConfirmModal';
import { soundEngine } from '../../audio/soundEffects';

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
    tokenBurnPerHour
  } = useGameStore();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isSubsidiaryDropdownOpen, setIsSubsidiaryDropdownOpen] = useState(false);

  if (!company) {
    return <>{children}</>;
  }

  const autonomyInfo = calcAutonomyInfo({ agents, valuation, stage });
  const activeSubsidiary = companies.find((c) => c.id === activeCompanyId) || companies[0];

  const navItems: {
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
      iconColor: 'text-[#ff9f0a]',
      hotkey: '9',
      badge: activeEvents.length > 0 ? `${activeEvents.length}` : undefined,
      badgeColor: 'bg-[#ff453a] text-white font-bold border-transparent'
    },
    { id: 'holding', label: 'Holding Portfolio', icon: Building2, iconColor: 'text-[#5e5ce6]', hotkey: '0' }
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121214] text-[#f5f5f7] overflow-hidden font-sans select-none antialiased">
      {/* 1. macOS Frosted Glass Titlebar */}
      <header className="h-11 shrink-0 bg-[#18181a]/85 backdrop-blur-2xl border-b border-white/[0.07] flex items-center justify-between px-4 z-40">
        {/* Left: Window Traffic Lights & Active Venture Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 group shrink-0">
            <button
              onClick={() => setIsResetOpen(true)}
              className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] hover:opacity-80 transition-opacity flex items-center justify-center text-[8px] font-bold text-black/70 group-hover:text-black"
              title="Reset Startup"
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

          {/* Subsidiary Switcher Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => { soundEngine.playClick(); setIsSubsidiaryDropdownOpen(!isSubsidiaryDropdownOpen); }}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-colors text-xs font-medium text-white/90 shrink-0"
            >
              <Building2 className="w-3.5 h-3.5 text-white/60 shrink-0" />
              <span className="tracking-tight truncate max-w-[130px]">{activeSubsidiary ? activeSubsidiary.name : company.name}</span>
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

          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08] flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-status-dot shrink-0" />
            1 Human CEO
          </span>
        </div>

        {/* Center: Live Financial Telemetry Ribbon */}
        <div className="hidden md:flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-[11px]">ARR</span>
            <strong className="text-[#30d158] font-mono font-semibold tabular-nums">${arr.toLocaleString()}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-[11px]">Treasury</span>
            <strong className="text-white font-mono font-semibold tabular-nums">${Math.round(cash).toLocaleString()}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-[11px]">Valuation</span>
            <strong className="text-white font-mono font-semibold tabular-nums">${valuation.toLocaleString()}</strong>
            <span className="text-[10px] text-white/40 font-mono">({valuationMultiple.toFixed(1)}x)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-[11px]">Compute Burn</span>
            <strong className="text-white/80 font-mono font-medium tabular-nums">${tokenBurnPerHour.toFixed(2)}/hr</strong>
          </div>
        </div>

        {/* Right: Actions, Speed & Audio Controls */}
        <div className="flex items-center gap-2">
          {/* Command Prompt Launcher */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-xs border border-white/[0.06] transition-colors"
            title="Open Command Palette (⌘K)"
          >
            <Command className="w-3 h-3 text-white/50" />
            <span className="font-mono text-[11px]">K</span>
          </button>

          {/* macOS Segmented Speed Toggles */}
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
        {/* Left macOS Sidebar */}
        <aside className="w-60 shrink-0 bg-[#161618]/90 backdrop-blur-xl border-r border-white/[0.06] flex flex-col justify-between p-3 z-30">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35 px-2.5 py-1.5 block">
              Autonomous Systems
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => { soundEngine.playClick(); setActiveTab(item.id); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#0a84ff] text-white shadow-sm font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.iconColor || 'text-white/40'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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

          {/* Bottom Sidebar HUD: Focus & Cluster Health */}
          <div className="p-3 rounded-2xl bg-[#1c1c1e]/70 border border-white/[0.06] space-y-2.5">
            {/* Focus Energy */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/50 flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3 text-[#0a84ff]" /> Focus Energy
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

            {/* GPU Cluster Load */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/50 flex items-center gap-1 text-[11px]">
                  <Cpu className="w-3 h-3 text-[#64d2ff]" /> GPU Cluster
                </span>
                <span className={`font-mono font-medium text-[11px] tabular-nums ${computeUsed > computeCapacity ? 'text-[#ff453a]' : 'text-white/80'}`}>
                  {computeUsed.toFixed(1)} / {computeCapacity} CU
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 rounded-full ${
                    computeUsed > computeCapacity ? 'bg-[#ff453a]' : 'bg-[#64d2ff]'
                  }`}
                  style={{ width: `${Math.min(100, (computeUsed / computeCapacity) * 100)}%` }}
                />
              </div>
            </div>

            {/* Autonomy Level */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-white/45 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3 h-3 text-[#5e5ce6]" /> Autonomy
              </span>
              <span className="text-white/90 font-medium text-[11px]">
                Tier {autonomyInfo.level} ({autonomyInfo.percent}%)
              </span>
            </div>
          </div>
        </aside>

        {/* Center Main Screen Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#121214] relative">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Modals */}
      <CommandPaletteModal isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <ResetConfirmModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} />
    </div>
  );
};

