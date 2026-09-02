import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { getRandomStartupChoices } from '../../data/companyIdeas';
import type { StartupIdea } from '../../types/game';
import { Sparkles, Users, ArrowRight, Zap, Building, Target } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export const IdeaSelectionModal: React.FC = () => {
  const { isIdeaModalOpen, company, initCompany } = useGameStore();
  const [choices, setChoices] = useState<StartupIdea[]>(() => getRandomStartupChoices(3));

  // If a company already exists, never show the idea picker
  if (!isIdeaModalOpen || company !== null) return null;

  const handleReroll = () => {
    soundEngine.playClick();
    setChoices(getRandomStartupChoices(3));
  };

  const handleSelectIdea = (idea: StartupIdea) => {
    soundEngine.playCelebration();
    initCompany(idea);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
      <div className="apple-card rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl text-left">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/[0.06] pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Zero Employees
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30 font-medium font-mono">
                1 Human Founder
              </span>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Select your initial venture. Build a <strong>$1 Billion autonomous business</strong> without ever hiring another human.
            </p>
          </div>

          <button
            onClick={handleReroll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl apple-btn-secondary transition-colors font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ff9f0a]" />
            <span>Roll New Ideas</span>
          </button>
        </div>

        {/* 3 Idea Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {choices.map((idea) => (
            <div
              key={idea.id}
              className="group flex flex-col justify-between apple-inset hover:border-white/[0.2] rounded-2xl p-5 transition-all duration-200 cursor-pointer"
              onClick={() => handleSelectIdea(idea)}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.08]">
                    {idea.archetype.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-[#30d158] font-medium tabular-nums">
                    ${idea.arpu}/mo ARPU
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-white transition-colors">
                  {idea.name}
                </h3>
                <p className="text-[11px] text-white/50 italic mt-0.5 font-serif">
                  "{idea.tagline}"
                </p>

                <p className="text-xs text-white/60 mt-3 leading-relaxed">
                  {idea.description}
                </p>

                {/* Economics Matrix */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2 text-white/50">
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Users className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span>Customer:</span>
                    </span>
                    <span 
                      className="font-medium text-white/80 text-right truncate min-w-0 flex-1"
                      title={idea.customer}
                    >
                      {idea.customer}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-white/50">
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Zap className="w-3.5 h-3.5 text-[#ff9f0a] shrink-0" />
                      <span>Virality:</span>
                    </span>
                    <span className="font-mono font-medium text-[#ff9f0a] text-right shrink-0">{idea.virality}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-white/50">
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Building className="w-3.5 h-3.5 text-[#5e5ce6] shrink-0" />
                      <span>Enterprise:</span>
                    </span>
                    <span className="font-mono font-medium text-[#5e5ce6] text-right shrink-0">{idea.enterprisePotential}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-white/50">
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Target className="w-3.5 h-3.5 text-[#ff453a] shrink-0" />
                      <span>Difficulty:</span>
                    </span>
                    <span className="font-mono font-medium text-white/70 text-right shrink-0">{idea.difficulty}</span>
                  </div>
                </div>
              </div>

              <button
                className="mt-5 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl apple-btn-primary text-xs tracking-tight transition-all shadow-sm"
              >
                <span>Found {idea.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

