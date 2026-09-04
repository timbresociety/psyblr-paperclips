import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { FOUNDER_POST_TEMPLATES } from '../../data/trends';
import {
  TrendingUp,
  Flame,
  Share2,
  Send,
  Radio,
  Zap,
  PauseCircle,
  Users,
  Target,
  DollarSign,
  Sparkles
} from 'lucide-react';

import { soundEngine } from '../../audio/soundEffects';

export const GrowthScreen: React.FC = () => {
  const store = useGameStore();
  const {
    attention,
    leads,
    hype,
    mrr,
    arr,
    customers,
    trends,
    activeTrendId,
    setActiveTrend,
    growthCampaigns,
    toggleGrowthCampaign,
    postManual,
    focus,
    agents
  } = store;

  const [customTweet, setCustomTweet] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(FOUNDER_POST_TEMPLATES[0].id);

  const activeTrend = trends.find(t => t.id === activeTrendId) || trends[0];
  const selectedTemplate = FOUNDER_POST_TEMPLATES.find(t => t.id === selectedTemplateId) || FOUNDER_POST_TEMPLATES[0];

  const growthAgents = agents.filter(a => a.role === 'GROWTH');
  const salesAgents = agents.filter(a => a.role === 'SALES');

  const agentAttentionPerSec = Math.round(
    growthAgents.reduce((acc, a) => acc + a.outputPerSec, 0) * (activeTrend ? activeTrend.viralMultiplier : 1)
  );

  const activeCampaigns = (growthCampaigns || []).filter(c => c.isActive);
  const campaignsAttentionPerSec = activeCampaigns.reduce((acc, c) => acc + c.attentionPerSecond, 0);
  const totalAttGainPerSec = agentAttentionPerSec + campaignsAttentionPerSec;

  const leadsClosedPerSec = Math.round(salesAgents.reduce((acc, a) => acc + a.outputPerSec, 0));
  const expectedLeadsPerSec = Math.round((totalAttGainPerSec / 100) * 3);

  // Template estimates
  const estimatedAttGain = Math.round(selectedTemplate.baseAttention * (activeTrend?.viralMultiplier || 1.0));
  const estimatedDirectLeads = Math.max(1, Math.floor(estimatedAttGain / 80));

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

  const displayArr = Math.round(arr || (mrr * 12));

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header with Funnel Context */}
      <div className="apple-card rounded-2xl p-5 border border-white/[0.1]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#bf5af2]/15 text-[#bf5af2] flex items-center justify-center border border-[#bf5af2]/25">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">
                    Distribution &amp; Growth Engine
                  </h1>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#bf5af2]/15 text-[#bf5af2] border border-[#bf5af2]/30 font-semibold">
                    Inbound Pipeline
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Viral attention continuously feeds inbound buyer leads into your sales agents, compounding ARR.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-[11px] text-white/40 block">Attention Inflow</span>
              <div className="text-sm font-semibold font-mono text-[#bf5af2] tabular-nums mt-0.5">
                +{totalAttGainPerSec}/sec
              </div>
            </div>
            <div>
              <span className="text-[11px] text-white/40 block">Lead Generation</span>
              <div className="text-sm font-semibold font-mono text-[#0a84ff] tabular-nums mt-0.5">
                ~{expectedLeadsPerSec}/sec
              </div>
            </div>
            <div>
              <span className="text-[11px] text-white/40 block">Viral Hype Multiplier</span>
              <div className="text-sm font-semibold font-mono text-[#ff9f0a] tabular-nums mt-0.5">
                {(1 + (hype / 100) * 0.5).toFixed(2)}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual 4-Stage Inbound-to-Revenue Funnel HUD */}
      <div className="apple-card rounded-2xl p-5 border border-white/[0.1] bg-gradient-to-b from-white/[0.03] to-transparent relative overflow-hidden">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#bf5af2]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              The Growth-to-Revenue Flywheel (How This Impacts Your Game)
            </h2>
          </div>
          <span className="text-[11px] text-white/40 font-mono hidden sm:inline">
            Attention &rarr; Leads &rarr; Customers &rarr; ARR
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          {/* Stage 1: Attention */}
          <div className="p-4 rounded-xl apple-inset border border-[#bf5af2]/20 relative group">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#bf5af2]">
                <Flame className="w-3.5 h-3.5" />
                1. Viral Attention
              </span>
              <span className="font-mono text-[#bf5af2] font-semibold">+{totalAttGainPerSec}/s</span>
            </div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {Math.floor(attention).toLocaleString()} <span className="text-xs font-normal text-white/40">Att</span>
            </div>
            <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed">
              Multiplying by <strong className="text-white">#{activeTrend?.name || 'Trend'} ({activeTrend?.viralMultiplier || 1}x)</strong>. Sourced by {growthAgents.length} Growth Agents and viral posts.
            </p>
          </div>

          {/* Stage 2: Leads */}
          <div className="p-4 rounded-xl apple-inset border border-[#0a84ff]/20 relative group">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#0a84ff]">
                <Users className="w-3.5 h-3.5" />
                2. Inbound Leads
              </span>
              <span className="font-mono text-[#0a84ff] font-semibold">~{expectedLeadsPerSec}/s</span>
            </div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {Math.floor(leads).toLocaleString()} <span className="text-xs font-normal text-white/40">Leads</span>
            </div>
            <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed">
              Viral attention continuously converts 3% into active inbound inquiries waiting for sales pitches.
            </p>
          </div>

          {/* Stage 3: Sales Closing */}
          <div className="p-4 rounded-xl apple-inset border border-[#ff9f0a]/20 relative group">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#ff9f0a]">
                <Zap className="w-3.5 h-3.5" />
                3. Sales Swarm
              </span>
              <span className="font-mono text-[#ff9f0a] font-semibold">{salesAgents.length} Agents</span>
            </div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {leadsClosedPerSec}/s <span className="text-xs font-normal text-white/40">Closed</span>
            </div>
            <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed">
              Sales Agents automatically pitch and close leads 24/7, turning prospects into paid monthly contracts.
            </p>
          </div>

          {/* Stage 4: Compounding ARR */}
          <div className="p-4 rounded-xl apple-inset border border-[#30d158]/20 relative group">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#30d158]">
                <DollarSign className="w-3.5 h-3.5" />
                4. Compounding ARR
              </span>
              <span className="font-mono text-[#30d158] font-semibold">{Math.floor(customers)} Users</span>
            </div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              ${displayArr.toLocaleString()} <span className="text-xs font-normal text-white/40">ARR</span>
            </div>
            <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed">
              Your recurring customer base compounds treasury and unlocks subsequent company Eras toward $1B.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Automated Acquisition Channels / Growth Campaigns */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#bf5af2]" />
              <span>Automated Acquisition Channels (Passive Inbound Engines)</span>
            </h2>
            <p className="text-[11px] text-white/50 mt-0.5">
              Runs 24/7 in the background to pump leads into your Sales Swarm without manual clicks. Pause anytime to cut monthly OPEX.
            </p>
          </div>
          <span className="text-[11px] font-mono text-white/40">
            Monthly Marketing OPEX
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(growthCampaigns || []).map((camp) => {
            const isUnlocked = camp.isUnlocked || mrr >= camp.requiredMrr;
            const yieldLeadsPerSec = ((camp.attentionPerSecond * (activeTrend?.viralMultiplier || 1.0) / 100) * 3).toFixed(1);

            return (
              <div
                key={camp.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  camp.isActive
                    ? 'bg-[#0a84ff]/10 border-[#0a84ff]/40 shadow-sm'
                    : isUnlocked
                    ? 'apple-card hover:border-white/[0.14]'
                    : 'apple-card opacity-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.08] capitalize font-medium">
                      {camp.category}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                      camp.isActive
                        ? 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30'
                        : isUnlocked
                        ? 'bg-white/[0.06] text-white/60 border-white/[0.08]'
                        : 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20'
                    }`}>
                      {camp.isActive ? 'Active 24/7' : isUnlocked ? 'Ready' : `Locked ($${camp.requiredMrr >= 1000 ? `${camp.requiredMrr/1000}k` : camp.requiredMrr} MRR)`}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-xs tracking-tight leading-snug mb-1">
                    {camp.name}
                  </h3>
                  <p className="text-[11px] text-white/50 mb-3 leading-relaxed">
                    {camp.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2.5 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white/40">Inflow:</span>
                    <span className="font-semibold text-[#bf5af2] tabular-nums">+{camp.attentionPerSecond} Att/s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white/40">Est. Lead Yield:</span>
                    <span className="font-semibold text-[#0a84ff] tabular-nums">~{yieldLeadsPerSec} Leads/s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white/40">Monthly Burn:</span>
                    <span className="font-semibold text-white/80 tabular-nums">${camp.monthlyCost}/mo</span>
                  </div>

                  <button
                    onClick={() => { soundEngine.playClick(); toggleGrowthCampaign(camp.id); }}
                    disabled={!isUnlocked}
                    className={`w-full py-1.5 px-3 rounded-xl font-semibold text-xs mt-2 transition-all flex items-center justify-center gap-1.5 ${
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
                        <span>Pause Channel (Save OPEX)</span>
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

      {/* 4. Two-Column Layout: Cultural Trends & Founder Content Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Active Cultural Trends */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-[#ff9f0a]" />
              <span>Active Cultural Trends</span>
            </h2>
            <span className="text-[11px] text-white/40">
              Click trend to hijack viral traffic
            </span>
          </div>

          {/* Active Trend Explainer Banner */}
          <div className="p-3.5 rounded-2xl bg-[#0a84ff]/10 border border-[#0a84ff]/30 text-left space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0a84ff]" />
              <span className="text-xs font-bold text-white">
                Active Swarm Target: #{activeTrend?.name || 'Trend'} ({activeTrend?.viralMultiplier || 1.0}x)
              </span>
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed">
              Every Growth Agent and marketing campaign currently receives an active <strong className="text-emerald-400">+{Math.round(((activeTrend?.viralMultiplier || 1.0) - 1) * 100)}% viral multiplier</strong>. Select any trend below to redirect your swarm.
            </p>
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
                      ? 'bg-[#0a84ff]/15 border-[#0a84ff] ring-1 ring-[#0a84ff]/40 shadow-md'
                      : 'apple-card hover:border-white/[0.14]'
                  }`}
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">
                        #{trend.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.06] text-white/60">
                        {trend.category}
                      </span>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#0a84ff] text-white font-bold">
                          ✓ Active Target
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/50 leading-snug">
                      {trend.description}
                    </p>
                  </div>

                  <div className="text-right pl-3 border-l border-white/[0.06]">
                    <span className="text-[10px] text-white/40 block">Viral Multiplier</span>
                    <span className="text-sm font-mono font-bold text-[#ff9f0a] tabular-nums">
                      {trend.viralMultiplier}x
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Founder Content Studio */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-[#bf5af2]" />
              <span>Founder Content Studio</span>
            </h2>
            <span className="text-[11px] text-white/40">
              Publish viral threads for immediate inbound leads
            </span>
          </div>

          <div className="apple-card rounded-2xl p-4.5 space-y-4 border border-white/[0.1]">
            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white flex items-center justify-between">
                <span>Select Hook Template:</span>
                <span className="text-[10px] font-mono text-white/40">
                  Amplified by #{activeTrend?.name} ({activeTrend?.viralMultiplier}x)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FOUNDER_POST_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  const previewAtt = Math.round(tmpl.baseAttention * (activeTrend?.viralMultiplier || 1.0));
                  const previewLeads = Math.max(1, Math.floor(previewAtt / 80));

                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => { soundEngine.playClick(); setSelectedTemplateId(tmpl.id); }}
                      className={`p-2.5 rounded-xl text-left text-xs border transition-all ${
                        isSelected
                          ? 'bg-[#0a84ff]/15 border-[#0a84ff] text-white shadow-xs'
                          : 'apple-inset text-white/60 hover:text-white hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="font-bold truncate">{tmpl.hook}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-white/40">
                        <span className="text-[#bf5af2]">+{previewAtt} Att</span>
                        <span className="text-[#0a84ff]">~{previewLeads} Leads</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Preview Box */}
            <div className="apple-inset rounded-xl p-3.5 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#0a84ff] flex items-center justify-center text-white text-[10px] font-bold">
                    F
                  </div>
                  <span className="text-xs font-bold text-white">Founder</span>
                  <span className="text-[10px] text-white/40 font-mono">@solo_unicorn</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  Expected: +{estimatedAttGain} Att &bull; ~{estimatedDirectLeads} Leads
                </span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed font-sans">
                {selectedTemplate.content}
              </p>
            </div>

            {/* Post CTA */}
            <button
              onClick={handlePostTemplate}
              disabled={focus < 1}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs tracking-tight transition-all shadow-md ${
                focus >= 1
                  ? 'apple-btn-primary'
                  : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                Publish Thread (1 Focus &rarr; +{estimatedAttGain} Att &amp; ~{estimatedDirectLeads} Leads on #{activeTrend?.name})
              </span>
            </button>

            {/* Custom Tweet Write-in Box */}
            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                <span>Or Write Custom Manifesto (Max 280 chars):</span>
                <span className="text-[10px] font-mono text-white/40">
                  Tag: #{activeTrend?.name}
                </span>
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
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    focus >= 1 && customTweet.trim()
                      ? 'apple-btn-secondary'
                      : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
                  }`}
                >
                  Publish Custom Post (1 Focus)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
