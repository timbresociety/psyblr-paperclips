import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { User, Crown } from 'lucide-react';

export const OrgChartTree: React.FC = () => {
  const { agents } = useGameStore();

  const ceoAgent = agents.find(a => a.role === 'CEO');
  const engAgents = agents.filter(a => a.role === 'ENGINEERING');
  const qaAgents = agents.filter(a => a.role === 'QA');
  const growthAgents = agents.filter(a => a.role === 'GROWTH');
  const salesAgents = agents.filter(a => a.role === 'SALES');
  const supportAgents = agents.filter(a => a.role === 'SUPPORT');
  const opsAgents = agents.filter(a => a.role === 'OPERATIONS');

  return (
    <div className="bg-[#111422] border border-[#20263c] rounded-xl p-6 text-center overflow-x-auto">
      <div className="min-w-[700px] flex flex-col items-center">
        {/* LEVEL 1: HUMAN FOUNDER */}
        <div className="inline-flex flex-col items-center">
          <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-300" />
              <span className="font-bold text-sm text-white font-mono">YOU (FOUNDER)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                1 Human
              </span>
            </div>
            <p className="text-[11px] text-purple-300/80 mt-1 font-mono">
              Capital Allocation & Strategic Vision
            </p>
          </div>
          <div className="w-0.5 h-6 bg-slate-700 my-1" />
        </div>

        {/* LEVEL 2: CEO AGENT */}
        <div className="inline-flex flex-col items-center">
          <div className={`px-5 py-3 rounded-xl border ${
            ceoAgent 
              ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'bg-[#161a2b] border-dashed border-slate-700 text-slate-500'
          }`}>
            <div className="flex items-center gap-2">
              <Crown className={`w-4 h-4 ${ceoAgent ? 'text-amber-400' : 'text-slate-600'}`} />
              <span className="font-bold text-sm font-mono text-white">
                {ceoAgent ? `${ceoAgent.name} (CEO AGENT)` : 'CEO AGENT [LOCKED]'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {ceoAgent ? 'Operating entire company with 100% velocity' : 'Requires $1M ARR ($83.3k MRR)'}
            </p>
          </div>
          <div className="w-0.5 h-6 bg-slate-700 my-1" />
        </div>

        {/* LEVEL 3: C-SUITE EXECUTIVE LAYER */}
        <div className="w-full grid grid-cols-3 gap-4 my-2">
          {/* Product Department */}
          <div className="bg-[#15192b] border border-cyan-800/40 rounded-xl p-3 flex flex-col items-center">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Product & Eng
            </span>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5">
              {engAgents.length + qaAgents.length} Agents Assigned
            </span>
            <div className="mt-3 flex flex-wrap gap-1 justify-center">
              {engAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {a.name} (L{a.level})
                </span>
              ))}
              {qaAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  {a.name} (L{a.level})
                </span>
              ))}
              {engAgents.length === 0 && qaAgents.length === 0 && (
                <span className="text-[10px] text-slate-600 italic">No agents hired</span>
              )}
            </div>
          </div>

          {/* Growth & Sales Department */}
          <div className="bg-[#15192b] border border-pink-800/40 rounded-xl p-3 flex flex-col items-center">
            <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
              Growth & Sales
            </span>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5">
              {growthAgents.length + salesAgents.length} Agents Assigned
            </span>
            <div className="mt-3 flex flex-wrap gap-1 justify-center">
              {growthAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800">
                  {a.name} (L{a.level})
                </span>
              ))}
              {salesAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {a.name} (L{a.level})
                </span>
              ))}
              {growthAgents.length === 0 && salesAgents.length === 0 && (
                <span className="text-[10px] text-slate-600 italic">No agents hired</span>
              )}
            </div>
          </div>

          {/* Operations & Support Department */}
          <div className="bg-[#15192b] border border-blue-800/40 rounded-xl p-3 flex flex-col items-center">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
              Ops & Support
            </span>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5">
              {supportAgents.length + opsAgents.length} Agents Assigned
            </span>
            <div className="mt-3 flex flex-wrap gap-1 justify-center">
              {supportAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  {a.name} (L{a.level})
                </span>
              ))}
              {opsAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                  {a.name} (L{a.level})
                </span>
              ))}
              {supportAgents.length === 0 && opsAgents.length === 0 && (
                <span className="text-[10px] text-slate-600 italic">No agents hired</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
