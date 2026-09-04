import React from 'react';
import { useV1Store } from '../../state/v1Store';
import type { RoomId } from '../../sim/types';

interface RoomNavItem {
  id: RoomId;
  name: string;
  code: string;
  num: string;
  key: string;
}

const ROOM_NAV_ITEMS: RoomNavItem[] = [
  { id: 'marketing', name: 'Marketing', code: 'MKT', num: '01', key: '1' },
  { id: 'product', name: 'Product', code: 'PRD', num: '02', key: '2' },
  { id: 'monetization', name: 'Pricing', code: 'PRC', num: '03', key: '3' },
  { id: 'retention', name: 'Retention', code: 'RET', num: '04', key: '4' },
  { id: 'expansion', name: 'Expansion', code: 'EXP', num: '05', key: '5' },
  { id: 'operations', name: 'Operations', code: 'OPS', num: '06', key: '6' },
];

export const BottomRoomNav: React.FC = () => {
  const { company, switchRoom } = useV1Store();

  const getBadgeCount = (roomId: RoomId): number => {
    switch (roomId) {
      case 'marketing':
        return company.marketing.queue.length;
      case 'product':
        return company.demandBacklogMilliGu > 0 ? Math.ceil(company.demandBacklogMilliGu / 1000) : 0;
      case 'monetization':
        return company.monetization.currentOpportunity || company.activationBacklogMilliGu >= 1000 ? 1 : 0;
      case 'retention':
        return company.retention.threats.length;
      case 'expansion':
        return company.expansion.accounts.length;
      case 'operations':
        return company.operations.incidents.length;
      default:
        return 0;
    }
  };

  return (
    <nav
      className="sticky bottom-0 z-40 bg-[#09090c]/98 backdrop-blur-xl border-t border-white/[0.08] px-2 sm:px-6 py-2 select-none"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-4xl mx-auto grid grid-cols-6 gap-1.5 sm:gap-2">
        {ROOM_NAV_ITEMS.map((item) => {
          const isActive = company.activeRoom === item.id;
          const badgeCount = getBadgeCount(item.id);
          const hasHighUrgency = (item.id === 'retention' || item.id === 'operations') && badgeCount > 0;
          const agentTier = company.agents[item.id] || 0;
          const isOverclocked = company.overclockRooms?.[item.id] ?? false;

          return (
            <button
              key={item.id}
              onClick={() => switchRoom(item.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition font-mono ${
                isActive
                  ? 'bg-white text-black border-white shadow-[0_4px_15px_rgba(255,255,255,0.15)] font-bold'
                  : 'bg-[#101014] border-white/[0.06] text-white/50 hover:text-white hover:border-white/[0.15]'
              }`}
            >
              {/* Autopilot LED Status Dot */}
              <div className="flex items-center gap-1 mb-0.5">
                {agentTier > 0 ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOverclocked
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-emerald-400'
                    }`}
                    title={`Autopilot Tier ${agentTier} Active`}
                  />
                ) : (
                  <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-black/30' : 'bg-white/20'}`} />
                )}
                <span className={`text-[8px] uppercase tracking-wider ${isActive ? 'text-black/50' : 'text-white/30'}`}>
                  M{item.num}
                </span>
              </div>

              {/* Badge for Inactive Rooms */}
              {badgeCount > 0 && !isActive && (
                <span
                  className={`absolute -top-1.5 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center border border-black/50 ${
                    hasHighUrgency
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-white text-black'
                  }`}
                >
                  {badgeCount}
                </span>
              )}

              {/* Room Key & Code */}
              <div className="flex items-center gap-1">
                <span className={`text-[8px] opacity-40 ${isActive ? 'text-black' : 'text-white'}`}>
                  [{item.key}]
                </span>
                <span className="text-[11px] font-bold tracking-tight">
                  {item.code}
                </span>
              </div>

              {/* Sub-label */}
              <span
                className={`text-[9px] uppercase mt-0.5 hidden sm:inline ${
                  isActive ? 'text-black/70 font-medium' : 'text-white/40'
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
