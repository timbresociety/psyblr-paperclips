import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { AGENT_ROLES, AGENT_NAMES } from '../../data/agentRoles';
import { AGENT_TRAITS, getRandomTrait } from '../../data/agentTraits';
import type { AgentRoleType, AgentTraitType } from '../../types/agents';
import { Bot, Sparkles, X, Plus } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

interface HireAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: AgentRoleType;
}

export const HireAgentModal: React.FC<HireAgentModalProps> = ({ isOpen, onClose, defaultRole }) => {
  const { cash, unlockedAgentRoles, hireAgent, agents } = useGameStore();

  const [selectedRole, setSelectedRole] = useState<AgentRoleType>(defaultRole || 'ENGINEERING');
  const [candidateTrait, setCandidateTrait] = useState<AgentTraitType>(getRandomTrait());
  const [candidateName, setCandidateName] = useState<string>(AGENT_NAMES[0]);

  React.useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
    } else if (agents.length >= 8 && !agents.some(a => a.role === 'MANAGER') && unlockedAgentRoles.includes('MANAGER')) {
      setSelectedRole('MANAGER');
    }
  }, [defaultRole, isOpen, agents.length, unlockedAgentRoles]);

  if (!isOpen) return null;


  const roleDef = AGENT_ROLES[selectedRole];
  const traitDef = AGENT_TRAITS[candidateTrait];
  const canAfford = cash >= roleDef.hireCost;

  const handleRollCandidate = () => {
    soundEngine.playClick();
    setCandidateTrait(getRandomTrait());
    setCandidateName(AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)]);
  };

  const handleHire = () => {
    soundEngine.playDeploy();
    const success = hireAgent(selectedRole, candidateTrait, candidateName);
    if (success) {
      handleRollCandidate();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in text-left">
      <div className="bg-[#1c1c1e]/95 border border-white/[0.12] rounded-2xl max-w-2xl w-full p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0a84ff]/15 text-[#0a84ff] flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Deploy Autonomous Agent
              </h3>
              <p className="text-xs text-white/50">
                Configure candidate role, persona traits, and system initialization parameters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Select Role Pipeline
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(Object.keys(AGENT_ROLES) as AgentRoleType[]).map((role) => {
              const def = AGENT_ROLES[role];
              const isUnlocked = unlockedAgentRoles.includes(role);
              const isSelected = selectedRole === role;
              const hasManager = agents.some(a => a.role === 'MANAGER');
              const hasSales = agents.some(a => a.role === 'SALES');
              const isRecommended = (role === 'MANAGER' && agents.length >= 8 && !hasManager) || (role === 'SALES' && agents.length >= 1 && !hasSales);

              return (
                <button
                  key={role}
                  disabled={!isUnlocked}
                  onClick={() => { soundEngine.playClick(); setSelectedRole(role); }}
                  className={`p-2.5 rounded-xl text-left border transition-all relative ${
                    isSelected
                      ? 'bg-[#0a84ff] text-white shadow-xs font-medium border-transparent'
                      : isRecommended
                      ? 'apple-inset text-white/90 border-[#ff453a]/40 hover:border-[#ff453a]/60 ring-1 ring-[#ff453a]/20'
                      : isUnlocked
                      ? 'apple-inset text-white/80 hover:border-white/[0.15]'
                      : 'bg-white/[0.02] border-white/[0.04] text-white/30 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold truncate">{def.title.split(' ')[0]}</div>
                    {isRecommended && !isSelected && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff453a] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff453a]" />
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 tabular-nums flex items-center justify-between ${isSelected ? 'text-white/80' : 'text-white/50'}`}>
                    <span>{isUnlocked ? `$${def.hireCost.toLocaleString()}` : 'Locked'}</span>
                    {isRecommended && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-[#ff453a]'}`}>
                        REC
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>


        {/* Candidate Preview Card */}
        <div className="apple-card rounded-2xl p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {candidateName}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.08]">
                {roleDef.title}
              </span>
            </div>

            <button
              onClick={handleRollCandidate}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg apple-btn-secondary transition-colors font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ff9f0a]" />
              <span>Reroll Trait</span>
            </button>
          </div>

          <p className="text-xs text-white/60">
            {roleDef.description}
          </p>

          {/* Rolled Trait Info */}
          <div className="apple-inset p-3 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/80">Persona Trait:</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${traitDef.badgeColor}`}>
                {traitDef.name}
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              {traitDef.description}
            </p>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="apple-inset p-2.5 rounded-xl">
              <span className="text-white/40 text-[10px] font-sans uppercase block">Base Output</span>
              <div className="font-semibold text-[#30d158] mt-0.5 tabular-nums">{roleDef.baseOutputDescription}</div>
            </div>
            <div className="apple-inset p-2.5 rounded-xl">
              <span className="text-white/40 text-[10px] font-sans uppercase block">Compute Load</span>
              <div className="font-semibold text-white/80 mt-0.5 tabular-nums">+{roleDef.baseComputeCost} CU</div>
            </div>
            <div className="apple-inset p-2.5 rounded-xl">
              <span className="text-white/40 text-[10px] font-sans uppercase block">Setup Fee</span>
              <div className="font-semibold text-white mt-0.5 tabular-nums">${roleDef.hireCost.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Footer & Hire Action */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
          <div className="text-xs font-mono text-white/50">
            Available Capital: <span className="font-semibold text-white tabular-nums">${Math.floor(cash).toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleHire}
              disabled={!canAfford}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                canAfford
                  ? 'apple-btn-primary'
                  : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy (${roleDef.hireCost.toLocaleString()})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

