import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { AgentCard } from './AgentCard';
import { OrgChartTree } from './OrgChartTree';
import { HireAgentModal } from './HireAgentModal';
import { Bot, Plus, Network, LayoutGrid } from 'lucide-react';

export const AgentsScreen: React.FC = () => {
  const { agents } = useGameStore();
  const [viewMode, setViewMode] = useState<'roster' | 'org'>('roster');
  const [isHireOpen, setIsHireOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* Header with View Toggle & Hire CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111422] border border-[#20263c] rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-black tracking-tight text-white">
              AUTONOMOUS WORKFORCE
            </h2>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
              {agents.length} AGENTS ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Every agent works 24/7 without human salaries, stock options, or offsites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Roster vs Org Chart View Switch */}
          <div className="flex bg-[#181c2e] p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setViewMode('roster')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'roster'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Roster</span>
            </button>
            <button
              onClick={() => setViewMode('org')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'org'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Org Chart</span>
            </button>
          </div>

          {/* Hire Agent CTA */}
          <button
            onClick={() => setIsHireOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-md hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Hire Agent</span>
          </button>
        </div>
      </div>

      {/* Main Content: Roster Grid vs Org Chart */}
      {viewMode === 'org' ? (
        <OrgChartTree />
      ) : (
        <>
          {agents.length === 0 ? (
            <div className="bg-[#121524] border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                Zero Agents Hired
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                You are currently doing everything manually. Hire your first Engineering or Growth agent to automate production.
              </p>
              <button
                onClick={() => setIsHireOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Hire First Agent</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Hire Modal */}
      <HireAgentModal isOpen={isHireOpen} onClose={() => setIsHireOpen(false)} />
    </div>
  );
};
