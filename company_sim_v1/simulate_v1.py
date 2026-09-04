#!/usr/bin/env python3
"""Monte Carlo balance harness for the V1 one-person company roguelite.

This model validates the deterministic economy and relative build viability. It is
not a substitute for human playtesting of feel, comprehension, or motor skill.
"""
from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

ROOMS = ["marketing", "product", "monetization", "retention", "expansion", "operations"]
BASE_FULL_FOUNDER = {
    "marketing": 12.0,
    "product": 10.0,
    "monetization": 30.0,
    "retention": 10.0,
    "expansion": 8.0,
    "operations": 12.0,
}

AGENT_THROUGHPUT = [0.0, 0.60, 1.30, 2.60, 4.50]
AGENT_RELIABILITY = [0.0, 0.72, 0.84, 0.90, 0.94]
AGENT_TOTAL_INSTALL_CU = [0.0, 1.0, 3.0, 7.0, 14.0]
AGENT_QUARTERLY_CU = [0.0, 0.45, 0.90, 1.80, 3.00]
AGENT_COMPLEXITY = [0.0, 1.0, 1.5, 3.0, 5.0]

STRATEGY_ALLOC = {
    "balanced": dict(zip(ROOMS, [0.22, 0.22, 0.08, 0.18, 0.12, 0.18])),
    "product_led": dict(zip(ROOMS, [0.15, 0.32, 0.08, 0.15, 0.12, 0.18])),
    "ragebait": dict(zip(ROOMS, [0.32, 0.20, 0.08, 0.14, 0.08, 0.18])),
    "nrr_machine": dict(zip(ROOMS, [0.12, 0.18, 0.06, 0.24, 0.24, 0.16])),
    "autonomous": dict(zip(ROOMS, [0.14, 0.18, 0.06, 0.16, 0.12, 0.34])),
    "debt_growth": dict(zip(ROOMS, [0.27, 0.25, 0.08, 0.12, 0.10, 0.18])),
    "vc_blitz": dict(zip(ROOMS, [0.27, 0.24, 0.08, 0.13, 0.10, 0.18])),
}

STRATEGY_PRIORITY = {
    "balanced": ["marketing", "product", "retention", "operations", "monetization", "expansion"],
    "product_led": ["product", "marketing", "operations", "retention", "monetization", "expansion"],
    "ragebait": ["marketing", "product", "monetization", "operations", "retention", "expansion"],
    "nrr_machine": ["retention", "expansion", "product", "operations", "marketing", "monetization"],
    "autonomous": ["operations", "product", "marketing", "retention", "monetization", "expansion"],
    "debt_growth": ["marketing", "product", "monetization", "operations", "retention", "expansion"],
    "vc_blitz": ["marketing", "product", "monetization", "operations", "retention", "expansion"],
}

PRESEED_SAFE_CAP = 15e6
STAGE_PRE_MONEY = {"seed": 20.2e6, "A": 65.6e6, "B": 166e6}
STAGE_BENCHMARK_RAISE = {"preseed": 1.5e6, "seed": 4.1e6, "A": 14.4e6, "B": 25e6}
STAGE_ARR_THRESHOLD = {"preseed": 0.20e6, "seed": 1e6, "A": 5e6, "B": 20e6}

HISTORY = {
    "fresh": {"room": None, "boost": 1.0, "ops": 0.0, "cost_ratio": 0.30, "preseed": 1.0, "seed": 1.0},
    "vibe_coder": {"room": "product", "boost": 1.12, "ops": 0.0, "cost_ratio": 0.30, "preseed": 1.0, "seed": 1.0},
    "distribution_native": {"room": "marketing", "boost": 1.12, "ops": 0.0, "cost_ratio": 0.30, "preseed": 1.0, "seed": 1.0},
    "monetization_nerd": {"room": "monetization", "boost": 1.12, "ops": 0.0, "cost_ratio": 0.30, "preseed": 1.0, "seed": 1.0},
    "customer_obsessive": {"room": "retention", "boost": 1.12, "ops": 0.0, "cost_ratio": 0.30, "preseed": 1.0, "seed": 1.0},
    "enterprise_operator": {"room": "expansion", "boost": 1.12, "ops": 0.0, "cost_ratio": 0.30, "preseed": 1.0, "seed": 1.0},
    "systems_operator": {"room": None, "boost": 1.0, "ops": 1.5, "cost_ratio": 0.30, "preseed": 1.0, "seed": 1.0},
    "bootstrapper": {"room": None, "boost": 1.0, "ops": 0.0, "cost_ratio": 0.26, "preseed": 1.0, "seed": 1.0},
    "repeat_founder": {"room": None, "boost": 1.0, "ops": 0.0, "cost_ratio": 0.30, "preseed": 1.30, "seed": 1.15},
}


