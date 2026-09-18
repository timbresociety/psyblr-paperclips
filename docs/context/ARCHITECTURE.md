# Starter architecture

The starter is deliberately smaller than the archived simulation contract.

```text
contracts/game.ts        frozen semantic interface for current wave
state/fixture.ts          explicit teaching fixture, not production balance
state/reducer.ts          crude deterministic causal seam
components/*              stable cockpit perimeter
features/<function>/*     independently owned interaction presentation
```

## Rules

1. Economic meaning lives outside React components.
2. Pointer coordinates and animation state are presentation-only.
3. Feature rooms emit semantic actions. They do not write ARR/cash directly.
4. Shared contracts and reducer are single-owner during a parallel wave.
5. Fixture values remain clearly marked as fixtures.
6. The archived engine becomes relevant only when replacing a proven interaction seam with the production simulation.

## Greenfield progression

Do not begin by porting the entire archived engine. Sequence:

```text
working interaction fixture
→ observed causal comprehension
→ stable semantic action seam
→ production deterministic engine behind that seam
→ more functions
→ broader balance/simulation
```

This avoids making game feel depend on finishing accounting architecture first.
