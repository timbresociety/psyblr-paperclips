import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { Moon, ArrowRight } from 'lucide-react';

export const OfflineRecapModal: React.FC = () => {
  const { isOfflineModalOpen, offlineRecapData, closeOfflineModal } = useGameStore();

  if (!isOfflineModalOpen || !offlineRecapData) return null;

  const hours = (offlineRecapData.timeOfflineSeconds / 3600).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#111422] border border-purple-500/50 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-[0_0_40px_rgba(168,85,247,0.2)] text-left">
        <div className="flex items-center gap-2 mb-2">
          <Moon className="w-5 h-5 text-purple-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
            Autonomous Offline Cycle ({hours} Hours)
          </span>
        </div>

        <h2 className="text-2xl font-black text-white glow-purple mb-4">
          WHILE YOU WERE GONE
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
          <div className="bg-[#161a2f] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Revenue Earned</span>
            <span className="text-sm font-bold text-emerald-400">
              +${offlineRecapData.revenueEarned.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#161a2f] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Customers Acquired</span>
            <span className="text-sm font-bold text-blue-400">
              +{offlineRecapData.customersGained}
            </span>
          </div>

          <div className="bg-[#161a2f] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Tickets Handled</span>
            <span className="text-sm font-bold text-cyan-300">
              {offlineRecapData.ticketsResolved}
            </span>
          </div>

          <div className="bg-[#161a2f] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Operational Incidents</span>
            <span className="text-sm font-bold text-amber-300">
              {offlineRecapData.incidentsCount}
            </span>
          </div>
        </div>

        {/* Satirical Flavor Quote */}
        <div className="p-3.5 bg-[#171c31] border border-purple-900/40 rounded-xl text-xs text-purple-200/90 italic font-mono mb-6">
          "{offlineRecapData.recapFlavor}"
        </div>

        <button
          onClick={closeOfflineModal}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md"
        >
          <span>Resume Operations</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