def growth_multiple(growth: float) -> int:
    if growth < 0.0:
        return 2
    if growth < 0.10:
        return 4
    if growth < 0.25:
        return 6
    if growth < 0.50:
        return 10
    if growth < 0.75:
        return 14
    if growth < 1.00:
        return 20
    if growth < 1.50:
        return 28
    return 40


def loc_limit(arr: float, valuation: float) -> float:
    if arr < 500_000:
        return 0.0
    return min(0.15 * arr, 0.010 * valuation)


def loc_apr(multiple: int, utilization: float) -> float:
    risk_pp = {2: 0.10, 4: 0.08, 6: 0.06, 10: 0.03, 14: 0.01, 20: 0.0, 28: 0.0, 40: 0.0}[multiple]
    return 0.10 + 0.10 * min(1.0, max(0.0, utilization)) + risk_pp


@dataclass
class State:
    arr: float = 100_000.0
    cash: float = 25_000.0
    debt: float = 0.0
    ownership: float = 1.0
    multiple: int = 10
    agents: Dict[str, int] = field(default_factory=lambda: {r: 0 for r in ROOMS})
    ops_capacity: float = 4.0
    room_boost: Dict[str, float] = field(default_factory=lambda: {r: 1.0 for r in ROOMS})
    demand_backlog: float = 0.0
    activation_backlog: float = 0.0
    rounds: set = field(default_factory=set)
    raised: float = 0.0
    debt_peak: float = 0.0
    max_strain: float = 0.0
    peak_valuation: float = 1_000_000.0
    unicorn_q: Optional[int] = None
    bankrupt: bool = False
    growths: List[float] = field(default_factory=list)


