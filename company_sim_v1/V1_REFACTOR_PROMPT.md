# V1 Refactor Prompt for Terminal Coding Agent

You are working inside the existing One-Person Company game repository.

The currently deployed product at `https://psyblr-paperclips.vercel.app/` is **V0**.

Treat V0 as an implementation and presentation reference, not as product truth.

Your job is to refactor the repository into the canonical **V1 One-Person Company Roguelite** defined by the specification package placed in this repository.

## Canonical reading order

Before modifying code, read these files completely:

1. `company_sim_v1/product_final.md`
2. `company_sim_v1/AGENTS.md`
3. `company_sim_v1/README.md`
4. `company_sim_v1/BALANCE_REPORT.md`
5. `company_sim_v1/simulate_v1.py`
6. the CSV/JSON files under `company_sim_v1/simulation_output/`

`product_final.md` is product truth.

`AGENTS.md` is the implementation contract.

`README.md` is the engineering rulebook.

`BALANCE_REPORT.md` explains why the baseline numbers are calibrated as they are and which risks still require playtesting.

If code, V0 behavior, or another document conflicts with `product_final.md`, V1 product truth wins.

Do not edit `product_final.md` merely to make implementation easier. If you find a genuine contradiction, stop that conflicting implementation path, document the contradiction, and propose the smallest canonical change to the user.

Do not commit or push unless explicitly asked.

---

# Mission

Preserve what V0 already does well:

- overall design language
- visual tone and polish
- progressive onboarding philosophy
- satisfying number presentation
- sense of an increasingly automated machine
- Holding Company concept and its ability to contain parallel company runs

Replace what V0 does poorly:

- meaningless buttons that directly make numbers rise
- idle/clicker actions without downstream consequences
- arbitrary ARR or valuation shortcuts
- upgrades that are only percentage multipliers
- automation that is merely a passive stat
- lack of roguelike build identity
- lack of meaningful Cash, Debt, founder ownership, and financing decisions
- lack of deterministic economic causality

V1 must feel visually related to V0 while being a fundamentally deeper game underneath.

Do not preserve a V0 mechanic merely because code already exists.

Reuse components, animation systems, tokens, layout primitives, Canvas utilities, PWA infrastructure, persistence, audio, and visual assets only when they fit the V1 contract.

---

# Critical new platform requirement

V1 is both:

1. a responsive web game across mobile and desktop
2. an installable Progressive Web App on supported desktop and mobile surfaces

This requirement affects architecture from the first refactor step.

Do not build a fixed desktop Canvas and retrofit mobile later.

Do not shrink the desktop UI until it fits a phone.

The game must reflow intelligently while the deterministic simulation remains identical.

## Required responsive presentation

### Compact mobile portrait

Use approximately this hierarchy:

```text
compact economic HUD
        ↓
active room canvas
        ↓
context / opportunity UI
        ↓
bottom room navigation
```

Inactive rooms communicate urgency through navigation badges, alarms, queue counts, and other compact indicators.

### Mobile landscape / tablet

Use additional width for room navigation and secondary company state without reducing the active room into a small target.

### Desktop

Use the extra space for richer HUD, visible queues, automation state, and cross-room machine flows while maintaining one dominant active room interaction surface.

No core mechanic may require a particular orientation.

Minimum V1 target viewport:

```text
320 x 568 CSS px
```

## Canvas rules

- Canvas size comes from a measured responsive container.
- Use `ResizeObserver` or the stack-equivalent container measurement.
- Use a stable logical room coordinate system.
- Map client Pointer Events into logical coordinates.
- Canvas backing-store resolution may change with DPR, but simulation coordinates never do.
- Recommended visual DPR cap is `2` unless profiling proves another value is needed.
- Resize, rotation, browser zoom, PWA window resize, or device pixel ratio changes must never alter economic state.
- No room may require multi-touch or hover.
- Use Pointer Events as the unified canonical input where practical.
- Keep critical information and accessible controls in DOM UI rather than drawing the entire application shell in Canvas.
- Respect device safe areas.

## PWA rules

Preserve existing PWA infrastructure if it is sound. Otherwise implement the minimum coherent V1 PWA shell:

- valid web app manifest
- standalone display configuration where supported
- application icons and theme metadata
- one service worker or framework-equivalent worker, never competing workers
- app-shell/static content caching
- versioned durable game persistence, preferably IndexedDB
- authored fallback content when GenAI/network personalization is unavailable
- safe client update flow that never force-reloads an active quarter

