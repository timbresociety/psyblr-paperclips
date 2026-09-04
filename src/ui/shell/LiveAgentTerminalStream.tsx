import React, { useEffect, useRef } from 'react';
import { useV1Store } from '../../state/v1Store';
import { Terminal, Shield, Cpu, Activity, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  detail: string;
  type: 'code' | 'monetization' | 'safety' | 'ops' | 'system' | 'agent';
}

export const LiveAgentTerminalStream: React.FC<{ isOpen: boolean; onToggle: () => void }> = ({
  isOpen,
  onToggle,
}) => {
  const company = useV1Store((s) => s.company);
  const agentLogs = useV1Store((s) => s.agentLogs);
  const triggerAlignmentEval = useV1Store((s) => s.triggerAlignmentEval);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [agentLogs]);

  // Determine current Automation Era
  const totalAgents = (Object.values(company.agents) as number[]).reduce((a, b) => a + b, 0);
  let eraName = 'Lvl 1: Zero AI (Manual Grind)';
  let eraBadgeColor = 'text-white/60 border-white/20 bg-white/5';
  if (company.valuationCents >= 1_000_000_000_00n) {
    eraName = 'Lvl 5: Autonomous Conglomerate';
    eraBadgeColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  } else if (totalAgents >= 6) {
    eraName = 'Lvl 4: Gas Town Swarm';
    eraBadgeColor = 'text-purple-400 border-purple-500/30 bg-purple-500/10';
  } else if (totalAgents >= 3) {
    eraName = 'Lvl 3: YOLO Mode (Let It Cook)';
    eraBadgeColor = 'text-sky-400 border-sky-500/30 bg-sky-500/10';
  } else if (totalAgents >= 1) {
    eraName = 'Lvl 2: IDE Copilot';
    eraBadgeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  }

  // Calculate Compute & Safety metrics
  const computePct = Math.min(100, Math.round(15 + totalAgents * 8.5));
  const safety = typeof company.safetyIndex === 'number' && !isNaN(company.safetyIndex) ? company.safetyIndex : 96;

  const handleRunEval = () => {
    soundEngine.playClick();
    triggerAlignmentEval();
  };

  return (
    <aside
      aria-label="Live agent telemetry terminal"
      className={`fixed top-[52px] sm:top-[58px] right-0 bottom-16 sm:bottom-0 z-30 transition-all duration-300 flex ${
        isOpen ? 'w-80 sm:w-96' : 'w-10'
      }`}
    >
      {/* Toggle Handle Button */}
      <button
        onClick={onToggle}
        className="self-center -ml-3 w-6 h-12 rounded-l-lg bg-[#14141a] border-l border-y border-white/[0.12] text-white/50 hover:text-white flex items-center justify-center transition shadow-lg z-40 hover:bg-[#1a1a22]"
        title={isOpen ? 'Collapse Terminal' : 'Open Agent Terminal Stream'}
      >
        {isOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Main Terminal Shell */}
      <div
        className={`flex-1 flex flex-col bg-[#0b0b0e]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl overflow-hidden font-mono ${
          !isOpen && 'hidden'
        }`}
      >
        {/* Terminal Header */}
        <div className="p-3 border-b border-white/[0.08] bg-[#121217] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white tracking-tight">AGENT STREAM</span>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${eraBadgeColor}`}>
            {eraName}
          </span>
        </div>

        {/* Real-time Hardware Telemetry Strip (Compute, Safety, Strain) */}
        <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-[#0e0e13] border-b border-white/[0.06] text-[10px]">
          {/* Compute Load */}
          <div className="bg-[#14141b] rounded-lg p-2 border border-white/[0.05]">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-sky-400" />
                COMPUTE
              </span>
              <span className="font-bold text-white">{computePct}%</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  computePct > 85 ? 'bg-red-400' : computePct > 60 ? 'bg-amber-400' : 'bg-sky-400'
                }`}
                style={{ width: `${computePct}%` }}
              />
            </div>
          </div>

          {/* AI Alignment / Safety */}
          <div className="bg-[#14141b] rounded-lg p-2 border border-white/[0.05]">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                SAFETY
              </span>
              <span className="font-bold text-white">{safety}%</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  safety < 50 ? 'bg-red-400' : safety < 75 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${safety}%` }}
              />
            </div>
          </div>
        </div>

        {/* Alignment Evals Quick Action */}
        <div className="px-2.5 py-1.5 bg-[#09090c] border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-[10px] text-white/40 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            EVAL MATRIX: {safety >= 75 ? 'ALIGNED' : 'DRIFT DETECTED'}
          </span>
          <button
            onClick={handleRunEval}
            className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition"
            title="Run safety alignment evaluation suite to mitigate hallucination and strain"
          >
            <Zap className="w-2.5 h-2.5" />
            <span>RUN EVALS (+15% SAFETY)</span>
          </button>
        </div>

        {/* Live Feed Log Viewport */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2.5 space-y-2 text-[11px] leading-relaxed select-text">
          {agentLogs.length === 0 ? (
            <div className="text-white/30 text-center py-8 text-xs italic">
              Terminal standby. Awaiting autonomous agent actions...
            </div>
          ) : (
            agentLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded-lg bg-[#111116] border border-white/[0.04] hover:border-white/[0.1] transition font-mono"
              >
                <div className="flex items-center justify-between text-[9px] text-white/40 mb-1">
                  <span className="text-emerald-400 font-bold tracking-wider uppercase">
                    [{log.agent}]
                  </span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="text-white/90 font-medium">
                  <span className="text-sky-400 mr-1.5 font-bold">{log.action}:</span>
                  {log.detail}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Terminal Footer */}
        <div className="p-2 bg-[#0c0c10] border-t border-white/[0.06] text-[9px] text-white/40 flex items-center justify-between">
          <span>GAS TOWN SYNC // 1 HUMAN CEO</span>
          <span className="text-emerald-400 animate-pulse">● CONNECTED</span>
        </div>
      </div>
    </aside>
  );
};
