import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { AI_MODELS } from '../../types/agents';
import type { AgentRoleType } from '../../types/agents';
import { AGENT_ROLES } from '../../data/agentRoles';
import { AgentInspectorDrawer } from './AgentInspectorDrawer';
import { HireAgentModal } from '../agents/HireAgentModal';
import {
  Bot,
  Plus,
  ArrowRight,
  Workflow,
  AlertTriangle,
  Cpu,
  Zap,
  Sliders
} from 'lucide-react';

import { soundEngine } from '../../audio/soundEffects';

interface PipelineSlot {
  id: string;
  title: string;
  role: AgentRoleType;
  department: 'Product' | 'Growth' | 'Operations' | 'Executive';
  desc: string;
}

const PIPELINES: {
  id: string;
  name: string;
  tag: string;
  tagClass: string;
  accentColor: string;
  unitLabel: string;
  slots: PipelineSlot[];
}[] = [
  {
    id: 'product_eng',
    name: 'Product & Engineering Pipeline',
    tag: 'Core Engine',
    tagClass: 'bg-[#64d2ff]/15 text-[#64d2ff] border-[#64d2ff]/25',
    accentColor: '#64d2ff',
    unitLabel: 'BP/s Velocity',
    slots: [
      { id: 'eng_1', title: 'Vibe Coder Agent', role: 'ENGINEERING', department: 'Product', desc: 'Continuous feature generation & code commits' },
      { id: 'qa_1', title: 'Automated QA Tester', role: 'QA', department: 'Product', desc: 'Automated unit tests & tech debt mitigation' }
    ]
  },
  {
    id: 'growth_dist',
    name: 'Growth & Distribution Pipeline',
    tag: 'Distribution',
    tagClass: 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/25',
    accentColor: '#bf5af2',
    unitLabel: 'Att/s Inflow',
    slots: [
      { id: 'growth_1', title: 'Viral Social Poster', role: 'GROWTH', department: 'Growth', desc: 'Multichannel social scraper & hype generation' }
    ]
  },
  {
    id: 'sales_rev',
    name: 'Sales & Monetization Pipeline',
    tag: 'Revenue',
    tagClass: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/25',
    accentColor: '#30d158',
    unitLabel: 'Leads/s Capacity',
    slots: [
      { id: 'sales_1', title: 'AI SDR & Closer', role: 'SALES', department: 'Growth', desc: 'Inbound lead qualification & enterprise closing' }
    ]
  },
  {
    id: 'cust_ops',
    name: 'Customer Operations & Support',
    tag: 'Retention',
    tagClass: 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/25',
    accentColor: '#ff9f0a',
    unitLabel: 'Tickets/s Resolved',
    slots: [
      { id: 'support_1', title: 'CSAT Support Resolver', role: 'SUPPORT', department: 'Operations', desc: 'Instant RAG ticket resolution & trust guard' },
      { id: 'ops_1', title: 'Cloud Ops & Optimizer', role: 'OPERATIONS', department: 'Operations', desc: 'Cluster balancing & API credit efficiency' }
    ]
  },
  {
    id: 'exec_gov',
    name: 'Autonomous Governance & C-Suite',
    tag: 'Governance',
    tagClass: 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/25',
    accentColor: '#bf5af2',
    unitLabel: 'Global Autonomy',
    slots: [
      { id: 'mgr_1', title: 'Department Manager', role: 'MANAGER', department: 'Executive', desc: 'Departmental prompt synergy & worker oversight' },
      { id: 'exec_1', title: 'C-Suite Executive', role: 'EXECUTIVE', department: 'Executive', desc: 'Cross-functional strategy & resource scaling' },
      { id: 'ceo_1', title: 'Autonomous CEO Agent', role: 'CEO', department: 'Executive', desc: '100% solo autopilot corporate execution' }
    ]
  }
];

