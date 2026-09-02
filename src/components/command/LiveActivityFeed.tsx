import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { Radio, AlertCircle, Sparkles, User, Bot } from 'lucide-react';

export const LiveActivityFeed: React.FC = () => {
  const { activityLogs } = useGameStore();

  const getBadge = (category: string, type: string) => {
    if (type === 'milestone') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-600/60 font-bold">
          <Sparkles className="w-2.5 h-2.5 text-purple-400" /> MILESTONE
        </span>
      );
    }
    if (category === 'founder') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-medium">
          <User className="w-2.5 h-2.5 text-amber-400" /> FOUNDER
        </span>
      );
    }
    if (category === 'agent') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-medium">
          <Bot className="w-2.5 h-2.5 text-cyan-400" /> AGENT
        </span>
      );
    }
    if (category === 'incident') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 font-medium">
          <AlertCircle className="w-2.5 h-2.5 text-rose-400" /> INCIDENT
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
        {category.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="bg-[#10121d] border border-[#1e2336] rounded-xl flex flex-col h-[340px]">
      {/* Live Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1c2033] bg-[#0d0f18] rounded-t-xl">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300">
            TODAY — LIVE COMPANY FEED
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Auto-logging
        </span>
      </div>

      {/* Log Feed Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs scrollbar-thin">
        {activityLogs.map((log) => (
          <div
            key={log.id}
            className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
              log.type === 'milestone'
                ? 'bg-purple-950/30 border border-purple-800/40 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.1)]'
                : log.type === 'error' || log.category === 'incident'
                ? 'bg-rose-950/20 border border-rose-900/30 text-rose-200'
                : log.type === 'success'
                ? 'bg-emerald-950/20 border border-emerald-900/30 text-emerald-200'
                : 'bg-[#151826] text-slate-300 border border-slate-800/60'
            }`}
          >
            <div className="pt-0.5">
              {getBadge(log.category, log.type)}
            </div>
            <p className="flex-1 leading-snug break-words">
              {log.text}
            </p>
            <span className="text-[10px] text-slate-500 whitespace-nowrap pt-0.5">
              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
