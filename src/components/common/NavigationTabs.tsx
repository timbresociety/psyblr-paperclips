import React from 'react';
import type { ScreenTab } from '../../types/game';
import { useGameStore } from '../../state/gameStore';
import { Terminal, Bot, Boxes, TrendingUp, Users, DollarSign, Inbox, Building2 } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

interface TabConfig {
  id: ScreenTab;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  badge?: string | number | null;
  badgeColor?: string;
}

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, agents, activeEvents, tickets, stage, vcOffers } = useGameStore();

  const unreadEvents = activeEvents.length;
  const availableVc = vcOffers.filter(v => v.isAvailable).length;

  const handleTabClick = (tabId: ScreenTab) => {
    soundEngine.playClick();
    setActiveTab(tabId);
  };

  const tabs: TabConfig[] = [
    {
      id: 'command',
      label: 'Command',
      shortcut: '1',
      icon: <Terminal className="w-3.5 h-3.5" />
    },
    {
      id: 'agents',
      label: 'Workforce',
      shortcut: '2',
      icon: <Bot className="w-3.5 h-3.5" />,
      badge: agents.length > 0 ? agents.length : null,
      badgeColor: 'bg-white/[0.08] text-white/90 border-white/[0.1]'
    },
    {
      id: 'product',
      label: 'Product',
      shortcut: '3',
      icon: <Boxes className="w-3.5 h-3.5" />
    },
    {
      id: 'growth',
      label: 'Growth',
      shortcut: '4',
      icon: <TrendingUp className="w-3.5 h-3.5" />
    },
    {
      id: 'customers',
      label: 'Customers',
      shortcut: '5',
      icon: <Users className="w-3.5 h-3.5" />,
      badge: tickets > 1 ? `${Math.floor(tickets)}` : null,
      badgeColor: 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30'
    },
    {
      id: 'finance',
      label: 'Finance',
      shortcut: '6',
      icon: <DollarSign className="w-3.5 h-3.5" />,
      badge: availableVc > 0 ? 'VC' : null,
      badgeColor: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30'
    },
    {
      id: 'inbox',
      label: 'Inbox',
      shortcut: '7',
      icon: <Inbox className="w-3.5 h-3.5" />,
      badge: unreadEvents > 0 ? unreadEvents : null,
      badgeColor: 'bg-[#ff453a] text-white font-bold border-transparent'
    }
  ];

  if (stage === 'HOLDING_COMPANY') {
    tabs.push({
      id: 'holding',
      label: 'Holding Co.',
      shortcut: '8',
      icon: <Building2 className="w-3.5 h-3.5" />,
      badge: 'Active',
      badgeColor: 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30'
    });
  }

  return (
    <nav className="bg-[#161618]/90 backdrop-blur-xl border-b border-white/[0.06] px-3 sm:px-5">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0a84ff] text-white shadow-xs font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {tab.icon}
                <span className="font-sans font-medium">{tab.label}</span>
              </div>

              {/* Numerical hotkey badge */}
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                isActive ? 'bg-white/20 text-white/80' : 'bg-white/[0.04] text-white/30'
              }`}>
                {tab.shortcut}
              </span>

              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full border font-mono ${
                    tab.badgeColor || 'bg-white/[0.06] text-white/70 border-white/[0.08]'
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

