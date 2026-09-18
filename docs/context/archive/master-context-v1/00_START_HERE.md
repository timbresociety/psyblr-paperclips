# SoloUnicorn master context

**Revision:** `1.0-engine-consolidated`  
**Date:** 2026-09-07  
**Status:** canonical product and execution context for implementation

This folder is the authoritative handoff for the SoloUnicorn coding agent. It combines the original v4.1 context, the latest owner decisions and the quantitative engine package. The original uploaded pack was reviewed read-only. No GitHub repository was changed.

## Read order

At the beginning of a fresh implementation session, read:

1. `00_START_HERE.md`
2. `AGENTS.md`
3. `CONTEXT.md`
4. `engine/METRICS.md`
5. `engine/IMPLEMENTATION.md`
6. `ENGINEERING.md`

Then read only the domain files relevant to the task: `BALANCE.md`, `DESIGN.md`, `CONTENT.md`, `GAME_DESIGN.md`, `SCREENS.md`, `BUILD_PLAN.md`, `TERMINAL_AGENT.md`, and the relevant data/reference files.

The engine package is the numerical authority for the current candidate profile. The product documents own the player fantasy, interaction intent and presentation. `DECISIONS.json` records provenance and superseded rules. Do not resolve a conflict by choosing the newest-looking paragraph or by treating a generated example as approval.

## Current owner decisions

These are locked for the current engine and product direction:

- The north-star objective is the first valid **$1B company valuation**. Valuation is the score; ARR is the operating base; liquid cash is the currency.
- Failure occurs when the company cannot pay a **mandatory obligation at its due timestamp**. Cash reaching zero by itself is not failure. Optional unaffordable purchases are rejected or throttled.
- **Growth-or-failure applies only after an accepted VC mandate is active.** Bootstrap and debt-only companies do not have a universal growth deadline.
- The simulation runs continuously while the founder works manually, inspects metrics, plans upgrades, uses the Finance surface, chooses post-quarter options and manages the company. An explicit pause may freeze the clock; a shop or Finance panel is not an automatic pause.
- Overextension accumulates. Scale increases capacity and coordination strain; Automation increases speed, recurring cost, context rot and exception work; Operations must actively repair accumulated strain and rot.
- Luck gives a modest positive expected output with much wider swings. Shared shocks mean a swarm cannot average away all risk. Bad sequences can damage or ruin an overextended company.
- Subscription economics separate contractual ARR, earned revenue, invoices, receivables and collected cash. Collection timing and operating payments determine liquidity.
- Strong ARR and growth can outweigh a burn penalty. Profitable and venture-funded strategies can both win; funding does not create ARR.
- Six functions are manual operating functions: **Demand, Product, Monetisation, Retention, Expansion and Operations**. Finance is a cashflow-management domain, not a seventh reflex minigame.
- Successful founders intentionally receive persistent rerun advantages through founder history/relics. Failed runs award no new permanent power. The difficulty is not normalized to erase a winner's advantage, and this pack adds no arbitrary meta-power cap.
- Relic catalogue and relic balance are a separate later evaluation. This package defines their interface and reporting requirements without pretending that specific relic effects are final.

## Rules that supersede the uploaded v4 pack

The following older defaults must not be implemented in the active product:

| Older rule | Current rule |
|---|---|
| Every run chooses a growth commitment and dies on a miss | Only an accepted VC mandate creates a dated growth failure condition |
| Quarter-close shop/allocation freezes the business | The business continues while the founder evaluates and chooses; only an explicit pause or a short engine settlement transaction can freeze time |
| ARR can be treated as immediately collected cash | Service accrues first, invoices are issued, customers pay on a schedule and cash is collected separately |
| Finance is another reflex/minigame function or a mandatory four-axis work tree | Finance is a management surface for cash, bills, debt, equity and allocation; no forced motor loop |
| Relic power should be normalized so reruns stay as hard as a first run | Successful repeat founders are supposed to be stronger and easier; measure them separately |
| The old four-term ARR bridge is sufficient | Include new, expansion, contraction, churn, eligibility loss and restoration buckets so the bridge reconciles exactly |
| “Autonomy” is the progression axis name | The mechanical axis is **Automate**. Legacy copy may use “Autonomy” only when clearly marked as a stage label |
| Values marked candidate are already balanced | All numbers in `engine/candidate_profile.json` are candidate values: numerically specified, not play-balance validated |

## Folder map

| Path | Authority |
|---|---|
| `CONTEXT.md` | Product premise, player fantasy, loop and scope |
| `BALANCE.md` | Score, accounting, six-function causal model and calibration rules |
| `engine/` | Executable formulas, metric registry, schemas, event transitions, tests and evidence |
| `DESIGN.md` | Visual, motion, audio, responsive and accessibility standards |
| `GAME_DESIGN.md` | Decision quality, causality, pressure, mastery and originality |
| `CONTENT.md` | Voice, narrative envelopes, content and IP-safety contract |
| `SCREENS.md` | Player surfaces and information hierarchy |
| `ENGINEERING.md` | React/Canvas/PWA architecture, deterministic time, saves and input |
| `BUILD_PLAN.md` | Milestones, scope and acceptance evidence |
| `TERMINAL_AGENT.md` | Model routing, bounded delegation, context management and recovery |
| `DECISIONS.json` | Decision provenance and superseded instructions |
| `data/skill_tree_blueprint.json` | Long-term branch inventory, with Finance explicitly marked management-only |
| `data/parameter_registry.json` | Parameter maturity inventory and pointer to the engine registry |
| `data/delivery_plan.json` | Bounded implementation tasks and dependencies |
| `references/` | User/design reference images and their allowed interpretation |
| `terminal/` | Bootstrap, task/checkpoint templates and optional client config |
| `scripts/check_master.py` | Read-only master consistency checker |

## Numerical engine entry point

Run from this folder:

```bash
python3 engine/verify.py
```

This runs the 51 reference checks, registry lint and evidence generation. It checks accounting and state invariants; it does not prove player enjoyment, full-run balance or a 30–45 minute win. Read `engine/METRICS.md` for the complete model and `engine/IMPLEMENTATION.md` for the production adapter boundary.

Run the structural master check:

```bash
python3 scripts/check_master.py
```

Do not edit `engine/metric_registry.json` or the profile by hand without regenerating the derived catalogue and evidence. The reproducible source is `engine/build_contract.py`; `engine/emit_contract.py` regenerates the registry, schemas, transitions and catalogue.

## Implementation posture

Build the thin causal loop first: time, attention, Demand → Product → Monetisation, actual service billing/collection, one retention threat, one Expansion outcome, Operations pressure, cash purchase and local save. Then add broader automation, financing, content, relics and visual breadth. Do not author hundreds of rank cards before the causal loop is playable.

When a new feature is not yet implemented, disable its triggers and content pool. Do not satisfy a schema by giving it zero effects, free cash or placeholder economic authority. Keep generated narrative downstream of deterministic event envelopes.

Every completion report must distinguish:

- implementation status;
- numerical verification status;
- human interaction/playtest status;
- owner acceptance status;
- remaining content, asset and balance work.

An attractive screen, a green build or a large simulation count does not establish a finished game.
