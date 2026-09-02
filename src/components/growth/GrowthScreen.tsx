import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { FOUNDER_POST_TEMPLATES } from '../../data/trends';
import { TrendingUp, Flame, Share2, Send } from 'lucide-react';

export const GrowthScreen: React.FC = () => {
  const {
    attention,
    leads,
    hype,
    trends,
    activeTrendId,
    setActiveTrend,
    postManual,
    focus
  } = useGameStore();

  const [customTweet, setCustomTweet] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(FOUNDER_POST_TEMPLATES[0].id);

  const activeTrend = trends.find(t => t.id === activeTrendId) || trends[0];
  const selectedTemplate = FOUNDER_POST_TEMPLATES.find(t => t.id === selectedTemplateId) || FOUNDER_POST_TEMPLATES[0];

  const handlePostTemplate = () => {
    if (focus < 1) return;
    postManual(activeTrendId || undefined, selectedTemplate.content);
  };

  const handlePostCustom = () => {
    if (focus < 1 || !customTweet.trim()) return;
    postManual(activeTrendId || undefined, customTweet.trim());
    setCustomTweet('');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Growth Funnel Header */}
      <div className="bg-[#111422] border border-[#20263c] rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <h2 className="text-lg font-black tracking-tight text-white">
                DISTRIBUTION & VIRALITY
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-pink-950 text-pink-300 border border-pink-800">
                {Math.floor(attention)} ATTENTION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Attention decays continuously. Growth Agents provide 24/7 automated campaigns; manual founder posts suffer audience saturation at scale.
            </p>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-xs font-mono text-slate-400">Leads in Funnel:</span>
              <div className="text-base font-black font-mono text-amber-300">
                {Math.floor(leads)} Leads
              </div>
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400">Hype Multiplier:</span>
              <div className="text-base font-black font-mono text-pink-400 glow-purple">
                {(1 + (hype / 100) * 0.5).toFixed(2)}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Real-Time Trends & Founder Post Maker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Hijacking Board */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-pink-400" />
              Active Cultural Trends
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Click trend to target content
            </span>
          </div>

          <div className="space-y-2">
            {trends.map((trend) => {
              const isActive = activeTrendId === trend.id;

              return (
                <div
                  key={trend.id}
                  onClick={() => setActiveTrend(trend.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-[#1a1c30] border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                      : 'bg-[#141726] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-white">
                        #{trend.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {trend.category}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-700 font-bold animate-pulse">
                          TARGETED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {trend.description}
                    </p>
                  </div>

                  <div className="text-right pl-3 border-l border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">Viral Boost</span>
                    <span className="text-xs font-mono font-bold text-pink-400">
                      {trend.viralMultiplier}x
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Founder Thought Leadership Generator */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-400" />
            Founder Thought Leadership Studio
          </h3>

          <div className="bg-[#141726] border border-[#21263c] rounded-xl p-4 space-y-4">
            {/* Archetype Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Select Content Hook Template:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FOUNDER_POST_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-2 rounded-lg text-left text-xs border transition-all ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                        : 'bg-[#181c2e] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold truncate">{tmpl.hook}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      +{tmpl.baseAttention} Base Att
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Preview Box */}
            <div className="bg-[#0f111c] border border-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                  1
                </div>
                <span className="text-xs font-bold text-white">You (Founder)</span>
                <span className="text-[10px] text-slate-500">@solo_unicorn</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedTemplate.content}
              </p>
            </div>

            {/* Post CTA */}
            <button
              onClick={handlePostTemplate}
              disabled={focus < 1}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all ${
                focus >= 1
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Publish Post (1 Focus &rarr; Target #{activeTrend.name})</span>
            </button>

            {/* Custom Tweet Write-in Box */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <label className="text-xs font-bold text-slate-400">
                Or Write Custom Manifesto (Max 280 chars):
              </label>
              <textarea
                value={customTweet}
                onChange={(e) => setCustomTweet(e.target.value.slice(0, 280))}
                placeholder="Drop an unhinged startup take..."
                className="w-full bg-[#0e101a] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 h-20 resize-none font-mono"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  {customTweet.length}/280 chars
                </span>
                <button
                  onClick={handlePostCustom}
                  disabled={focus < 1 || !customTweet.trim()}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    focus >= 1 && customTweet.trim()
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Send Tweet (1 Focus)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
