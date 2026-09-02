import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from './state/gameStore';
import { runSimulationTick } from './state/simulationEngine';
import { checkAndProcessOfflineProgress } from './state/offlineEngine';
import type { ScreenTab } from './types/game';

import { MacConsoleShell } from './components/layout/MacConsoleShell';
import { CommandCenter } from './components/command/CommandCenter';
import { SwarmOrchestrationCanvas } from './components/orchestration/SwarmOrchestrationCanvas';
import { LiveAgentTerminal } from './components/orchestration/LiveAgentTerminal';
import { AgentsScreen } from './components/agents/AgentsScreen';
import { ProductScreen } from './components/product/ProductScreen';
import { GrowthScreen } from './components/growth/GrowthScreen';
import { CustomersScreen } from './components/customers/CustomersScreen';
import { FinanceScreen } from './components/finance/FinanceScreen';
import { InboxScreen } from './components/inbox/InboxScreen';
import { HoldingCompanyScreen } from './components/holding/HoldingCompanyScreen';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';

import { IdeaSelectionModal } from './components/startup/IdeaSelectionModal';
import { MilestoneCelebration } from './components/milestones/MilestoneCelebration';
import { OfflineRecapModal } from './components/milestones/OfflineRecapModal';
import { UnicornVictoryModal } from './components/milestones/UnicornVictoryModal';
import { soundEngine } from './audio/soundEffects';

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    vibeCodeManual,
    postManual,
    sellManual,
    supportManual,
    stage
  } = useGameStore();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const lastTimeRef = useRef<number>(0);

  // 1. Check Offline Progress on Mount & Init Timer
  useEffect(() => {
    lastTimeRef.current = Date.now();
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

  // 3. Global Keyboard Shortcuts for macOS AI CEO Console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      // ⌘K or Ctrl+K to toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      // 1-0 Numerical Tab Switchers
      const tabMap: Record<string, ScreenTab> = {
        '1': 'command',
        '2': 'swarm',
        '3': 'terminal',
        '4': 'agents',
        '5': 'product',
        '6': 'growth',
        '7': 'customers',
        '8': 'finance',
        '9': 'inbox',
        '0': 'holding'
      };

      if (tabMap[e.key]) {
        if (e.key === '0' && stage !== 'HOLDING_COMPANY') return;
        e.preventDefault();
        soundEngine.playClick();
        setActiveTab(tabMap[e.key]);
        return;
      }

      // Hotkeys for Founder Manual Actions
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        soundEngine.playDeploy();
        vibeCodeManual();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        soundEngine.playClick();
        postManual();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        soundEngine.playCash();
        sellManual();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        soundEngine.playTicketResolved();
        supportManual();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, vibeCodeManual, postManual, sellManual, supportManual, stage]);

  return (
    <MacConsoleShell>
      {/* Active Screen Tab Viewport */}
      {activeTab === 'command' && <CommandCenter />}
      {activeTab === 'swarm' && <SwarmOrchestrationCanvas />}
      {activeTab === 'terminal' && <LiveAgentTerminal />}
      {activeTab === 'agents' && <AgentsScreen />}
      {activeTab === 'product' && <ProductScreen />}
      {activeTab === 'growth' && <GrowthScreen />}
      {activeTab === 'customers' && <CustomersScreen />}
      {activeTab === 'finance' && <FinanceScreen />}
      {activeTab === 'inbox' && <InboxScreen />}
      {activeTab === 'holding' && <HoldingCompanyScreen />}

      {/* Global Command Palette */}
      <CommandPaletteModal isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* Modals & Overlays */}
      <IdeaSelectionModal />
      <MilestoneCelebration />
      <OfflineRecapModal />
      <UnicornVictoryModal />
    </MacConsoleShell>
  );
};

export default App;