export const SwarmOrchestrationCanvas: React.FC = () => {
  const {
    agents,
    setSelectedCanvasAgent,
    selectedCanvasAgentId,
    tokenBurnPerHour,
    computeUsed,
    computeCapacity,
    techDebt,
    setActiveTab
  } = useGameStore();

  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [targetRoleForHire, setTargetRoleForHire] = useState<AgentRoleType | undefined>(undefined);

  const isThrottled = computeUsed > computeCapacity && computeCapacity > 0;
  const throttlePct = isThrottled ? Math.max(10, Math.round((computeCapacity / computeUsed) * 100)) : 100;

  const handleOpenHireForRole = (role: AgentRoleType) => {
    soundEngine.playClick();
    setTargetRoleForHire(role);
    setIsHireModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in relative pb-12 text-left">
      {/* 1. Top Cockpit Telemetry Banner */}
      <div className="apple-card rounded-2xl p-5 border border-white/[0.1] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#64d2ff]/15 text-[#64d2ff] flex items-center justify-center border border-[#64d2ff]/25">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Swarm Orchestration Canvas
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
                Live Swarm Pipeline
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Visual pipeline routing &amp; neural architecture. Click any agent node to swap models, toggle tools, or level up stats.
            </p>
          </div>
        </div>

        {/* Global Pipeline Metrics */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3.5 py-2 rounded-xl apple-inset border border-white/[0.06]">
            <span className="text-[10px] text-white/40 block font-sans uppercase font-semibold">Active Swarm</span>
            <strong className="text-white text-xs font-bold tabular-nums">{agents.length} Agents</strong>
          </div>

          <div className="px-3.5 py-2 rounded-xl apple-inset border border-white/[0.06]">
            <span className="text-[10px] text-white/40 block font-sans uppercase font-semibold">Token Burn</span>
            <strong className="text-[#64d2ff] text-xs font-bold tabular-nums">${tokenBurnPerHour.toFixed(2)}/hr</strong>
          </div>

          <div className="px-3.5 py-2 rounded-xl apple-inset border border-white/[0.06]">
            <span className="text-[10px] text-white/40 block font-sans uppercase font-semibold">Cluster Load</span>
            <strong className={`${isThrottled ? 'text-[#ff453a]' : 'text-white/80'} text-xs font-bold tabular-nums`}>
              {computeUsed.toFixed(1)} / {computeCapacity} CU
            </strong>
          </div>

          <button
            onClick={() => { soundEngine.playClick(); setTargetRoleForHire(undefined); setIsHireModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl apple-btn-primary text-xs font-bold tracking-tight shadow-md font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deploy Agent</span>
          </button>
        </div>
      </div>

      {/* 2. Critical GPU Cluster Overload Alert (if throttled) */}
      {isThrottled && (
        <div className="p-4 rounded-2xl bg-[#ff453a]/15 border border-[#ff453a]/35 flex flex-wrap items-center justify-between gap-4 text-left shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff453a]/25 text-[#ff453a] flex items-center justify-center border border-[#ff453a]/40 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white">
                  GPU CLUSTER OVERLOAD: WORKFORCE THROTTLED TO {throttlePct}% SPEED!
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff453a] text-white font-bold">
                  -{100 - throttlePct}% Penalty
                </span>
              </div>
              <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                Your {agents.length} agents consume <strong className="text-white">{computeUsed.toFixed(1)} CU</strong>, exceeding your cluster limit of <strong className="text-white">{computeCapacity} CU</strong>. Every agent is operating at only {throttlePct}% speed.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('finance');
            }}
            className="px-4 py-2 rounded-xl bg-[#ff453a] hover:bg-[#ff453a]/90 text-white text-xs font-bold tracking-tight shadow-md flex items-center gap-1.5 transition-all shrink-0"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Upgrade GPU Cluster in Finance &rarr;</span>
          </button>
        </div>
      )}

      {/* 3. Purpose & Interactive Architecture Explainer Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#64d2ff]/10 via-[#bf5af2]/05 to-transparent border border-white/[0.08] text-left space-y-1.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#64d2ff]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            What This Tab Does &amp; How It Impacts Your Gameplay
          </h3>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          The <strong>Swarm Canvas</strong> organizes your {agents.length} autonomous agents into 5 functional corporate pipelines.
          <strong className="text-white"> Click any agent node below</strong> to open the <strong>Deep Agent Inspector</strong>: swap AI models (e.g. Claude 3.7 Sonnet vs Gemini Flash), toggle tool permissions (GitHub, Supabase, Stripe), or level up their output.
        </p>
      </div>

      {/* 4. Interactive Visual Pipeline Board */}
      <div className="space-y-4">
        {PIPELINES.map((pipeline) => {
          // Find all active agents matching this pipeline's department or roles
          const assignedAgents = agents.filter((a) =>
            pipeline.slots.some((s) => s.role === a.role)
          );

          const totalOutput = assignedAgents.reduce((acc, a) => acc + a.outputPerSec, 0);

          return (
            <div
              key={pipeline.id}
              className="apple-card rounded-2xl p-5 border border-white/[0.1] relative overflow-hidden"
            >
              {/* Pipeline Header with Live Velocity Telemetry */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${pipeline.tagClass}`}>
                    {pipeline.tag}
                  </span>
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    {pipeline.name}
                  </h2>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  {assignedAgents.length > 0 && (
                    <div className="flex items-center gap-1 text-[#30d158] font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>+{totalOutput.toFixed(1)} {pipeline.unitLabel}</span>
                    </div>
                  )}
                  <span className="text-white/40">{assignedAgents.length} Active Node(s)</span>
                </div>
              </div>

              {/* Pipeline Node Flow Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3.5 relative">
                {/* 1. Render active agent nodes in this pipeline */}
                {assignedAgents.map((agent) => {
                  const roleDef = AGENT_ROLES[agent.role];
                  const modelDef = AI_MODELS[agent.model] || AI_MODELS.CLAUDE_3_7_SONNET;
                  const isSelected = selectedCanvasAgentId === agent.id;
                  const isHallucinating = techDebt > 30 && (agent.hallucinationRisk || 5) > 20;

                  return (
                    <div
                      key={agent.id}
                      onClick={() => { soundEngine.playClick(); setSelectedCanvasAgent(agent.id); }}
                      className={`group p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'apple-card border-[#0a84ff] ring-2 ring-[#0a84ff]/50 shadow-lg'
                          : 'apple-inset hover:border-white/[0.2] hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Node Status Beacon */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isHallucinating
                                ? 'bg-[#ff453a] animate-ping'
                                : 'bg-[#30d158] animate-pulse'
                            }`}
                          />
                          <span className="text-[10px] font-mono font-medium text-white/60 uppercase tracking-wider">
                            {isHallucinating ? 'Model Drift' : 'Active'}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08] font-semibold">
                          {modelDef.tag}
                        </span>
                      </div>

                      {/* Agent Name & Title */}
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-[#64d2ff]" />
                        <h3 className="text-xs font-bold text-white group-hover:text-[#64d2ff] transition-colors">
                          {agent.name}
                        </h3>
                        <span className="text-[10px] font-mono text-white/40">
                          Lv.{agent.level}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-0.5">{roleDef.title}</p>

                      {/* Live Output & Token Metrics */}
                      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#30d158] font-bold tabular-nums">
                          +{agent.outputPerSec.toFixed(2)}/s
                        </span>
                        <span className="text-white/60 tabular-nums">
                          {agent.computeCost.toFixed(1)} CU
                        </span>
                      </div>

                      {/* Enabled Tool Badges */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(agent.enabledTools || ['github', 'browser']).slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/60 border border-white/[0.06]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Hover Action Cue */}
                      <div className="mt-2.5 pt-2 border-t border-white/[0.04] text-[10px] text-[#64d2ff] opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-between font-semibold">
                        <span>Click to Configure Brain</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}

                {/* 2. Render Unhired/Deploy Slots for this pipeline */}
                {pipeline.slots
                  .filter((slot) => !assignedAgents.some((a) => a.role === slot.role))
                  .map((slot) => {
                    const roleDef = AGENT_ROLES[slot.role];
                    return (
                      <div
                        key={slot.id}
                        onClick={() => handleOpenHireForRole(slot.role)}
                        className="p-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.01] hover:bg-white/[0.05] hover:border-white/[0.25] transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-white/40 mb-2 font-mono">
                            <span className="uppercase font-semibold">Slot Open</span>
                            <span className="tabular-nums">${roleDef.hireCost}</span>
                          </div>
                          <h3 className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                            {slot.title}
                          </h3>
                          <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                            {slot.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-white/[0.04] flex items-center justify-center gap-1.5 text-xs font-bold text-white/70 group-hover:text-white">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Deploy Node</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-Over Agent Inspector Drawer */}
      <AgentInspectorDrawer />

      {/* Hire Agent Modal */}
      <HireAgentModal
        isOpen={isHireModalOpen}
        onClose={() => setIsHireModalOpen(false)}
        defaultRole={targetRoleForHire}
      />
    </div>
  );
};
