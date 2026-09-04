import { useGameStore, calcBuildTarget, calcAutonomyInfo } from './gameStore';
import { getRandomEvent, getTemplateKey } from '../data/eventsPool';
import { MILESTONES } from '../data/milestones';
import { soundEngine } from '../audio/soundEffects';
import { COMPUTE_TIERS, INITIAL_VC_OFFERS } from '../data/vcOffers';
import { calcCurrentEra, getEraConfig } from '../data/eras';
import type { CompanyState } from '../types/game';
import type { AgentInstance, AgentExecutionTrace } from '../types/agents';
import { AI_MODELS } from '../types/agents';
import { AGENT_ROLES } from '../data/agentRoles';


let lastEventCheckTime = Date.now();
let eventIntervalSeconds = 90;
let lastTraceTime = Date.now();

function generateTraceForAgent(agent: AgentInstance, techDebt: number): AgentExecutionTrace {
  const isHallucinating = techDebt > 25 && Math.random() < (techDebt / 180);
  const now = Date.now();
  const modelDef = AI_MODELS[agent.model] || AI_MODELS.CLAUDE_3_7_SONNET;

  if (agent.role === 'ENGINEERING') {
    if (isHallucinating) {
      return {
        id: `tr_${now}_${Math.random().toString(36).substring(2, 6)}`,
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        model: agent.model,
        thought: 'Refactoring production database schema live on main without migration rollback scripts...',
        toolCall: { tool: 'github', args: 'git push origin main --force', result: 'Regression alert: API endpoint 500 error.' },
        tokensUsed: Math.round(1800 * (1 + agent.level * 0.2)),
        durationMs: 410,
        timestamp: now,
        status: 'hallucinating'
      };
    }
    return {
      id: `tr_${now}_${Math.random().toString(36).substring(2, 6)}`,
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      model: agent.model,
      thought: `Analyzing TypeScript AST on ${modelDef.name}. Generating automated feature sprint modules...`,
      toolCall: { tool: 'github', args: `gh pr merge #feat-${Math.floor(Math.random() * 80 + 10)} --auto --squash`, result: 'CI passed. Build Points incremented.' },
      tokensUsed: Math.round(2400 * (1 + agent.level * 0.2)),
      durationMs: Math.round(350 / (modelDef.speedRating / 80)),
      timestamp: now,
      status: 'success'
    };
  }

  if (agent.role === 'SALES') {
    return {
      id: `tr_${now}_${Math.random().toString(36).substring(2, 6)}`,
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      model: agent.model,
      thought: `Parsing inbound enterprise requirements with ${modelDef.name}. Formulating ROI model...`,
      toolCall: { tool: 'email', args: 'sendProposal(to: "procurement@enterprise-whale.com", plan: "Enterprise Annual")', result: 'Invoice generated on Stripe API.' },
      tokensUsed: Math.round(1950 * (1 + agent.level * 0.15)),
      durationMs: Math.round(480 / (modelDef.speedRating / 80)),
      timestamp: now,
      status: 'success'
    };
  }

  if (agent.role === 'GROWTH') {
    return {
      id: `tr_${now}_${Math.random().toString(36).substring(2, 6)}`,
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      model: agent.model,
      thought: `Scraping algorithmic trending tags on X & LinkedIn. Highlighting 1-person company benchmarks...`,
      toolCall: { tool: 'postiz', args: 'publishViralThread(topic: "How 1 Founder Scaled to 10M ARR With AI Swarms")', result: 'Thread live. Gained +140 attention units.' },
      tokensUsed: Math.round(1200 * (1 + agent.level * 0.1)),
      durationMs: Math.round(220 / (modelDef.speedRating / 80)),
      timestamp: now,
      status: 'success'
    };
  }

  if (agent.role === 'SUPPORT') {
    return {
      id: `tr_${now}_${Math.random().toString(36).substring(2, 6)}`,
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      model: agent.model,
      thought: `Ingesting support ticket queue. Performing RAG embedding search on Postgres/Supabase docs...`,
      toolCall: { tool: 'supabase', args: 'vectorSearch(table: "kb_articles", query: "API webhook idempotency")', result: 'Delivered tailored fix. Ticket closed.' },
      tokensUsed: Math.round(1100 * (1 + agent.level * 0.1)),
      durationMs: Math.round(290 / (modelDef.speedRating / 80)),
      timestamp: now,
      status: 'success'
    };
  }

  if (agent.role === 'QA') {
    return {
      id: `tr_${now}_${Math.random().toString(36).substring(2, 6)}`,
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      model: agent.model,
      thought: `Running regression test suite and static analysis over codebase...`,
      toolCall: { tool: 'github', args: 'pytest -v --cov=services/ tests/', result: '99.4% coverage. Technical debt reduced.' },
      tokensUsed: Math.round(1500 * (1 + agent.level * 0.15)),
      durationMs: Math.round(380 / (modelDef.speedRating / 80)),
      timestamp: now,
      status: 'success'
    };
  }

  return {
    id: `tr_${now}_${Math.random().toString(36).substring(2, 6)}`,
    agentId: agent.id,
    agentName: agent.name,
    role: agent.role,
    model: agent.model,
    thought: `Orchestrating cross-swarm synchronization and token context optimization...`,
    toolCall: { tool: 'browser', args: 'clusterHealth.verifySync()', result: 'Autonomous pipeline operating at 100% throughput.' },
    tokensUsed: Math.round(3000 * (1 + agent.level * 0.2)),
    durationMs: 310,
    timestamp: now,
    status: 'success'
  };
}

export const SECONDS_PER_GAME_MONTH = 12; // 12 real seconds = 1 monthly billing cycle in game time

