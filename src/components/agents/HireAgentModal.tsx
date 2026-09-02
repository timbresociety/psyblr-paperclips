import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { AGENT_ROLES, AGENT_NAMES } from '../../data/agentRoles';
import { AGENT_TRAITS, getRandomTrait } from '../../data/agentTraits';
import type { AgentRoleType, AgentTraitType } from '../../types/agents';
import { Bot, Sparkles, X, Plus } from 'lucide-react';

interface HireAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HireAgentModal: React.FC<HireAgentModalProps> = ({ isOpen, onClose }) => {
  const { cash, unlockedAgentRoles, hireAgent } = useGameStore();

  const [selectedRole, setSelectedRole] = useState<AgentRoleType>('ENGINEERING');
  const [candidateTrait, setCandidateTrait] = useState<AgentTraitType>(getRandomTrait());
  const [candidateName, setCandidateName] = useState<string>(AGENT_NAMES[0]);

  if (!isOpen) return null;

  const roleDef = AGENT_ROLES[selectedRole];
  const traitDef = AGENT_TRAITS[candidateTrait];
  const canAfford = cash >= roleDef.hireCost;

  const handleRollCandidate = () => {
    setCandidateTrait(getRandomTrait());
    setCandidateName(AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)]);
  };

  const handleHire = () => {
    const success = hireAgent(selectedRole, candidateTrait, candidateName);
    if (success) {
      handleRollCandidate();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#111422] border border-purple-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)] text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-black text-white tracking-wide">
              HIRE AUTONOMOUS AGENT
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="space-y-2 mb-4">
          <label className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Select Role
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(Object.keys(AGENT_ROLES) as AgentRoleType[]).map((role) => {
              const def = AGENT_ROLES[role];
              const isUnlocked = unlockedAgentRoles.includes(role);
              const isSelected = selectedRole === role;

              return (
                <button
                  key={role}
                  disabled={!isUnlocked}
                  onClick={() => setSelectedRole(role)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                      : isUnlocked
                      ? 'bg-[#171b2d] border-slate-800 text-slate-300 hover:border-slate-600'
                      : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{def.title.split(' ')[0]}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {isUnlocked ? `$${def.hireCost}` : 'Locked'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Candidate Preview Card */}
        <div className="bg-[#181c2f] border border-purple-500/30 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-black font-mono text-white">
                {candidateName}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                {roleDef.title}
              </span>
            </div>

            <button
              onClick={handleRollCandidate}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Reroll Trait</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            {roleDef.description}
          </p>

          {/* Rolled Trait Info */}
          <div className="bg-[#111422] p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Rolled Trait:</span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${traitDef.badgeColor}`}>
                {traitDef.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {traitDef.description}
            </p>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs font-mono">
            <div className="bg-[#121524] p-2 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase">Base Output</span>
              <div className="font-bold text-emerald-400 mt-0.5">{roleDef.baseOutputDescription}</div>
            </div>
            <div className="bg-[#121524] p-2 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase">Compute Load</span>
              <div className="font-bold text-cyan-300 mt-0.5">+{roleDef.baseComputeCost} CU</div>
            </div>
            <div className="bg-[#121524] p-2 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase">Setup Fee</span>
              <div className="font-bold text-white mt-0.5">${roleDef.hireCost}</div>
            </div>
          </div>
        </div>

        {/* Footer & Hire Action */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs font-mono text-slate-400">
            Available Cash: <span className="font-bold text-emerald-400">${Math.floor(cash).toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleHire}
              disabled={!canAfford}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                canAfford
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Hire Agent (${roleDef.hireCost})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