def simulate(
    strategy: str,
    skill: float = 1.0,
    founder_history: str = "fresh",
    seed: Optional[int] = None,
    max_quarters: int = 16,
    first_run: bool = False,
) -> Tuple[State, pd.DataFrame, Optional[str]]:
    rng = np.random.default_rng(seed)
    hist_cfg = HISTORY[founder_history]
    s = State()
    s.ops_capacity += hist_cfg["ops"]
    if hist_cfg["room"]:
        s.room_boost[hist_cfg["room"]] *= hist_cfg["boost"]
    rows: List[dict] = []
    fail_reason = None

    for q in range(1, max_quarters + 1):
        start_arr = s.arr
        start_val = start_arr * s.multiple
        gu = max(25_000.0, 0.01 * start_arr)
        cu = max(5_000.0, 0.0075 * start_arr)

        # Fundraising policy for archetype simulations.
        for stage in ["preseed", "seed", "A", "B"]:
            if stage in s.rounds or start_arr < STAGE_ARR_THRESHOLD[stage]:
                continue
            take = strategy == "vc_blitz"
            raise_scale = 1.0
            if strategy == "balanced" and s.cash < 2.5 * cu and stage in ("preseed", "seed"):
                take, raise_scale = True, 0.5
            if strategy == "autonomous" and s.cash < 1.5 * cu and stage == "seed":
                take, raise_scale = True, 0.5
            if take:
                history_mod = hist_cfg["preseed"] if stage == "preseed" else hist_cfg["seed"] if stage == "seed" else 1.0
                cash_raised = STAGE_BENCHMARK_RAISE[stage] * raise_scale
                if stage == "preseed":
                    safe_cap = max(PRESEED_SAFE_CAP * history_mod, 0.75 * start_val)
                    dilution = min(0.35, cash_raised / safe_cap)
                else:
                    pre_money = max(STAGE_PRE_MONEY[stage] * history_mod, 0.65 * start_val)
                    dilution = cash_raised / (pre_money + cash_raised)
                s.cash += cash_raised
                s.ownership *= (1.0 - dilution)
                s.raised += cash_raised
                s.rounds.add(stage)

        # Credit policy for debt build and emergency liquidity.
        current_limit = loc_limit(start_arr, start_val)
        if current_limit > 0:
            if strategy == "debt_growth":
                target_debt = min(0.90 * current_limit, 7.0 * cu)
                if s.debt < target_debt:
                    draw = target_debt - s.debt
                    s.debt += draw
                    s.cash += draw
            elif s.cash < 0.5 * cu and strategy in ("balanced", "product_led", "nrr_machine", "autonomous"):
                target_debt = min(0.60 * current_limit, 2.0 * cu)
                if s.debt < target_debt:
                    draw = target_debt - s.debt
                    s.debt += draw
                    s.cash += draw
        s.debt_peak = max(s.debt_peak, s.debt)

        # Automation purchases. More aggressive builds buy more automation sooner.
        if q >= 3:
            max_level = 1 if q <= 4 else 2 if q <= 6 else 3 if q <= 9 else 4
            if strategy == "autonomous":
                max_level = min(4, max_level + (1 if q >= 5 else 0))
            if strategy == "vc_blitz":
                max_level = min(4, max_level + (1 if q >= 4 else 0))
            passes = 2 if strategy == "balanced" else 4 if strategy in ("vc_blitz", "debt_growth", "autonomous") else 3
            for _ in range(passes):
                purchased = False
                for room in STRATEGY_PRIORITY[strategy]:
                    lvl = s.agents[room]
                    if lvl >= max_level:
                        continue
                    increment = (AGENT_TOTAL_INSTALL_CU[lvl + 1] - AGENT_TOTAL_INSTALL_CU[lvl]) * cu
                    projected_complexity = sum(AGENT_COMPLEXITY[s.agents[r]] for r in ROOMS) - AGENT_COMPLEXITY[lvl] + AGENT_COMPLEXITY[lvl + 1]
                    strain_threshold = 1.30 if strategy == "ragebait" else 1.15
                    while projected_complexity / s.ops_capacity > strain_threshold and s.cash > increment + 3.75 * cu:
                        s.cash -= 3.0 * cu
                        s.ops_capacity += 4.0
                    reserve = (1.25 if strategy in ("balanced", "product_led", "nrr_machine") else 0.40) * cu
                    if s.cash - increment > reserve:
                        s.cash -= increment
                        s.agents[room] = lvl + 1
                        purchased = True
                        break
                if not purchased:
                    break

        # One representative run-upgrade purchase each quarter. The detailed 48-item pool
        # is specified in product_final.md. This harness models its average room effect.
        if q >= 2:
            cost_cu = 1.0 if q < 5 else 2.0 if q < 9 else 3.0
            if s.cash > (cost_cu + 0.75) * cu:
                relevant_probability = 0.78 if skill >= 1.0 else 0.68
                room = STRATEGY_PRIORITY[strategy][(q - 2) % len(ROOMS)] if rng.random() < relevant_probability else rng.choice(ROOMS)
                s.cash -= cost_cu * cu
                if room == "operations":
                    s.ops_capacity += 3.0
                else:
                    s.room_boost[room] *= 1.15

        complexity = sum(AGENT_COMPLEXITY[s.agents[r]] for r in ROOMS)
        complexity += sum(max(0.0, math.log(max(1.0, b), 1.15)) for b in s.room_boost.values()) * 0.15
        strain = complexity / s.ops_capacity
        s.max_strain = max(s.max_strain, strain)
        if strain <= 1.0:
            reliability_mult, ops_churn_rate, cost_leak_rate = 1.0, 0.0, 0.0
        elif strain <= 1.25:
            reliability_mult, ops_churn_rate, cost_leak_rate = 0.95, 0.004, 0.03
        elif strain <= 1.50:
            reliability_mult, ops_churn_rate, cost_leak_rate = 0.90, 0.012, 0.08
        else:
            reliability_mult, ops_churn_rate, cost_leak_rate = 0.75, 0.040, 0.18

        # One meaningful situation archetype per simulated quarter. The shipped game uses
        # one or two readable situations, but the economic aggregate is represented here.
        event_names = ["neutral", "market_up", "market_down", "bugs", "churn", "cost", "catastrophe"]
        event_probs = [0.41, 0.12, 0.10, 0.10, 0.12, 0.10, 0.05]
        if first_run and q <= 4:
            event_probs = [0.60, 0.15, 0.05, 0.06, 0.07, 0.07, 0.0]
        event = str(rng.choice(event_names, p=event_probs))
        market_mod, bug_mod, churn_mod, cost_extra = 1.0, 1.0, 1.0, 0.0
        if event == "market_up":
            market_mod = 1.28
        elif event == "market_down":
            market_mod = 0.72
        elif event == "bugs":
            bug_mod = 2.20
        elif event == "churn":
            churn_mod = 1.80
        elif event == "cost":
            cost_extra = (0.75 + 1.25 * rng.random()) * cu
        elif event == "catastrophe":
            market_mod, bug_mod, churn_mod = 0.75, 2.0, 2.0
            mitigation = min(0.65, max(0.0, (s.ops_capacity - complexity) / max(4.0, s.ops_capacity)) + 0.15)
            cost_extra = (3.0 + 3.0 * rng.random()) * cu * (1.0 - mitigation)

        market = rng.lognormal(-0.5 * 0.12**2, 0.12) * market_mod
        manual = {}
        for room in ROOMS:
            execution = max(0.60, min(1.30, rng.normal(skill, 0.08)))
            manual[room] = BASE_FULL_FOUNDER[room] * STRATEGY_ALLOC[strategy][room] * execution * s.room_boost[room]
        agent_capacity = {
            room: BASE_FULL_FOUNDER[room]
            * AGENT_THROUGHPUT[s.agents[room]]
            * AGENT_RELIABILITY[s.agents[room]]
            * reliability_mult
            * s.room_boost[room]
            for room in ROOMS
        }

        # Marketing creates Demand GU.
        demand_units = (manual["marketing"] * 0.95 + agent_capacity["marketing"]) * market
        low_quality_share = 0.08
        if strategy == "ragebait" and q >= 5:
            demand_units *= 2.0
            low_quality_share = 0.35

        # Product converts Demand GU into Activation GU and can create bug pressure.
        available_demand = s.demand_backlog + demand_units
        product_capacity = manual["product"] + agent_capacity["product"]
        activated_units = min(available_demand, product_capacity)
        s.demand_backlog = max(0.0, available_demand - activated_units)
        manual_error = max(0.02, 0.10 - 0.055 * skill)
        lvl = s.agents["product"]
        agent_error = (1.0 - AGENT_RELIABILITY[lvl] * reliability_mult) if lvl else 0.0
        weighted_error = (manual["product"] * manual_error + agent_capacity["product"] * agent_error) / max(product_capacity, 1e-9)
        bug_units = activated_units * min(0.85, weighted_error * bug_mod)

        # Monetization converts Activation GU into new-customer ARR.
        available_activation = s.activation_backlog + activated_units
        monetization_capacity = manual["monetization"] + agent_capacity["monetization"]
        priced_units = min(available_activation, monetization_capacity)
        s.activation_backlog = max(0.0, available_activation - priced_units)
        manual_priced = min(priced_units, manual["monetization"])
        agent_priced = max(0.0, priced_units - manual_priced)
        lvl = s.agents["monetization"]
        agent_capture = [0.0, 0.78, 0.90, 0.97, 1.02][lvl] * reliability_mult if lvl else 0.0
        new_customer_units = manual_priced * (1.0 + 0.10 * (skill - 1.0)) + agent_priced * agent_capture

        # Expansion creates ARR from the installed base, capped as a share of starting ARR.
        expansion_capacity = manual["expansion"] + agent_capacity["expansion"]
        expansion_yield, expansion_cap_rate = (0.60, 0.14) if strategy == "nrr_machine" else (0.45, 0.08)
        expansion_arr = min(expansion_capacity * expansion_yield * gu, start_arr * expansion_cap_rate)
        expansion_error = max(0.03, 0.11 - 0.05 * skill)
        if s.agents["expansion"]:
            expansion_error = (expansion_error + (1.0 - AGENT_RELIABILITY[s.agents["expansion"]] * reliability_mult)) / 2.0
        bad_expansion_units = expansion_capacity * expansion_error * 0.17

        new_customer_arr = new_customer_units * gu
        low_quality_arr = new_customer_arr * low_quality_share

        # Retention only affects churn. It never manufactures positive ARR.
        churn_threat = (
            0.035 * start_arr * churn_mod
            + 0.14 * low_quality_arr
            + bug_units * gu * 0.70
            + bad_expansion_units * gu
            + ops_churn_rate * start_arr
        )
        retention_capacity = (manual["retention"] + agent_capacity["retention"]) * gu
        churned_arr = max(0.0, churn_threat - retention_capacity)

        end_arr = max(0.0, start_arr + new_customer_arr + expansion_arr - churned_arr)
        growth = (end_arr - start_arr) / start_arr
        s.growths.append(growth)
        multiple = growth_multiple(growth)
        valuation = end_arr * multiple
        s.arr, s.multiple = end_arr, multiple
        s.peak_valuation = max(s.peak_valuation, valuation)

        # Cash collections use average ARR over the quarter divided by four.
        quarter_collections = ((start_arr + end_arr) / 2.0) / 4.0
        base_cash_cost = hist_cfg["cost_ratio"] * quarter_collections
        agent_recurring = sum(AGENT_QUARTERLY_CU[s.agents[r]] for r in ROOMS) * cu
        cost_leak = cost_leak_rate * quarter_collections
        current_limit = loc_limit(start_arr, start_val)
        utilization = s.debt / current_limit if current_limit > 0 else 0.0
        interest = s.debt * loc_apr(s.multiple, utilization) / 4.0
        s.cash += quarter_collections - base_cash_cost - agent_recurring - cost_leak - interest - cost_extra

        # Conservative repayment behavior. Debt build intentionally carries more leverage.
        if s.debt > 0 and strategy != "debt_growth" and s.cash > 5.0 * cu:
            repay = min(s.debt, (s.cash - 5.0 * cu) * 0.50)
            s.cash -= repay
            s.debt -= repay
        if strategy == "debt_growth" and s.debt > 0 and s.cash > 14.0 * cu:
            repay = min(s.debt, (s.cash - 14.0 * cu) * 0.35)
            s.cash -= repay
            s.debt -= repay

        # Emergency draw, then bankruptcy if liquidity is still negative.
        current_limit = loc_limit(start_arr, start_val)
        available_credit = max(0.0, current_limit - s.debt)
        if s.cash < 0.0:
            if available_credit > 0.0:
                draw = min(available_credit, -s.cash + 0.5 * cu)
                s.cash += draw
                s.debt += draw
            if s.cash < 0.0:
                s.bankrupt = True
                fail_reason = "bankruptcy"

        if valuation >= 1e9 and s.unicorn_q is None:
            s.unicorn_q = q

        rows.append(
            {
                "quarter": q,
                "event": event,
                "start_arr": start_arr,
                "new_customer_arr": new_customer_arr,
                "expansion_arr": expansion_arr,
                "churned_arr": churned_arr,
                "end_arr": end_arr,
                "growth": growth,
                "multiple": multiple,
                "valuation": valuation,
                "cash": s.cash,
                "debt": s.debt,
                "ownership": s.ownership,
                "complexity": complexity,
                "ops_capacity": s.ops_capacity,
                "strain": strain,
                "gu": gu,
                "cu": cu,
            }
        )
        if s.unicorn_q is not None or s.bankrupt:
            break

    return s, rows, fail_reason


