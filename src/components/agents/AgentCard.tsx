import React from 'react';
import type { AgentInstance } from '../../types/agents';
import { AGENT_TRAITS } from '../../data/agentTraits';
import { AGENT_ROLES } from '../../data/agentRoles';
import { useGameStore } from '../../state/gameStore';
import { Bot, Cpu, Zap, ArrowUpCircle, Trash2 } from 'lucide-react';

interface AgentCardProps {
  agent: AgentInstance;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const { cash, upgradeAgent, fireAgent } = useGameStore();
  const traitDef = AGENT_TRAITS[agent.trait];
  const roleDef = AGENT_ROLES[agent.role];

  const upgradeCost = Math.round(roleDef.hireCost * 0.75 * Math.pow(1.3, agent.level));
  const canUpgrade = cash >= upgradeCost && agent.level < 10;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ENGINEERING': return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'GROWTH': return 'bg-pink-950 text-pink-300 border-pink-800';
      case 'SALES': return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'SUPPORT': return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'QA': return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'OPERATIONS': return 'bg-teal-950 text-teal-300 border-teal-800';
      case 'MANAGER': return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'EXECUTIVE': return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'CEO': return 'bg-yellow-950 text-yellow-300 border-yellow-700 font-bold';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-[#151827] border border-[#23293f] hover:border-purple-500/50 rounded-xl p-4 flex flex-col justify-between transition-all duration-200">
      <div>
        {/* Header: Name, Role, Level */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-purple-400" />
              <h4 className="font-mono font-bold text-white text-sm tracking-wide">
                {agent.name}
              </h4>
            </div>
            <span className={`inline-block mt-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getRoleBadgeColor(agent.role)}`}>
              {roleDef.title}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-600/30 text-purple-200 border border-purple-500/40">
              LVL {agent.level}
            </span>
          </div>
        </div>

        {/* Trait Badge */}
        <div className="mt-3">
          <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${traitDef.badgeColor}`}>
            {traitDef.name}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            {traitDef.description}
          </p>
        </div>

        {/* Output & Compute Metrics */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Output:
            </span>
            <span className="font-bold text-emerald-400">
              {agent.outputPerSec.toFixed(2)} / sec
            </span>
          </div>

          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" /> Compute:
            </span>
            <span className="font-bold text-cyan-300">
              {agent.computeCost.toFixed(1)} CU
            </span>
          </div>
        </div>

        {/* Agent Quote */}
        <p className="mt-3 text-[11px] text-purple-300/80 italic font-mono bg-purple-950/20 p-2 rounded border border-purple-900/30">
          {agent.quote}
        </p>
      </div>

      {/* Action Buttons: Upgrade / Fire */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
        <button
          onClick={() => upgradeAgent(agent.id)}
          disabled={!canUpgrade}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
            canUpgrade
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <ArrowUpCircle className="w-3.5 h-3.5" />
          <span>
            {agent.level < 10 ? `Upgrade ($${upgradeCost.toLocaleString()})` : 'Max Level'}
          </span>
        </button>

        <button
          onClick={() => {
            if (window.confirm(`Revoke API keys for ${agent.name}?`)) {
              fireAgent(agent.id);
            }
          }}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition-colors"
          title="Revoke Agent API Key"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
