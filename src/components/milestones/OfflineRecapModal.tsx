import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { Moon, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export const OfflineRecapModal: React.FC = () => {
  const { isOfflineModalOpen, offlineRecapData, closeOfflineModal } = useGameStore();

  if (!isOfflineModalOpen || !offlineRecapData) return null;

  const hours = (offlineRecapData.timeOfflineSeconds / 3600).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
      <div className="apple-card rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-left">
        <div className="flex items-center gap-2 mb-2">
          <Moon className="w-4 h-4 text-[#bf5af2]" />
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#bf5af2]">
            Autonomous Offline Cycle ({hours} Hours)
          </span>
        </div>

        <h2 className="text-xl font-bold text-white mb-4 tracking-tight">
          While You Were Away
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 font-mono text-xs tabular-nums">
          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 text-[10px] font-sans block">Revenue Earned</span>
            <span className="text-sm font-semibold text-[#30d158] mt-0.5 block">
              +${offlineRecapData.revenueEarned.toLocaleString()}
            </span>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 text-[10px] font-sans block">Customers Acquired</span>
            <span className="text-sm font-semibold text-white mt-0.5 block">
              +{offlineRecapData.customersGained}
            </span>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 text-[10px] font-sans block">Tickets Resolved</span>
            <span className="text-sm font-semibold text-white/80 mt-0.5 block">
              {offlineRecapData.ticketsResolved}
            </span>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 text-[10px] font-sans block">Incidents Logged</span>
            <span className="text-sm font-semibold text-[#ff9f0a] mt-0.5 block">
              {offlineRecapData.incidentsCount}
            </span>
          </div>
        </div>

        {/* Satirical Flavor Quote */}
        <div className="p-3.5 apple-inset rounded-xl text-xs text-white/70 italic font-serif mb-6">
          "{offlineRecapData.recapFlavor}"
        </div>

        <button
          onClick={() => { soundEngine.playClick(); closeOfflineModal(); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl apple-btn-primary text-xs font-medium tracking-tight transition-all shadow-sm"
        >
          <span>Resume Operations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

