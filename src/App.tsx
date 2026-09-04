import React, { useEffect, useRef } from 'react';
import { useV1Store } from './state/v1Store';
import { ResponsiveShell } from './ui/shell/ResponsiveShell';
import { registerPwaServiceWorker } from './pwa/registerServiceWorker';

export const App: React.FC = () => {
  const init = useV1Store((s) => s.init);
  const tick = useV1Store((s) => s.tick);
  const lastTimeRef = useRef<number>(Date.now());

  // 1. Initialize store & PWA Service Worker on mount
  useEffect(() => {
    init();
    registerPwaServiceWorker(() => {
      console.log('New V1 version available. Ready to activate on intermission.');
    });
  }, [init]);

  // 2. High Frequency Simulation Loop (100ms)
  useEffect(() => {
    lastTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaMs = Math.min(1000, now - lastTimeRef.current);
      lastTimeRef.current = now;

      if (deltaMs > 0) {
        tick(deltaMs);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [tick]);

  return <ResponsiveShell />;
};

export default App;
