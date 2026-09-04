# V0 to V1 Codebase Audit & Migration Guide

Date: September 2026  
Status: Complete Phase 0 Audit  

This document audits the existing V0 codebase (`psyblr-paperclips`) against the canonical V1 One-Person Company Roguelite specifications defined in `company_sim_v1/product_final.md`, `company_sim_v1/AGENTS.md`, and `company_sim_v1/README.md`.

---

## 1. Current Framework & Build Tooling

- **Core Framework**: React 19 (`react: ^19.2.8`, `react-dom: ^19.2.8`)
- **Build Tool**: Vite 8 (`vite: ^8.2.2`, `@vitejs/plugin-react: ^6.1.0`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite: ^4.3.3`, `tailwindcss: ^4.3.3`)
- **State Management**: Zustand v5 (`zustand: ^5.0.15`) with `persist` middleware
- **Icons & Motion**: `lucide-react: ^1.39.0`, `framer-motion: ^13.1.1`
- **Effects**: `canvas-confetti: ^1.9.4`
- **Linter**: `oxlint: ^1.79.0`
- **Testing**: Puppeteer (`puppeteer: ^25.9.0`) running browser automation scripts against `localhost:5173`.
- **Runtime Environment**: Node.js v24.12.0. Python harness run via `uv` at `~/.local/bin/uv`.
- **Build Status**: `npm run build` succeeds cleanly (`tsc -b && vite build`), generating `dist/`.

---

## 2. Canvas & Rendering Approach

- **V0 Reality**: Zero actual `<canvas>` elements exist in the entire codebase!
  - Components with names like `SwarmOrchestrationCanvas.tsx` are entirely DOM/HTML-based flex/grid layouts with SVG icons and CSS styles.
  - The only canvas usage in V0 was `canvas-confetti` rendering confetti overlays upon milestones.
- **V1 Requirement**:
  - Six actual responsive `<canvas>` rooms: Marketing (Swipe), Product (Merge), Monetization (Tap), Retention (Aim/Auto-fire), Expansion (Drag/Pack), and Operations (Scratch/Reveal).
  - Measured container pattern via `ResizeObserver`.
  - Backing store scaled by `renderDpr = Math.min(window.devicePixelRatio || 1, 2)`.
  - Stable logical room coordinate space (e.g. 1000x1000 or normalized 0..10,000) independent of CSS pixels.
  - Client-to-logical pointer projection using Pointer Events.
  - DOM UI used for critical HUD numbers, buttons, modals, and navigation.

---

## 3. Current Simulation & Economy Ownership

- **V0 Reality**:
  - Simulation logic is scattered between `src/state/gameStore.ts` and `src/state/simulationEngine.ts`.
  - `runSimulationTick` is executed via `setInterval` every 100ms in `App.tsx`.
  - The economy is driven by floating-point dollars, non-deterministic `Math.random()`, and arbitrary non-canonical resources (`buildPoints`, `techDebt`, `attention`, `hype`, `computeUsed`, `trust`, `tickets`, `leads`).
  - ARR is computed arbitrarily as `customers * arpu * 12`.
  - Valuation is arbitrarily boosted by manual clicks, marketing campaigns, and VC rounds.
- **V1 Requirement**:
  - Pure deterministic simulation core in `src/sim/`, independent of React, Canvas, DOM, audio, or GenAI.
  - Integer cents (`MoneyCents = bigint` / integer cents codec) and basis points (`BasisPoints = number`).
  - Exact ARR Bridge:
    ```text
    ARR_END = ARR_START + NEW_CUSTOMER_ARR + EXPANSION_ARR - CHURNED_ARR
    NEW_ARR = NEW_CUSTOMER_ARR + EXPANSION_ARR  (subtotal only)
    ```
  - Valuation strictly locked to:
    ```text
    VALUATION = ARR * LOCKED_GROWTH_MULTIPLE
    ```
  - Growth Multiple updated only at quarter-close from quarterly ARR growth bands (2x, 4x, 6x, 10x, 14x, 20x, 28x, 40x).
  - Operations costs hit Cash, not ARR. Financing provides liquidity, not score.

---

## 4. State Management

- **V0 Reality**:
  - Single massive Zustand store (`src/state/gameStore.ts`, 1,618 lines).
  - Store actions directly mutate game state, spawn random events, and calculate metrics inline.
- **V1 Requirement**:
  - Clean separation:
    - Pure `CompanyState` and `HoldingCompanyState` governed by deterministic tick reducer.
    - Presentation Zustand store serves as a reactive bridge, consuming state snapshots from the simulation engine.
    - 10 Hz deterministic simulation tick decoupled from 60 FPS presentation loop.

---

## 5. Persistence

- **V0 Reality**:
  - Zustand `persist` middleware saving serialized JSON state to `localStorage` under `psyblr-paperclips-storage-v3`.
  - Subject to quota limits (5MB) and synchronous main-thread JSON serialization spikes.
- **V1 Requirement**:
  - Versioned durable persistence using IndexedDB (`src/pwa/db.ts`).
  - Stores: active run snapshot, seed, action log / replay checkpoints, founder history, holding company conglomerate state, balance version.
  - Debounced transactional writes at safe boundaries (quarter close, monthly close, financing actions, app backgrounding/visibility change).
  - Active runs survive refresh, app restart, and temporary network loss.

---

## 6. PWA / Manifest / Service-Worker Setup

- **V0 Reality**:
  - No `manifest.json` existed in `public/` (only `favicon.svg` and `icons.svg`).
  - No service worker was registered; no offline caching or standalone app support existed.
- **V1 Requirement**:
  - Valid Web App Manifest (`public/manifest.json`) with `display: standalone`, `theme_color: #000000`, name, icons.
  - Service worker (`public/sw.js` and `registerServiceWorker.ts`) providing app-shell and static asset caching.
  - Safe client update flow: updates download in background and activate only at safe boundaries (intermission, menu), never force-reloading an active quarter.
  - Core game fully playable offline once assets are cached.

---

## 7. Responsive Behavior & Mobile Input

- **V0 Reality**:
  - Desktop-centric shell (`MacConsoleShell.tsx`) modeled as a fixed macOS window with traffic-light window buttons.
  - Depends on desktop hotkeys (Cmd+K, keys 1-9 for tabs, C/P/S/T for founder actions).
  - Unusable and clipped on compact mobile screens (320 x 568).
- **V1 Requirement**:
  - Mobile-first responsive hierarchy:
    - **Compact Mobile Portrait (320x568 min)**: Compact economic HUD -> Active room canvas -> Context/Opportunity UI -> Bottom room navigation (with badges/urgency).
    - **Tablet / Landscape**: Room rail + secondary company metrics.
    - **Desktop**: Rich multi-column HUD, queues, automation state, dominant room interaction.
  - Unified Pointer Events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) with `setPointerCapture`.
  - All 6 room games playable with one thumb/pointer without hover, right-click, or multi-touch.
  - Safe area insets respected: `env(safe-area-inset-*)`.

