import React, { useState } from 'react';
import { useV1Store } from '../../state/v1Store';
import { formatMoney, formatBps } from '../../sim/math';
import { FOUNDER_HISTORIES } from '../../content/histories';
import type { FounderHistoryId } from '../../sim/types';

export const HoldingCompanyModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    company,
    holding,
    launchNewSubsidiary,
    switchHoldingCompany,
  } = useV1Store();

  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<FounderHistoryId>('vibe_coder');
  const [subName, setSubName] = useState('Next Venture');

  if (activeModal !== 'holding_company') return null;

  const allCompanies = holding.companies.length > 0 ? holding.companies : [company];
  const portfolioFounderValue = allCompanies.reduce(
    (acc, co) => acc + (co.valuationCents * BigInt(co.founderOwnershipBps)) / 10000n,
    0n
  );

  const handleLaunch = () => {
    launchNewSubsidiary(selectedHistory, subName);
    setIsLaunching(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0c0c0e] border border-[#1e1e24] rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-left my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e1e24] pb-5">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block">
              SYS.HOLDING // CONGLOMERATE META-LAYER
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Portfolio Management Console
            </h2>
          </div>

          <button
            onClick={closeModal}
            className="px-3 py-1 text-xs font-mono text-white/50 hover:text-white rounded border border-[#1e1e24] hover:bg-white/[0.04]"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Portfolio Score Card */}
        <div className="p-5 rounded-xl bg-[#111114] border border-[#1e1e24] flex items-center justify-between font-mono">
          <div>
            <span className="text-[10px] text-white/40 uppercase block">AGGREGATE FOUNDER WEALTH</span>
            <span className="text-2xl font-bold text-white">
              {formatMoney(portfolioFounderValue)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-white/40 uppercase block">PORTFOLIO SLOTS</span>
            <span className="text-sm font-bold text-white">
              {allCompanies.length} / {holding.availableSlots} ACTIVE
            </span>
          </div>
        </div>

        {/* Subsidiary Company Slots */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-white/40">Portfolio Subsidiaries</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
            {allCompanies.map((co) => {
              const isActive = co.id === company.id;
              const founderStake = (co.valuationCents * BigInt(co.founderOwnershipBps)) / 10000n;

              return (
                <div
                  key={co.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                    isActive
                      ? 'bg-white/[0.04] border-white'
                      : 'bg-[#111114] border-[#1e1e24] hover:border-white/[0.2]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{co.name}</span>
                      {isActive && (
                        <span className="text-[9px] bg-white text-black px-1.5 py-0.5 rounded font-bold">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/40 block mb-3">{co.tagline}</span>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-white/50">
                        <span>ARR:</span>
                        <span className="text-white font-bold">{formatMoney(co.arrCents)}</span>
                      </div>
                      <div className="flex justify-between text-white/50">
                        <span>Valuation:</span>
                        <span className="text-white font-bold">{formatMoney(co.valuationCents)}</span>
                      </div>
                      <div className="flex justify-between text-white/50">
                        <span>Founder Equity:</span>
                        <span className="text-[#30d158] font-bold">{formatMoney(founderStake)} ({formatBps(co.founderOwnershipBps)})</span>
                      </div>
                    </div>
                  </div>

                  {!isActive && (
                    <button
                      onClick={() => {
                        switchHoldingCompany(co.id);
                        closeModal();
                      }}
                      className="mt-4 w-full py-2 bg-white text-black text-xs font-bold rounded-lg transition"
                    >
                      SWITCH COMMAND →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Launch New Subsidiary Flow */}
        {allCompanies.length < holding.availableSlots && (
          <div className="pt-2">
            {!isLaunching ? (
              <button
                onClick={() => setIsLaunching(true)}
                className="w-full py-3 bg-[#111114] hover:bg-white/[0.04] border border-dashed border-[#1e1e24] text-white font-mono text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <span>+ LAUNCH NEW SUBSIDIARY (SLOT {allCompanies.length + 1})</span>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-[#111114] border border-[#1e1e24] space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-white">
                  New Subsidiary Parameters
                </h4>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 block">COMPANY NAME</label>
                  <input
                    type="text"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="w-full bg-black/60 border border-[#1e1e24] rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 block">FOUNDER ARCHETYPE</label>
                  <select
                    value={selectedHistory}
                    onChange={(e) => setSelectedHistory(e.target.value as FounderHistoryId)}
                    className="w-full bg-black/60 border border-[#1e1e24] rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  >
                    {Object.values(FOUNDER_HISTORIES).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} — {h.tagline}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setIsLaunching(false)}
                    className="px-3 py-1.5 bg-white/[0.04] text-white/60 text-xs font-mono rounded-lg"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleLaunch}
                    className="px-3 py-1.5 bg-white text-black text-xs font-mono font-bold rounded-lg hover:bg-white/90"
                  >
                    LAUNCH SUBSIDIARY
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

