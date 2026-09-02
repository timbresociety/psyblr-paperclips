import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { AI_MODELS } from '../../types/agents';
import type { AgentModelType, AgentToolType, AgentInstance } from '../../types/agents';
import { AGENT_ROLES } from '../../data/agentRoles';
import { AGENT_TRAITS } from '../../data/agentTraits';
import {
  X,
  Bot,
  Brain,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Sliders,
  Check,
  ArrowUpCircle,
  Trash2
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

const ALL_TOOLS: { id: AgentToolType; name: string; desc: string; icon: string }[] = [
  { id: 'github', name: 'GitHub CI/CD', desc: 'Code commits, PR reviews, automated pytest', icon: '🐙' },
  { id: 'browser', name: 'Headless Browser', desc: 'Real-time market research & web scraping', icon: '🌐' },
  { id: 'stripe', name: 'Stripe API', desc: 'Invoicing, subscription provisioning & refunds', icon: '💳' },
  { id: 'postiz', name: 'Postiz Social API', desc: 'Direct multichannel social distribution (X/LI)', icon: '📢' },
  { id: 'supabase', name: 'Supabase Postgres', desc: 'Vector search embeddings & customer DB', icon: '⚡' },
  { id: 'email', name: 'Outbound SMTP', desc: 'Personalized cold pitch & support dispatch', icon: '✉️' }
];

interface AgentInspectorContentProps {
  agent: AgentInstance;
  onClose: () => void;
}

const AgentInspectorContent: React.FC<AgentInspectorContentProps> = ({ agent, onClose }) => {
  const {
    updateAgentModel,
    updateAgentConfig,
    patchAgentPrompt,
    upgradeAgent,
    fireAgent,
    cash
  } = useGameStore();

  const [editedPrompt, setEditedPrompt] = useState(agent.systemPrompt || '');
  const [activeTab, setActiveTab] = useState<'model' | 'prompt' | 'tools'>('model');

  const roleDef = AGENT_ROLES[agent.role];
  const traitDef = AGENT_TRAITS[agent.trait];
  const currentModel = AI_MODELS[agent.model] || AI_MODELS.CLAUDE_3_7_SONNET;
  const upgradeCost = Math.round(roleDef.hireCost * 0.75 * Math.pow(1.3, agent.level));
  const canUpgrade = cash >= upgradeCost && agent.level < 10;

  const handleToolToggle = (toolId: AgentToolType) => {
    soundEngine.playClick();
    const current = agent.enabledTools || [];
    const updated = current.includes(toolId)
      ? current.filter((t) => t !== toolId)
      : [...current, toolId];
    updateAgentConfig(agent.id, { enabledTools: updated });
  };

  const handlePatchPrompt = () => {
    if (!editedPrompt.trim()) return;
    patchAgentPrompt(agent.id, editedPrompt.trim());
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#161618]/95 backdrop-blur-3xl border-l border-white/[0.08] shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right text-left">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] text-white/90 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">{agent.name}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.08]">
                Lv.{agent.level}
              </span>
            </div>
            <p className="text-xs text-white/50">{roleDef.title}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Subtabs (macOS Segmented Bar) */}
      <div className="flex border-b border-white/[0.06] bg-black/30 p-2 gap-1.5">
        <button
          onClick={() => { soundEngine.playClick(); setActiveTab('model'); }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'model'
              ? 'bg-white/[0.16] text-white shadow-xs'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>LLM Engine</span>
        </button>
        <button
          onClick={() => { soundEngine.playClick(); setActiveTab('prompt'); }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'prompt'
              ? 'bg-white/[0.16] text-white shadow-xs'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Directives</span>
        </button>
        <button
          onClick={() => { soundEngine.playClick(); setActiveTab('tools'); }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'tools'
              ? 'bg-white/[0.16] text-white shadow-xs'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Tools</span>
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Core Live Telemetry */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl apple-inset">
          <div className="text-center">
            <span className="text-[10px] text-white/40 uppercase font-sans block">Output</span>
            <span className="text-xs font-mono font-semibold text-[#30d158] mt-0.5 block tabular-nums">
              +{agent.outputPerSec.toFixed(2)}/s
            </span>
          </div>
          <div className="text-center border-x border-white/[0.06]">
            <span className="text-[10px] text-white/40 uppercase font-sans block">Compute</span>
            <span className="text-xs font-mono font-semibold text-white/80 mt-0.5 block tabular-nums">
              {agent.computeCost.toFixed(1)} CU
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-white/40 uppercase font-sans block">Reliability</span>
            <span className="text-xs font-mono font-semibold text-white mt-0.5 block tabular-nums">
              {agent.reliability}%
            </span>
          </div>
        </div>

        {/* TAB 1: LLM Engine Selection */}
        {activeTab === 'model' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                Select Base LLM
              </span>
              <span className="text-[11px] font-mono text-white/60">
                Active: {currentModel.tag}
              </span>
            </div>

            <div className="space-y-2">
              {(Object.keys(AI_MODELS) as AgentModelType[]).map((mKey) => {
                const m = AI_MODELS[mKey];
                const isSelected = agent.model === mKey;
                return (
                  <div
                    key={mKey}
                    onClick={() => updateAgentModel(agent.id, mKey)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0a84ff] border-[#0a84ff] text-white shadow-sm'
                        : 'apple-inset hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{m.name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            isSelected ? 'bg-white/20 text-white border-white/30' : 'bg-white/[0.06] text-white/70 border-white/[0.08]'
                          }`}>
                            {m.tag}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-1 leading-relaxed ${isSelected ? 'text-white/80' : 'text-white/50'}`}>
                          {m.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-white text-[#0a84ff] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className={`flex items-center gap-4 mt-2.5 pt-2 border-t text-[10px] font-mono ${
                      isSelected ? 'border-white/20 text-white/80' : 'border-white/[0.04] text-white/40'
                    }`}>
                      <span>Intelligence: <strong className={isSelected ? 'text-white' : 'text-white/80'}>{m.intelligenceRating}/100</strong></span>
                      <span>Speed: <strong className={isSelected ? 'text-white' : 'text-white/80'}>{m.speedRating}/100</strong></span>
                      <span>Cost: <strong className={isSelected ? 'text-white' : 'text-white/80'}>${m.costPerMillionTokens}/M</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Prompt & Guardrails */}
        {activeTab === 'prompt' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                  System Directives
                </label>
                <span className="text-[10px] text-white/40 font-mono tabular-nums">
                  {editedPrompt.length} chars
                </span>
              </div>
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={4}
                className="w-full bg-black/40 border border-white/[0.08] focus:border-[#0a84ff] rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none transition-colors leading-relaxed font-sans"
                placeholder="Enter system prompt instructions for this autonomous agent..."
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handlePatchPrompt}
                  className="px-3.5 py-1.5 rounded-xl apple-btn-primary text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Enforce Guardrail</span>
                </button>
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="p-3.5 rounded-xl apple-inset space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white/80">Sampling Temperature</span>
                <span className="font-mono font-semibold text-white tabular-nums">
                  {agent.temperature ?? 0.7}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={agent.temperature ?? 0.7}
                onChange={(e) => updateAgentConfig(agent.id, { temperature: parseFloat(e.target.value) })}
                className="w-full accent-[#0a84ff] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>0.0 (Deterministic)</span>
                <span>0.7 (Standard)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>

            {/* Hallucination Risk Gauge */}
            <div className="p-3.5 rounded-xl apple-inset space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white/80 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#ff9f0a]" />
                  <span>Drift Risk Level</span>
                </span>
                <span className="font-mono font-semibold text-[#ff9f0a] tabular-nums">
                  {agent.hallucinationRisk || 5}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#30d158] via-[#ff9f0a] to-[#ff453a] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, (agent.hallucinationRisk || 5) * 2)}%` }}
                />
              </div>
              <p className="text-[11px] text-white/40">
                Higher tech debt and creative temperature increase model drift. Patching prompts reduces risk.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: Tool Permissions Matrix */}
        {activeTab === 'tools' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
              Autonomous Tool Permissions
            </span>
            <div className="space-y-2">
              {ALL_TOOLS.map((tool) => {
                const isEnabled = (agent.enabledTools || []).includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    onClick={() => handleToolToggle(tool.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isEnabled
                        ? 'bg-white/[0.06] border-[#0a84ff]/40 text-white'
                        : 'apple-inset text-white/50 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{tool.icon}</span>
                      <div>
                        <div className="text-xs font-semibold text-white/90">{tool.name}</div>
                        <div className="text-[11px] text-white/40">{tool.desc}</div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isEnabled
                          ? 'bg-[#0a84ff] border-[#0a84ff] text-white'
                          : 'border-white/[0.15] bg-black/40 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trait Card */}
        <div className="p-3.5 rounded-xl apple-inset space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-sans text-white/40 tracking-wider">Persona Trait</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${traitDef.badgeColor}`}>
              {traitDef.name}
            </span>
          </div>
          <p className="text-xs text-white/70 mt-1">{traitDef.description}</p>
          <p className="text-[11px] text-white/60 italic mt-1 font-serif">"{agent.quote}"</p>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
        <button
          onClick={() => upgradeAgent(agent.id)}
          disabled={!canUpgrade}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
            canUpgrade
              ? 'apple-btn-secondary'
              : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span>
            {agent.level >= 10 ? 'Max Level' : `Upgrade to Lv.${agent.level + 1} ($${upgradeCost.toLocaleString()})`}
          </span>
        </button>

        <button
          onClick={() => {
            if (confirm(`Terminate ${agent.name}'s API token?`)) {
              fireAgent(agent.id);
            }
          }}
          className="p-2 rounded-xl bg-[#ff453a]/10 hover:bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/20 transition-colors"
          title="Revoke API Key"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const AgentInspectorDrawer: React.FC = () => {
  const { agents, selectedCanvasAgentId, setSelectedCanvasAgent } = useGameStore();
  const agent = agents.find((a) => a.id === selectedCanvasAgentId);

  if (!agent) return null;

  return (
    <AgentInspectorContent
      key={agent.id}
      agent={agent}
      onClose={() => setSelectedCanvasAgent(null)}
    />
  );
};

