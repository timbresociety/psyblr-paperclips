# V1 Agent Handoff Package

Drop this folder into the root of the existing V0 repository.

Then give your terminal coding agent the contents of:

```text
V1_REFACTOR_PROMPT.md
```

The agent should treat the current deployed/repository product as V0 and this package as the canonical V1 specification.

## Files

```text
product_final.md
  Canonical V1 product truth.

AGENTS.md
  Implementation contract and coding-agent rules.

README.md
  Compact engineering rulebook.

BALANCE_REPORT.md
  Quantitative baseline, simulation interpretation, and known balance risks.

V1_REFACTOR_PROMPT.md
  Self-contained prompt to start the V0 to V1 refactor.

simulate_v1.py
  Reproducible Monte Carlo balance harness.

simulation_output/
  Baseline outputs used by the current V1 calibration.
```

## Platform requirement

V1 is a responsive Canvas web game and installable PWA across mobile and desktop.

This requirement is canonical in `product_final.md` Section 28 and implemented through the contract in `AGENTS.md` Section 29.

Do not build desktop first and retrofit mobile later.

## Canonical priority

If files conflict:

```text
product_final.md
>
AGENTS.md
>
README.md / BALANCE_REPORT.md
>
current V0 behavior
```

Do not edit canonical product rules simply to preserve legacy V0 code.
