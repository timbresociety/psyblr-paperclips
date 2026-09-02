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
    <div className="apple-card rounded-2xl p-6 text-center overflow-x-auto">
      <div className="min-w-[700px] flex flex-col items-center">
        {/* LEVEL 1: HUMAN FOUNDER */}
        <div className="inline-flex flex-col items-center">
          <div className="px-5 py-3 rounded-2xl apple-card border-white/[0.12] shadow-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#ff9f0a]" />
              <span className="font-semibold text-xs text-white">You (Founder &amp; Chair)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08] font-medium">
                1 Human
              </span>
            </div>
            <p className="text-[11px] text-white/50 mt-1">
              Capital Allocation &amp; Strategic Governance
            </p>
          </div>
          <div className="w-px h-6 bg-white/[0.12] my-1" />
        </div>

        {/* LEVEL 2: CEO AGENT */}
        <div className="inline-flex flex-col items-center">
          <div className={`px-5 py-3 rounded-2xl border ${
            ceoAgent 
              ? 'apple-card border-[#5e5ce6]/40 shadow-sm'
              : 'apple-inset border-dashed border-white/[0.10] text-white/40'
          }`}>
            <div className="flex items-center gap-2">
              <Crown className={`w-4 h-4 ${ceoAgent ? 'text-[#5e5ce6]' : 'text-white/30'}`} />
              <span className="font-semibold text-xs text-white">
                {ceoAgent ? `${ceoAgent.name} (CEO Agent)` : 'Autonomous CEO [Locked]'}
              </span>
            </div>
            <p className="text-[11px] text-white/40 mt-0.5">
              {ceoAgent ? 'Operating entire company with 100% velocity' : 'Requires $1M ARR ($83.3k MRR)'}
            </p>
          </div>
          <div className="w-px h-6 bg-white/[0.12] my-1" />
        </div>

        {/* LEVEL 3: C-SUITE EXECUTIVE LAYER */}
        <div className="w-full grid grid-cols-3 gap-4 my-2">
          {/* Product Department */}
          <div className="apple-inset rounded-2xl p-3.5 flex flex-col items-center">
            <span className="text-xs font-semibold text-[#64d2ff] uppercase tracking-wider">
              Product &amp; Eng
            </span>
            <span className="text-[11px] text-white/40 mt-0.5 font-mono">
              {engAgents.length + qaAgents.length} Agents Assigned
            </span>
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
              {engAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#64d2ff]/15 text-[#64d2ff] border border-[#64d2ff]/25 font-medium">
                  {a.name} (Lv.{a.level})
                </span>
              ))}
              {qaAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#64d2ff]/15 text-[#64d2ff] border border-[#64d2ff]/25 font-medium">
                  {a.name} (Lv.{a.level})
                </span>
              ))}
              {engAgents.length === 0 && qaAgents.length === 0 && (
                <span className="text-[11px] text-white/30 italic">No agents deployed</span>
              )}
            </div>
          </div>

          {/* Growth & Sales Department */}
          <div className="apple-inset rounded-2xl p-3.5 flex flex-col items-center">
            <span className="text-xs font-semibold text-[#bf5af2] uppercase tracking-wider">
              Growth &amp; Sales
            </span>
            <span className="text-[11px] text-white/40 mt-0.5 font-mono">
              {growthAgents.length + salesAgents.length} Agents Assigned
            </span>
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
              {growthAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#bf5af2]/15 text-[#bf5af2] border border-[#bf5af2]/25 font-medium">
                  {a.name} (Lv.{a.level})
                </span>
              ))}
              {salesAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/25 font-medium">
                  {a.name} (Lv.{a.level})
                </span>
              ))}
              {growthAgents.length === 0 && salesAgents.length === 0 && (
                <span className="text-[11px] text-white/30 italic">No agents deployed</span>
              )}
            </div>
          </div>

          {/* Operations & Support Department */}
          <div className="apple-inset rounded-2xl p-3.5 flex flex-col items-center">
            <span className="text-xs font-semibold text-[#ff9f0a] uppercase tracking-wider">
              Ops &amp; Support
            </span>
            <span className="text-[11px] text-white/40 mt-0.5 font-mono">
              {supportAgents.length + opsAgents.length} Agents Assigned
            </span>
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
              {supportAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/25 font-medium">
                  {a.name} (Lv.{a.level})
                </span>
              ))}
              {opsAgents.map(a => (
                <span key={a.id} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5e5ce6]/15 text-[#5e5ce6] border border-[#5e5ce6]/25 font-medium">
                  {a.name} (Lv.{a.level})
                </span>
              ))}
              {supportAgents.length === 0 && opsAgents.length === 0 && (
                <span className="text-[11px] text-white/30 italic">No agents deployed</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

