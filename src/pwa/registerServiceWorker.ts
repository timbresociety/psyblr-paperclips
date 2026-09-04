/**
 * Service Worker Registration & Safe Update Lifecycle
 * Product Truth: company_sim_v1/AGENTS.md Section 29.8, 29.11
 */

let waitingWorker: ServiceWorker | null = null;

export function registerPwaServiceWorker(onUpdateAvailable?: () => void): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available, waiting to activate
                waitingWorker = installingWorker;
                onUpdateAvailable?.();
              }
            }
          });
        });
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}

/**
 * Activate waiting worker at safe boundaries (e.g. intermission, main menu)
 */
export function activateWaitingServiceWorker(): void {
  if (waitingWorker) {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    waitingWorker = null;
    window.location.reload();
  }
}
