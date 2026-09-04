import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { ERAS, getEraConfig } from '../../data/eras';
import { getGuidingAttentionPoints } from '../../state/attentionSystem';
import { EraRoadmapModal } from '../common/EraRoadmapModal';
import {
  Compass,
  Target,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

interface EraMissionCardProps {
  onOpenHireModal?: (role?: any) => void;
  onOpenIncidentModal?: () => void;
}

export const EraMissionCard: React.FC<EraMissionCardProps> = ({
  onOpenHireModal,
  onOpenIncidentModal
}) => {
  const store = useGameStore();
  const {
    currentEra: rawCurrentEra,
    arr,
    mrr,
    mvpShipped,
    setActiveTab
  } = store;

  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);

  const currentEra = rawCurrentEra || 1;
  const currentConfig = getEraConfig(currentEra);
  const nextConfig = ERAS.find(e => e.id === currentEra + 1);

  // Attention points from the real-time attention system
  const attentionPoints = getGuidingAttentionPoints(store);

  // Calculate Progress towards next Era
  let progressPct = 100;
  let remainingText = 'Max Era Achieved';

  if (nextConfig) {
    if (currentEra === 1) {
      progressPct = mvpShipped ? 100 : Math.min(100, Math.round((store.buildPoints / 100) * 100));
      remainingText = mvpShipped ? 'MVP Shipped' : `${100 - Math.floor(store.buildPoints)} BP remaining to ship MVP`;
    } else {
      const current = Math.max(0, arr);
      const target = nextConfig.arrThreshold;
      const prev = currentConfig.arrThreshold;
      const pct = Math.round(((current - prev) / Math.max(1, target - prev)) * 100);
      progressPct = Math.min(100, Math.max(0, pct));
      const remainingArr = Math.max(0, target - current);
      remainingText = `$${Math.round(remainingArr).toLocaleString()} ARR remaining to unlock ${nextConfig.shortName}`;
    }
  }

  const handleActionClick = (target: any) => {
    soundEngine.playClick();
    if (!target) return;
    if (target.modal === 'hire') {
      if (onOpenHireModal) {
        onOpenHireModal(target.role);
      } else {
        setActiveTab('agents');
      }
    } else if (target.tab === 'inbox') {
      if (onOpenIncidentModal) {
        onOpenIncidentModal();
      } else {
        setActiveTab('inbox');
      }
    } else if (target.tab) {
      setActiveTab(target.tab);
    }
  };


  return (
    <>
      <div className="apple-card rounded-2xl p-4 sm:p-5 border border-white/[0.1] shadow-lg relative overflow-hidden text-left animate-in fade-in duration-300">
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-32 bg-radial from-[#0a84ff]/10 to-transparent pointer-events-none blur-2xl" />

        {/* Top Row: Mission Header & Roadmap Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0a84ff]/15 text-[#0a84ff] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#0a84ff]">
                  ACTIVE ERA MISSION
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.08]">
                  Era {currentEra}/10
                </span>
                {attentionPoints.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a]" />
                    {attentionPoints.length} Action Needed
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                {currentConfig.name}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              setIsRoadmapOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl apple-btn-secondary text-xs font-medium tracking-tight transition-all text-white/90 hover:text-white"
          >
            <Target className="w-3.5 h-3.5 text-[#0a84ff]" />
            <span>View 10-Era Roadmap</span>
            <ArrowRight className="w-3 h-3 text-white/40" />
          </button>
        </div>

        {/* Progress Bar Row */}
        {nextConfig && (
          <div className="mt-4 pt-3.5 border-t border-white/[0.06] relative z-10">
            <div className="flex flex-wrap items-center justify-between text-xs mb-1.5 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-white/60">Objective to Unlock {nextConfig.name}:</span>
                <span className="font-mono font-semibold text-white">
                  ${nextConfig.arrThreshold.toLocaleString()} ARR
                </span>
              </div>
              <div className="font-mono text-xs tabular-nums text-right">
                <span className="font-semibold text-[#0a84ff]">{progressPct}% Complete</span>
                <span className="text-white/40 ml-1.5">({remainingText})</span>
              </div>
            </div>

            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden p-0.5 border border-white/[0.04]">
              <div
                className="h-full bg-gradient-to-r from-[#0a84ff] to-[#64d2ff] rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Guiding Action Items / Attention Radar */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.06] relative z-10 space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block">
            Guiding Radar &middot; Things Requiring Founder Attention:
          </span>

          {attentionPoints.length === 0 ? (
            <div className="p-2.5 rounded-xl bg-[#30d158]/10 border border-[#30d158]/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#30d158]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-medium">
                  All systems nominal! Your autonomous swarm is scaling toward ${nextConfig?.arrThreshold.toLocaleString() || '1B'} ARR.
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#30d158]/80">
                +${Math.round(mrr / 12)}/sec
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attentionPoints.slice(0, 4).map((pt) => {
                const isCritical = pt.severity === 'critical';

                return (
                  <div
                    key={pt.id}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                      isCritical
                        ? 'bg-[#ff453a]/10 border-[#ff453a]/30 hover:border-[#ff453a]/50'
                        : 'bg-[#ff9f0a]/10 border-[#ff9f0a]/25 hover:border-[#ff9f0a]/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="mt-0.5 relative flex h-2.5 w-2.5 shrink-0">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            isCritical ? 'bg-[#ff453a]' : 'bg-[#ff9f0a]'
                          }`}
                        />
                        <span
                          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                            isCritical ? 'bg-[#ff453a]' : 'bg-[#ff9f0a]'
                          }`}
                        />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white tracking-tight truncate">
                          {pt.title}
                        </h4>
                        <p className="text-[11px] text-white/60 mt-0.5 line-clamp-2 leading-relaxed">
                          {pt.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleActionClick(pt.actionTarget)}
                      className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        isCritical
                          ? 'bg-[#ff453a] hover:bg-[#e0382e] text-white shadow-xs'
                          : 'bg-[#ff9f0a]/20 hover:bg-[#ff9f0a]/30 text-[#ff9f0a] border border-[#ff9f0a]/40'
                      }`}
                    >
                      <span>{pt.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 10-Era Roadmap Modal */}
      <EraRoadmapModal
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
      />
    </>
  );
};