function simulateInactiveCompany(company: CompanyState, dt: number, treasuryYield: { dividend: number }): CompanyState {
  const agentCount = company.agents.length;
  if (agentCount === 0) {
    // L1: Passive founder garage state
    return {
      ...company,
      focus: Math.min(company.maxFocus, company.focus + 0.5 * dt)
    };
  }

  // 1. Multipliers
  let prodDeptMult = 1.0;
  let growthDeptMult = 1.0;
  let opsDeptMult = 1.0;
  let companyCeoMult = 1.0;

  company.agents.forEach(a => {
    if (a.role === 'MANAGER') {
      prodDeptMult += 0.25 * a.level;
      growthDeptMult += 0.25 * a.level;
      opsDeptMult += 0.25 * a.level;
    } else if (a.role === 'EXECUTIVE') {
      prodDeptMult += 0.50 * a.level;
      growthDeptMult += 0.50 * a.level;
      opsDeptMult += 0.50 * a.level;
    } else if (a.role === 'CEO') {
      companyCeoMult += 1.0 * a.level;
    }
  });

  const totalProdMult = prodDeptMult * companyCeoMult;
  const totalGrowthMult = growthDeptMult * companyCeoMult;
  const totalOpsMult = opsDeptMult * companyCeoMult;

  // 2. Engineering & Roadmap (with tech debt velocity drag)
  let bpProduced = 0;
  const engAgents = company.agents.filter(a => a.role === 'ENGINEERING');
  engAgents.forEach(a => {
    bpProduced += a.outputPerSec * totalProdMult * dt;
  });
  const debtVelocityMultiplier = Math.max(0.20, 1 - (company.techDebt / 100) * 0.70);
  bpProduced *= debtVelocityMultiplier;

  const qaAgents = company.agents.filter(a => a.role === 'QA');
  let debtReduced = 0;
  qaAgents.forEach(a => {
    debtReduced += a.outputPerSec * totalProdMult * dt;
  });

  const newTechDebt = Math.max(0, Math.min(100, company.techDebt + (0.05 * engAgents.length * dt) - debtReduced));

  let newBP = company.buildPoints + bpProduced;
  let newLevel = company.productLevel;
  let newTarget = company.buildPointsTarget;

  while (newBP >= newTarget) {
    newBP -= newTarget;
    newLevel += 1;
    newTarget = calcBuildTarget(newLevel);
  }

  let updatedRoadmap = [...company.roadmapFeatures];
  if (company.activeRoadmapId && bpProduced > 0) {
    updatedRoadmap = updatedRoadmap.map(feat => {
      if (feat.id === company.activeRoadmapId && !feat.isCompleted) {
        const nextDone = feat.buildPointsCompleted + bpProduced;
        if (nextDone >= feat.buildPointsRequired) {
          return { ...feat, buildPointsCompleted: feat.buildPointsRequired, isCompleted: true };
        }
        return { ...feat, buildPointsCompleted: nextDone };
      }
      return feat;
    });
  }

  const completedFeaturesArpuBoost = updatedRoadmap
    .filter(f => f.isCompleted)
    .reduce((acc, f) => acc + (f.effects.arpuBoost || 0), 0);
  const currentArpu = (company.baseArpu || 25) + completedFeaturesArpuBoost;

  // 3. Growth & Leads
  let attentionProduced = 0;
  const growthAgents = company.agents.filter(a => a.role === 'GROWTH');
  growthAgents.forEach(a => {
    attentionProduced += a.outputPerSec * totalGrowthMult * dt;
  });
  const newAttention = Math.max(0, (company.attention + attentionProduced) * (1 - 0.02 * dt));
  let newLeads = Math.max(0, company.leads + (newAttention / 250) * dt);


  // 4. Sales & Customers
  let leadsProcessed = 0;
  const salesAgents = company.agents.filter(a => a.role === 'SALES');
  salesAgents.forEach(a => {
    leadsProcessed += a.outputPerSec * totalGrowthMult * dt;
  });

  const actualLeadsProcessed = Math.min(newLeads, leadsProcessed);
  newLeads = Math.max(0, newLeads - actualLeadsProcessed);


  const baseConversion = 0.08 * (1 + (newLevel - 1) * 0.05) * (company.trust / 50);
  const conversionRate = Math.min(0.85, Math.max(0.01, baseConversion));
  const expectedNewCustomers = actualLeadsProcessed * conversionRate;
  let newCustomers = company.customers + expectedNewCustomers;

  // Churn
  const churnPerSec = 0.04 / SECONDS_PER_GAME_MONTH;
  newCustomers = Math.max(0, newCustomers - newCustomers * churnPerSec * dt);

  // 5. Support Tickets
  let ticketsResolved = 0;
  const supportAgents = company.agents.filter(a => a.role === 'SUPPORT');
  supportAgents.forEach(a => {
    ticketsResolved += a.outputPerSec * totalOpsMult * dt;
  });
  const ticketsGenerated = newCustomers * (1 / (125 * 60)) * dt;
  const newTickets = Math.max(0, company.tickets + ticketsGenerated - ticketsResolved);

  // 6. Financials & Autonomy
  const newMrr = Math.round(newCustomers * currentArpu);
  const newArr = newMrr * 12;
  const revenuePerSec = newMrr / SECONDS_PER_GAME_MONTH;

  // Multiple
  let workforceMultipleBoost = agentCount < 5 ? 0.5 : (agentCount < 15 ? 2.0 : (agentCount < 30 ? 4.5 : 7.5));
  let leadershipBoost = 0;
  company.agents.forEach(a => {
    if (a.role === 'MANAGER') leadershipBoost += 2.0 * a.level;
    else if (a.role === 'EXECUTIVE') leadershipBoost += 4.0 * a.level;
    else if (a.role === 'CEO') leadershipBoost += 8.0 * a.level;
  });
  const multiple = Math.max(1.5, Math.min(35.0, 4.0 + workforceMultipleBoost + leadershipBoost + (company.hype / 100) * 10 - (newTechDebt / 100) * 10));
  const organicValuation = Math.round(newArr * multiple);
  const newValuation = Math.max(company.lastValuation || 0, organicValuation);

  // Check L5 Conglomerate Dividend
  const autonomy = calcAutonomyInfo({ agents: company.agents, valuation: newValuation });
  if (autonomy.level === 5) {
    // 5% of L5 Unicorn revenue flows to conglomerate dividend
    treasuryYield.dividend += revenuePerSec * 0.05 * dt;
  }

  const newCash = company.cash + revenuePerSec * dt;

  // Stage determination
  let newStage = company.stage;
  if (newValuation >= 1000000000 && company.agents.some(a => a.role === 'CEO')) {
    newStage = 'ONE_PERSON_UNICORN';
  } else if (agentCount >= 30 && company.agents.some(a => a.role === 'EXECUTIVE')) {
    newStage = 'AUTONOMOUS_STARTUP';
  } else if (agentCount >= 8 && company.agents.some(a => a.role === 'MANAGER')) {
    newStage = 'AGENT_MANAGER';
  } else if (agentCount >= 1) {
    newStage = 'VIBE_CODER';
  } else {
    newStage = 'MANUAL_FOUNDER';
  }

  return {
    ...company,
    stage: newStage,
    autonomyLevel: autonomy.level,
    cash: Number(newCash.toFixed(2)),
    customers: Number(newCustomers.toFixed(2)),
    arpu: currentArpu,
    mrr: newMrr,
    arr: newArr,
    valuation: newValuation,
    lastValuation: company.lastValuation || 0,
    valuationMultiple: Number(multiple.toFixed(2)),
    buildPoints: newBP,
    productLevel: newLevel,
    buildPointsTarget: newTarget,
    techDebt: Number(newTechDebt.toFixed(2)),
    attention: Number(newAttention.toFixed(1)),
    leads: Number(newLeads.toFixed(1)),

    tickets: Number(newTickets.toFixed(2)),
    roadmapFeatures: updatedRoadmap
  };
}

