# Terminal agent operating policy

This file governs agents building SoloUnicorn. It is a cost-aware execution policy, not product mechanics. The actual client, model availability and repository instructions take precedence.

## Route work by difficulty

Use the lowest capable model and only raise capability for a concrete unresolved problem. The names below are starting guidance and must be checked against the active client:

| Work | Starting tier |
|---|---|
| Mechanical extraction, link fixes, validated data transforms, small content batch | `gpt-5.6-luna`, low |
| Bounded UI/input/content implementation with known interfaces | `gpt-5.6-terra`, medium |
| ARR/cash edge cases, save migrations, exploit analysis, independent critical review | `gpt-5.6-sol`, high |
| Cross-system architecture conflict or repeated hard failure | `gpt-6-astra`, high, only as needed |
| Raster/image/audio asset production | Appropriate image/audio capability plus visual inspection |

Higher effort is not a quality guarantee. Do not run the strongest model for every JSON row or small CSS change. Record actual model/settings when exposed. Never claim a model switch happened without tool evidence.

## Choose the agent structure

One agent is the default for small or coupled work. Add one focused reviewer when independent reproduction reduces a real risk. Use at most two workers when outcomes have stable interfaces and non-overlapping files. One lead owns shared schemas, event order, candidate balance profile, effect registration and integration.

Good parallel tasks: visual gesture exploration against a frozen action schema, a bounded content batch against approved effect IDs, or an isolated test harness. Bad parallel tasks: several agents inventing churn/ARR rules, editing one reducer, changing the shared profile concurrently or authoring relic economics before effects exist.

Workers return outcome, file paths/diff identity, commands/tests, unresolved findings and the next dependency. The lead reviews diffs and runs integration gates. Do not create a swarm because the game has six functions; coordination cost and stale context are part of the decision.

## Context and task packets

At session start read `00_START_HERE.md`, `AGENTS.md`, `CONTEXT.md`, `engine/METRICS.md`, `engine/IMPLEMENTATION.md` and the relevant domain file. Search headings and read bounded slices of large JSON/docs. Do not load all reference images for a mechanical task.

Use `data/delivery_plan.json`, `terminal/TASK_TEMPLATE.md` and `terminal/CHECKPOINT_TEMPLATE.md`. A task packet contains one observable outcome, contract revision, file ownership, dependencies, acceptance checks and rollback/recovery. Keep progress/checkpoints outside canonical product rules.

Write a checkpoint before context compaction, model handoff, long waits and material milestones. On resume, inspect the checkpoint, actual branch/dirty state, current contract revisions and last verified command. Do not rely on chat history or a worker summary as the sole product source.

## Safe iteration

Inspect current instructions and code before editing. Preserve unrelated changes. Use targeted `rg`/diffs and save long logs to artifacts. Run the smallest relevant checks first, then required integration gates. Stop optional testing after the declared risk is answered. Do not repeat a blocked operation or fan out speculative work.

Do not push GitHub, publish, install paid services, send messages, alter access or change global configuration unless the actual task explicitly authorizes it. Do not use network availability, LLM output, client frame rate or viewport dimensions as economic inputs.

## Quality gate

Completion means the requested behavior is implemented, integrated and evidenced. Report real commands, tests, replay seeds, screenshots/recordings where needed, content/balance versions and remaining limitations. Keep arithmetic verification, human playtest and owner acceptance separate. A green build, screenshot, large run count or generated copy does not prove a fun or balanced game.