def summarize(runs: int, skills: List[float], out_dir: Path) -> pd.DataFrame:
    rows = []
    for skill in skills:
        for strategy in STRATEGY_ALLOC:
            unicorn_q, peak_val, ownership, debt_peak, raised, strain, bankrupt = [], [], [], [], [], [], 0
            for i in range(runs):
                s, _, reason = simulate(strategy, skill=skill, seed=10_000_000 + i + int(skill * 1000))
                if s.unicorn_q is not None:
                    unicorn_q.append(s.unicorn_q)
                peak_val.append(s.peak_valuation)
                ownership.append(s.ownership)
                debt_peak.append(s.debt_peak)
                raised.append(s.raised)
                strain.append(s.max_strain)
                bankrupt += int(reason == "bankruptcy")
            rows.append(
                {
                    "skill": skill,
                    "strategy": strategy,
                    "unicorn_rate": len(unicorn_q) / runs,
                    "median_unicorn_q": float(np.median(unicorn_q)) if unicorn_q else np.nan,
                    "p25_unicorn_q": float(np.percentile(unicorn_q, 25)) if unicorn_q else np.nan,
                    "p75_unicorn_q": float(np.percentile(unicorn_q, 75)) if unicorn_q else np.nan,
                    "bankruptcy_rate": bankrupt / runs,
                    "median_peak_valuation_b": float(np.median(peak_val) / 1e9),
                    "median_founder_ownership": float(np.median(ownership)),
                    "median_peak_debt_m": float(np.median(debt_peak) / 1e6),
                    "median_capital_raised_m": float(np.median(raised) / 1e6),
                    "p95_max_strain": float(np.percentile(strain, 95)),
                }
            )
    df = pd.DataFrame(rows)
    df.to_csv(out_dir / "simulation_summary.csv", index=False)
    return df


