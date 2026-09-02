import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { FOUNDER_POST_TEMPLATES } from '../../data/trends';
import { TrendingUp, Flame, Share2, Send, Radio, Zap, PauseCircle } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export const GrowthScreen: React.FC = () => {
  const {
    attention,
    leads,
    hype,
    mrr,
    trends,
    activeTrendId,
    setActiveTrend,
    growthCampaigns,
    toggleGrowthCampaign,
    postManual,
    focus,
    agents
  } = useGameStore();

  const [customTweet, setCustomTweet] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(FOUNDER_POST_TEMPLATES[0].id);

  const activeTrend = trends.find(t => t.id === activeTrendId) || trends[0];
  const selectedTemplate = FOUNDER_POST_TEMPLATES.find(t => t.id === selectedTemplateId) || FOUNDER_POST_TEMPLATES[0];

  const growthAgents = agents.filter(a => a.role === 'GROWTH');
  const agentAttentionPerSec = Math.round(growthAgents.reduce((acc, a) => acc + a.outputPerSec, 0) * (activeTrend ? activeTrend.viralMultiplier : 1));

  const activeCampaigns = (growthCampaigns || []).filter(c => c.isActive);
  const campaignsAttentionPerSec = activeCampaigns.reduce((acc, c) => acc + c.attentionPerSecond, 0);
  const totalAttGainPerSec = agentAttentionPerSec + campaignsAttentionPerSec;

  const handlePostTemplate = () => {
    if (focus < 1) return;
    soundEngine.playClick();
    postManual(activeTrendId || undefined, selectedTemplate.content);
  };

  const handlePostCustom = () => {
    if (focus < 1 || !customTweet.trim()) return;
    soundEngine.playClick();
    postManual(activeTrendId || undefined, customTweet.trim());
    setCustomTweet('');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Growth Funnel Header */}
      <div className="apple-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#bf5af2]/15 text-[#bf5af2] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-white tracking-tight">
                    Distribution &amp; Growth Channels
                  </h1>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08] tabular-nums">
                    {Math.floor(attention).toLocaleString()} Attention
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Attention decays continuously. Scale automated distribution channels and deploy Growth Agents to sustain inbound leads.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-[11px] font-sans text-white/40 block">Total Inflow</span>
              <div className="text-sm font-semibold font-mono text-white tabular-nums mt-0.5">
                +{totalAttGainPerSec}/s
              </div>
            </div>
            <div>
              <span className="text-[11px] font-sans text-white/40 block">Leads in Pipeline</span>
              <div className="text-sm font-semibold font-mono text-white tabular-nums mt-0.5">
                {Math.floor(leads)} Leads
              </div>
            </div>
            <div>
              <span className="text-[11px] font-sans text-white/40 block">Hype Multiplier</span>
              <div className="text-sm font-semibold font-mono text-[#ff9f0a] tabular-nums mt-0.5">
                {(1 + (hype / 100) * 0.5).toFixed(2)}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Distribution Channels / Growth Campaigns */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#bf5af2]" />
            <span>Automated Acquisition Channels</span>
          </h2>
          <span className="text-[11px] font-mono text-white/40">
            Monthly Recurring Marketing OPEX
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(growthCampaigns || []).map((camp) => {
            const isUnlocked = camp.isUnlocked || mrr >= camp.requiredMrr;

            return (
              <div
                key={camp.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  camp.isActive
                    ? 'bg-[#0a84ff]/10 border-[#0a84ff]/30 shadow-xs'
                    : isUnlocked
                    ? 'apple-card hover:border-white/[0.14]'
                    : 'apple-card opacity-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.08] capitalize">
                      {camp.category}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium ${
                      camp.isActive
                        ? 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30'
                        : isUnlocked
                        ? 'bg-white/[0.06] text-white/60 border-white/[0.08]'
                        : 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20'
                    }`}>
                      {camp.isActive ? 'Active' : isUnlocked ? 'Ready' : `Locked ($${camp.requiredMrr >= 1000 ? `${camp.requiredMrr/1000}k` : camp.requiredMrr} MRR)`}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white text-xs tracking-tight leading-snug mb-1">
                    {camp.name}
                  </h3>
                  <p className="text-[11px] text-white/50 mb-3 leading-relaxed">
                    {camp.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2.5 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white/40">Inflow:</span>
                    <span className="font-semibold text-[#30d158] tabular-nums">+{camp.attentionPerSecond} Att/s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white/40">OPEX:</span>
                    <span className="font-semibold text-white/80 tabular-nums">${camp.monthlyCost}/mo</span>
                  </div>

                  <button
                    onClick={() => { soundEngine.playClick(); toggleGrowthCampaign(camp.id); }}
                    disabled={!isUnlocked}
                    className={`w-full py-1.5 px-3 rounded-xl font-medium text-xs mt-2 transition-all flex items-center justify-center gap-1.5 ${
                      !isUnlocked
                        ? 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
                        : camp.isActive
                        ? 'bg-[#ff453a]/15 hover:bg-[#ff453a]/25 text-[#ff453a] border border-[#ff453a]/25'
                        : 'apple-btn-secondary'
                    }`}
                  >
                    {camp.isActive ? (
                      <>
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Pause Channel</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-[#ff9f0a]" />
                        <span>{isUnlocked ? `Launch ($${camp.monthlyCost}/mo)` : `Locked`}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Grid: Real-Time Trends & Founder Post Maker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Hijacking Board */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-[#ff9f0a]" />
              <span>Active Cultural Trends</span>
            </h2>
            <span className="text-[11px] text-white/40">
              Click trend to hijack traffic
            </span>
          </div>

          <div className="space-y-2.5">
            {trends.map((trend) => {
              const isActive = activeTrendId === trend.id;

              return (
                <div
                  key={trend.id}
                  onClick={() => { soundEngine.playClick(); setActiveTrend(trend.id); }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-[#0a84ff]/10 border-[#0a84ff] ring-1 ring-[#0a84ff]/30 shadow-xs'
                      : 'apple-card hover:border-white/[0.14]'
                  }`}
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white">
                        #{trend.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.06] text-white/60">
                        {trend.category}
                      </span>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#0a84ff]/15 text-[#0a84ff] border border-[#0a84ff]/30 font-medium">
                          Active Target
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/50 leading-snug">
                      {trend.description}
                    </p>
                  </div>

                  <div className="text-right pl-3 border-l border-white/[0.06]">
                    <span className="text-[10px] text-white/40 block">Viral Multiplier</span>
                    <span className="text-xs font-mono font-semibold text-[#ff9f0a] tabular-nums">
                      {trend.viralMultiplier}x
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Founder Thought Leadership Generator */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-[#bf5af2]" />
            <span>Founder Content Studio</span>
          </h2>

          <div className="apple-card rounded-2xl p-4 space-y-4">
            {/* Archetype Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/80">
                Content Hook Template:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FOUNDER_POST_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => { soundEngine.playClick(); setSelectedTemplateId(tmpl.id); }}
                    className={`p-2.5 rounded-xl text-left text-xs border transition-all ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-[#0a84ff]/15 border-[#0a84ff] text-white'
                        : 'apple-inset text-white/60 hover:text-white hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="font-semibold truncate">{tmpl.hook}</div>
                    <div className="text-[10px] font-mono text-white/40 mt-0.5 tabular-nums">
                      +{tmpl.baseAttention} Base Att
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Preview Box */}
            <div className="apple-inset rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-[#0a84ff] flex items-center justify-center text-white text-[10px] font-bold">
                  F
                </div>
                <span className="text-xs font-semibold text-white">Founder</span>
                <span className="text-[10px] text-white/40 font-mono">@solo_unicorn</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                {selectedTemplate.content}
              </p>
            </div>

            {/* Post CTA */}
            <button
              onClick={handlePostTemplate}
              disabled={focus < 1}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium text-xs tracking-tight transition-all ${
                focus >= 1
                  ? 'apple-btn-primary'
                  : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Thread (1 Focus &rarr; #{activeTrend.name})</span>
            </button>

            {/* Custom Tweet Write-in Box */}
            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              <label className="text-xs font-medium text-white/70">
                Or Write Custom Post (Max 280 chars):
              </label>
              <textarea
                value={customTweet}
                onChange={(e) => setCustomTweet(e.target.value.slice(0, 280))}
                placeholder="Drop a sharp startup manifesto..."
                className="w-full bg-black/40 border border-white/[0.08] focus:border-[#0a84ff] rounded-xl p-2.5 text-xs text-white placeholder-white/40 focus:outline-none h-20 resize-none font-sans"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40 tabular-nums">
                  {customTweet.length}/280 chars
                </span>
                <button
                  onClick={handlePostCustom}
                  disabled={focus < 1 || !customTweet.trim()}
                  className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    focus >= 1 && customTweet.trim()
                      ? 'apple-btn-secondary'
                      : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
                  }`}
                >
                  Send Post (1 Focus)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

