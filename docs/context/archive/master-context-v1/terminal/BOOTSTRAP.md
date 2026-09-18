# Adopt the SoloUnicorn master context

Use the full extracted folder and keep relative paths intact. Before implementation, replace `<PACK_PATH>` with the actual path and state the requested milestone.

```text
Implement SoloUnicorn using <PACK_PATH>/00_START_HERE.md as the context entry.
Read 00_START_HERE.md, AGENTS.md, CONTEXT.md, engine/METRICS.md,
engine/IMPLEMENTATION.md and ENGINEERING.md. Then read only the domain files
needed for this task. Inspect the repository's own instructions, branch,
dirty state, existing code and real commands before editing.

The product score is company valuation. Six operating functions are Demand,
Product, Monetisation, Retention, Expansion and Operations. Finance manages
cashflow and financing and is not a compulsory reflex minigame. Cash failure
occurs at an unpaid mandatory due obligation. Growth failure exists only after
an accepted VC mandate. The company continues while the founder inspects,
spends, routes agents and chooses post-quarter options unless explicitly
paused. Successful repeat founders intentionally retain permanent advantages.

Use engine/metric_registry.json, candidate_profile.json and event_contract.json
for numerical and event authority. Preserve ARR, earned revenue, receivables,
collections, cash, debt and ownership as separate state. Do not credit expected
output as actual work. GenAI can write contextual copy only after the engine
fixes the event, options, values and effect IDs.

Choose one bounded outcome from data/delivery_plan.json. Use the lowest capable
model and only bounded independent workers with one integration owner. Do not
fan out shared economy or reducer work. Run relevant tests and record exact
files, commands, seeds, versions and remaining gaps in an execution checkpoint.
Do not claim play balance, human acceptance or completion from a green build.
Do not push GitHub, publish, install paid services or change permissions unless
the actual task explicitly authorizes it.
```

## Root routing bridge

If the pack is copied into a repository, merge this into the repository's existing guide rather than replacing unrelated instructions:

```markdown
## SoloUnicorn master context

For SoloUnicorn work, read `context/solounicorn/00_START_HERE.md`, then
`AGENTS.md`, `CONTEXT.md`, `engine/METRICS.md` and the relevant domain files.
`DECISIONS.json` owns provenance, `engine/` owns numerical rules and
`ENGINEERING.md` owns implementation boundaries. Keep execution checkpoints
outside product canon.
```

After changing the bridge, start a fresh coding session and ask the agent to list the instruction paths it actually loaded. Run `python3 scripts/check_master.py` and `python3 engine/verify.py` from the extracted pack. Audit the live checkout separately; this context pack does not claim repository status.
