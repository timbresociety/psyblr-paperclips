import React from 'react';
import { useV1Store } from '../../state/v1Store';

export const SituationModal: React.FC = () => {
  const { activeModal, activeSituation, chooseSituationOption } = useV1Store();

  if (activeModal !== 'situation' || !activeSituation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e] border border-[#ff453a]/40 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-left">
        {/* Header */}
        <div className="border-b border-[#1e1e24] pb-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#ff453a] block">
            ALERT // {activeSituation.sender.toUpperCase()}
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            {activeSituation.title}
          </h2>
        </div>

        {/* Situation Body */}
        <p className="text-xs text-white/80 leading-relaxed bg-[#111114] p-4 rounded-xl border border-[#1e1e24] font-mono">
          {activeSituation.body}
        </p>

        {/* 2 Deterministic Choices */}
        <div className="space-y-2">
          {activeSituation.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => chooseSituationOption(idx as 0 | 1)}
              className="w-full p-3.5 rounded-xl bg-[#111114] hover:bg-white/[0.05] border border-[#1e1e24] hover:border-white/30 text-left transition space-y-1 font-mono"
            >
              <span className="font-bold text-xs text-white block">
                [{idx + 1}] {choice.label}
              </span>
              <span className="text-[11px] text-white/50 block">
                → {choice.effect.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

