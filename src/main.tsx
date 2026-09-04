import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGameStore } from './state/gameStore'
import { useV1Store } from './state/v1Store'

if (typeof window !== 'undefined') {
  (window as any).__gameStore = useGameStore;
  (window as any).__v1Store = useV1Store;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
