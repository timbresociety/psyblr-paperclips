import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { Code, Share2, DollarSign, LifeBuoy, Zap, Bot } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';
import { emitFloatingParticle } from '../common/FloatingParticles';

const VIBE_CODE_SNIPPETS = [
  '+15 BP',
  'git commit -m "feat"',
  'async () => {}',
  'npm run build',
  '0 bugs found',
  'refactor AST',
  'export default Swarm'
];

export const FounderActions: React.FC = () => {
  const {
    focus,
    maxFocus,
    vibeCodeManual,
    postManual,
    sellManual,
    supportManual,
    agents,
    leads,
    tickets,
    currentEra: rawCurrentEra,
    earlyUpgrades
  } = useGameStore();


  const currentEra = rawCurrentEra || 1;
  const hasEngAgent = agents.some(a => a.role === 'ENGINEERING');
  const hasGrowthAgent = agents.some(a => a.role === 'GROWTH');
  const hasSalesAgent = agents.some(a => a.role === 'SALES');
  const hasSupportAgent = agents.some(a => a.role === 'SUPPORT');

  const focusPercent = Math.min(100, Math.max(0, (focus / maxFocus) * 100));

  const handleAction = (
    e: React.MouseEvent,
    action: () => void,
    soundType: 'click' | 'cash' | 'deploy' | 'ticket',
    particleText: string,
    color?: string
  ) => {
    if (soundType === 'cash') soundEngine.playCash();
    else if (soundType === 'deploy') soundEngine.playDeploy();
    else if (soundType === 'ticket') soundEngine.playTicketResolved();
    else soundEngine.playClick();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2 + (Math.random() * 40 - 20);
    const y = rect.top + (Math.random() * 10 - 5);
    emitFloatingParticle(particleText, x, y, color);

    action();
  };

  const isLateEra = currentEra >= 6;
  const eraScale = Math.max(1, Math.pow(1.5, currentEra - 1));
  const vibeBpEstimate = Math.round((earlyUpgrades.includes('upg_mech_keyboard') ? 23 : 15) * eraScale);
  const attEstimate = Math.round(80 * eraScale);
  const ticketsEstimate = Math.min(Math.round(2 * eraScale), Math.max(1, Math.ceil(tickets)));

  const showVibeCode = true;
  const showGrowthSales = currentEra >= 2;
  const showSupport = currentEra >= 3;

  const getVibeParticle = () => {
    return isLateEra ? `+${vibeBpEstimate} BP` : VIBE_CODE_SNIPPETS[Math.floor(Math.random() * VIBE_CODE_SNIPPETS.length)];
  };

  return (
    <div className="apple-card rounded-2xl p-4 sm:p-5 text-left space-y-4">
      {/* Focus Gauge Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-[#0a84ff]/15 text-[#0a84ff]">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-white tracking-tight">
              {isLateEra ? 'Executive Strategy Energy' : 'Founder Focus Energy'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono font-semibold text-[#0a84ff] tabular-nums">
              {focus.toFixed(1)} / {maxFocus}
            </span>
            <span className="text-[11px] text-white/40">
              ({earlyUpgrades.includes('upg_espresso') ? '+1.0/s (2x)' : '+0.5/s'})
            </span>
          </div>
        </div>

        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0a84ff] transition-all duration-150 rounded-full"
            style={{ width: `${focusPercent}%` }}
          />
        </div>
      </div>

      {/* Progressive Tactical Actions Deck */}
      <div className={`grid gap-3 ${
        !showGrowthSales
          ? 'grid-cols-1'
          : !showSupport
          ? 'grid-cols-1 sm:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {/* 1. VIBE CODE / EXECUTIVE SPRINT */}
        {showVibeCode && (
          <div className="apple-inset rounded-xl p-3.5 flex flex-col justify-between transition-all group hover:border-white/[0.12]">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#64d2ff]/15 text-[#64d2ff]">
                    <Code className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08]">
                    C
                  </span>
                </div>
                {hasEngAgent ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#64d2ff]/10 text-[#64d2ff] border border-[#64d2ff]/20">
                    <Bot className="w-3 h-3 text-[#64d2ff]" /> Managed
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-white/40">1.0 Focus</span>
                )}
              </div>

              <h4 className="text-xs font-semibold text-white tracking-tight">
                {isLateEra ? 'Executive Sprint Crunch' : 'Vibe Code'}
              </h4>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                {isLateEra
                  ? `+${vibeBpEstimate} BP to active roadmap. Dispatches founder priority sprint.`
                  : `${earlyUpgrades.includes('upg_mech_keyboard') ? '+23 BP' : '+15 BP'}, +2% Tech Debt. Rapid prototyping with AI.`}
              </p>
            </div>

            <button
              onClick={(e) => handleAction(e, vibeCodeManual, 'deploy', getVibeParticle(), '#64d2ff')}
              disabled={focus < 1}
              className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-medium tracking-tight transition-all apple-btn-secondary"
            >
              {isLateEra ? `Sprint Crunch (+${vibeBpEstimate} BP)` : (hasEngAgent ? 'Assist Agent' : 'Vibe Code (1 Focus)')}
            </button>
          </div>
        )}


        {/* 2. POST (Revealed in Era 2+) */}
        {showGrowthSales && (
          <div className="apple-inset rounded-xl p-3.5 flex flex-col justify-between transition-all group hover:border-white/[0.12] animate-in fade-in duration-300">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#bf5af2]/15 text-[#bf5af2]">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08]">
                    P
                  </span>
                </div>
                {hasGrowthAgent ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2]/20">
                    <Bot className="w-3 h-3 text-[#bf5af2]" /> Managed
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-white/40">1.0 Focus</span>
                )}
              </div>

              <h4 className="text-xs font-semibold text-white tracking-tight">
                {isLateEra ? 'Strategic Keynote' : 'Post Content'}
              </h4>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                {isLateEra
                  ? `Deliver global tech keynote (+${attEstimate} Attention). Amplified across viral channels.`
                  : 'Publish viral thread. Generates high attention; automated by Growth Agents.'}
              </p>
            </div>

            <button
              onClick={(e) => handleAction(e, postManual, 'click', `+${attEstimate} Attention`, '#bf5af2')}
              disabled={focus < 1}
              className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-medium tracking-tight transition-all apple-btn-secondary"
            >
              {isLateEra ? `Deliver Keynote (+${attEstimate} Att)` : (hasGrowthAgent ? 'Drop Viral Thread' : 'Post Content (1 Focus)')}
            </button>
          </div>
        )}

        {/* 3. SELL (Revealed in Era 2+) */}
        {showGrowthSales && (
          <div className="apple-inset rounded-xl p-3.5 flex flex-col justify-between transition-all group hover:border-white/[0.12] animate-in fade-in duration-300">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#30d158]/15 text-[#30d158]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08]">
                    S
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasSalesAgent && (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20">
                      <Bot className="w-3 h-3 text-[#30d158]" /> Managed
                    </span>
                  )}
                  <span className={`text-[11px] font-mono tabular-nums ${leads >= 1 ? 'text-[#30d158] font-semibold' : 'text-white/40'}`}>
                    {Math.floor(leads)} Leads
                  </span>
                  {leads >= 1 && (
                    <span className="relative flex h-2 w-2" title="Leads ready to convert">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30d158] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30d158]" />
                    </span>
                  )}
                </div>
              </div>

              <h4 className="text-xs font-semibold text-white tracking-tight">
                {isLateEra ? 'Enterprise Closer Call' : 'Pitch Lead (Sell)'}
              </h4>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                {isLateEra
                  ? 'Founder joins enterprise procurement call to close high-ticket whale ARR.'
                  : 'Convert qualified leads into paying recurring ARR.'}
              </p>
            </div>

            <button
              onClick={(e) => handleAction(e, sellManual, 'cash', '+$25 MRR', '#30d158')}
              disabled={focus < 1}
              className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-medium tracking-tight transition-all ${
                leads >= 1
                  ? 'bg-[#30d158]/15 hover:bg-[#30d158]/25 text-[#30d158] border border-[#30d158]/30 shadow-xs'
                  : 'apple-btn-secondary'
              }`}
            >
              {isLateEra
                ? 'Close Enterprise Deal (1 Focus)'
                : leads >= 1
                ? hasSalesAgent ? 'Close Whale Lead (1 Focus)' : 'Pitch Lead (1 Focus)'
                : 'Cold Outreach Pitch (1 Focus)'}
            </button>
          </div>
        )}

        {/* 4. SUPPORT (Revealed in Era 3+) */}
        {showSupport && (
          <div className="apple-inset rounded-xl p-3.5 flex flex-col justify-between transition-all group hover:border-white/[0.12] animate-in fade-in duration-300">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#ff9f0a]/15 text-[#ff9f0a]">
                    <LifeBuoy className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08]">
                    T
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasSupportAgent && (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#ff9f0a]/10 text-[#ff9f0a] border border-[#ff9f0a]/20">
                      <Bot className="w-3 h-3 text-[#ff9f0a]" /> Managed
                    </span>
                  )}
                  <span className={`text-[11px] font-mono tabular-nums ${tickets >= 3 ? 'text-[#ff453a] font-semibold' : 'text-white/40'}`}>
                    {Math.ceil(tickets)} Open
                  </span>
                  {tickets >= 3 && (
                    <span className="relative flex h-2 w-2" title="Unresolved tickets spiking churn!">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff453a] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff453a]" />
                    </span>
                  )}
                </div>
              </div>

              <h4 className="text-xs font-semibold text-white tracking-tight">
                {isLateEra ? 'Executive SLA Blitz' : 'Resolve Support'}
              </h4>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                {isLateEra
                  ? `Executive intervention clears backlog tickets to protect retention and trust.`
                  : 'Resolve tickets to protect customer trust and minimize churn.'}
              </p>
            </div>

            <button
              onClick={(e) => handleAction(e, supportManual, 'ticket', '+0.5% Trust', '#ff9f0a')}
              disabled={focus < 1 || tickets <= 0}
              className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-medium tracking-tight transition-all ${
                tickets >= 4
                  ? 'bg-[#ff453a]/20 hover:bg-[#ff453a]/30 text-[#ff453a] border border-[#ff453a]/40 shadow-xs'
                  : 'apple-btn-secondary'
              }`}
            >
              {tickets > 0 ? (isLateEra ? `SLA Blitz (Resolve ${ticketsEstimate})` : `Resolve Tickets (${Math.ceil(tickets)})`) : 'Inbox Zero'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