def commitment_feasibility(runs: int, out_dir: Path, grace_quarters: int = 4) -> pd.DataFrame:
    targets = [0.10, 0.25, 0.50, 0.75, 1.00]
    rows = []
    for strategy in STRATEGY_ALLOC:
        histories = []
        for i in range(runs):
            s, _, _ = simulate(strategy, skill=1.0, seed=20_000_000 + i)
            histories.append(s)
        for target in targets:
            survived = 0
            for s in histories:
                end_q = s.unicorn_q if s.unicorn_q is not None else len(s.growths)
                tested = s.growths[grace_quarters:end_q]
                if not tested:
                    continue
                if all(g >= target for g in tested) and s.unicorn_q is not None:
                    survived += 1
            rows.append({"strategy": strategy, "growth_commitment": target, "unicorn_while_never_missing_after_q4": survived / runs})
    df = pd.DataFrame(rows)
    df.to_csv(out_dir / "growth_commitment_feasibility.csv", index=False)
    return df


def history_sensitivity(runs: int, out_dir: Path) -> pd.DataFrame:
    mapping = {
        "fresh": "product_led",
        "vibe_coder": "product_led",
        "distribution_native": "ragebait",
        "monetization_nerd": "product_led",
        "customer_obsessive": "nrr_machine",
        "enterprise_operator": "nrr_machine",
        "systems_operator": "autonomous",
        "bootstrapper": "balanced",
        "repeat_founder": "vc_blitz",
    }
    rows = []
    for history, strategy in mapping.items():
        qs, own, peak = [], [], []
        for i in range(runs):
            s, _, _ = simulate(strategy, skill=1.0, founder_history=history, seed=30_000_000 + i)
            if s.unicorn_q is not None:
                qs.append(s.unicorn_q)
            own.append(s.ownership)
            peak.append(s.peak_valuation)
        rows.append(
            {
                "history": history,
                "tested_strategy": strategy,
                "unicorn_rate": len(qs) / runs,
                "median_unicorn_q": float(np.median(qs)) if qs else np.nan,
                "median_founder_ownership": float(np.median(own)),
                "median_peak_valuation_b": float(np.median(peak) / 1e9),
            }
        )
    df = pd.DataFrame(rows)
    df.to_csv(out_dir / "history_sensitivity.csv", index=False)
    return df