After required static assets are cached, an ordinary core run must survive temporary network loss.

A valid active run must survive:

- browser refresh
- closing and reopening the installed PWA
- normal mobile application backgrounding
- viewport rotation

Do not show an install prompt on initial load. Installation should be offered only after the player has experienced meaningful value or from Settings/menu.

---

# Phase 0: audit V0 before changing it

Inspect the repository and write a short local implementation note named `V0_TO_V1_AUDIT.md` containing:

1. current framework/build tooling
2. Canvas/rendering approach
3. current simulation/economy ownership
4. state management
5. persistence
6. current PWA/manifest/service-worker setup
7. responsive behavior and mobile input
8. reusable design tokens/components
9. current Holding Company implementation
10. V0 systems that should be retained
11. V0 systems that must be replaced
12. risky coupling that would prevent deterministic simulation
13. proposed migration sequence

Do not ask the user to restate requirements that already exist in the specification package.

Do not start with a visual rewrite.

---

# Phase 1: preserve the V0 shell, replace economic truth

Create a deterministic simulation layer that can run without React, Canvas, audio, PWA APIs, or GenAI.

Implement the canonical V1 state and invariants first:

```text
ARR_END
=
ARR_START
+ NEW_CUSTOMER_ARR
+ EXPANSION_ARR
- CHURNED_ARR
```

with reporting subtotal:

```text
NEW_ARR
=
NEW_CUSTOMER_ARR
+ EXPANSION_ARR
```

Never double-count Expansion.

Implement separately:

```text
ARR
Cash
Debt
Founder Ownership
Growth Multiple
Valuation
Complexity
Ops Capacity
```

Valuation remains:

```text
VALUATION
=
ARR x LOCKED_GROWTH_MULTIPLE
```

No button, debt draw, funding round, relic, agent, or upgrade may directly create Valuation.

Operations cost hits Cash, not ARR.

Financing creates liquidity, not score.

Use integer/fixed-point canonical arithmetic as specified in `AGENTS.md`.

Add invariant tests before moving on.

---

# Phase 2: build the six manual room games

Implement and validate the manual interaction before its automation:

```text
Marketing     SWIPE
Product       MERGE
Monetization  TAP
Retention     AIM / AUTO-FIRE
Expansion     DRAG / PACK
Operations    SCRATCH / REVEAL
```

Each room must have:

```text
Incoming workload
Physical gesture
Skill expression
Useful output
Mistake consequence
Automation equivalent
```

Canvas emits commands.

Simulation resolves consequences.

Canvas never owns ARR, Cash, valuation, financing, or authoritative opportunity state.

Preserve V0 styling where it improves clarity and feel, but prioritize satisfying tactile feedback and causal readability.

Do not add agents until the corresponding manual interaction is understandable and satisfying.

---

# Phase 3: progressive first-run onboarding

Implement the curated Q1 to Q5 onboarding from `product_final.md`.

The player should discover mechanics through need and consequence rather than tutorial walls.

Required learning progression includes:

```text
Marketing
Product
Monetization
ARR
Cash
Valuation
Retention
Operations
Expansion
upgrade shop
agents
Complexity
Debt
venture funding
Founder Ownership
situations
Growth Commitment
cross-room systems
cursed systems
```

First-run layout must work on mobile portrait as well as desktop from day one.

Do not build onboarding that depends on hover tooltips.

---

# Phase 4: automation and roguelike systems

Agents literally perform the same interactions as the founder.

A Marketing Agent swipes.
A Product Agent merges.
A Pricing Agent taps.
A Support Agent attacks threats.
An Account Agent packs modules.
An Ops Agent investigates incidents.

Their visible actions are part of the fantasy.

Implement:

- agent tiers
- recurring costs
- agent reliability
- Complexity
- Ops Capacity
- Strain
- 30 room-specific upgrades
- 12 cross-room systems
- 6 cursed upgrades
- Founder Histories
- relics
- deterministic situations

Avoid generic `+15% ARR` upgrades.

Upgrades should change flows, decisions, capabilities, automation, or risk.

Founder Histories may change relic access, early fundraising terms, operating affordances, and upgrade weighting. They may encourage builds outside a founder's obvious meta. They may not mint free ARR or valuation.

---

# Phase 5: capital systems

Implement Cash before financing.

Then implement:

