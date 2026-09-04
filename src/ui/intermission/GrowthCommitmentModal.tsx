import React, { useState } from 'react';
import { useV1Store } from '../../state/v1Store';

const COMMITMENTS = [
  { value: 0.10, label: '10% Target', risk: 'Defensive Baseline', common: 55, uncommon: 30, rare: 12, legendary: 3 },
  { value: 0.25, label: '25% Target', risk: 'Standard Growth', common: 50, uncommon: 31, rare: 15, legendary: 4 },
  { value: 0.50, label: '50% Target', risk: 'Aggressive Scale', common: 40, uncommon: 32, rare: 21, legendary: 7 },
  { value: 0.75, label: '75% Target', risk: 'Extreme Risk', common: 30, uncommon: 30, rare: 28, legendary: 12 },
  { value: 1.00, label: '100% Target', risk: 'Max Wager', common: 20, uncommon: 28, rare: 34, legendary: 18 },
];

export const GrowthCommitmentModal: React.FC = () => {
  const { activeModal, selectGrowthCommitment, company } = useV1Store();
  const [selected, setSelected] = useState<number>(0.25);

  if (activeModal !== 'intermission_commitment') return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e] border border-[#1e1e24] rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-left">
        {/* Header */}
        <div className="border-b border-[#1e1e24] pb-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block">
            SYS.GROWTH // QUARTER {company.quarter + 1} MANDATE
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Commit to Growth Mandate
          </h2>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">
            Higher commitments increase legendary and rare upgrade probabilities in the engineering shop, but failing to achieve your target terminates the company.
          </p>
        </div>

        {/* Commitment Options List */}
        <div className="space-y-2">
          {COMMITMENTS.map((c) => {
            const isChosen = selected === c.value;
            return (
              <div
                key={c.value}
                onClick={() => setSelected(c.value)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  isChosen
                    ? 'bg-white/[0.08] border-white text-white'
                    : 'bg-[#111114] border-[#1e1e24] text-white/60 hover:border-white/[0.2]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isChosen ? 'border-white bg-white' : 'border-white/30'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold font-mono text-white block">{c.label}</span>
                    <span className="text-[10px] text-white/40">{c.risk}</span>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span className="text-white font-semibold">{c.legendary}% LEG</span>
                  <span className="text-white/30 mx-1.5">/</span>
                  <span className="text-white/70">{c.rare}% RARE</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm Button */}
        <button
          onClick={() => selectGrowthCommitment(selected)}
          className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition flex items-center justify-center gap-2 text-xs font-mono tracking-wider"
        >
          <span>LOCK COMMITMENT & ENTER SHOP →</span>
        </button>
      </div>
    </div>
  );
};

