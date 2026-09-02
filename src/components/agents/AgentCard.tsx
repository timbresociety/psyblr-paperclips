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

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'CEO': return 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30 font-semibold';
      case 'EXECUTIVE':
      case 'MANAGER': return 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30';
      case 'ENGINEERING':
      case 'QA': return 'bg-[#64d2ff]/15 text-[#64d2ff] border-[#64d2ff]/30';
      case 'GROWTH': return 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/30';
      case 'SALES': return 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30';
      case 'SUPPORT':
      case 'OPERATIONS': return 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30';
      default: return 'bg-white/[0.06] text-white/70 border-white/[0.08]';
    }
  };

  return (
    <div className="apple-card rounded-2xl p-4 flex flex-col justify-between transition-all group hover:border-white/[0.14] text-left">
      <div>
        {/* Header: Name, Role, Level */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-white/80" />
              <h4 className="font-semibold text-white text-xs tracking-tight">
                {agent.name}
              </h4>
            </div>
            <span className={`inline-block mt-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(agent.role)}`}>
              {roleDef.title}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08]">
              Lv.{agent.level}
            </span>
          </div>
        </div>

        {/* Trait Badge */}
        <div className="mt-3">
          <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${traitDef.badgeColor}`}>
            {traitDef.name}
          </span>
          <p className="text-[11px] text-white/50 mt-1 line-clamp-2">
            {traitDef.description}
          </p>
        </div>

        {/* Output & Compute Metrics */}
        <div className="mt-3.5 pt-3 border-t border-white/[0.06] space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-white/80">
            <span className="text-white/40 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#ff9f0a]" /> Output
            </span>
            <span className="font-semibold text-[#30d158] tabular-nums">
              +{agent.outputPerSec.toFixed(2)}/s
            </span>
          </div>

          <div className="flex justify-between text-white/80">
            <span className="text-white/40 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-white/40" /> Compute
            </span>
            <span className="font-semibold text-white/80 tabular-nums">
              {agent.computeCost.toFixed(1)} CU
            </span>
          </div>
        </div>

        {/* Agent Quote */}
        <p className="mt-3 text-[11px] text-white/60 italic font-serif bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05]">
          "{agent.quote}"
        </p>
      </div>

      {/* Action Buttons: Upgrade / Fire */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
        <button
          onClick={() => upgradeAgent(agent.id)}
          disabled={!canUpgrade}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
            canUpgrade
              ? 'apple-btn-secondary'
              : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
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
          className="p-2 rounded-xl bg-[#ff453a]/10 hover:bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/20 transition-colors"
          title="Revoke Agent API Key"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