def valuation_math(out_dir: Path) -> pd.DataFrame:
    rows = []
    for growth in [0.10, 0.25, 0.50, 0.75, 1.00, 1.50]:
        arr = 100_000.0
        multiple = growth_multiple(growth)
        hit_q = None
        val = arr * multiple
        for q in range(1, 25):
            arr *= 1.0 + growth
            val = arr * multiple
            if hit_q is None and val >= 1e9:
                hit_q = q
                break
        rows.append({"constant_quarterly_growth": growth, "multiple": multiple, "unicorn_quarter": hit_q, "arr_at_crossing": arr, "valuation_at_crossing": val})
    df = pd.DataFrame(rows)
    df.to_csv(out_dir / "valuation_math.csv", index=False)
    return df


def first_run_trace(out_dir: Path) -> pd.DataFrame:
    # Fixed seed only verifies economy pacing. The onboarding unlock sequence is deterministic
    # content logic and is documented separately.
    _, rows, _ = simulate("product_led", skill=0.95, seed=404, first_run=True)
    h = pd.DataFrame(rows)
    h.to_csv(out_dir / "first_run_economic_trace.csv", index=False)
    return h


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=2000)
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent / "simulation_output")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    summary = summarize(args.runs, [0.85, 1.00, 1.12], args.out)
    commitments = commitment_feasibility(args.runs, args.out)
    histories = history_sensitivity(args.runs, args.out)
    math_df = valuation_math(args.out)
    first_trace = first_run_trace(args.out)

    report = {
        "runs_per_cell": args.runs,
        "summary_rows": len(summary),
        "commitment_rows": len(commitments),
        "history_rows": len(histories),
        "valuation_rows": len(math_df),
        "first_run_rows": len(first_trace),
    }
    (args.out / "simulation_manifest.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
