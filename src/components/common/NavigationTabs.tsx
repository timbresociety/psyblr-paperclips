import React from 'react';
import type { ScreenTab } from '../../types/game';
import { useGameStore } from '../../state/gameStore';
import { Terminal, Bot, Boxes, TrendingUp, Users, DollarSign, Inbox, Building2 } from 'lucide-react';

interface TabConfig {
  id: ScreenTab;
  label: string;
  icon: React.ReactNode;
  badge?: string | number | null;
  badgeColor?: string;
  showAlways?: boolean;
}

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, agents, activeEvents, tickets, stage, vcOffers } = useGameStore();

  const unreadEvents = activeEvents.length;
  const availableVc = vcOffers.filter(v => v.isAvailable).length;

  const tabs: TabConfig[] = [
    {
      id: 'command',
      label: 'Command',
      icon: <Terminal className="w-4 h-4" />
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: <Bot className="w-4 h-4" />,
      badge: agents.length > 0 ? agents.length : null,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    },
    {
      id: 'product',
      label: 'Product',
      icon: <Boxes className="w-4 h-4" />
    },
    {
      id: 'growth',
      label: 'Growth',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-4 h-4" />,
      badge: tickets > 1 ? `${Math.floor(tickets)} tix` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: <DollarSign className="w-4 h-4" />,
      badge: availableVc > 0 ? 'VC Offer' : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: <Inbox className="w-4 h-4" />,
      badge: unreadEvents > 0 ? unreadEvents : null,
      badgeColor: 'bg-rose-500 text-white font-bold animate-pulse'
    }
  ];

  if (stage === 'HOLDING_COMPANY') {
    tabs.push({
      id: 'holding',
      label: 'Holding Co.',
      icon: <Building2 className="w-4 h-4" />,
      badge: 'Unlocked',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
    });
  }

  return (
    <nav className="bg-[#0f111a] border-b border-[#1c2133] px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600/20 text-purple-200 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181b28] border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full border font-mono ${
                    tab.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
