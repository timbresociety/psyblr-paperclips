import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../state/gameStore';
import type { ScreenTab } from '../../types/game';
import {
  Search,
  Terminal,
  Bot,
  Boxes,
  TrendingUp,
  Users,
  DollarSign,
  Inbox,
  Building2,
  Code,
  Share2,
  LifeBuoy,
  Cpu,
  Volume2,
  VolumeX,
  FastForward,
  Plus
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Founder Actions' | 'Operations' | 'Simulation';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHire?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenHire
}) => {
  const {
    setActiveTab,
    vibeCodeManual,
    postManual,
    sellManual,
    supportManual,
    setGameSpeed,
    gameSpeed,
    toggleSound,
    soundEnabled,
    companies,
    switchActiveCompany,
    stage
  } = useGameStore();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navigateTo = (tab: ScreenTab) => {
    soundEngine.playClick();
    setActiveTab(tab);
    onClose();
  };

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-command',
      title: 'Command Center',
      subtitle: 'Primary telemetry & mission control',
      category: 'Navigation',
      icon: <Terminal className="w-4 h-4 text-[#0a84ff]" />,
      shortcut: '1',
      action: () => navigateTo('command')
    },
    {
      id: 'nav-swarm',
      title: 'Swarm Canvas',
      subtitle: 'Interactive multi-agent pipeline routing',
      category: 'Navigation',
      icon: <Bot className="w-4 h-4 text-[#5e5ce6]" />,
      shortcut: '2',
      action: () => navigateTo('swarm')
    },
    {
      id: 'nav-terminal',
      title: 'Live Agent Stream',
      subtitle: 'Real-time thoughts, tool calls & trace logs',
      category: 'Navigation',
      icon: <Terminal className="w-4 h-4 text-[#5e5ce6]" />,
      shortcut: '3',
      action: () => navigateTo('terminal')
    },
    {
      id: 'nav-agents',
      title: 'Autonomous Workforce',
      subtitle: 'Manage AI workforce roster & corporate tree',
      category: 'Navigation',
      icon: <Users className="w-4 h-4 text-[#5e5ce6]" />,
      shortcut: '4',
      action: () => navigateTo('agents')
    },
    {
      id: 'nav-product',
      title: 'Product Roadmap & Debt',
      subtitle: 'Feature sprints & codebase health',
      category: 'Navigation',
      icon: <Boxes className="w-4 h-4 text-[#64d2ff]" />,
      shortcut: '5',
      action: () => navigateTo('product')
    },
    {
      id: 'nav-growth',
      title: 'Distribution & Growth',
      subtitle: 'Marketing channels & cultural trends',
      category: 'Navigation',
      icon: <TrendingUp className="w-4 h-4 text-[#bf5af2]" />,
      shortcut: '6',
      action: () => navigateTo('growth')
    },
    {
      id: 'nav-customers',
      title: 'Customers & Support Desk',
      subtitle: 'Subscriber cohorts & ticket SLA',
      category: 'Navigation',
      icon: <Users className="w-4 h-4 text-[#ff9f0a]" />,
      shortcut: '7',
      action: () => navigateTo('customers')
    },
    {
      id: 'nav-finance',
      title: 'Financials & Valuation',
      subtitle: 'P&L, cap table & compute upgrades',
      category: 'Navigation',
      icon: <DollarSign className="w-4 h-4 text-[#30d158]" />,
      shortcut: '8',
      action: () => navigateTo('finance')
    },
    {
      id: 'nav-inbox',
      title: 'Priority Inbox & Decisions',
      subtitle: 'Executive memos & incident alerts',
      category: 'Navigation',
      icon: <Inbox className="w-4 h-4 text-[#ff9f0a]" />,
      shortcut: '9',
      action: () => navigateTo('inbox')
    },

    // Founder Actions
    {
      id: 'action-vibe-code',
      title: 'Founder Action: Code Sprint',
      subtitle: 'Ship 15 Build Points (+2.0% Tech Debt)',
      category: 'Founder Actions',
      icon: <Code className="w-4 h-4 text-[#64d2ff]" />,
      shortcut: 'C',
      action: () => {
        soundEngine.playBuild();
        vibeCodeManual();
        onClose();
      }
    },
    {
      id: 'action-post',
      title: 'Founder Action: Publish Post',
      subtitle: 'Boost audience attention & viral loop',
      category: 'Founder Actions',
      icon: <Share2 className="w-4 h-4 text-[#bf5af2]" />,
      shortcut: 'P',
      action: () => {
        soundEngine.playClick();
        postManual();
        onClose();
      }
    },
    {
      id: 'action-sell',
      title: 'Founder Action: Pitch Sales Lead',
      subtitle: 'Convert qualified leads to paying customers',
      category: 'Founder Actions',
      icon: <DollarSign className="w-4 h-4 text-[#30d158]" />,
      shortcut: 'S',
      action: () => {
        soundEngine.playSale();
        sellManual();
        onClose();
      }
    },
    {
      id: 'action-support',
      title: 'Founder Action: Resolve Tickets',
      subtitle: 'Clear customer queue & boost trust score',
      category: 'Founder Actions',
      icon: <LifeBuoy className="w-4 h-4 text-[#ff9f0a]" />,
      shortcut: 'T',
      action: () => {
        soundEngine.playTicketResolved();
        supportManual();
        onClose();
      }
    },

    // Operations
    {
      id: 'op-hire',
      title: 'Hire Autonomous AI Agent',
      subtitle: 'Expand Engineering, Growth, Sales, or Support fleet',
      category: 'Operations',
      icon: <Plus className="w-4 h-4 text-white" />,
      action: () => {
        navigateTo('agents');
        if (onOpenHire) onOpenHire();
      }
    },
    {
      id: 'op-compute',
      title: 'Upgrade GPU Compute Cluster',
      subtitle: 'Scale compute capacity to prevent agent throttling',
      category: 'Operations',
      icon: <Cpu className="w-4 h-4 text-[#64d2ff]" />,
      action: () => navigateTo('finance')
    },

    // Simulation
    {
      id: 'sim-speed-1',
      title: 'Simulation Speed: 1x',
      subtitle: gameSpeed === 1 ? 'Currently Active' : 'Set speed to normal (1x)',
      category: 'Simulation',
      icon: <FastForward className="w-4 h-4 text-white/50" />,
      action: () => {
        setGameSpeed(1);
        onClose();
      }
    },
    {
      id: 'sim-speed-5',
      title: 'Simulation Speed: 5x',
      subtitle: gameSpeed === 5 ? 'Currently Active' : 'Set speed to fast (5x)',
      category: 'Simulation',
      icon: <FastForward className="w-4 h-4 text-[#0a84ff]" />,
      action: () => {
        setGameSpeed(5);
        onClose();
      }
    },
    {
      id: 'sim-speed-10',
      title: 'Simulation Speed: 10x',
      subtitle: gameSpeed === 10 ? 'Currently Active' : 'Set speed to hyperspeed (10x)',
      category: 'Simulation',
      icon: <FastForward className="w-4 h-4 text-[#0a84ff]" />,
      action: () => {
        setGameSpeed(10);
        onClose();
      }
    },
    {
      id: 'sim-toggle-audio',
      title: soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects',
      subtitle: soundEnabled ? 'Audio synthesis active' : 'Audio muted',
      category: 'Simulation',
      icon: soundEnabled ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-[#30d158]" />,
      action: () => {
        toggleSound();
        onClose();
      }
    }
  ];

  if (stage === 'HOLDING_COMPANY') {
    commands.push({
      id: 'nav-holding',
      title: 'Holding Company Conglomerate',
      subtitle: 'Manage autonomous corporate subsidiaries',
      category: 'Navigation',
      icon: <Building2 className="w-4 h-4 text-[#5e5ce6]" />,
      shortcut: '8',
      action: () => navigateTo('holding')
    });
  }

  // Add subsidiary switchers if multi-company
  if (companies.length > 1) {
    companies.forEach(comp => {
      commands.push({
        id: `switch-${comp.id}`,
        title: `Switch to Subsidiary: ${comp.name}`,
        subtitle: `Autonomy L${comp.autonomyLevel || 1} • $${comp.mrr.toLocaleString()} MRR`,
        category: 'Operations',
        icon: <Building2 className="w-4 h-4 text-[#5e5ce6]" />,
        action: () => {
          switchActiveCompany(comp.id);
          onClose();
        }
      });
    });
  }

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    (cmd.subtitle && cmd.subtitle.toLowerCase().includes(search.toLowerCase())) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#1c1c1e]/95 border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden text-left backdrop-blur-2xl"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="relative flex items-center px-4 py-3 border-b border-white/[0.08] bg-white/[0.03]">
          <Search className="w-4 h-4 text-white/40 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, screens, or founder actions..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-white placeholder-white/30 focus:outline-none font-sans"
          />
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.08] text-white/60 border border-white/[0.08]">
              esc
            </span>
          </div>
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-0.5">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-xs">
              No commands found matching "{search}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#0a84ff] text-white shadow-xs font-medium'
                      : 'text-white/80 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-white/[0.04] border-white/[0.08] text-white/70'
                    }`}>
                      {cmd.icon}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {cmd.title}
                      </div>
                      {cmd.subtitle && (
                        <div className={`text-[11px] truncate leading-tight mt-0.5 ${
                          isSelected ? 'text-white/80' : 'text-white/40'
                        }`}>
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-white/[0.04] text-white/50 border-white/[0.08]'
                    }`}>
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md border ${
                        isSelected
                          ? 'bg-white/25 text-white border-white/40'
                          : 'bg-white/[0.06] text-white/60 border-white/[0.08]'
                      }`}>
                        {cmd.shortcut}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
          <span>Navigate with <kbd className="text-white/60 font-mono">↑</kbd> <kbd className="text-white/60 font-mono">↓</kbd> • Select with <kbd className="text-white/60 font-mono">↵</kbd></span>
          <span className="text-white/50 font-mono text-[10px]">⌘K Spotlight</span>
        </div>
      </div>
    </div>
  );
};