1. monthly revenue collection
2. recurring tools/agent/Ops costs
3. LOC
4. interest
5. over-limit behavior
6. bankruptcy grace
7. pre-seed SAFE abstraction
8. Seed / Series A / Series B priced rounds
9. multiplicative founder dilution
10. founder stake value

Use the exact formulas and balance values in `product_final.md`.

Do not replace them with guessed real-world formulas.

The financing model is a deterministic game abstraction calibrated against contemporary startup financing, not financial advice or a claim that every lender/investor prices companies this way.

---

# Phase 6: Holding Company

Only after the single-company V1 loop is stable, refactor/rebuild the Holding Company.

The hierarchy is:

```text
HOLDING COMPANY
    ↓
COMPANY RUNS
    ↓
SIX FUNCTIONS
    ↓
TACTILE WORK
```

Parallel companies can create synergies, but Holding Company synergies create opportunities, workload, capacity, or information.

They never create free ARR.

Only one company receives direct founder interaction at a time. Other active companies operate through their automation.

Preserve useful V0 Holding Company presentation and interaction concepts where compatible.

---

# Determinism and replay

The same:

```text
seed
+ balance version
+ content version
+ ordered action log
```

must produce the same economic result regardless of:

- desktop vs mobile
- portrait vs landscape
- browser window size
- Canvas DPR
- reduced-motion setting
- installed PWA vs ordinary browser tab
- render FPS

Add regression tests for this explicitly.

---

# Required responsive/PWA tests

At minimum test:

```text
320 x 568
360 x 800
390 x 844
768 x 1024
1024 x 768
1366 x 768
1440 x 900
1920 x 1080
resizable standalone PWA window
```

For all relevant layouts:

- no critical control is clipped
- HUD remains legible
- room switching is reachable
- every gesture works
- pointer mapping remains accurate after resize
- orientation change preserves state
- safe areas do not cover controls
- no accidental page scroll breaks gestures
- simulation output remains deterministic

Also verify:

- manifest validity
- standalone launch route
- cached app-shell boot
- active-run persistence after close/reopen
- authored fallback operation without GenAI
- waiting service-worker update does not destroy an active run

---

# Balance workflow

After implementing the deterministic model, run the supplied simulator unchanged first:

```bash
python company_sim_v1/simulate_v1.py --runs 1000 --out company_sim_v1/simulation_output
```

Use its existing outputs as the baseline.

After any material balance change, rerun it and compare results.

Do not tune only for equal unicorn rates.

Preserve strategically different profiles across:

```text
speed
risk
manual skill
founder ownership
debt
automation
complexity
```

If implementation requires changing a canonical number, report why and get user approval before changing `product_final.md`.

---

# Copyright and cultural-content rules

Use original startup-culture situations and generic fictional brands/content.

Do not copy:

- tweets or social posts
- game characters
- logos
- slogans
- branded layouts
- music
- dialogue
- recognizable copyrighted art assets

Contemporary startup phenomena can be referenced generically when factually relevant, but the game should not depend on third-party IP for humor or comprehension.

Generated personalization can change surface wording only. It cannot invent economic effects, costs, probabilities, valuation rules, financing terms, or upgrade mechanics.

---

# Validation before declaring the refactor complete

Do not call V1 complete until:

1. all accounting invariants pass
2. same seed plus same action log is deterministic
3. all six rooms have satisfying manual implementations
4. all six rooms support mouse, trackpad, and touch
5. 320 x 568 mobile portrait is fully playable
6. desktop layouts use extra space rather than simply scaling everything up
7. resizing/rotation never alters economic truth
8. installable PWA requirements pass on supported target browsers
9. active runs survive refresh/restart
10. cached core gameplay survives temporary network loss
11. agents visibly perform canonical room work
12. Complexity can punish over-automation
13. debt, VC, and bootstrap paths remain distinct
14. Founder Ownership is mathematically correct through repeated financing rounds
15. first-run onboarding teaches the entire core grammar
16. the balance harness still shows at least five plausible non-identical unicorn paths
17. no third-party IP is required for the base game
18. GenAI can be disabled without breaking mechanics
19. human playtesting remains flagged as required for motor feel, fun, comprehension, and repeat-run desire

At the end of each implementation pass, report:

- what V0 code was reused
- what V0 code was removed/replaced
- what V1 systems were implemented
- tests executed and their result
- simulation/balance changes, if any
- responsive/PWA checks executed
- known remaining work
- any conflict with canonical product truth

Do not push or commit unless the user explicitly asks.