---

## 8. Reusable Design Tokens & Components

- **Aesthetic Tone**: Dark glassmorphic macOS console style (`#000000`, `#161618`, `#1c1c1e`, subtle border `border-white/[0.08]`, `font-mono` typography) aligns well with V1's "designed object / physical instrument" philosophy.
- **Audio Engine**: `src/audio/soundEffects.ts` uses zero-dependency procedural Web Audio synthesis (`playClick`, `playCash`, `playDeploy`, `playTicketResolved`, `playCelebration`, `playAlarm`). Fully reusable for tactile feedback in the six rooms!
- **Startup Ideas Data**: `src/data/companyIdeas.ts` has humorous, brand-neutral fictional startup archetypes (e.g. *Meetless*, *Dentally*, *VibeCrafter*, *SlopShield*) that fit V1 copyright-safe content rules.
- **Modal Primitives**: Reset confirm modal, command palette, and celebration confetti components can be adapted into V1 intermission and situation screens.

---

## 9. Holding Company Implementation

- **V0 Reality**:
  - `HoldingCompanyScreen.tsx` allowed launching subsidiaries and injecting cash from a conglomerate treasury.
- **V1 Requirement**:
  - Hierarchy: `HOLDING COMPANY -> COMPANY RUNS -> SIX FUNCTIONS -> TACTILE WORK`.
  - Unlocks after first company run finishes.
  - Starts with 2 slots; Slot 3 unlocks after two unicorn companies.
  - Single active founder focus: only foreground company receives direct founder input; background companies run automated agents, monthly collections, bills, and incidents.
  - Synergies (Shared Audience, Shared Infrastructure, Portfolio Cross-Sell, Shared Data, Shared Vendor, Shared Reputation) provide workload, capacity, or visibility—**never direct ARR**.
  - Portfolio score: `PORTFOLIO FOUNDER VALUE = SUM(founder ownership * valuation)`.

---

## 10. V0 Systems to Retain vs. Replace

### Retain & Adapt
- Procedural Web Audio engine (`soundEffects.ts`).
- Fictional startup name/concept generator (`companyIdeas.ts`).
- Dark slate/obsidian aesthetic, monospace telemetry styling, and sleek glassmorphic containers.
- Confetti celebration overlays for the $1B checkpoint and milestones.
- Multi-company slot concept for the Holding Company meta-layer.

### Remove / Replace
- Idle/clicker buttons that directly inflate metrics (`vibeCodeManual`, `postManual`, `sellManual`, `supportManual`).
- Fictional disconnected resources (`buildPoints`, `techDebt`, `attention`, `hype`, `computeUsed`, `trust`).
- Floating-point financial accounting and `Math.random()`.
- Desktop-only fixed `MacConsoleShell` wrapper.
- Synchronous `localStorage` persistence.
- Generic SaaS tabs with equal-weight cards.

---

## 11. Risky Coupling Preventing Deterministic Simulation

1. **Direct Zustand Store Mutation**: V0 actions mutate store state in unpredictable order based on browser frame timers.
2. **`Math.random()` and Wall-Clock Time**: V0 simulation uses `Date.now()` and unseeded `Math.random()`, preventing replay determinism.
3. **UI and Simulation Entanglement**: Modals, tabs, audio triggers, and economic counters were combined in single state objects.
4. **Resolution**: All simulation code is isolated in `src/sim/`, driven strictly by `(seed, state, command_log) => next_state`.

---

## 12. Proposed Migration Sequence

```text
Phase 0: Audit & Architecture Verification (Complete)
    ↓
Phase 1: Deterministic Simulation Core (Types, Invariants, ARR Bridge, Clock, Capital, Tests)
    ↓
Phase 2: Six Tactile Room Games (Marketing, Product, Monetization, Retention, Expansion, Operations)
    ↓
Phase 3: Progressive First-Run Onboarding (Curated Q1 to Q5 State Machine)
    ↓
Phase 4: Automation & Roguelike Systems (Agents, Complexity/Strain, 48 Upgrades, 24 Situations, Histories)
    ↓
Phase 5: Capital Systems (Cash Closes, LOC Debt, Venture Dilution Compounding)
    ↓
Phase 6: Holding Company Conglomerate (Multi-Company Runner, Opportunity Synergies)
    ↓
Phase 7: Responsive Presentation & Installable PWA Shell (Manifest, SW, IndexedDB, Safe Updates)
    ↓
Phase 8: Validation Matrix (Replay Determinism, Viewport Parity, Simulator Parity)
```
