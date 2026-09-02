import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../state/gameStore';
import {
  Radio,
  AlertCircle,
  Sparkles,
  User,
  Bot,
  Search
} from 'lucide-react';

type FilterCategory = 'all' | 'founder' | 'agent' | 'sales' | 'incident' | 'milestone';

export const LiveActivityFeed: React.FC = () => {
  const { activityLogs } = useGameStore();
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      // Category filter
      if (filter === 'founder' && log.category !== 'founder') return false;
      if (filter === 'agent' && log.category !== 'agent') return false;
      if (filter === 'incident' && log.category !== 'incident' && log.type !== 'error') return false;
      if (filter === 'milestone' && log.type !== 'milestone') return false;
      if (filter === 'sales' && !log.text.toLowerCase().includes('lead') && !log.text.toLowerCase().includes('sale') && !log.text.toLowerCase().includes('mrr') && !log.text.toLowerCase().includes('$')) return false;

      // Text search
      if (searchTerm && !log.text.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [activityLogs, filter, searchTerm]);

  const getBadge = (category: string, type: string) => {
    if (type === 'milestone') {
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#bf5af2]/15 text-[#bf5af2] border border-[#bf5af2]/30 font-medium">
          <Sparkles className="w-2.5 h-2.5" /> Milestone
        </span>
      );
    }
    if (category === 'founder') {
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-white/90 border border-white/[0.1] font-medium">
          <User className="w-2.5 h-2.5 text-[#ff9f0a]" /> Founder
        </span>
      );
    }
    if (category === 'agent') {
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#64d2ff]/15 text-[#64d2ff] border border-[#64d2ff]/30 font-medium">
          <Bot className="w-2.5 h-2.5" /> Swarm
        </span>
      );
    }
    if (category === 'incident' || type === 'error') {
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/30 font-medium">
          <AlertCircle className="w-2.5 h-2.5" /> Incident
        </span>
      );
    }
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.08] font-medium capitalize">
        {category}
      </span>
    );
  };

  return (
    <div className="apple-card rounded-2xl flex flex-col h-[380px] text-left overflow-hidden">
      {/* Terminal Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#30d158]/10 border border-[#30d158]/20">
            <Radio className="w-3 h-3 text-[#30d158] animate-status-dot" />
            <span className="text-[11px] font-medium text-[#30d158]">
              Live Activity Stream
            </span>
          </div>
          <span className="text-[11px] text-white/40 font-mono tabular-nums">
            ({filteredLogs.length} events)
          </span>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search stream..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/40 text-xs text-white placeholder-white/40 px-2.5 py-1 pl-7 rounded-lg border border-white/[0.08] focus:border-[#0a84ff] focus:outline-none w-32 sm:w-44 transition-colors font-sans"
            />
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-2 top-2 pointer-events-none" />
          </div>

          {/* Category Filter Segmented Bar */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/[0.06]">
            {(['all', 'founder', 'agent', 'incident', 'milestone'] as FilterCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`text-[11px] px-2.5 py-0.5 rounded-md transition-all capitalize font-medium ${
                  filter === cat
                    ? 'bg-white/[0.16] text-white shadow-xs'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal Log Items Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/40 text-xs">
            No telemetry log entries matching filter.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-2.5 p-2 rounded-xl transition-colors border ${
                log.type === 'milestone'
                  ? 'bg-[#bf5af2]/10 border-[#bf5af2]/20 text-[#f5f5f7]'
                  : log.type === 'error' || log.category === 'incident'
                  ? 'bg-[#ff453a]/10 border-[#ff453a]/20 text-[#f5f5f7]'
                  : log.type === 'success'
                  ? 'bg-white/[0.04] border-white/[0.08] text-white/90'
                  : 'bg-white/[0.02] text-white/80 border-white/[0.04] hover:bg-white/[0.04]'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {getBadge(log.category, log.type)}
              </div>
              <p className="flex-1 leading-snug break-words text-[12px] text-white/90">
                {log.text}
              </p>
              <span className="text-[10px] text-white/40 whitespace-nowrap pt-0.5 font-mono tabular-nums">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Terminal Footer Status Bar */}
      <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#30d158]"></span>
          <span>Telemetry Stream Synced (100ms)</span>
        </span>
        <span className="text-white/30">Studio Engine v2.5</span>
      </div>
    </div>
  );
};

