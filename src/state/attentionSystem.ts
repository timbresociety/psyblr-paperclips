import type { AttentionPoint } from '../types/attention';
import type { AgentInstance, AgentRoleType } from '../types/agents';

export interface AttentionInputState {
  currentEra: number;
  mvpShipped: boolean;
  arr: number;
  mrr: number;
  cash: number;
  agents: AgentInstance[];
  unlockedAgentRoles: AgentRoleType[];
  tickets: number;
  leads: number;
  attention: number;
  techDebt: number;
  activeEvents: any[];
  buildPoints: number;
  buildPointsTarget: number;
  activeRoadmapId: string | null;
  roadmapFeatures: any[];
}

export function getGuidingAttentionPoints(state: AttentionInputState): AttentionPoint[] {
  const points: AttentionPoint[] = [];

  const growthAgents = state.agents.filter(a => a.role === 'GROWTH');
  const salesAgents = state.agents.filter(a => a.role === 'SALES');
  const supportAgents = state.agents.filter(a => a.role === 'SUPPORT');
  const managerAgents = state.agents.filter(a => a.role === 'MANAGER');
  const execAgents = state.agents.filter(a => a.role === 'EXECUTIVE');

  // 1. Era 1: Pre-MVP Prototype Sprint
  if (!state.mvpShipped) {
    if (state.buildPoints >= 100) {
      points.push({
        id: 'att_deploy_mvp',
        tab: 'command',
        title: 'MVP Ready to Ship',
        description: 'You have reached 100 Build Points! Deploy MVP now to connect Stripe and start generating revenue.',
        actionLabel: 'Deploy MVP & Launch',
        severity: 'critical',
        actionTarget: { tab: 'command' }
      });
    } else {
      points.push({
        id: 'att_vibe_code',
        tab: 'command',
        title: 'Solo Prototype Sprint in Progress',
        description: `Write code by hand to reach 100 BP (${Math.floor(state.buildPoints)}/100 BP) to ship your MVP.`,
        actionLabel: 'Vibe Code (C)',
        severity: 'info',
        actionTarget: { tab: 'command' }
      });
    }
  }

  // 2. Open Support Tickets (Accelerates churn!)
  if (state.tickets >= 3) {
    points.push({
      id: 'att_tickets',
      tab: 'command',
      title: `${Math.ceil(state.tickets)} Open Support Tickets`,
      description: 'Customer complaints are piling up! Resolve tickets immediately to restore trust and prevent paying users from churning.',
      actionLabel: 'Resolve Support Tickets',
      severity: state.tickets >= 8 ? 'critical' : 'warning',
      actionTarget: { tab: 'command' }
    });
  }

  // 3. High Tech Debt (>45%)
  if (state.techDebt >= 45 && state.currentEra >= 4) {
    const drag = Math.round((1 - Math.max(0.20, 1 - (state.techDebt / 100) * 0.70)) * 100);
    points.push({
      id: 'att_tech_debt',
      tab: 'product',
      title: `Critical Tech Debt: ${state.techDebt.toFixed(0)}%`,
      description: `Technical debt is causing a -${drag}% slowdown on engineering velocity and increasing customer churn.`,
      actionLabel: 'Hotfix Tech Debt',
      severity: state.techDebt >= 70 ? 'critical' : 'warning',
      actionTarget: { tab: 'product', modal: 'refactor' }
    });
  }

  // 4. Milestone: 8+ Agents reached, Need Manager! (Autonomy Tier 3 unlock)
  if (state.agents.length >= 8 && managerAgents.length === 0 && state.unlockedAgentRoles.includes('MANAGER')) {
    points.push({
      id: 'att_hire_manager',
      tab: 'agents',
      title: 'Department Manager Available',
      description: 'You have 8 active agents! Deploy a Department Manager to unlock Tier 3 Autonomy and +25% output boost across all pods.',
      actionLabel: 'Deploy Manager Agent',
      severity: 'critical',
      actionTarget: { tab: 'agents', modal: 'hire', role: 'MANAGER' }
    });
  }

  // 5. Milestone: 15+ Agents reached, Need Executive! (Autonomy Tier 4 unlock)
  if (state.agents.length >= 15 && execAgents.length === 0 && state.unlockedAgentRoles.includes('EXECUTIVE')) {
    points.push({
      id: 'att_hire_exec',
      tab: 'agents',
      title: 'Appoint C-Suite Executive',
      description: 'Your swarm has 15+ agents! Deploy an Executive agent to orchestrate cross-functional autonomy and boost throughput +50%.',
      actionLabel: 'Deploy Executive Agent',
      severity: 'critical',
      actionTarget: { tab: 'agents', modal: 'hire', role: 'EXECUTIVE' }
    });
  }

  // 6. Era 3+ Revenue Scaling Bottlenecks
  if (state.currentEra >= 3) {
    // Missing Sales Agent: Inbound leads are not converting
    if (salesAgents.length === 0 && state.unlockedAgentRoles.includes('SALES')) {
      points.push({
        id: 'att_hire_sales',
        tab: 'agents',
        title: 'Missing Sales Agent (Revenue Bottleneck)',
        description: 'You have 0 Sales agents. Inbound leads are not being converted into paying customers. Deploy Sales to scale ARR toward $100k!',
        actionLabel: 'Deploy Sales Agent',
        severity: 'critical',
        actionTarget: { tab: 'agents', modal: 'hire', role: 'SALES' }
      });
    }

    // Missing Growth Agent: No attention or inbound leads generated
    if (growthAgents.length === 0 && state.unlockedAgentRoles.includes('GROWTH')) {
      points.push({
        id: 'att_hire_growth',
        tab: 'agents',
        title: 'Missing Growth Agent (Lead Bottleneck)',
        description: 'You have 0 Growth agents. Deploy a Growth agent to publish viral content and generate a constant stream of inbound leads.',
        actionLabel: 'Deploy Growth Agent',
        severity: 'warning',
        actionTarget: { tab: 'agents', modal: 'hire', role: 'GROWTH' }
      });
    }

    // Missing Support Agent when customer base grows
    if (supportAgents.length === 0 && (state.mrr >= 1500 || state.tickets >= 2) && state.unlockedAgentRoles.includes('SUPPORT')) {
      points.push({
        id: 'att_hire_support',
        tab: 'agents',
        title: 'Deploy Support Agent',
        description: 'As customer base scales, tickets increase. Deploy a Support agent to automate triage and protect customer trust.',
        actionLabel: 'Deploy Support Agent',
        severity: 'warning',
        actionTarget: { tab: 'agents', modal: 'hire', role: 'SUPPORT' }
      });
    }
  }

  // 7. Active Crises in Inbox (Always Alert When Incident Exists!)
  if (state.activeEvents && state.activeEvents.length > 0) {
    const firstEvt = state.activeEvents[0];
    points.push({
      id: 'att_inbox_crisis',
      tab: 'inbox',
      title: firstEvt?.title ? `Incident: "${firstEvt.title}"` : `${state.activeEvents.length} Active Incident in Inbox`,
      description: firstEvt?.description || 'An operational incident requires your executive intervention in the Inbox.',
      actionLabel: 'Open Executive Inbox',
      severity: 'critical',
      actionTarget: { tab: 'inbox' }
    });
  }




  // 8. Leads waiting to be closed manually if no sales agent
  if (state.leads >= 2 && salesAgents.length === 0) {
    points.push({
      id: 'att_close_leads',
      tab: 'command',
      title: `${Math.floor(state.leads)} Inbound Leads Ready to Close`,
      description: 'Prospective buyers are waiting. Pitch leads manually or deploy a Sales agent to close them automatically.',
      actionLabel: 'Pitch Leads',
      severity: 'warning',
      actionTarget: { tab: 'command' }
    });
  }

  return points;
}
