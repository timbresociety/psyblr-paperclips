import React from 'react';
import { useV1Store } from '../../state/v1Store';
import { formatMoney } from '../../sim/math';
import { ALL_ROOMS, AGENT_TIER_CONFIGS } from '../../sim/types';

export const UpgradeShopModal: React.FC = () => {
  const {
    activeModal,
    company,
    shopOfferedUpgrades,
    shopRerollCount,
    shopPurchasedCount,
    shopLockedUpgradeIds,
    shopAgentUpgradesPurchased,
    toggleLockUpgrade,
    buyUpgrade,
    rerollShop,
    buyAgentTier,
    openModal,
  } = useV1Store();

  if (activeModal !== 'intermission_shop') return null;

  const rerollCostCents = company.capitalUnitCents / 2n;
  const canReroll = shopRerollCount < 1 && company.cashCents >= rerollCostCents;

  const handleBuy = (upgradeId: string) => {
    if (shopPurchasedCount >= 2) return;
    buyUpgrade(upgradeId);
  };

  const isAutomationUnlocked = company.quarter >= 3;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-4 md:p-6 flex justify-center items-start sm:items-center">
      <div className="bg-[#0c0c0e] border border-[#1e1e24] rounded-2xl max-w-5xl w-full p-4 sm:p-6 space-y-4 sm:space-y-4.5 shadow-2xl text-left my-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e24] pb-3.5 sm:pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-white/40">
                SYS.SHOP // QUARTER {company.quarter} ARCHITECTURE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.1] text-white/80">
                UPGRADES: {shopPurchasedCount}/2 PURCHASED
              </span>
              {shopLockedUpgradeIds.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ffd60a]/10 border border-[#ffd60a]/30 text-[#ffd60a]">
                  {shopLockedUpgradeIds.length} PINNED
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
              Architect Your Machine
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Select up to 2 engineering upgrades. Second purchase incurs a 1.5x price surge. Pin upgrades to keep them through rerolls & quarters. Available Liquidity:{' '}
              <strong className="text-[#30d158] font-mono">{formatMoney(company.cashCents)}</strong>
            </p>
          </div>

          {/* Reroll Button */}
          <button
            onClick={rerollShop}
            disabled={!canReroll}
            className={`px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-mono border transition ${
              canReroll
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.15] text-white'
                : 'opacity-40 cursor-not-allowed border-white/[0.05] text-white/30'
            }`}
          >
            REROLL CATALOG ({formatMoney(rerollCostCents)})
          </button>
        </div>

        {/* 3 Offered Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
          {shopOfferedUpgrades.map((u) => {
            const isOwned = company.upgrades.includes(u.id);
            const isLocked = shopLockedUpgradeIds.includes(u.id);
            const priceMultiplier = shopPurchasedCount === 1 ? 1.5 : 1.0;
            const costCents =
              u.costCu === 0
                ? 0n
                : (company.capitalUnitCents * BigInt(Math.round(u.costCu * priceMultiplier * 100))) / 100n;
            const canAfford = company.cashCents >= costCents || u.costCu === 0;

            const rarityColor =
              u.rarity === 'legendary'
                ? '#ffd60a'
                : u.rarity === 'rare'
                ? '#bf5af2'
                : u.rarity === 'uncommon'
                ? '#30d158'
                : u.rarity === 'cursed'
                ? '#ff453a'
                : '#64d2ff';

            return (
              <div
                key={u.id}
                className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between transition ${
                  isOwned
                    ? 'bg-white/[0.01] border-white/[0.04] opacity-50'
                    : isLocked
                    ? 'bg-[#16140e] border-[#ffd60a]/50 shadow-[0_0_15px_rgba(255,214,10,0.08)]'
                    : 'bg-[#111114] border-[#1e1e24] hover:border-white/[0.2]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                      style={{
                        color: rarityColor,
                        borderColor: `${rarityColor}40`,
                        backgroundColor: `${rarityColor}10`,
                      }}
                    >
                      {u.rarity.toUpperCase()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {u.complexity > 0 && (
                        <span className="text-[10px] font-mono text-white/50">
                          +{u.complexity} Complexity
                        </span>
                      )}
                      {!isOwned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLockUpgrade(u.id);
                          }}
                          title={isLocked ? 'Pinned: Will persist through reroll and next quarter' : 'Pin upgrade to preserve across reroll/quarters'}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border transition flex items-center gap-1 ${
                            isLocked
                              ? 'bg-[#ffd60a]/20 border-[#ffd60a]/60 text-[#ffd60a]'
                              : 'bg-white/[0.04] border-white/[0.1] text-white/40 hover:text-white hover:border-white/30'
                          }`}
                        >
                          <span>{isLocked ? '🔒 PINNED' : '🔓 PIN'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">{u.name}</h3>
                  <p className="text-xs text-white/60 mt-1.5 leading-snug">{u.description}</p>
                  <p className="text-[11px] text-white/40 mt-1.5 font-mono italic">"{u.mechanicNote}"</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1e1e24] flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-white">
                    {u.costCu === 0 ? 'FREE (CURSED)' : formatMoney(costCents)}
                  </span>

                  <button
                    onClick={() => handleBuy(u.id)}
                    disabled={isOwned || !canAfford || shopPurchasedCount >= 2}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                      isOwned
                        ? 'bg-white/[0.05] text-white/40 cursor-default'
                        : canAfford && shopPurchasedCount < 2
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-white/[0.05] text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {isOwned ? 'OWNED' : shopPurchasedCount >= 2 ? 'LIMIT (2/2)' : 'PURCHASE'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct Automation License Panel */}
        <div className="pt-3.5 sm:pt-4 border-t border-[#1e1e24]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div>
              <h4 className="text-xs font-bold font-mono text-white tracking-wider uppercase">
                Autonomous Agent Licenses
              </h4>
              <p className="text-[11px] text-white/40 mt-0.5 font-mono">
                Higher tiers scale throughput dramatically, but increase monthly operating costs & complexity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2.5 py-0.5 sm:py-1 rounded border ${
                shopAgentUpgradesPurchased >= 2
                  ? 'bg-[#ff453a]/15 border-[#ff453a]/30 text-[#ff453a]'
                  : 'bg-white/[0.05] border-white/[0.1] text-white/70'
              }`}>
                QUOTA: {shopAgentUpgradesPurchased}/2 LICENSES INSTALLED THIS QTR
              </span>
              {!isAutomationUnlocked && (
                <span className="text-[10px] font-mono text-[#ffd60a] bg-[#ffd60a]/10 border border-[#ffd60a]/30 px-2 py-0.5 rounded">
                  LOCKED UNTIL Q3
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-2.5 font-mono text-xs">
            {ALL_ROOMS.map((room) => {
              const currentTier = company.agents[room];
              const nextTier = (currentTier + 1) as 1 | 2 | 3 | 4;
              const isMax = currentTier >= 4;
              const incrementCu = [0, 1, 2, 4, 7][nextTier] || 0;
              const costCents = company.capitalUnitCents * BigInt(incrementCu);
              const nextConfig = !isMax ? AGENT_TIER_CONFIGS[nextTier] : null;
              const nextMonthlyCostCents = nextConfig
                ? (company.capitalUnitCents * BigInt(Math.round(nextConfig.monthlyCostCu * 100))) / 100n
                : 0n;
              const isQuotaReached = shopAgentUpgradesPurchased >= 2;
              const canAfford = isAutomationUnlocked && !isQuotaReached && company.cashCents >= costCents && !isMax;

              return (
                <div key={room} className="bg-[#111114] border border-[#1e1e24] p-2.5 sm:p-3 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-white/40 uppercase block truncate">{room}</span>
                    <span className="text-xs font-bold text-white block mt-0.5 truncate">
                      {AGENT_TIER_CONFIGS[currentTier].name} (T{currentTier})
                    </span>
                    {nextConfig ? (
                      <div className="mt-1 leading-snug font-mono text-[9px]">
                        <span className="text-white/60 block truncate">+{formatMoney(nextMonthlyCostCents)}/mo cost</span>
                        <span className="text-white/40 block truncate">+{nextConfig.complexity} Complexity</span>
                      </div>
                    ) : (
                      <div className="mt-1 font-mono text-[9px] text-[#30d158]">
                        MAX TIER
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => buyAgentTier(room)}
                    disabled={!canAfford}
                    className={`mt-2.5 py-1.5 rounded-lg text-[10px] font-bold transition truncate px-1 ${
                      isMax
                        ? 'bg-white/[0.05] text-white/30 cursor-default'
                        : !isAutomationUnlocked
                        ? 'bg-white/[0.04] text-white/30 cursor-not-allowed'
                        : isQuotaReached
                        ? 'bg-white/[0.04] text-white/30 cursor-not-allowed'
                        : canAfford
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {!isAutomationUnlocked
                      ? 'Q3 LOCK'
                      : isMax
                      ? 'MAX TIER'
                      : isQuotaReached
                      ? 'QUOTA (2/2)'
                      : `T${nextTier}: ${formatMoney(costCents)}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Proceed Button */}
        <div className="pt-3 sm:pt-3.5 border-t border-[#1e1e24] flex justify-end">
          <button
            onClick={() => openModal('intermission_capital')}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition flex items-center gap-2 text-xs font-mono tracking-wider"
          >
            <span>PROCEED TO CAPITAL & FINANCING →</span>
          </button>
        </div>
      </div>
    </div>
  );
};

