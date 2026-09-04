import React from 'react';
import { useGameStore, calcAutonomyInfo } from '../../state/gameStore';
import { FounderActions } from './FounderActions';
import { LiveActivityFeed } from './LiveActivityFeed';
import {
  ArrowRight,
  Building2,
  DollarSign,
  Cpu,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  Rocket,
  Keyboard,
  Coffee,
  Terminal as TerminalIcon,
  CheckCircle2,
  Code
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';
import { EARLY_GARAGE_UPGRADES } from '../../data/eras';
import { emitFloatingParticle } from '../common/FloatingParticles';
import { EraMissionCard } from './EraMissionCard';
import { HireAgentModal } from '../agents/HireAgentModal';
import { ExecutiveIncidentModal } from '../inbox/ExecutiveIncidentModal';
import type { AgentRoleType } from '../../types/agents';


const VIBE_SNIPPETS = [
  '+15 BP',
  'git commit -m "mvp"',
  'async function main()',
  'npm run build',
  '0 bugs found',
  'export default Swarm'
];

export const CommandCenter: React.FC = () => {
  const {
    stage,
    valuation,
    productLevel,
    buildPoints,
    buildPointsTarget,
    attention,
    leads,
    customers,
    mrr,
    agents,
    techDebt,
    roadmapFeatures,
    activeRoadmapId,
    setActiveTab,
    companies,
    currentEra: rawCurrentEra,
    mvpShipped,
    shipMvp,
    earlyUpgrades,
    purchaseEarlyUpgrade,
    cash,
    vibeCodeManual,
    quickRefactorManual,
    focus
  } = useGameStore();

  const currentEra = rawCurrentEra || 1;
  const activeFeature = roadmapFeatures.find(f => f.id === activeRoadmapId);
  const bpPercent = (buildPoints / Math.max(1, buildPointsTarget)) * 100;
  const autonomy = calcAutonomyInfo({ agents, valuation, stage });

  const [isHireModalOpen, setIsHireModalOpen] = React.useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState(false);
  const [hireRole, setHireRole] = React.useState<AgentRoleType | undefined>(undefined);
  const needsManager = agents.length >= 8 && !agents.some(a => a.role === 'MANAGER');


  const handleTabJump = (tab: any) => {

    soundEngine.playClick();
    setActiveTab(tab);
  };

  const handleHeroVibeClick = (e: React.MouseEvent) => {
    if (focus < 1) return;
    soundEngine.playDeploy();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2 + (Math.random() * 60 - 30);
    const y = rect.top + (Math.random() * 20 - 10);
    const snippet = VIBE_SNIPPETS[Math.floor(Math.random() * VIBE_SNIPPETS.length)];
    emitFloatingParticle(snippet, x, y, '#64d2ff');
    vibeCodeManual();
  };

  const getGearIcon = (category: string) => {
    if (category === 'gear') return <Keyboard className="w-4 h-4 text-[#64d2ff]" />;
    if (category === 'caffeine') return <Coffee className="w-4 h-4 text-[#ff9f0a]" />;
    if (category === 'tooling') return <TerminalIcon className="w-4 h-4 text-[#bf5af2]" />;
    return <Rocket className="w-4 h-4 text-[#30d158]" />;
  };

  // ==========================================
  // ERA 1: GLEB GARAGE FOUNDER HERO COCKPIT
  // ==========================================
  if (currentEra === 1) {
    const mvpProgress = productLevel >= 2 ? 100 : Math.min(100, (buildPoints / 100) * 100);
    const isMvpReady = buildPoints >= 100 || productLevel >= 2;

    return (
      <div className="space-y-6 text-left max-w-4xl mx-auto py-2 sm:py-6 animate-in fade-in duration-300">
        {/* Minimal Hero Header */}
        <div className="text-center space-y-1.5 pb-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#0a84ff] font-semibold">
            Era 1 // The Garage Hacker
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Build the Prototype
          </h1>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            You are a solo founder with $2,000 savings and zero human employees. Write code by hand to ship your MVP.
          </p>
        </div>

        {/* Big Gleb Tactile Hero Button */}
        <div className="apple-card rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-5 relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-radial from-[#0a84ff]/10 via-transparent to-transparent pointer-events-none" />

          {/* Tactile VIBE CODE Button */}
          <button
            onClick={handleHeroVibeClick}
            disabled={focus < 1}
            className="gleb-hero-btn group relative px-8 py-5 sm:px-12 sm:py-6 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 transition-all w-full sm:w-auto min-w-[280px]"
          >
            <div className="flex items-center gap-2.5">
              <Code className="w-5 h-5 text-[#64d2ff] group-hover:rotate-6 transition-transform" />
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                VIBE CODE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.1] text-white/80 border border-white/[0.12]">
                C
              </span>
            </div>
            <span className="text-[11px] text-white/50 font-mono">
              {earlyUpgrades.includes('upg_mech_keyboard') ? '+23 BP' : '+15 BP'} &middot; 1 Focus &middot; +2% Tech Debt
            </span>
          </button>

          <div className="text-[11px] text-white/40 font-mono">
            click or press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/70 border border-white/[0.1]">C</kbd> to write code by hand like an animal
          </div>

          {/* MVP Sprint Meter */}
          <div className="w-full max-w-md space-y-2 pt-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60 font-medium">Prototype MVP Sprint</span>
              <span className="text-[#64d2ff] font-semibold tabular-nums">
                {Math.floor(buildPoints)} / 100 BP
              </span>
            </div>

            <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#0a84ff] to-[#64d2ff] rounded-full transition-all duration-200 shadow-sm"
                style={{ width: `${mvpProgress}%` }}
              />
            </div>

            {isMvpReady && !mvpShipped && (
              <button
                onClick={shipMvp}
                className="mt-3 w-full py-3 px-4 rounded-xl bg-[#30d158] hover:bg-[#28c840] text-black font-semibold text-xs tracking-tight flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#30d158]/20 cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span>DEPLOY MVP TO PRODUCTION (Unlock Era 2)</span>
              </button>
            )}

          </div>
        </div>

        {/* Early Garage Founder Gear / Upgrades */}
        <div className="apple-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Garage Founder Gear &amp; Hustle
            </h3>
            <span className="text-[11px] text-white/40 font-mono">
              Treasury: ${Math.round(cash).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EARLY_GARAGE_UPGRADES.filter(u => u.id !== 'upg_deploy_stripe').map((upg) => {
              const isOwned = earlyUpgrades.includes(upg.id);
              const canAfford = cash >= upg.cost;

              return (
                <div
                  key={upg.id}
                  className={`apple-inset rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                    isOwned ? 'border-[#30d158]/30 bg-[#30d158]/5' : ''
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="p-1 rounded-lg bg-white/[0.06]">
                        {getGearIcon(upg.category)}
                      </div>
                      {isOwned ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-[#30d158]">
                          <CheckCircle2 className="w-3 h-3" /> OWNED
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-semibold text-white/90">
                          ${upg.cost}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-white tracking-tight">
                      {upg.name}
                    </h4>
                    <p className="text-[11px] text-white/50 leading-snug">
                      {upg.description}
                    </p>
                    <p className="text-[11px] text-[#64d2ff] font-medium font-mono pt-1">
                      {upg.benefitText}
                    </p>
                  </div>

                  {!isOwned && (
                    <button
                      onClick={() => purchaseEarlyUpgrade(upg.id)}
                      disabled={!canAfford}
                      className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-medium apple-btn-secondary"
                    >
                      {canAfford ? `Buy ($${upg.cost})` : 'Need Cash'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERA 2+: PROGRESSIVE EVOLVING COCKPIT
  // ==========================================
  const showUnitEconomics = currentEra >= 2;
  const showAutonomyCard = currentEra >= 3;
  const showProductCard = currentEra >= 4;
  const showGrowthCard = currentEra >= 5;
  const showTerminalFeed = currentEra >= 4;

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-300">
      {/* Era Mission Objective & Guiding Radar HUD */}
      <EraMissionCard
        onOpenHireModal={(role) => {
          setHireRole(role);
          setIsHireModalOpen(true);
        }}
        onOpenIncidentModal={() => setIsIncidentModalOpen(true)}
      />


      {/* Progressive Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Unit Economics (Era 2+) */}
        {showUnitEconomics && (
          <div className="apple-card rounded-2xl p-4 flex flex-col justify-between transition-all group animate-in fade-in duration-300">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-3.5 h-3.5 text-[#30d158]" />
                  Unit Economics
                </span>
                <span className="text-xs font-mono font-semibold text-[#30d158] tabular-nums">
                  ${mrr.toLocaleString()} MRR
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between items-center bg-white/[0.03] px-2.5 py-1.5 rounded-xl border border-white/[0.04]">
                  <span className="text-white/50">Paying Users</span>
                  <span className="font-mono font-semibold text-white tabular-nums">{Math.floor(customers)}</span>
                </div>
                <div className="flex justify-between items-center bg-white/[0.03] px-2.5 py-1.5 rounded-xl border border-white/[0.04]">
                  <span className="text-white/50">Gross Margin</span>
                  <span className="font-mono font-semibold text-white/90">96.4%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              {currentEra >= 7 ? (
                <button
                  onClick={() => handleTabJump('finance')}
                  className="flex items-center justify-between w-full text-xs text-white/70 hover:text-white font-medium transition-colors"
                >
                  <span>P&amp;L &amp; Term Sheets</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <span className="text-[11px] font-mono text-white/40">
                  Zero Payroll OPEX &middot; 1 Human CEO
                </span>
              )}
            </div>
          </div>
        )}

        {/* 2. Autonomy Matrix (Era 3+) */}
        {showAutonomyCard && (
          <div className={`apple-card rounded-2xl p-4 flex flex-col justify-between transition-all group animate-in fade-in duration-300 ${
            needsManager ? 'border-[#ff453a]/30 ring-1 ring-[#ff453a]/20' : ''
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#5e5ce6]" />
                  Autonomy
                </span>
                <div className="flex items-center gap-1.5">
                  {needsManager && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/30 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a]" />
                      Hire Manager
                    </span>
                  )}
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-medium bg-white/[0.06] text-white/80 border border-white/[0.08]">
                    Tier {autonomy.level} ({autonomy.percent}%)
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-base font-semibold text-white tracking-tight truncate">
                  {autonomy.title.split(':')[1] || stage.replace('_', ' ')}
                </div>
                <p className="text-xs text-white/50 mt-0.5 line-clamp-1">
                  {autonomy.subtitle}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    autonomy.level === 5 ? 'bg-[#30d158]' : 'bg-[#5e5ce6]'
                  }`}
                  style={{ width: `${Math.max(5, autonomy.percent)}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] font-mono">
                <span className="text-white/40 block">Next Unlock:</span>
                <span className="text-white/80 block mt-0.5 leading-snug">
                  {autonomy.nextRequirement}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              {needsManager ? (
                <button
                  onClick={() => {
                    setHireRole('MANAGER');
                    setIsHireModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ff453a] hover:bg-[#e0382e] text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <span>Deploy Manager Agent</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => handleTabJump('agents')}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-medium transition-colors"
                >
                  <span>{agents.length} Active Agents</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {companies && companies.length > 1 && (
                <button
                  onClick={() => handleTabJump('holding')}
                  className="text-[11px] font-mono text-white/40 hover:text-white/80 flex items-center gap-1"
                  title="View holding portfolio"
                >
                  <Building2 className="w-3 h-3" />
                  <span>{companies.length} Subs</span>
                </button>
              )}
            </div>
          </div>
        )}


        {/* 3. Product Velocity & Tech Debt (Era 4+) */}
        {showProductCard && (
          <div className="apple-card rounded-2xl p-4 flex flex-col justify-between transition-all group animate-in fade-in duration-300">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5 text-[#64d2ff]" />
                  Product Velocity
                </span>
                <span className="text-xs font-mono font-medium text-white/70">Lvl {productLevel}</span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/80 mb-1">
                  <span className="font-mono font-semibold text-white tabular-nums">{Math.floor(buildPoints)} BP</span>
                  <span className="text-white/40 font-mono">/ {buildPointsTarget} BP</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-[#64d2ff] transition-all duration-200 rounded-full" style={{ width: `${Math.min(100, bpPercent)}%` }} />
                </div>
                {activeFeature ? (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <p className="text-white/80 truncate flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#64d2ff] animate-pulse shrink-0" />
                      <span className="truncate">{activeFeature.name}</span>
                    </p>
                    {agents.some(a => a.role === 'ENGINEERING') && (
                      <span className="text-[10px] font-mono text-[#30d158] font-medium shrink-0 ml-1">
                        Auto-Building
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-white/40 mt-2">
                    All sprint tickets resolved
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <button
                onClick={() => handleTabJump('product')}
                className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-medium transition-colors shrink-0"
              >
                <span>Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
              </button>
              {techDebt > 20 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    quickRefactorManual();
                  }}
                  title="Click to apply founder hotfix (-8% Tech Debt)"
                  className={`flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg border transition-all truncate ${
                    techDebt > 60
                      ? 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30 hover:bg-[#ff453a]/25'
                      : 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30 hover:bg-[#ff9f0a]/25'
                  }`}
                >
                  <ShieldAlert className="w-3 h-3 shrink-0" />
                  <span>Debt {techDebt.toFixed(0)}% (-{Math.round((1 - Math.max(0.20, 1 - (techDebt / 100) * 0.70)) * 100)}% Spd) [Fix]</span>
                </button>
              )}
            </div>
          </div>
        )}


        {/* 4. Growth Funnel (Era 5+) */}
        {showGrowthCard && (
          <div className="apple-card rounded-2xl p-4 flex flex-col justify-between transition-all group animate-in fade-in duration-300">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-[#bf5af2]" />
                  Growth Funnel
                </span>
                <span className="text-xs font-mono font-medium text-white/80 tabular-nums">{Math.floor(attention)} Att</span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between items-center bg-white/[0.03] px-2.5 py-1.5 rounded-xl border border-white/[0.04]">
                  <span className="text-white/50">Marketing Leads</span>
                  <span className="font-mono font-semibold text-white tabular-nums">{Math.floor(leads)}</span>
                </div>
                <div className="flex justify-between items-center bg-white/[0.03] px-2.5 py-1.5 rounded-xl border border-white/[0.04]">
                  <span className="text-white/50">Paying Customers</span>
                  <span className="font-mono font-semibold text-white tabular-nums">{Math.floor(customers)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => handleTabJump('growth')}
                className="flex items-center justify-between w-full text-xs text-white/70 hover:text-white font-medium transition-colors"
              >
                <span>Trends &amp; Campaigns</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Founder Tactical Actions Deck */}
      <FounderActions />

      {/* Live Mission Control Terminal Log Stream (Docked in Era 4+) */}
      {showTerminalFeed && <LiveActivityFeed />}

      {/* Hire Agent Modal */}
      <HireAgentModal
        isOpen={isHireModalOpen}
        onClose={() => setIsHireModalOpen(false)}
        defaultRole={hireRole}
      />

      {/* Executive Incident Review & Resolution Modal */}
      <ExecutiveIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
      />
    </div>
  );
};