export function runSimulationTick(deltaSeconds: number) {
  const store = useGameStore.getState();
  if (!store.company) return;

  const speed = store.gameSpeed || 1;
  const dt = deltaSeconds * speed;
  const now = Date.now();

  // 0. Active Unattended Inbox Alert Penalties
  let unattendedTrustDrainPerSec = 0;
  let unattendedChurnMultiplier = 1.0;
  let unattendedCashDrainPerSec = 0;
  let unattendedCancellationsPerSec = 0;
  let unattendedPenaltiesActive = false;

  (store.activeEvents || []).forEach(evt => {
    const ageSec = (now - evt.timestamp) / 1000;
    const gracePeriod = evt.gracePeriodSeconds || 15;
    if (ageSec > gracePeriod) {
      unattendedPenaltiesActive = true;
      const overdueSec = ageSec - gracePeriod;
      // Escalation multiplier: starts at 1.0x, ramps up to 2.5x if ignored for 60+ seconds
      const escalationMult = Math.min(2.5, 1 + (overdueSec / 45));

      const severity = evt.severity || 1;
      if (severity === 1) {
        unattendedTrustDrainPerSec += 0.20 * escalationMult;
        unattendedChurnMultiplier *= (1 + 0.20 * escalationMult);
      } else if (severity === 2) {
        unattendedTrustDrainPerSec += 0.50 * escalationMult;
        unattendedChurnMultiplier *= (1 + 0.50 * escalationMult);
        unattendedCashDrainPerSec += Math.max(35, (store.cash || 0) * 0.00012) * escalationMult;
      } else if (severity === 3) {
        unattendedTrustDrainPerSec += 1.25 * escalationMult;
        unattendedChurnMultiplier *= (1 + 1.25 * escalationMult);
        unattendedCashDrainPerSec += Math.max(150, (store.cash || 0) * 0.00035) * escalationMult;
        unattendedCancellationsPerSec += 0.8 * escalationMult;
      }
    }
  });

  // 1. Focus Regeneration (+0.5 focus / sec, 2x if espresso upgrade owned)
  const focusMultiplier = store.earlyUpgrades?.includes('upg_espresso') ? 2.0 : 1.0;
  const newFocus = Math.min(store.maxFocus, store.focus + 0.5 * focusMultiplier * dt);

  // 2. Compute Calculations & Architecture Modifiers
  let rawComputeUsed = 0;
  store.agents.forEach(a => {
    rawComputeUsed += a.computeCost;
  });

  // Ops Agents reduce compute usage
  const opsAgents = store.agents.filter(a => a.role === 'OPERATIONS');
  let opsEfficiency = 1.0;
  opsAgents.forEach(a => {
    opsEfficiency *= (1 - 0.15 * Math.pow(1.1, a.level - 1));
  });

  // Redis Caching Architecture Upgrade reduces compute usage
  const cachingArch = store.architectureUpgrades.find(u => u.id === 'arch_caching' || u.id === 'arch_caching_layer');
  const cachingEfficiency = cachingArch ? (1 - 0.10 * cachingArch.level) : 1.0;

  const computeUsed = Number((rawComputeUsed * Math.max(0.15, opsEfficiency * cachingEfficiency)).toFixed(1));

  // Compute Overload & Hallucination Metrics
  const overloadRatio = (store.computeCapacity > 0 && computeUsed > store.computeCapacity)
    ? Number((computeUsed / store.computeCapacity).toFixed(2))
    : 1.0;
  const isComputeOverloaded = overloadRatio > 1.0;
  const computeExcess = isComputeOverloaded ? overloadRatio - 1.0 : 0;

  // Throttling: Throttled by compute overload
  let computeThrottle = 1.0;
  if (isComputeOverloaded) {
    computeThrottle = Math.max(0.1, 1 / overloadRatio);
  }

  // Monthly compute cost burn (converted to per second using game month)
  const currentTier = COMPUTE_TIERS.find(t => t.id === store.currentComputeTierId);
  const monthlyComputeCost = currentTier ? currentTier.monthlyCost : 0;
  const computeCostPerSec = monthlyComputeCost / SECONDS_PER_GAME_MONTH;

  // Real Agent OPEX & Token Burn per month
  let totalAgentOpexMonthly = 0;
  store.agents.forEach(a => {
    const roleDef = AGENT_ROLES[a.role];
    const baseOpex = roleDef ? roleDef.monthlyOpex : 300;
    const modelDef = AI_MODELS[a.model] || AI_MODELS.CLAUDE_3_7_SONNET;
    const tokenMult = Math.max(0.5, (modelDef.costPerMillionTokens || 1.0) / 1.0);
    const levelMult = Math.pow(1.2, a.level - 1);
    totalAgentOpexMonthly += baseOpex * tokenMult * levelMult;
  });
  const agentOpexPerSec = totalAgentOpexMonthly / SECONDS_PER_GAME_MONTH;

  // Insolvency Check: When cash runs dry and expenses exceed revenue!
  const isInsolvent = store.cash <= 0;
  const insolvencyThrottle = isInsolvent ? 0.05 : 1.0;

  // 3. Agent Department Multipliers (Managers, Executives, CEO)
  let prodDeptMult = 1.0;
  let growthDeptMult = 1.0;
  let opsDeptMult = 1.0;
  let companyCeoMult = 1.0;

  store.agents.forEach(a => {
    if (a.role === 'MANAGER') {
      prodDeptMult += 0.25 * a.level;
      growthDeptMult += 0.25 * a.level;
      opsDeptMult += 0.25 * a.level;
    } else if (a.role === 'EXECUTIVE') {
      prodDeptMult += 0.50 * a.level;
      growthDeptMult += 0.50 * a.level;
      opsDeptMult += 0.50 * a.level;
    } else if (a.role === 'CEO') {
      companyCeoMult += 1.0 * a.level;
    }
  });

  const totalProdMult = prodDeptMult * companyCeoMult * computeThrottle * insolvencyThrottle;
  const totalGrowthMult = growthDeptMult * companyCeoMult * computeThrottle * insolvencyThrottle;
  const totalOpsMult = opsDeptMult * companyCeoMult * computeThrottle * insolvencyThrottle;

  // 4. Engineering Output, Build Points & Roadmap
  let bpProduced = 0;
  let rawDebtGenerated = 0;
  const allRoadmapComplete = (store.roadmapFeatures || []).length > 0 && store.roadmapFeatures.every(f => f.isCompleted);
  const engAgents = store.agents.filter(a => a.role === 'ENGINEERING');

  engAgents.forEach(a => {
    bpProduced += a.outputPerSec * totalProdMult * dt;
    // When all features are shipped, engineers don't generate dirty new code; they maintain & refactor
    if (!allRoadmapComplete) {
      // Overloaded compute causes hallucinated code commits (+tech debt)!
      rawDebtGenerated += (0.08 * a.level + 0.35 * computeExcess) * dt;
    }
  });


  // Tech Debt Drag: High debt significantly slows engineering velocity!
  // At 0% debt = 100% velocity. At 70% debt = 51% velocity. At 95% debt = 33% velocity.
  const debtVelocityMultiplier = Math.max(0.20, 1 - (store.techDebt / 100) * 0.70);
  bpProduced *= debtVelocityMultiplier;

  // CI/CD Architecture Upgrade reduces tech debt accumulation
  const cicdArch = store.architectureUpgrades.find(u => u.id === 'arch_cicd' || u.id === 'arch_ci_cd');
  const cicdDebtDiscount = cicdArch ? (1 - 0.15 * cicdArch.level) : 1.0;

  const debtGenerated = rawDebtGenerated * Math.max(0.2, cicdDebtDiscount);

  // QA Agents reducing debt
  let debtReduced = 0;
  const qaAgents = store.agents.filter(a => a.role === 'QA');
  qaAgents.forEach(a => {
    debtReduced += a.outputPerSec * totalProdMult * dt;
  });

  // If Tech Debt is high (>50%), engineering swarm automatically allocates cycles to refactor & stabilize
  if (store.techDebt > 50 && engAgents.length > 0) {
    debtReduced += engAgents.length * 0.35 * dt;
  }

  // When all roadmap features are complete, engineers actively crush tech debt to 0!
  if (allRoadmapComplete && engAgents.length > 0) {
    debtReduced += engAgents.length * 1.5 * dt;
  }

  const newTechDebt = Math.max(0, Math.min(100, store.techDebt + debtGenerated - debtReduced));


  let newBP = store.buildPoints + bpProduced;
  let newLevel = store.productLevel;
  let newTarget = store.buildPointsTarget;

  while (newBP >= newTarget) {
    newBP -= newTarget;
    newLevel += 1;
    newTarget = calcBuildTarget(newLevel);
  }

  // Active Roadmap Feature progress & Autonomous Sprint Dispatch
  let updatedRoadmap = [...store.roadmapFeatures];
  let dynamicArpuBoost = 0;
  let dynamicTrustBoost = 0;
  let dynamicHypeBoost = 0;

  // Auto-Roadmap Dispatch: If no active feature, or current active is completed,
  // automatically dispatch engineering swarm to the next incomplete feature!
  let nextActiveRoadmapId = store.activeRoadmapId;
  const currentActive = updatedRoadmap.find(f => f.id === nextActiveRoadmapId);
  if (!nextActiveRoadmapId || (currentActive && currentActive.isCompleted)) {
    const nextPending = updatedRoadmap.find(f => !f.isCompleted);
    if (nextPending) {
      nextActiveRoadmapId = nextPending.id;
    }
  }

  if (nextActiveRoadmapId && bpProduced > 0) {
    updatedRoadmap = updatedRoadmap.map(feat => {
      if (feat.id === nextActiveRoadmapId && !feat.isCompleted) {
        const nextDone = feat.buildPointsCompleted + bpProduced;
        if (nextDone >= feat.buildPointsRequired) {
          // Feature Complete!
          soundEngine.playDeploy();
          useGameStore.getState().addLog(`🚀 Shipped Feature: "${feat.name}"! ${feat.description}`, 'product', 'success');
          dynamicArpuBoost += (feat.effects.arpuBoost || 0);
          dynamicTrustBoost += (feat.effects.trustBoost || 0);
          dynamicHypeBoost += (feat.effects.hypeBoost || 0);
          return { ...feat, buildPointsCompleted: feat.buildPointsRequired, isCompleted: true };
        }
        return { ...feat, buildPointsCompleted: nextDone };
      }
      return feat;
    });

    // Auto advance to next feature upon completion
    const justCompleted = updatedRoadmap.find(f => f.id === nextActiveRoadmapId && f.isCompleted);
    if (justCompleted) {
      const nextPending = updatedRoadmap.find(f => !f.isCompleted);
      nextActiveRoadmapId = nextPending ? nextPending.id : null;
      if (nextPending) {
        useGameStore.getState().addLog(`📋 Engineering swarm auto-dispatched to next sprint: "${nextPending.name}"`, 'product', 'info');
      }
    }
  }


  // Recalculate dynamic ARPU from baseArpu + all completed features
  const completedFeaturesArpuBoost = updatedRoadmap
    .filter(f => f.isCompleted)
    .reduce((acc, f) => acc + (f.effects.arpuBoost || 0), 0);

  // 5. Growth Output & Attention Decay
  const activeTrend = store.trends.find(t => t.id === store.activeTrendId);
  const trendMultiplier = activeTrend ? activeTrend.viralMultiplier * (1 + activeTrend.strength / 200) : 1.0;

  let attentionProduced = 0;
  const growthAgents = store.agents.filter(a => a.role === 'GROWTH');
  growthAgents.forEach(a => {
    attentionProduced += a.outputPerSec * totalGrowthMult * trendMultiplier * dt;
  });

  // Active Growth Campaigns
  let campaignCostPerSec = 0;
  const updatedCampaigns = (store.growthCampaigns || []).map(c => {
    const isUnlocked = c.isUnlocked || (store.mrr >= c.requiredMrr);
    if (c.isActive) {
      attentionProduced += c.attentionPerSecond * trendMultiplier * dt;
      campaignCostPerSec += c.monthlyCost / SECONDS_PER_GAME_MONTH;
    }
    return { ...c, isUnlocked };
  });

  // Feature virality boosts
  let viralityBonus = 1.0;
  updatedRoadmap.filter(f => f.isCompleted).forEach(f => {
    if (f.effects.viralityBoost) viralityBonus += f.effects.viralityBoost;
  });

  // Attention decay formula
  const decayFraction = (0.05 + 0.005 * (store.attention / 1000)) * dt;
  const decayedAttention = Math.max(0, store.attention * (1 - decayFraction) + (attentionProduced * viralityBonus));

  // Leads
  const leadsGenerated = (attentionProduced / 100) * 3;
  let newLeads = store.leads + leadsGenerated;

  // 6. Sales Processing & Customer Conversions
  let leadsProcessed = 0;
  const salesAgents = store.agents.filter(a => a.role === 'SALES');
  salesAgents.forEach(a => {
    leadsProcessed += a.outputPerSec * totalGrowthMult * dt;
  });

  const actualLeadsProcessed = Math.min(newLeads, leadsProcessed);
  newLeads = Math.max(0, newLeads - actualLeadsProcessed);

  // Conversion rate formula
  let baseConversion = 0.08 * (1 + (newLevel - 1) * 0.05) * (store.trust / 50);
  updatedRoadmap.filter(f => f.isCompleted).forEach(f => {
    if (f.effects.conversionBoost) baseConversion *= (1 + f.effects.conversionBoost);
  });
  const conversionRate = Math.min(0.85, Math.max(0.01, baseConversion));

  const expectedNewCustomers = actualLeadsProcessed * conversionRate;
  let newCustomers = store.customers + expectedNewCustomers;

  // Churn Calculation: Tech Debt, Trust penalty, and Unattended Alert Drag!
  // At 20% debt = 1.2x. At 50% debt = 2.2x. At 75% debt = 3.8x. At 90% debt = 5.0x churn!
  let baseMonthlyChurn = 0.05;
  updatedRoadmap.filter(f => f.isCompleted).forEach(f => {
    if (f.effects.retentionBoost) baseMonthlyChurn = Math.max(0.01, baseMonthlyChurn * (1 - f.effects.retentionBoost));
  });

  const trustPenalty = store.trust < 30 ? 3.5 : (store.trust < 50 ? 2.0 : (store.trust > 80 ? 0.6 : 1.0));
  const debtChurnMultiplier = 1 + Math.pow(newTechDebt / 40, 2);
  const churnPerSec = (baseMonthlyChurn * trustPenalty * debtChurnMultiplier * unattendedChurnMultiplier) / SECONDS_PER_GAME_MONTH;
  const churnedCustomers = newCustomers * churnPerSec * dt;
  const directCancellations = unattendedCancellationsPerSec * dt;
  newCustomers = Math.max(0, newCustomers - churnedCustomers - directCancellations);

  const integerCustomers = Math.floor(newCustomers);

  // Update Customer Segments & Dynamic Blended ARPU
  const hasEnterpriseFeature = updatedRoadmap.some(f => f.id === 'feat_sso_saml' && f.isCompleted);
  const isProUnlocked = integerCustomers >= 20;
  const isEntUnlocked = integerCustomers >= 100 || hasEnterpriseFeature;

  let entCount = 0;
  let proCount = 0;
  let smbCount = integerCustomers;

  if (isEntUnlocked) {
    entCount = Math.floor(integerCustomers * 0.10);
    proCount = Math.floor(integerCustomers * 0.30);
    smbCount = Math.max(0, integerCustomers - proCount - entCount);
  } else if (isProUnlocked) {
    proCount = Math.floor(integerCustomers * 0.30);
    smbCount = Math.max(0, integerCustomers - proCount);
  }

  const baseArpu = store.baseArpu || 25;
  const smbArpu = baseArpu;
  const proArpu = Math.round(baseArpu * 3);
  const entArpu = Math.round(baseArpu * 15);

  const updatedSegments = (store.customerSegments || []).map(seg => {
    if (seg.id === 'smb') return { ...seg, count: smbCount, arpu: smbArpu, unlocked: true };
    if (seg.id === 'pro') return { ...seg, count: proCount, arpu: proArpu, unlocked: isProUnlocked };
    if (seg.id === 'enterprise') return { ...seg, count: entCount, arpu: entArpu, unlocked: isEntUnlocked };
    return seg;
  });

  const totalCust = Math.max(1, integerCustomers);
  const weightedArpu = integerCustomers > 0 
    ? Math.round((smbCount * smbArpu + proCount * proArpu + entCount * entArpu) / totalCust)
    : baseArpu;
  const currentArpu = weightedArpu + completedFeaturesArpuBoost + dynamicArpuBoost;

  // 7. Support Ticket Generation & Resolution
  const lowDebtRate = 1 / (125 * 60);
  const highDebtRate = 1 / (25 * 60);
  const ticketRatePerCustSec = lowDebtRate + (newTechDebt / 100) * (highDebtRate - lowDebtRate);

  const chaosArch = store.architectureUpgrades.find(u => u.id === 'arch_chaos' || u.id === 'arch_chaos_engineering');
  const chaosDiscount = chaosArch ? (1 - 0.15 * chaosArch.level) : 1.0;

  // Overloaded compute causes hallucinated answers & customer complaints (+tickets)!
  const overloadTicketRate = computeExcess * 0.003;
  const ticketsGenerated = newCustomers * (ticketRatePerCustSec + overloadTicketRate) * Math.max(0.2, chaosDiscount) * dt;

  let ticketsResolved = 0;
  const supportAgents = store.agents.filter(a => a.role === 'SUPPORT');
  supportAgents.forEach(a => {
    ticketsResolved += a.outputPerSec * totalOpsMult * dt;
  });

  const newTickets = Math.max(0, store.tickets + ticketsGenerated - ticketsResolved);
  const totalTicketsResolved = store.totalTicketsResolved + ticketsResolved;

  // Trust decay / recovery
  let trustDelta = 0;
  if (newTickets > 5) {
    trustDelta -= 0.10 * (newTickets / (newCustomers + 10)) * dt;
  } else if (newTickets === 0 && store.customers > 0) {
    trustDelta += 0.02 * dt;
  }
  // Penalties from unattended inbox alerts and compute overload!
  trustDelta -= (unattendedTrustDrainPerSec + (0.12 * computeExcess)) * dt;

  const newTrust = Math.max(0, Math.min(100, store.trust + trustDelta + dynamicTrustBoost));
  const newHype = Math.max(0, Math.min(100, store.hype + dynamicHypeBoost));

  // 8. Financials (Cash, MRR, ARR, Valuation)
  const newMrr = Math.round(newCustomers * currentArpu);
  const newArr = newMrr * 12;

  // Game Month: Real cash deposited every second based on MRR
  const revenuePerSec = newMrr / SECONDS_PER_GAME_MONTH;
  const totalExpensesPerSec = computeCostPerSec + campaignCostPerSec + agentOpexPerSec + unattendedCashDrainPerSec;
  const netCashFlowPerSec = revenuePerSec - totalExpensesPerSec;
  const netCashChange = netCashFlowPerSec * dt;
  const newCash = Math.max(0, store.cash + netCashChange);

  // Net ARR Delta per second (can be negative if churn > sales!)
  const netCustomerDeltaPerSec = (expectedNewCustomers - churnedCustomers - directCancellations) / (dt || 1);
  const netArrDeltaPerSec = Math.round(netCustomerDeltaPerSec * currentArpu * 12);



  // Valuation Multiple Formula
  let workforceMultipleBoost = 0;
  const agentCount = store.agents.length;
  if (agentCount === 0) {
    workforceMultipleBoost = -2.5;
  } else if (agentCount < 5) {
    workforceMultipleBoost = 0.5;
  } else if (agentCount < 15) {
    workforceMultipleBoost = 2.0;
  } else if (agentCount < 30) {
    workforceMultipleBoost = 4.5;
  } else {
    workforceMultipleBoost = 7.5;
  }

  let leadershipBoost = 0;
  store.agents.forEach(a => {
    if (a.role === 'MANAGER') leadershipBoost += 2.0 * a.level;
    else if (a.role === 'EXECUTIVE') leadershipBoost += 4.0 * a.level;
    else if (a.role === 'CEO') leadershipBoost += 8.0 * a.level;
  });

  const hypeBonus = (newHype / 100) * 10;
  const trustBonus = ((newTrust - 50) / 50) * 4;
  const debtPenalty = (newTechDebt / 100) * 10;
  const growthBonus = store.customers > 10 ? Math.min(6, (expectedNewCustomers / (store.customers + 1)) * 400) : 0;
  
  const rawMultiple = 4.0 + workforceMultipleBoost + leadershipBoost + hypeBonus + trustBonus + growthBonus - debtPenalty;
  const multiple = Math.max(1.5, Math.min(35.0, rawMultiple));
  const organicValuation = Math.round(newArr * multiple);
  const newValuation = Math.max(store.lastValuation || 0, organicValuation);

  // Update VC offers availability
  const hasManager = store.agents.some(a => a.role === 'MANAGER');
  const hasExec = store.agents.some(a => a.role === 'EXECUTIVE');
  const hasCEO = store.agents.some(a => a.role === 'CEO');
  const currentComputeTierId = store.currentComputeTierId;

  const rawOffers = (store.vcOffers && store.vcOffers.length >= INITIAL_VC_OFFERS.length)
    ? store.vcOffers
    : INITIAL_VC_OFFERS.map(def => {
        const existing = store.vcOffers?.find(o => o.id === def.id);
        return existing ? { ...def, ...existing, maxArr: def.maxArr } : def;
      });

  const updatedVcOffers = rawOffers.map(offer => {
    const def = INITIAL_VC_OFFERS.find(o => o.id === offer.id);
    const maxArr = offer.maxArr || def?.maxArr;

    if (offer.isAccepted) return { ...offer, maxArr };

    // Check if company has outgrown this round!
    const isOutgrown = maxArr ? newArr > maxArr : false;
    if (isOutgrown) {
      return {
        ...offer,
        maxArr,
        isAvailable: false,
        isExpired: true
      };
    }

    const meetsMrr = newMrr >= offer.requiredMrr;
    const meetsTrust = newTrust >= offer.requiredTrust;
    const meetsAgents = !offer.requiredAgents || store.agents.length >= offer.requiredAgents;
    const meetsProduct = !offer.requiredProductLevel || newLevel >= offer.requiredProductLevel;
    const meetsManager = !offer.requiresManager || hasManager;
    const meetsExec = !offer.requiresExecutive || hasExec;
    const meetsCEO = !offer.requiresCEO || hasCEO;

    let meetsCompute = true;
    if (offer.requiredComputeTierId) {
      const reqIdx = COMPUTE_TIERS.findIndex(t => t.id === offer.requiredComputeTierId);
      const currIdx = COMPUTE_TIERS.findIndex(t => t.id === currentComputeTierId);
      meetsCompute = currIdx >= reqIdx;
    }

    return {
      ...offer,
      isExpired: false,
      isAvailable: meetsMrr && meetsTrust && meetsAgents && meetsProduct && meetsManager && meetsExec && meetsCEO && meetsCompute
    };
  });

  // 9. Milestone Check
  let nextMilestoneCelebration = store.activeMilestoneCelebration;
  const currentUnlocked = new Set(store.unlockedMilestones);

  MILESTONES.forEach(ms => {
    if (!currentUnlocked.has(ms.id)) {
      const isSatisfied = ms.check({
        customers: integerCustomers,
        mrr: newMrr,
        agents: store.agents,
        productLevel: newLevel,
        valuation: newValuation
      });
      if (isSatisfied) {
        currentUnlocked.add(ms.id);

        // Suppress intrusive modal pop-up if the company has already far outgrown this milestone!
        const isOutgrownMilestone = 
          (ms.id === 'ms_mrr_100' && newArr > 20000) ||
          (ms.id === 'ms_mrr_1k' && newArr > 200000) ||
          (ms.id === 'ms_mrr_10k' && newArr > 2000000) ||
          (ms.id === 'ms_first_coworker' && newArr > 500000);

        if (!isOutgrownMilestone) {
          nextMilestoneCelebration = ms;
          soundEngine.playMilestone();
        }
        useGameStore.getState().addLog(`🏆 MILESTONE UNLOCKED: ${ms.bannerTitle}! ${ms.rewardFlavor}`, 'system', 'milestone');
      }
    }
  });


  // Check $1B ARR Victory Condition & Stage Updates
  let isUnicorn = store.isUnicornModalOpen;
  let currentStage = store.stage;

  if (newArr >= 1000000000) {
    if (!store.hasSeenUnicorn) {
      isUnicorn = true;
      soundEngine.playUnicornVictory();
    }
    if (currentStage !== 'HOLDING_COMPANY') {
      currentStage = 'ONE_PERSON_UNICORN';
    }
  } else if (currentStage !== 'HOLDING_COMPANY' && currentStage !== 'ONE_PERSON_UNICORN') {
    if (store.agents.length >= 30 && hasExec) {
      currentStage = 'AUTONOMOUS_STARTUP';
    } else if (store.agents.length >= 8 && hasManager) {
      currentStage = 'AGENT_MANAGER';
    } else if (store.agents.length >= 1) {
      currentStage = 'VIBE_CODER';
    } else {
      currentStage = 'MANUAL_FOUNDER';
    }
  }

  // Progressive Eras Update (1 to 10)
  const calculatedEra = calcCurrentEra({
    arr: newArr,
    mvpShipped: store.mvpShipped,
    agentsCount: store.agents.length
  });

  const prevEra = store.currentEra || 1;
  let newCurrentEra = prevEra;
  let newActiveEraUnlock = store.activeEraUnlock;
  let isEraProgressionBlocked = false;
  let eraProgressionBlockReason = '';

  if (calculatedEra > prevEra) {
    // Check if operational crisis blocks progression
    if (unattendedPenaltiesActive) {
      isEraProgressionBlocked = true;
      eraProgressionBlockReason = 'Unattended emergency in Executive Inbox';
    } else if (isInsolvent) {
      isEraProgressionBlocked = true;
      eraProgressionBlockReason = 'Company is insolvent ($0 Cash)';
    } else if (newTrust < 30) {
      isEraProgressionBlocked = true;
      eraProgressionBlockReason = `Trust collapsed (${newTrust.toFixed(0)}% < 30%)`;
    } else if (newTechDebt > 60) {
      isEraProgressionBlocked = true;
      eraProgressionBlockReason = `Critical Tech Debt (${newTechDebt.toFixed(0)}% > 60%)`;
    }

    if (!isEraProgressionBlocked) {
      newCurrentEra = calculatedEra;
      const eraConfig = getEraConfig(calculatedEra);
      newActiveEraUnlock = {
        era: calculatedEra,
        name: eraConfig.name,
        description: eraConfig.description,
        unlockedItem: eraConfig.hint
      };
      soundEngine.playCelebration();
      useGameStore.getState().addLog(`🌟 UNLOCKED ${eraConfig.name.toUpperCase()}! ${eraConfig.description}`, 'system', 'milestone');
    }
  } else {
    newCurrentEra = Math.max(prevEra, calculatedEra);
  }

  // 10. Random Event Trigger Check
  const completedFeatureIds = updatedRoadmap.filter(f => f.isCompleted).map(f => f.id);

  const evalContext = {
    mrr: newMrr,
    arr: newArr,
    cash: newCash,
    customers: integerCustomers,
    techDebt: newTechDebt,
    trust: newTrust,
    hype: newHype,
    computeUsed,
    stage: currentStage,
    agents: store.agents,
    completedFeatures: completedFeatureIds,
    companyName: store.company?.name,
    archetype: store.company?.archetype
  };

  // Only filter out active events if they are vastly outgrown by stage!
  // NEVER filter out active events because MRR/customers dipped during a crisis!
  let activeEvents = store.activeEvents.filter(e => {
    const templateKey = getTemplateKey(e);
    if (templateKey.startsWith('evt_s1_') && (newArr > 250000 || store.agents.length >= 3)) {
      return false;
    }
    if (templateKey.startsWith('evt_s2_') && newArr > 10000000) {
      return false;
    }
    if (templateKey.startsWith('evt_s3_') && newArr > 100000000) {
      return false;
    }
    return true;
  });

  if (now - lastEventCheckTime > eventIntervalSeconds * 1000 && activeEvents.length < 3) {
    lastEventCheckTime = now;
    if (newMrr > 100000) eventIntervalSeconds = 45;
    else if (newMrr > 1000) eventIntervalSeconds = 60;
    else eventIntervalSeconds = 90;

    const seenEventKeys = new Set([
      ...store.eventHistory.map(getTemplateKey),
      ...activeEvents.map(getTemplateKey)
    ]);

    const newEvt = getRandomEvent({
      ...evalContext,
      seenEventIds: seenEventKeys
    });

    if (newEvt) {
      soundEngine.playWarningAlert();
      activeEvents = [newEvt, ...activeEvents];
      useGameStore.getState().addLog(`⚠️ Incident Arrived: "${newEvt.title}" (Check Inbox)`, 'incident', 'warning');
    }
  }

  // 11. Multi-Company Background Simulation & Portfolio Synchronization
  const activeAutonomy = calcAutonomyInfo({ agents: store.agents, valuation: newValuation, stage: currentStage });
  const activeCompanyId = store.activeCompanyId || (store.company ? `comp_${store.company.id}` : 'comp_primary');

  const updatedActiveCompanySnapshot: CompanyState = {
    id: activeCompanyId,
    name: store.company.name,
    idea: store.company,
    foundedAt: store.totalPlayTimeSeconds ? Date.now() - store.totalPlayTimeSeconds * 1000 : Date.now(),
    stage: currentStage,
    autonomyLevel: activeAutonomy.level,
    cash: Number(newCash.toFixed(2)),
    customers: Number(newCustomers.toFixed(2)),
    arpu: currentArpu,
    baseArpu: store.baseArpu,
    mrr: newMrr,
    arr: newArr,
    valuation: newValuation,
    lastValuation: store.lastValuation || 0,
    valuationMultiple: Number(multiple.toFixed(2)),
    founderOwnership: store.founderOwnership,
    totalCapitalRaised: store.totalCapitalRaised,
    employees: 1,
    focus: newFocus,
    maxFocus: store.maxFocus,
    productLevel: newLevel,
    buildPoints: newBP,
    buildPointsTarget: newTarget,
    attention: Number(decayedAttention.toFixed(1)),
    leads: Number(newLeads.toFixed(1)),
    tickets: Number(newTickets.toFixed(2)),
    totalTicketsResolved: Number(totalTicketsResolved.toFixed(1)),
    trust: Number(newTrust.toFixed(2)),
    techDebt: Number(newTechDebt.toFixed(2)),
    hype: Number(newHype.toFixed(2)),
    computeUsed,
    computeCapacity: store.computeCapacity,
    currentComputeTierId: store.currentComputeTierId,

    agentOpexPerSec: Number(agentOpexPerSec.toFixed(2)),
    netArrDeltaPerSec,
    netCashFlowPerSec: Number(netCashFlowPerSec.toFixed(2)),
    isComputeOverloaded,
    computeOverloadRatio: overloadRatio,
    unattendedPenaltiesActive,
    unattendedTrustDrainPerSec: Number(unattendedTrustDrainPerSec.toFixed(2)),
    unattendedChurnMultiplier: Number(unattendedChurnMultiplier.toFixed(2)),
    unattendedCashDrainPerSec: Number(unattendedCashDrainPerSec.toFixed(2)),
    isInsolvent,

    agents: store.agents,
    unlockedAgentRoles: store.unlockedAgentRoles,
    roadmapFeatures: updatedRoadmap,
    activeRoadmapId: nextActiveRoadmapId,

    completedFeatures: store.completedFeatures,
    architectureUpgrades: store.architectureUpgrades,
    trends: store.trends,
    activeTrendId: store.activeTrendId,
    growthCampaigns: updatedCampaigns,
    customerSegments: updatedSegments,
    vcOffers: updatedVcOffers,
    activeEvents,
    eventHistory: store.eventHistory,
    unlockedMilestones: Array.from(currentUnlocked),
    activityLogs: store.activityLogs
  };

  const treasuryYield = { dividend: 0 };
  const rawCompanies = store.companies && store.companies.length > 0 ? store.companies : [updatedActiveCompanySnapshot];
  
  const simulatedCompanies = rawCompanies.map(c => {
    if (c.id === activeCompanyId) {
      return updatedActiveCompanySnapshot;
    }
    return simulateInactiveCompany(c, dt, treasuryYield);
  });

  const totalConglomerateValuation = simulatedCompanies.reduce((acc, c) => acc + c.valuation, 0);
  const totalConglomerateRevenue = simulatedCompanies.reduce((acc, c) => acc + c.arr, 0);
  const totalConglomerateAgents = simulatedCompanies.reduce((acc, c) => acc + c.agents.length, 0);
  const newTreasury = (store.conglomerateTreasury || 0) + treasuryYield.dividend;

  const updatedHoldingPortfolio = {
    portfolioValuation: totalConglomerateValuation,
    totalCompanies: simulatedCompanies.length,
    totalAgents: totalConglomerateAgents,
    totalRevenue: totalConglomerateRevenue,
    synergyLevel: Math.max(1, simulatedCompanies.length),
    conglomerateTreasury: newTreasury,
    totalDividendsEarned: (store.holdingPortfolio?.totalDividendsEarned || 0) + treasuryYield.dividend
  };

  // Token Burn & Trace Generation
  let hourlyTokenCost = 0;
  store.agents.forEach(a => {
    const modelDef = AI_MODELS[a.model] || AI_MODELS.CLAUDE_3_7_SONNET;
    const estimatedTokensPerHour = 35000 * (1 + a.level * 0.2);
    hourlyTokenCost += (estimatedTokensPerHour / 1000000) * modelDef.costPerMillionTokens;
  });

  let updatedTraces = store.agentTraces;
  if (store.agents.length > 0 && now - lastTraceTime > 2200) {
    lastTraceTime = now;
    const activeAgents = store.agents;
    const randomAgent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
    const newTrace = generateTraceForAgent(randomAgent, newTechDebt);
    updatedTraces = [newTrace, ...(store.agentTraces || []).slice(0, 49)];
  }

  // Update Game State
  useGameStore.setState({
    focus: newFocus,
    computeUsed,
    buildPoints: newBP,
    productLevel: newLevel,
    buildPointsTarget: newTarget,
    techDebt: Number(newTechDebt.toFixed(2)),
    roadmapFeatures: updatedRoadmap,
    activeRoadmapId: nextActiveRoadmapId,

    arpu: currentArpu,
    attention: Number(decayedAttention.toFixed(1)),
    leads: Number(newLeads.toFixed(1)),
    customers: Number(newCustomers.toFixed(2)),
    tickets: Number(newTickets.toFixed(2)),
    totalTicketsResolved: Number(totalTicketsResolved.toFixed(1)),
    trust: Number(newTrust.toFixed(2)),
    hype: Number(newHype.toFixed(2)),
    mrr: newMrr,
    arr: newArr,
    cash: Number(newCash.toFixed(2)),
    valuationMultiple: Number(multiple.toFixed(2)),
    valuation: newValuation,
    lastValuation: store.lastValuation || 0,
    stage: currentStage,
    growthCampaigns: updatedCampaigns,
    vcOffers: updatedVcOffers,
    customerSegments: updatedSegments,
    unlockedMilestones: Array.from(currentUnlocked),
    activeMilestoneCelebration: nextMilestoneCelebration,
    isUnicornModalOpen: isUnicorn,
    activeEvents,
    companies: simulatedCompanies,
    conglomerateTreasury: newTreasury,
    holdingPortfolio: updatedHoldingPortfolio,
    totalPlayTimeSeconds: store.totalPlayTimeSeconds + dt,
    lastTickTime: now,
    tokenBurnPerHour: Number(hourlyTokenCost.toFixed(2)),
    agentTraces: updatedTraces,
    currentEra: newCurrentEra,
    activeEraUnlock: newActiveEraUnlock,

    // Roguelike Tension & Active Consequence Telemetry
    agentOpexPerSec: Number(agentOpexPerSec.toFixed(2)),
    netArrDeltaPerSec,
    netCashFlowPerSec: Number(netCashFlowPerSec.toFixed(2)),
    isComputeOverloaded,
    computeOverloadRatio: overloadRatio,
    unattendedPenaltiesActive,
    unattendedTrustDrainPerSec: Number(unattendedTrustDrainPerSec.toFixed(2)),
    unattendedChurnMultiplier: Number(unattendedChurnMultiplier.toFixed(2)),
    unattendedCashDrainPerSec: Number(unattendedCashDrainPerSec.toFixed(2)),
    isInsolvent,
    isEraProgressionBlocked,
    eraProgressionBlockReason
  });


}
