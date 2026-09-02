import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { getRandomStartupChoices } from '../../data/companyIdeas';
import type { StartupIdea } from '../../types/game';
import { Sparkles, Users, ArrowRight, Zap, Building, Target } from 'lucide-react';

export const IdeaSelectionModal: React.FC = () => {
  const { isIdeaModalOpen, company, initCompany } = useGameStore();
  const [choices, setChoices] = useState<StartupIdea[]>(() => getRandomStartupChoices(3));

  // If a company already exists, never show the idea picker
  if (!isIdeaModalOpen || company !== null) return null;

  const handleReroll = () => {
    setChoices(getRandomStartupChoices(3));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#11131f] border border-purple-500/40 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)] text-left">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white glow-purple">
                ZERO EMPLOYEES
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                1 Human Founder
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Select your startup venture. Reach a <strong>$1 Billion valuation</strong> without ever hiring another human.
            </p>
          </div>

          <button
            onClick={handleReroll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Roll New Ideas</span>
          </button>
        </div>

        {/* 3 Idea Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {choices.map((idea) => (
            <div
              key={idea.id}
              className="group flex flex-col justify-between bg-[#171a29] hover:bg-[#1d2235] border border-slate-800 hover:border-purple-500/60 rounded-xl p-5 transition-all duration-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] cursor-pointer"
              onClick={() => initCompany(idea)}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    {idea.archetype.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    ${idea.arpu}/mo ARPU
                  </span>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                  {idea.name}
                </h3>
                <p className="text-xs text-purple-200/90 font-medium mt-0.5 italic">
                  "{idea.tagline}"
                </p>

                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {idea.description}
                </p>

                {/* Economics Matrix */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 text-slate-500" /> Target Customer:
                    </span>
                    <span className="font-medium text-slate-300 text-right truncate max-w-[120px]">
                      {idea.customer}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 text-yellow-500" /> Virality:
                    </span>
                    <span className="font-mono font-bold text-yellow-300">{idea.virality}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building className="w-3 text-blue-400" /> Enterprise:
                    </span>
                    <span className="font-mono font-bold text-blue-300">{idea.enterprisePotential}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 text-rose-400" /> Difficulty:
                    </span>
                    <span className="font-mono font-bold text-slate-300">{idea.difficulty}</span>
                  </div>
                </div>
              </div>

              <button
                className="mt-5 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide transition-all shadow-md group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
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
