import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { ERAS, getEraConfig } from '../../data/eras';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  TrendingUp,
  X,
  Target,
  Layers,
  Users,
  Compass,
  DollarSign,
  Workflow,
  Building2,
  Cpu,
  Inbox
} from 'lucide-react';



interface EraRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EraRoadmapModal: React.FC<EraRoadmapModalProps> = ({ isOpen, onClose }) => {
  const { currentEra: rawCurrentEra, arr, mvpShipped } = useGameStore();

  if (!isOpen) return null;

  const currentEra = rawCurrentEra || 1;
  const currentConfig = getEraConfig(currentEra);
  const nextConfig = ERAS.find(e => e.id === currentEra + 1);

  const getTargetProgress = (eraId: number) => {
    if (eraId < currentEra) return 100;
    if (eraId > currentEra) return 0;
    if (!nextConfig) return 100;
    
    // Era 1 is based on MVP shipping (or BP)
    if (eraId === 1) {
      return mvpShipped ? 100 : 0;
    }

    const currentArr = Math.max(0, arr);
    const targetArr = nextConfig.arrThreshold;
    const prevArr = currentConfig.arrThreshold;
    const progress = ((currentArr - prevArr) / Math.max(1, targetArr - prevArr)) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'command': return Cpu;
      case 'agents': return Users;
      case 'product': return Layers;
      case 'growth': return TrendingUp;
      case 'customers': return Compass;
      case 'inbox': return Inbox;
      case 'finance': return DollarSign;

      case 'swarm': return Workflow;
      case 'holding': return Building2;
      default: return Sparkles;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fade-in text-left">
      <div className="apple-card rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-white/[0.14] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-black/40 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#0a84ff]/15 text-[#0a84ff]">
                <Target className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Autonomous Startup Eras Roadmap
              </h2>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#0a84ff]/20 text-[#0a84ff] border border-[#0a84ff]/30 font-medium">
                Era {currentEra} of 10
              </span>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Your software company progressively unlocks deeper autonomy, departments, and infrastructure as ARR scales.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Mission Banner */}
        {nextConfig && (
          <div className="p-4 sm:px-6 bg-[#0a84ff]/10 border-b border-[#0a84ff]/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#0a84ff] font-semibold block">
                CURRENT STRATEGIC TARGET
              </span>
              <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-2">
                <span>Unlock {nextConfig.name}</span>
                <span className="text-xs font-mono font-normal text-white/60">
                  (Goal: ${nextConfig.arrThreshold.toLocaleString()} ARR)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-right min-w-[120px]">
                <div className="text-xs font-mono font-semibold text-white tabular-nums">
                  ${Math.round(arr).toLocaleString()} / ${nextConfig.arrThreshold.toLocaleString()}
                </div>
                <span className="text-[10px] text-white/40">
                  {getTargetProgress(currentEra)}% Complete
                </span>
              </div>
              <div className="w-32 h-2 bg-white/[0.1] rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-[#0a84ff] rounded-full transition-all duration-300"
                  style={{ width: `${getTargetProgress(currentEra)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 10 Eras Scrollable List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 divide-y divide-white/[0.04]">
          {ERAS.map((era) => {
            const isCompleted = era.id < currentEra;
            const isCurrent = era.id === currentEra;
            const isNext = era.id === currentEra + 1;
            const isLocked = era.id > currentEra;

            return (
              <div
                key={era.id}
                className={`pt-3.5 first:pt-0 rounded-2xl transition-all ${
                  isCurrent
                    ? 'p-4 bg-[#0a84ff]/10 border border-[#0a84ff]/40 shadow-sm ring-1 ring-[#0a84ff]/20'
                    : isNext
                    ? 'p-4 bg-white/[0.03] border border-white/[0.12]'
                    : isCompleted
                    ? 'p-4 bg-white/[0.015] border border-white/[0.06] opacity-85'
                    : 'p-4 bg-white/[0.01] border border-white/[0.04] opacity-50'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                        isCompleted
                          ? 'bg-[#30d158]/20 text-[#30d158]'
                          : isCurrent
                          ? 'bg-[#0a84ff] text-white shadow-xs'
                          : isNext
                          ? 'bg-white/[0.1] text-white/80'
                          : 'bg-white/[0.04] text-white/30'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : era.id}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-semibold tracking-tight ${isCurrent ? 'text-white' : 'text-white/90'}`}>
                          {era.name}
                        </h3>
                        {isCompleted && (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30">
                            Completed
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#0a84ff]/20 text-[#0a84ff] border border-[#0a84ff]/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-pulse" />
                            Active Now
                          </span>
                        )}
                        {isNext && (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/30">
                            Next Target
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                        {era.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-semibold text-white/80 tabular-nums">
                      {era.arrThreshold === 0 ? 'Pre-MVP' : `$${era.arrThreshold.toLocaleString()} ARR`}
                    </span>
                    <span className="text-[10px] block text-white/40 font-mono">
                      {era.gateConditionDescription}
                    </span>
                  </div>
                </div>

                {/* Unlocked Systems & Tabs Badges */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 mr-1">
                    Unlocks:
                  </span>
                  {era.unlockedTabs.map(tab => {
                    const Icon = getTabIcon(tab);
                    return (
                      <span
                        key={tab}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                          isCurrent
                            ? 'bg-[#0a84ff]/15 text-[#0a84ff] border-[#0a84ff]/30'
                            : isCompleted
                            ? 'bg-white/[0.06] text-white/70 border-white/[0.08]'
                            : 'bg-white/[0.03] text-white/40 border-white/[0.04]'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="capitalize">{tab} Tab</span>
                      </span>
                    );
                  })}
                  <span className="text-[10px] text-white/40 italic ml-1">
                    "{era.hint}"
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs text-white/50 shrink-0">
          <span>The $1 Billion Autonomous Unicorn Climax awaits at Era 10.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl apple-btn-secondary text-xs font-medium text-white transition-all"
          >
            Continue Building
          </button>
        </div>
      </div>
    </div>
  );
};
