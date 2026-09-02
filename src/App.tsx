import React, { useEffect, useRef } from 'react';
import { useGameStore } from './state/gameStore';
import { runSimulationTick } from './state/simulationEngine';
import { checkAndProcessOfflineProgress } from './state/offlineEngine';

import { HeaderKPIBar } from './components/common/HeaderKPIBar';
import { NavigationTabs } from './components/common/NavigationTabs';
import { CommandCenter } from './components/command/CommandCenter';
import { AgentsScreen } from './components/agents/AgentsScreen';
import { ProductScreen } from './components/product/ProductScreen';
import { GrowthScreen } from './components/growth/GrowthScreen';
import { CustomersScreen } from './components/customers/CustomersScreen';
import { FinanceScreen } from './components/finance/FinanceScreen';
import { InboxScreen } from './components/inbox/InboxScreen';
import { HoldingCompanyScreen } from './components/holding/HoldingCompanyScreen';

import { IdeaSelectionModal } from './components/startup/IdeaSelectionModal';
import { MilestoneCelebration } from './components/milestones/MilestoneCelebration';
import { OfflineRecapModal } from './components/milestones/OfflineRecapModal';
import { UnicornVictoryModal } from './components/milestones/UnicornVictoryModal';

export const App: React.FC = () => {
  const { activeTab } = useGameStore();
  const lastTimeRef = useRef<number>(Date.now());

  // 1. Check Offline Progress on Mount
  useEffect(() => {
    checkAndProcessOfflineProgress();
  }, []);

  // 2. High Frequency Game Simulation Loop (100ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.min(1.0, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (deltaSeconds > 0) {
        runSimulationTick(deltaSeconds);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Fixed Header with 4 Headline Numbers & Permanent EMPLOYEES: 1 Counter */}
      <HeaderKPIBar />

      {/* Main Tab Navigation */}
      <NavigationTabs />

      {/* Main Screen Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'command' && <CommandCenter />}
        {activeTab === 'agents' && <AgentsScreen />}
        {activeTab === 'product' && <ProductScreen />}
        {activeTab === 'growth' && <GrowthScreen />}
        {activeTab === 'customers' && <CustomersScreen />}
        {activeTab === 'finance' && <FinanceScreen />}
        {activeTab === 'inbox' && <InboxScreen />}
        {activeTab === 'holding' && <HoldingCompanyScreen />}
      </main>

      {/* Modals & Overlays */}
      <IdeaSelectionModal />
      <MilestoneCelebration />
      <OfflineRecapModal />
      <UnicornVictoryModal />
    </div>
  );
};

export default App;
