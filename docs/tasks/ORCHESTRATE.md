# Root Codex orchestration prompt

Use this file as the root task after the starter itself runs.

1. Read `AGENTS.md` and `tasks/README.md`.
2. Run the starter once before delegating. If it does not boot, fix only the bootstrap first.
3. Freeze shared contracts for Wave 1.
4. If collaboration/subagent tools are available, delegate S01, S02, S03 and S04 concurrently. Use each task's preferred model when model routing is exposed; otherwise use the closest capable available model.
5. Workers may write only their owned paths. Reject scope expansion.
6. When all workers return, perform I01 yourself using GPT-6 Astra/high if available.
7. Run browser acceptance on desktop and mobile portrait. A green build is insufficient.
8. Run `R01_TASTE_GAMEPLAY_REVIEW.md` as a read-only independent critic using Astra/high (or strongest available reasoning model). Do not let the critic rewrite product scope.
9. Fix only the blocking findings tied to the approved contract or review rubric.
10. Stop after I01 + R01 and report the observed quality of the first-customer loop. Do not automatically start Wave 2.

The decision to continue is empirical: continue only if the first loop is understandable enough that adding Retention/Expansion/Operations tests a new hypothesis rather than hiding a weak core loop.
