import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../state/gameStore';
import { AI_MODELS } from '../../types/agents';
import type { AgentModelType } from '../../types/agents';
import {
  Terminal,
  Brain,
  ShieldAlert,
  Search,
  Play,
  Pause,
  Code,
  Activity,
  Radio,
  AlertTriangle
} from 'lucide-react';

import { soundEngine } from '../../audio/soundEffects';

export const LiveAgentTerminal: React.FC = () => {
  const {
    agentTraces,
    agents,
    tokenBurnPerHour,
    computeUsed,
    computeCapacity,
    techDebt,
    trust,
    setActiveTab
  } = useGameStore();

  const [filterModel, setFilterModel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);

  const isThrottled = computeUsed > computeCapacity && computeCapacity > 0;
  const throttlePct = isThrottled ? Math.max(10, Math.round((computeCapacity / computeUsed) * 100)) : 100;

  const filteredTraces = useMemo(() => {
    return (agentTraces || []).filter((trace) => {
      if (filterModel !== 'all' && trace.model !== filterModel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = trace.agentName.toLowerCase().includes(q);
        const matchThought = trace.thought.toLowerCase().includes(q);
        const matchTool = trace.toolCall?.tool.toLowerCase().includes(q);
        const matchDrift = q === 'drift' && trace.status === 'hallucinating';
        if (!matchName && !matchThought && !matchTool && !matchDrift) return false;
      }
      return true;
    });
  }, [agentTraces, filterModel, searchQuery]);

  return (
    <div className="space-y-5 animate-fade-in pb-12 text-left">
      {/* 1. Terminal Title & Controls Bar */}
      <div className="apple-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-white/[0.1]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#30d158]/15 text-[#30d158] flex items-center justify-center border border-[#30d158]/25">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Agent Execution Stream
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
                Live Traces
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Real-time multi-agent reasoning, tool execution results, API token usage, and latency logs.
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { soundEngine.playClick(); setIsPaused(!isPaused); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isPaused
                ? 'apple-btn-primary'
                : 'apple-btn-secondary'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
          </button>
        </div>
      </div>

      {/* 2. Observability & Gameplay Explainer Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#30d158]/10 via-[#64d2ff]/05 to-transparent border border-white/[0.08] text-left space-y-1.5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#30d158] animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            What This Tab Does &amp; Why It Matters in Gameplay
          </h3>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          The <strong>Agent Execution Stream</strong> is your company's live LLM observability feed (like LangSmith or Datadog APM). It tracks live agent thoughts, tool executions (GitHub, Supabase, Stripe), and latency in real time.
          <strong className="text-white"> Watch for red "Drift" alerts</strong>: when Tech Debt rises (&gt;30%), agents begin to hallucinate and fail tasks here, causing customer trust and retention to drop!
        </p>
      </div>

      {/* 3. Main Split Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Streaming Execution Terminal */}
        <div className="lg:col-span-2 space-y-3 flex flex-col">
          {/* Filter Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl apple-inset border border-white/[0.06]">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by agent, tool (e.g. 'github', 'stripe'), or 'drift'..."
                className="w-full bg-black/40 border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#0a84ff] transition-colors"
              />
            </div>

            {/* Model Filter Pills */}
            <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/[0.06] text-[11px] font-mono">
              <button
                onClick={() => setFilterModel('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterModel === 'all'
                    ? 'bg-white/[0.16] text-white shadow-xs'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                ALL
              </button>
              {(Object.keys(AI_MODELS) as AgentModelType[]).map((mKey) => (
                <button
                  key={mKey}
                  onClick={() => setFilterModel(mKey)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterModel === mKey
                      ? 'bg-white/[0.16] text-white shadow-xs'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {AI_MODELS[mKey].tag}
                </button>
              ))}
            </div>
          </div>

          {/* Stream Container */}
          <div className="apple-card rounded-2xl p-4 h-[580px] overflow-y-auto space-y-3 border border-white/[0.08]">
            {filteredTraces.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-2">
                <Terminal className="w-8 h-8 opacity-40" />
                <p className="text-xs">No agent execution traces in buffer.</p>
                <p className="text-[11px] text-white/30">Deploy agents in the Swarm Canvas to start autonomous executions.</p>
              </div>
            ) : (
              filteredTraces.map((trace) => {
                const modelDef = AI_MODELS[trace.model] || AI_MODELS.CLAUDE_3_7_SONNET;
                const isHallucinating = trace.status === 'hallucinating';

                return (
                  <div
                    key={trace.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isHallucinating
                        ? 'bg-[#ff453a]/10 border-[#ff453a]/30 text-[#ff453a]'
                        : 'apple-inset text-white/85 hover:border-white/[0.14]'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">[{trace.agentName}]</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08]">
                          {modelDef.tag}
                        </span>
                        {isHallucinating && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/40 font-bold uppercase tracking-wider animate-pulse">
                            ⚠️ Hallucination / Drift
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-white/40 text-[10px] font-mono tabular-nums">
                        <span>{trace.tokensUsed} tokens</span>
                        <span>{trace.durationMs}ms</span>
                        <span>{new Date(trace.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Agent Thought */}
                    <div className="text-white/90 leading-relaxed text-xs mb-2 font-mono">
                      <span className="text-[#30d158] font-bold mr-1.5">›</span>
                      {trace.thought}
                    </div>

                    {/* Tool Invocation Result */}
                    {trace.toolCall && (
                      <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.06] space-y-1 font-mono">
                        <div className="flex items-center gap-2 text-[11px] text-[#64d2ff]">
                          <Code className="w-3.5 h-3.5" />
                          <span className="font-bold uppercase">{trace.toolCall.tool}:</span>
                          <span className="text-white/70 truncate">{trace.toolCall.args}</span>
                        </div>
                        <div className="text-[11px] text-white/80 pl-5">
                          ↳ {trace.toolCall.result}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Swarm Telemetry & AI Model Breakdown */}
        <div className="space-y-4">
          {/* Swarm Live Telemetry Card */}
          <div className="apple-card rounded-2xl p-4 space-y-3 border border-white/[0.1]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#64d2ff]" />
              <span>Swarm Telemetry</span>
            </h2>

            {/* Overload Warning inside telemetry */}
            {isThrottled && (
              <div className="p-3 rounded-xl bg-[#ff453a]/15 border border-[#ff453a]/30 text-xs text-[#ff453a] space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Throttled to {throttlePct}%
                  </span>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveTab('finance');
                    }}
                    className="px-2 py-0.5 rounded bg-[#ff453a] text-white text-[10px] font-bold hover:bg-[#ff453a]/90 transition-all"
                  >
                    Upgrade GPU &rarr;
                  </button>
                </div>
                <p className="text-[10px] text-white/70 leading-tight">
                  Swarm requires {computeUsed.toFixed(1)} CU, exceeding cluster limit of {computeCapacity} CU.
                </p>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl apple-inset">
                <span className="text-white/50">Active Agents</span>
                <span className="font-mono font-bold text-white">{agents.length}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl apple-inset">
                <span className="text-white/50">Token Burn Rate</span>
                <span className="font-mono font-bold text-[#64d2ff] tabular-nums">${tokenBurnPerHour.toFixed(2)}/hr</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl apple-inset">
                <span className="text-white/50">Cluster Capacity</span>
                <span className={`font-mono font-bold tabular-nums ${isThrottled ? 'text-[#ff453a]' : 'text-white/80'}`}>
                  {computeUsed.toFixed(1)} / {computeCapacity} CU
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl apple-inset">
                <span className="text-white/50">Technical Debt</span>
                <span className={`font-mono font-bold tabular-nums ${techDebt > 70 ? 'text-[#ff453a]' : techDebt > 30 ? 'text-[#ff9f0a]' : 'text-[#30d158]'}`}>
                  {techDebt.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Model Distribution Card */}
          <div className="apple-card rounded-2xl p-4 space-y-3 border border-white/[0.1]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#bf5af2]" />
              <span>Model Fleet Distribution</span>
            </h2>

            <div className="space-y-2">
              {(Object.keys(AI_MODELS) as AgentModelType[]).map((mKey) => {
                const m = AI_MODELS[mKey];
                const count = agents.filter((a) => a.model === mKey).length;
                return (
                  <div
                    key={mKey}
                    className="p-2.5 rounded-xl apple-inset flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white/90">{m.tag}</div>
                      <div className="text-[10px] text-white/40 font-mono">${m.costPerMillionTokens}/M tokens</div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08]">
                      {count} node{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prompt Drift Triage */}
          <div className="apple-card rounded-2xl p-4 space-y-3 border border-white/[0.1]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#ff9f0a]" />
              <span>Drift Guardrails &amp; Trust</span>
            </h2>

            <p className="text-xs text-white/60 leading-relaxed">
              When Tech Debt exceeds 30%, agents trigger red <strong className="text-[#ff453a]">"Drift"</strong> events in this feed. When drift occurs, ticket resolution fails and customer trust drops.
            </p>

            <div className="p-3 rounded-xl apple-inset text-xs text-white/80 flex items-center justify-between">
              <span>System Trust:</span>
              <strong className={`font-mono font-bold tabular-nums ${trust >= 60 ? 'text-[#30d158]' : trust >= 30 ? 'text-[#ff9f0a]' : 'text-[#ff453a]'}`}>
                {trust.toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
