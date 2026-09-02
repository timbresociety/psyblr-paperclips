import { useGameStore, calcAutonomyInfo } from './gameStore';
import type { OfflineRecapData } from '../types/game';

export function checkAndProcessOfflineProgress() {
  const store = useGameStore.getState();
  if (!store.company || !store.lastTickTime) return;

  const now = Date.now();
  const elapsedSeconds = Math.floor((now - store.lastTickTime) / 1000);

  // If away for more than 60 seconds, run offline progress
  if (elapsedSeconds < 60) return;

  // Max 8 hours of full offline progress
  const simulatedSeconds = Math.min(28800, elapsedSeconds);

  // 1. Process Active Company
  const engCount = store.agents.filter(a => a.role === 'ENGINEERING').length;
  const growthCount = store.agents.filter(a => a.role === 'GROWTH').length;
  const supportCount = store.agents.filter(a => a.role === 'SUPPORT').length;
  const salesCount = store.agents.filter(a => a.role === 'SALES').length;

  const activeRevenuePerSec = store.mrr / (30 * 86400);
  const activeRevenueEarned = Math.round(activeRevenuePerSec * simulatedSeconds);

  const leadsPerSec = (growthCount * 40 / 100) * 3;
  const salesCapacity = salesCount * 0.25;
  const leadsProcessed = Math.min(leadsPerSec, salesCapacity) * simulatedSeconds;
  const conversionRate = 0.08 * (1 + store.productLevel * 0.05);
  const customersGained = Math.floor(leadsProcessed * conversionRate);

  const ticketsGenerated = Math.floor(store.customers * (1 / (125 * 60)) * simulatedSeconds);
  const ticketsResolved = Math.min(ticketsGenerated, Math.floor(supportCount * 0.15 * simulatedSeconds));

  const bpProduced = engCount * 2.0 * simulatedSeconds;
  const featuresShipped = Math.floor(bpProduced / 500);

  // 2. Process All Inactive Subsidiaries
  let portfolioExtraRevenue = 0;
  let offlineDividendsEarned = 0;

  const updatedCompanies = (store.companies || []).map(comp => {
    if (comp.id === store.activeCompanyId) {
      const updatedCust = store.customers + customersGained;
      const updatedMrr = Math.round(updatedCust * store.arpu);
      return {
        ...comp,
        cash: store.cash + activeRevenueEarned,
        customers: updatedCust,
        mrr: updatedMrr,
        arr: updatedMrr * 12,
        tickets: Math.max(0, store.tickets + ticketsGenerated - ticketsResolved)
      };
    }

    // Inactive subsidiary offline
    const compEng = comp.agents.filter(a => a.role === 'ENGINEERING').length;
    const compSales = comp.agents.filter(a => a.role === 'SALES').length;
    const compRevPerSec = comp.mrr / (30 * 86400);
    const compRevEarned = Math.round(compRevPerSec * simulatedSeconds);
    const compCustGained = Math.floor(compSales * 0.15 * simulatedSeconds);
    const updatedCust = comp.customers + compCustGained;
    const updatedMrr = Math.round(updatedCust * comp.arpu);

    portfolioExtraRevenue += compRevEarned;

    const compAutonomy = calcAutonomyInfo(comp);
    if (compAutonomy.level === 5) {
      offlineDividendsEarned += compRevEarned * 0.05;
    }

    return {
      ...comp,
      cash: comp.cash + compRevEarned,
      customers: updatedCust,
      mrr: updatedMrr,
      arr: updatedMrr * 12,
      buildPoints: comp.buildPoints + compEng * 2.0 * simulatedSeconds
    };
  });

  const availableFlavors: string[] = [];

  if (store.companies && store.companies.length > 1) {
    availableFlavors.push(
      `Your holding conglomerate continued operating across ${store.companies.length} subsidiaries.`,
      `Autonomous portfolio startups transacted and scaled recurring revenue quietly.`,
      `Your distributed AI agent workforce executed directives across all portfolio ventures.`
    );
  } else if (store.agents.length === 0) {
    availableFlavors.push(
      'Your automated server scripts stayed up and kept the product humming quietly.',
      'Three prospective customers stared at your landing page for 18 minutes.',
      'Your background database cron jobs ran cleanly with zero human overhead.',
      'A restful pause while the human founder prepares the next batch of features.'
    );
  } else {
    if (growthCount > 0) {
      availableFlavors.push('Your Growth Agent scheduled 40 unhinged thought leadership threads.');
      availableFlavors.push('Your Growth Agent published an AI manifesto that trended in 3 subreddits.');
    }
    if (supportCount > 0) {
      availableFlavors.push('Your Support Agent apologized 400 times in Shakespearean sonnets.');
    }
    if (engCount > 0) {
      availableFlavors.push('Your Engineering Agent drank 14 virtual Red Bulls and pushed straight to production.');
    }
    if (salesCount > 0) {
      availableFlavors.push('Your Sales Agent closed prospects while hallucinating on LinkedIn.');
    }
    if (store.agents.some(a => a.role === 'QA')) {
      availableFlavors.push('Your QA Agent found 82 missing semicolons and refactored the auth module.');
    }
    if (availableFlavors.length === 0) {
      availableFlavors.push('Your autonomous agents executed background directives without incident.');
    }
  }

  const randomFlavor = availableFlavors[Math.floor(Math.random() * availableFlavors.length)];

  const totalEarned = activeRevenueEarned + portfolioExtraRevenue;
  const recapData: OfflineRecapData = {
    timeOfflineSeconds: elapsedSeconds,
    revenueEarned: totalEarned,
    customersGained,
    featuresShipped,
    ticketsResolved,
    ticketsGenerated,
    incidentsCount: Math.floor(simulatedSeconds / 7200),
    recapFlavor: randomFlavor
  };

  const updatedActiveCustomers = store.customers + customersGained;
  const updatedActiveMrr = updatedActiveCustomers * store.arpu;
  const updatedActiveValuation = Math.max(store.lastValuation || 0, Math.round(updatedActiveMrr * 12 * store.valuationMultiple));

  useGameStore.setState({
    cash: store.cash + activeRevenueEarned,
    customers: updatedActiveCustomers,
    mrr: updatedActiveMrr,
    arr: updatedActiveMrr * 12,
    valuation: updatedActiveValuation,
    tickets: Math.max(0, store.tickets + ticketsGenerated - ticketsResolved),
    companies: updatedCompanies.length > 0 ? updatedCompanies : store.companies,
    conglomerateTreasury: (store.conglomerateTreasury || 0) + offlineDividendsEarned,
    isOfflineModalOpen: true,
    offlineRecapData: recapData,
    lastTickTime: now
  });
}
