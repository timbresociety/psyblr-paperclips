import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { AgentCard } from './AgentCard';
import { OrgChartTree } from './OrgChartTree';
import { HireAgentModal } from './HireAgentModal';
import { Bot, Plus, Network, LayoutGrid } from 'lucide-react';

export const AgentsScreen: React.FC = () => {
  const { agents, unlockedAgentRoles } = useGameStore();
  const [viewMode, setViewMode] = useState<'roster' | 'org'>('roster');
  const [isHireOpen, setIsHireOpen] = useState(false);

  const hasManager = agents.some(a => a.role === 'MANAGER');
  const needsManager = agents.length >= 8 && !hasManager && unlockedAgentRoles.includes('MANAGER');
  const needsSales = agents.length >= 1 && !agents.some(a => a.role === 'SALES') && unlockedAgentRoles.includes('SALES');
  const hasAttention = needsManager || needsSales;

  return (
    <div className="space-y-5 text-left">
      {/* Header with View Toggle & Hire CTA */}
      <div className="apple-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ff9f0a]/15 text-[#ff9f0a] flex items-center justify-center">
              <Bot className="w-4 h-4" />

            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white tracking-tight">
                  Workforce Fleet
                </h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08]">
                  {agents.length} Active Nodes
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Autonomous agent workers executing 24/7 without salaries, equity dilution, or office overhead.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Roster vs Org Chart View Switch */}
          <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setViewMode('roster')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'roster'
                  ? 'bg-white/[0.16] text-white shadow-xs'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Roster</span>
            </button>
            <button
              onClick={() => setViewMode('org')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'org'
                  ? 'bg-white/[0.16] text-white shadow-xs'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Org Chart</span>
            </button>
          </div>

          {/* Hire Agent CTA */}
          <button
            onClick={() => setIsHireOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl apple-btn-primary text-xs font-medium tracking-tight shadow-sm relative"
          >
            {hasAttention && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff453a] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff453a]" />
              </span>
            )}
            <Plus className="w-3.5 h-3.5" />
            <span>Deploy Agent</span>
          </button>
        </div>
      </div>


      {/* Main Content: Roster Grid vs Org Chart */}
      {viewMode === 'org' ? (
        <OrgChartTree />
      ) : (
        <>
          {agents.length === 0 ? (
            <div className="apple-card border-dashed rounded-2xl p-12 text-center">
              <Bot className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1">
                Zero Agents Deployed
              </h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto mb-5 leading-relaxed">
                You are currently handling tasks manually. Deploy your first Engineering or Growth agent to automate production.
              </p>
              <button
                onClick={() => setIsHireOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl apple-btn-primary text-xs font-medium shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deploy First Agent</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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

