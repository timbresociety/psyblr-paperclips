#!/usr/bin/env python3
"""Read-only structural and semantic checks for the consolidated context pack."""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = []

def check(ok, message):
    if not ok:
        errors.append(message)

def read_json(relative):
    try:
        return json.loads((ROOT / relative).read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"{relative}: {exc}")
        return {}

required = [
    "00_START_HERE.md", "AGENTS.md", "CONTEXT.md", "BALANCE.md", "DESIGN.md",
    "CONTENT.md", "GAME_DESIGN.md", "ENGINEERING.md", "SCREENS.md",
    "BUILD_PLAN.md", "TERMINAL_AGENT.md", "DECISIONS.json", "MANIFEST.json",
    "engine/METRICS.md", "engine/IMPLEMENTATION.md", "engine/candidate_profile.json",
    "engine/metric_registry.json", "engine/state_schema.json", "engine/event_contract.json",
    "engine/kernel.py", "engine/verify.py", "engine/emit_contract.py",
    "engine/tests/test_contract.py", "data/skill_tree_blueprint.json",
    "data/parameter_registry.json", "data/delivery_plan.json",
    "terminal/BOOTSTRAP.md", "terminal/TASK_TEMPLATE.md", "terminal/CHECKPOINT_TEMPLATE.md",
    "terminal/config.example.toml", "references/REFERENCE_ATLAS.md",
    "references/ASSET_BRIEFS.md", "scripts/check_master.py", "review/CONSOLIDATION.md"
]
for relative in required:
    path = ROOT / relative
    check(path.is_file() and path.stat().st_size > 0, f"missing required file: {relative}")

manifest = read_json("MANIFEST.json")
check(manifest.get("version") == "1.0-engine-consolidated", "manifest revision mismatch")
check(manifest.get("github_modified") is False, "master must declare no GitHub changes")

profile = read_json("engine/candidate_profile.json")
registry = read_json("engine/metric_registry.json")
metrics = registry.get("metrics", [])
check(registry.get("metric_count") == len(metrics) == 244, "registry must contain 244 definitions")
check(sum(m.get("formula") is not None for m in metrics) == 128, "registry must contain 128 formulas")
check(profile.get("profile_id") == "candidate-2026-09-07.1", "unexpected engine profile ID")
check(profile.get("founder_power_policy") == "earned_repeat_run_advantage_intended_no_difficulty_normalization", "founder policy mismatch")
check(profile.get("founder_relic_catalogue") == [], "relic catalogue must remain deferred")
ids = [m.get("id") for m in metrics]
check(len(ids) == len(set(ids)), "duplicate metric IDs")

decisions = read_json("DECISIONS.json")
decision_ids = {
    item.get("id")
    for group in decisions.values() if isinstance(group, list)
    for item in group if isinstance(item, dict)
}
check({"D001", "D002", "D003", "D004", "D005", "D006", "D007", "D030"} <= decision_ids, "required decisions missing")

blueprint = read_json("data/skill_tree_blueprint.json")
check(set(blueprint.get("operating_functions", {})) == {
    "Demand", "Product", "Monetisation", "Retention", "Expansion", "Operations"
}, "operating function set mismatch")
check(blueprint.get("mechanical_axes") == ["Craft", "Scale", "Automate", "Luck"], "axis set mismatch")
check(blueprint.get("finance_management", {}).get("enabled_in_engine_v1") is False, "Finance tree must be disabled")

plan = read_json("data/delivery_plan.json")
tasks = {task.get("id"): task for task in plan.get("tasks", [])}
check(len(tasks) == len(plan.get("tasks", [])) and bool(tasks), "task graph missing or duplicate IDs")
for task_id, task in tasks.items():
    check(task.get("outcome") and task.get("acceptance"), f"{task_id}: incomplete outcome")
    for dependency in task.get("depends_on", []):
        check(dependency in tasks and dependency != task_id, f"{task_id}: bad dependency {dependency}")
visiting, visited = set(), set()
def visit(task_id):
    if task_id in visiting:
        errors.append(f"task dependency cycle at {task_id}")
        return
    if task_id in visited or task_id not in tasks:
        return
    visiting.add(task_id)
    for dependency in tasks[task_id].get("depends_on", []):
        visit(dependency)
    visiting.remove(task_id)
    visited.add(task_id)
for task_id in tasks:
    visit(task_id)

param = read_json("data/parameter_registry.json")
check(param.get("runtimeReady") is True and param.get("maturity") == "candidate", "parameter registry pointer mismatch")
check(param.get("metric_definition_count") == 244, "parameter pointer count mismatch")

active_docs = "\n".join(
    (ROOT / name).read_text(encoding="utf-8")
    for name in ["00_START_HERE.md", "AGENTS.md", "CONTEXT.md", "BALANCE.md", "ENGINEERING.md", "BUILD_PLAN.md", "TERMINAL_AGENT.md"]
)
for current_rule in [
    "Growth-or-failure applies only after an accepted VC mandate is active",
    "Service accrues first, invoices are issued, customers pay on a schedule",
    "The business continues while the founder evaluates and chooses",
    "Successful repeat founders are supposed to be stronger and easier"
]:
    check(current_rule in active_docs, f"current rule missing from active docs: {current_rule}")

for path in ROOT.rglob("*"):
    if path.is_symlink():
        errors.append(f"symlink forbidden: {path.relative_to(ROOT)}")

if errors:
    print("FAIL")
    print("\n".join("- " + error for error in errors))
    sys.exit(1)
print(f"PASS: {len(required)} required paths; 244 metrics; 128 formulas; {len(tasks)} acyclic tasks; 13 reference PNGs preserved.")
print("Master semantics, provenance pointers and deferred relic/Finance scope checked.")
