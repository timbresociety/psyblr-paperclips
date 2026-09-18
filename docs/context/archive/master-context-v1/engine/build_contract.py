"""Build the quantitative contract. Standard library only; no network access."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROFILE = {
    "profile_id": "candidate-2026-09-07.1",
    "status": "numerically_specified_not_play_balanced",
    "tick_seconds": 0.1,
    "ticks_per_month": 600,
    "months_per_quarter": 3,
    "score_history_ticks": 1800,
    "forecast_ticks": 1800,
    "starting_cash_cents": 150000,
    "win_valuation_cents": 100000000000,
    "arr_floor_cents": 1200000,
    "revenue_floor_cents_per_month": 10000,
    "growth_knots": [[-1,1],[-0.5,2],[0,4],[0.25,6],[0.5,8],[1,12],[2,18],[4,26]],
    "burn_weight": 0.4,
    "shortfall_weight": 1.5,
    "capital_factor_floor": 0.05,
    "craft_batch_by_rank": [1,2,4,8,16],
    "units_by_scale_rank": [1,2,4,8,16],
    "auto_speed_by_rank": [0,0.35,0.8,1.6,3.2],
    "auto_upkeep_cents_per_unit_month": [0,3000,7000,18000,50000],
    "unit_upkeep_cents_per_month": 1000,
    "base_company_overhead_cents_per_month": 10000,
    "queue_slots_per_unit": 12,
    "strain_speed_coefficient": 0.35,
    "strain_error_coefficient": 0.08,
    "rot_error_coefficient": 0.45,
    "max_error_probability": 0.95,
    "rework_units_per_failure": 1.5,
    "rot_per_auto_attempt_base": 0.0008,
    "rot_per_auto_attempt_rank": 0.0004,
    "rot_per_configuration_change": 0.025,
    "rot_recovery_per_maintenance_point": 0.008,
    "coordination_base_capacity": 12,
    "coordination_capacity_per_ops_unit": 4,
    "coordination_pair_load": 0.04,
    "strain_repair_load_per_maintenance_point": 0.5,
    "product_capability_gain_per_output": 0.02,
    "defect_added_per_bad_ship": 0.05,
    "defect_removed_per_fix_output": 0.02,
    "incident_added_per_escaped_failure": 0.05,
    "incident_removed_per_ops_output": 0.02,
    "luck_mean_per_rank": 0.01,
    "luck_sd_per_rank": 0.16,
    "luck_shared_variance_fraction": 0.4,
    "luck_epoch_ticks": 200,
    "opportunity_ttl_ticks": 300,
    "churn_threat_ttl_ticks": 120,
    "collection_retry_ticks": 120,
    "collection_grace_ticks": 1200,
    "collection_attempt_limit": 3,
    "expansion_maturity_months": 2,
    "expansion_min_health": 60,
    "addon_slots_per_customer": 2,
    "addon_price_fraction": 0.25,
    "addon_service_cost_fraction": 0.30,
    "maximum_accepted_price_to_wtp": 2.0,
    "health_fit_gain": 12,
    "health_fit_neutral": 0.60,
    "health_defect_loss": 15,
    "health_overpricing_loss": 10,
    "health_care_gain": 8,
    "health_incident_loss": 5,
    "base_churn_monthly": 0.01,
    "churn_health_weight": 0.12,
    "churn_overpricing_weight": 0.04,
    "churn_defect_weight": 0.05,
    "churn_competition_weight": 0.02,
    "churn_min": 0.005,
    "churn_max": 0.35,
    "competition_start": 0.10,
    "competition_per_quarter": 0.025,
    "competition_cap": 0.85,
    "default_loan_apr_bps": 1800,
    "default_loan_term_months": 6,
    "debt_capacity_mrr_multiple": 3,
    "debt_min_mrr_cents": 10000,
    "default_vc_growth_bps": 5000,
    "default_vc_absolute_arr_cents": 1200000,
    "vc_min_arr_cents": 1200000,
    "vc_offer_pre_money_arr_multiple": 4,
    "vc_max_raise_fraction_bps": 2500,
    "upgrade_base_cents": 30000,
    "upgrade_cost_ratio": 6,
    "upgrade_deploy_ticks": 50,
    "forecast_collection_haircut": 0.80,
    "functions": {
        "demand": {"manual_seconds":2, "unit_load":1.0, "base_error":0.02, "attempt_cost_cents":100},
        "product": {"manual_seconds":6, "unit_load":1.4, "base_error":0.03, "attempt_cost_cents":25},
        "monetisation": {"manual_seconds":3, "unit_load":0.8, "base_error":0.02, "attempt_cost_cents":10},
        "retention": {"manual_seconds":4, "unit_load":0.8, "base_error":0.02, "attempt_cost_cents":50},
        "expansion": {"manual_seconds":6, "unit_load":1.2, "base_error":0.03, "attempt_cost_cents":25},
        "operations": {"manual_seconds":5, "unit_load":0.6, "base_error":0.02, "attempt_cost_cents":30, "mode":"maintain"}
    },
    "segments": {
        "creator":{"wtp_cents":4000,"service_cents_month":400,"needs":[0.7,0.2,0.1],"collection_probability":0.95,"collection_delay_ticks":60},
        "team":{"wtp_cents":15000,"service_cents_month":1800,"needs":[0.2,0.6,0.2],"collection_probability":0.98,"collection_delay_ticks":120},
        "enterprise":{"wtp_cents":80000,"service_cents_month":12000,"needs":[0.1,0.3,0.6],"collection_probability":0.90,"collection_delay_ticks":240}
    },
    "channels": {
        "community":{"reach_per_attempt":4,"cost_per_attempt_cents":100,"segment_weights":[0.7,0.25,0.05],"pool_per_month":1000},
        "paid":{"reach_per_attempt":12,"cost_per_attempt_cents":800,"segment_weights":[0.25,0.6,0.15],"pool_per_month":6000},
        "outbound":{"reach_per_attempt":2,"cost_per_attempt_cents":200,"segment_weights":[0.05,0.25,0.7],"pool_per_month":500}
    },
    "pressure_applies_to": ["qualification_probability","willingness_to_pay","churn_probability"],
    "founder_relic_catalogue": [],
    "founder_power_policy":"earned_repeat_run_advantage_intended_no_difficulty_normalization",
    "runtime_precision":{"money":"integer_cents","time":"integer_ticks","ratios":"binary64","score":"Decimal_28_then_floor_to_cents"}
}

M=[]
EVENT_BINDINGS={}
def metric(scope, id, unit, formula=None, *, default=0, low=0, high=None,
           kind=None, group=None, level="L3", writer=None, nullable=False,
           visibility="detail", meaning="", dtype="number", persistence=None):
    kind=kind or ("derived" if formula is not None else "state")
    if dtype=="number" and unit in ("count","ticks","cents","cents/month","cents/year","rank","basis_points"):
        dtype="integer" if formula is None else "number"
    record={
        "id":f"{scope}.{id}", "local_id":id, "scope":scope, "kind":kind,
        "group":group or scope, "level":level, "unit":unit,
        "value_type":dtype, "nullable":nullable, "default":default,
        "bounds":{"minimum":low,"maximum":high,"maximum_semantics":"unbounded_in_domain" if high is None else "inclusive"},
        "formula":formula,
        "writer":writer or (f"evaluate:{scope}" if formula is not None else f"validated_snapshot:{scope}.{id}"),
        "persistence":persistence or ("recompute" if formula is not None else "run"),
        "update_phase":"snapshot_evaluation" if formula is not None else "ordered_event_commit",
        "visibility":visibility,"meaning":meaning,
        "zero_denominator":"null" if nullable else "explicit_guard_in_formula_or_not_applicable",
        "source_of_truth":"formula" if formula is not None else "entity_or_event_state",
        "numerical_status":"candidate"
    }
    M.append(record)
    return record

# Session and founder history: categorical IDs/status objects are separately typed.
metric("run","tick","ticks",dtype="integer",writer="clock.advance",visibility="hud")
metric("run","active","boolean",default=True,low=None,dtype="boolean",kind="control",writer="session.resume_or_suspend")
metric("run","first_unicorn_tick","ticks",default=None,nullable=True,writer="milestone.check",level="L0")
metric("run","elapsed_seconds","seconds","tick * p['tick_seconds']",visibility="hud")
metric("run","elapsed_months","months","tick / p['ticks_per_month']")
metric("run","quarter_index","count","1 + tick // (p['ticks_per_month'] * p['months_per_quarter'])",visibility="hud")
metric("run","quarter_remaining_ticks","ticks","p['ticks_per_month'] * p['months_per_quarter'] - tick % (p['ticks_per_month'] * p['months_per_quarter'])")
metric("run","work_seconds","seconds",writer="clock.attention_mode")
metric("run","inspection_seconds","seconds",writer="clock.attention_mode")
metric("run","finance_seconds","seconds",writer="clock.attention_mode")
metric("run","shopping_seconds","seconds",writer="clock.attention_mode")
metric("run","idle_seconds","seconds",writer="clock.attention_mode")
metric("run","attention_accounting_error","seconds","elapsed_seconds - work_seconds - inspection_seconds - finance_seconds - shopping_seconds - idle_seconds",low=None,group="audit")
metric("founder","successful_runs","count",dtype="integer",writer="founder.record_success_once",persistence="founder")
metric("founder","failed_runs","count",dtype="integer",writer="founder.record_failure_once",persistence="founder")
metric("founder","owned_relic_count","count",dtype="integer",writer="count(founder.owned_relic_ids)",persistence="founder")
metric("founder","run_succeeded","boolean",default=False,dtype="boolean",low=None,writer="run.first_valid_unicorn_checkpoint")
metric("founder","relic_award_eligible","boolean","run_succeeded",dtype="boolean",low=None,group="founder",meaning="A failed run does not mint permanent relic power.")
metric("founder","starting_cash_bonus_cents","cents",writer="sum(founder_relic.start_cash_effects)",persistence="founder",meaning="No automatic bonus per win is invented; effects are supplied by the deferred relic catalogue.")

# Market: numeric controls, external seeded inputs, and explicit time pressure.
metric("market","completed_quarters","count",dtype="integer",writer="run.quarter_index - 1")
metric("market","capability_speed","ratio",default=.35,high=1,writer="product.development_commit")
metric("market","capability_collaboration","ratio",default=.15,high=1,writer="product.development_commit")
metric("market","capability_control","ratio",default=.05,high=1,writer="product.development_commit")
metric("market","channel_remaining_pool","count",default=1000,dtype="integer",writer="market.month_refill_or_demand_consumption")
metric("market","competition","ratio","min(p['competition_cap'], p['competition_start'] + completed_quarters * p['competition_per_quarter'])",high=1)
metric("market","qualified_demand_multiplier","ratio","1 - 0.2 * competition",high=1)
metric("market","wtp_market_multiplier","ratio","1 - 0.3 * competition",high=1)
metric("market","channel_pool_next_month","count","channel['pool_per_month']",dtype="integer")
metric("market","channel_reach_per_attempt","count","channel['reach_per_attempt']",dtype="integer")
metric("market","channel_cost_per_attempt_cents","cents","channel['cost_per_attempt_cents']",dtype="integer")

# Mechanical inputs; per-function template expands for each of the six functions.
for axis in ("craft","scale","automate","luck"):
    metric("function",axis+"_rank","rank",high=4,dtype="integer",kind="control",writer="upgrade.activate_after_paid_deployment",group="progression")
metric("function","online_units","count",default=1,dtype="integer",kind="control",writer="function.route_or_throttle",group="capacity")
metric("function","founder_focus","boolean",default=False,dtype="boolean",low=None,kind="control",writer="input.select_one_function",group="attention")
metric("function","manual_performance","ratio",default=1,high=1,kind="control",writer="engaged_ticks / sampled_ticks",group="attention",meaning="Hold-to-work duty cycle, not an unspecified reflex score. In one active tick this is 0 or 1.")
metric("function","auto_utilization","ratio",default=1,high=1,kind="control",writer="function.throttle_policy",group="capacity")
metric("function","rework_share","ratio",default=.25,high=1,kind="control",writer="function.rework_policy",group="rework")
metric("function","verification_share","ratio",default=0,high=1,kind="control",writer="function.verification_policy",group="quality")
metric("function","luck_exposure","ratio",default=1,high=1,kind="control",writer="function.risk_policy",group="luck")
metric("function","queue_work_units","work_units",default=0,writer="queue.accept_expire_complete",group="queues")
metric("function","oldest_queue_age_ticks","ticks",dtype="integer",writer="now_tick - oldest_expirable_opportunity.created_tick; 0 if none",group="queues")
metric("function","rework_backlog","work_units",writer="function.commit_work_outcome",group="rework")
metric("function","context_rot","ratio",high=1,writer="function.commit_next_rot",group="rot",visibility="alert")
metric("function","configuration_changes","count",dtype="integer",writer="count(config_events_since_previous_step)",group="rot")
metric("function","maintenance_points_per_second","maintenance_points/second",writer="ops.allocate_accepted_maintenance",group="rot")
metric("function","ops_maintenance_weight","ratio",default=1/8,high=1,kind="control",writer="ops.allocation_weights",group="operations")
metric("function","eligible_output_room","output_units",default=100,writer="domain.remaining_eligible_target_units",group="queues")
metric("function","batch_output_credit","output_units",default=0,high=1,writer="work_output.whole_units_and_remainder",group="precision")
metric("function","manual_work_credit","work_units",default=0,high=1,writer="manual_clock.completed_attempts_and_remainder",group="precision")
metric("function","auto_work_credit","work_units",default=0,high=1,writer="auto_clock.completed_attempts_and_remainder",group="precision")
metric("function","attempt_sequence","count",dtype="integer",writer="increment_once_per_started_attempt; never reset on requeue",group="precision")
metric("function","window_useful_output_count","count",dtype="integer",writer="sum task.useful_output_count in W filtered by function_id and work mode",level="L2",group="work_results")
metric("function","window_domain_attempts","count",dtype="integer",writer="sum actual consumed domain inputs in W filtered by function_id and work mode",group="work_results")
metric("function","window_attempt_cost_cents","cents",writer="sum committed variable work charges in W filtered by function_id",level="L2",group="cost")
metric("function","window_dropped_output_count","count",dtype="integer",writer="sum downstream-capacity rejection counts in W filtered by source function_id",level="L2",group="queues")
metric("function","window_expired_input_count","count",dtype="integer",writer="sum unresolved dated input counts expiring in W filtered by function_id",level="L2",group="queues")
metric("function","founder_work_seconds","seconds",writer="tick_seconds * count active founder-work ticks assigned to function_id",group="attention")
metric("function","domain_conversion_rate","ratio","ratio(window_useful_output_count, window_domain_attempts)",nullable=True,high=1,level="L2",group="work_results")
metric("function","base_units","count","p['units_by_scale_rank'][scale_rank]",group="capacity")
metric("function","unit_capacity","count","mod('function.unit_capacity', base_units)",group="capacity",meaning="Earned modifiers can exceed base-rank unit counts.")
metric("function","craft_batch","output_units/attempt","mod('function.craft_batch', p['craft_batch_by_rank'][craft_rank])",group="progression")
metric("function","queue_capacity","work_units","mod('function.queue_capacity', unit_capacity * p['queue_slots_per_unit'])",group="queues")
metric("function","queue_fill","ratio","ratio(queue_work_units, queue_capacity)",nullable=True,group="queues")
metric("function","queue_expired","boolean","oldest_queue_age_ticks >= p['opportunity_ttl_ticks'] and queue_work_units > 0",dtype="boolean",low=None,group="queues")
metric("function","base_manual_attempts_per_second","attempts/second","1 / fn['manual_seconds']",group="throughput")
metric("function","manual_attempts_per_second","attempts/second","base_manual_attempts_per_second * manual_performance if founder_focus and online_units > 0 else 0",group="throughput")
metric("function","autonomous_attempts_per_second","attempts/second","mod('function.autonomous_rate', online_units * base_manual_attempts_per_second * p['auto_speed_by_rank'][automate_rank] * auto_utilization)",group="throughput")
metric("function","coordination_load","load_units","online_units * fn['unit_load'] * (1 + 0.15 * automate_rank) + p['coordination_pair_load'] * online_units * max(0, online_units - 1)",group="strain")
metric("function","coordination_capacity_contribution","load_units","online_units * p['coordination_capacity_per_ops_unit'] * (1 + 0.25 * craft_rank) if function_id == 'operations' else 0",group="strain")
metric("function","strain_speed_factor","ratio","1 / (1 + p['strain_speed_coefficient'] * excess_strain ** 2)",high=1,group="strain")
metric("function","verification_speed_factor","ratio","1 - 0.35 * verification_share",high=1,group="quality")
metric("function","raw_service_capacity","work_units/second","(manual_attempts_per_second + autonomous_attempts_per_second) * strain_speed_factor * verification_speed_factor",group="throughput")
metric("function","rework_serviced_per_second","work_units/second","min(rework_backlog / dt, raw_service_capacity * rework_share)",group="rework")
metric("function","production_attempts_per_second","attempts/second","min(queue_work_units / dt, max(0, raw_service_capacity - rework_serviced_per_second))",group="throughput")
metric("function","failure_probability","probability","clamp(fn['base_error'] + p['strain_error_coefficient'] * excess_strain ** 2 + p['rot_error_coefficient'] * context_rot ** 2, 0, p['max_error_probability'])",high=1,group="quality")
metric("function","failed_attempts_per_second","attempts/second","production_attempts_per_second * failure_probability",group="rework")
metric("function","successful_attempts_per_second","attempts/second","production_attempts_per_second * (1 - failure_probability)",group="throughput")
metric("function","rework_backlog_next_expected","work_units","max(0, rework_backlog + dt * (failed_attempts_per_second * p['rework_units_per_failure'] - rework_serviced_per_second))",group="rework",meaning="Expected-value diagnostic; realized reducer uses the actual sampled failure count.")
metric("function","nominal_output_per_second","output_units/second","successful_attempts_per_second * craft_batch",group="throughput")
metric("function","effective_luck_rank","rank_equivalent","luck_rank * luck_exposure",high=4,group="luck")
metric("function","luck_mean_multiplier","ratio","1 + p['luck_mean_per_rank'] * effective_luck_rank",group="luck")
metric("function","luck_standard_deviation","ratio","p['luck_sd_per_rank'] * effective_luck_rank",group="luck")
metric("function","luck_min_multiplier","ratio","luck_mean_multiplier - luck_standard_deviation * (sqrt(p['luck_shared_variance_fraction']) + sqrt(1 - p['luck_shared_variance_fraction']))",group="luck")
metric("function","luck_max_multiplier","ratio","luck_mean_multiplier + luck_standard_deviation * (sqrt(p['luck_shared_variance_fraction']) + sqrt(1 - p['luck_shared_variance_fraction']))",group="luck")
metric("function","luck_expected_accepted_batch","output_units/attempt","capped_luck_mean(craft_batch, eligible_output_room, effective_luck_rank, p)",group="luck")
metric("function","luck_realized_ev_gain","ratio","ratio(luck_expected_accepted_batch, min(craft_batch, eligible_output_room)) - 1 if eligible_output_room > 0 and craft_batch > 0 else None",nullable=True,low=None,group="luck")
metric("function","expected_accepted_output_per_second","output_units/second","min(eligible_output_room / dt, successful_attempts_per_second * luck_expected_accepted_batch)",group="throughput")
metric("function","attempt_cost_cents","cents/attempt","mod('function.attempt_cost_cents', fn['attempt_cost_cents'])",group="cost")
metric("function","resource_cost_cents_per_second","cents/second","(production_attempts_per_second + rework_serviced_per_second) * attempt_cost_cents",group="cost")
metric("function","upkeep_cents_per_month","cents/month","online_units * p['auto_upkeep_cents_per_unit_month'][automate_rank] + max(0, online_units - 1) * p['unit_upkeep_cents_per_month']",group="cost")
metric("function","cost_per_useful_output_cents","cents/output_unit","ratio(resource_cost_cents_per_second + upkeep_cents_per_month / (p['ticks_per_month'] * p['tick_seconds']), expected_accepted_output_per_second)",nullable=True,group="cost")
metric("function","automatic_work_share","ratio","ratio(autonomous_attempts_per_second, manual_attempts_per_second + autonomous_attempts_per_second) if manual_attempts_per_second + autonomous_attempts_per_second > 0 else 0",high=1,group="rot")
metric("function","executed_auto_attempts_per_second","attempts/second","(production_attempts_per_second + rework_serviced_per_second) * automatic_work_share",group="rot")
metric("function","rot_generated_per_second","rot/second","executed_auto_attempts_per_second * (p['rot_per_auto_attempt_base'] + p['rot_per_auto_attempt_rank'] * automate_rank) * (1 + 0.5 * excess_strain) + configuration_changes * p['rot_per_configuration_change'] / dt",group="rot")
metric("function","rot_removed_per_second","rot/second","maintenance_points_per_second * p['rot_recovery_per_maintenance_point']",group="rot")
metric("function","context_rot_next_expected","ratio","clamp(context_rot + dt * (rot_generated_per_second - rot_removed_per_second), 0, 1)",high=1,group="rot")
metric("function","escaped_defect_probability","probability","clamp(0.08 + 0.03 * automate_rank + 0.25 * context_rot + 0.08 * excess_strain - 0.015 * craft_rank - 0.10 * verification_share, 0, 0.75)",high=1,group="quality")
metric("function","available_maintenance_points_per_second","maintenance_points/second","expected_accepted_output_per_second if function_id == 'operations' and fn['mode'] == 'maintain' else 0",group="operations")
metric("function","next_rank_price_cents","cents","p['upgrade_base_cents'] * p['upgrade_cost_ratio'] ** selected_axis_rank if selected_axis_rank < 4 else None",nullable=True,group="progression")
metric("function","next_deployment_ready_tick","ticks","now_tick + p['upgrade_deploy_ticks']",group="progression")
metric("function","hud_capability_signature","count","craft_rank + 5 * scale_rank + 25 * automate_rank + 125 * luck_rank",group="progression",meaning="Stable 0..624 signature; renderer maps each changed rank to a visible capability.")

# Shared load: no feedback from this tick's repaired state into the same tick's work roll.
metric("operations","total_coordination_load","load_units",writer="sum(function.coordination_load)",group="strain")
metric("operations","ops_capacity_contribution","load_units",writer="function.operations.coordination_capacity_contribution",group="strain")
metric("operations","capacity","load_units","p['coordination_base_capacity'] + ops_capacity_contribution",group="strain")
metric("operations","strain_ratio","ratio","total_coordination_load / capacity",group="strain",visibility="alert")
metric("operations","strain_backlog","load_units",writer="ops.commit_strain_backlog",group="strain")
metric("operations","strain_repair_share","ratio",default=.25,high=1,kind="control",writer="ops.allocation_weights",group="strain")
metric("operations","instant_overload","ratio","max(0, strain_ratio - 1)",group="strain")
metric("operations","excess_strain","ratio","instant_overload + strain_backlog / capacity",group="strain")
metric("operations","maintenance_output_per_second","maintenance_points/second",writer="function.operations.available_maintenance_points_per_second",group="operations")
metric("operations","allocation_weight_sum","ratio",default=.75,high=1,writer="sum(function.ops_maintenance_weight)",group="operations")
metric("operations","strain_repair_per_second","load_units/second","maintenance_output_per_second * strain_repair_share * p['strain_repair_load_per_maintenance_point']",group="strain")
metric("operations","strain_backlog_next_expected","load_units","max(0, strain_backlog + p['tick_seconds'] * ((total_coordination_load - capacity) / (p['ticks_per_month'] * p['tick_seconds']) - strain_repair_per_second))",group="strain",meaning="Realized commit substitutes sampled Ops output for its expected rate; excess capacity also pays down accumulated strain.")

# Cohort/account template. All records are homogeneous; split records before partial changes.
metric("customer","count","count",default=1,dtype="integer",writer="cohort.subscribe_split_cancel",group="customers")
metric("customer","active","boolean",default=True,dtype="boolean",low=None,writer="cohort.activate_or_cancel",group="customers")
metric("customer","price_cents_per_month","cents/month",default=4000,writer="monetisation.accepted_price",group="revenue")
metric("customer","addon_count_per_customer","count",high=2,dtype="integer",writer="expansion.attach_or_downgrade",group="expansion")
metric("customer","health","health_points",default=70,high=100,writer="customer.commit_health_next",group="retention")
metric("customer","defect_exposure","ratio",high=1,writer="product.ship_or_fix",group="quality")
metric("customer","incident_exposure","ratio",high=1,writer="incident.open_or_resolve",group="quality")
metric("customer","care_coverage","ratio",high=1,writer="min(1, retention.serviced_customers / eligible_customers)",group="retention")
metric("customer","age_ticks","ticks",dtype="integer",writer="clock.tick - customer.activation_tick",group="customers")
metric("customer","delinquency_ticks","ticks",dtype="integer",writer="max(0,now_tick - min(unpaid_due_ticks + unresolved_default_due_ticks)); 0 when both sets empty",group="collections")
metric("customer","at_risk_count","count",dtype="integer",writer="churn.spawn_threat_or_save",group="retention")
metric("customer","save_discount_bps","basis_points",high=2000,dtype="integer",kind="control",writer="retention.concession_policy",group="retention")
metric("customer","fit","ratio","segment['needs'][0] * capability_speed + segment['needs'][1] * capability_collaboration + segment['needs'][2] * capability_control",high=1,group="product")
metric("customer","effective_wtp_cents","cents/month","segment['wtp_cents'] * (0.4 + 0.6 * fit) * (1 - 0.3 * competition)",group="monetisation")
metric("customer","price_to_wtp","ratio","price_cents_per_month / max(1, effective_wtp_cents)",group="monetisation")
metric("customer","overpricing","ratio","max(0, price_to_wtp - 1)",group="monetisation")
metric("customer","qualification_probability","probability","clamp(0.15 + 0.7 * fit + 0.03 * demand_craft - 0.2 * competition, 0.05, 0.95)",high=1,group="demand")
metric("customer","activation_probability","probability","clamp(0.15 + 0.8 * fit + 0.02 * product_craft - 0.3 * competition - 0.2 * defect_exposure, 0.02, 0.98)",high=1,group="product")
metric("customer","paid_conversion_probability","probability","clamp(0.85 * (0.3 + 0.7 * fit) / (1 + price_to_wtp ** 4), 0, 0.95) if price_to_wtp <= p['maximum_accepted_price_to_wtp'] else 0",high=1,group="monetisation")
metric("customer","addon_price_cents","cents/month","floor(price_cents_per_month * p['addon_price_fraction'])",group="expansion")
metric("customer","base_mrr_cents","cents/month","count * price_cents_per_month if active else 0",level="L2",group="revenue")
metric("customer","expansion_mrr_cents","cents/month","count * addon_count_per_customer * addon_price_cents if active else 0",level="L2",group="revenue")
metric("customer","contractual_mrr_cents","cents/month","base_mrr_cents + expansion_mrr_cents",level="L2",group="revenue")
metric("customer","score_eligible","boolean","active and delinquency_ticks <= p['collection_grace_ticks']",dtype="boolean",low=None,group="revenue")
metric("customer","eligible_arr_cents","cents/year","12 * contractual_mrr_cents if score_eligible else 0",level="L2",group="revenue")
metric("customer","service_cost_cents_per_month","cents/month","count * segment['service_cents_month'] * (1 + p['addon_service_cost_fraction'] * addon_count_per_customer) if active else 0",level="L2",group="cost")
metric("customer","contribution_cents_per_month","cents/month","contractual_mrr_cents - service_cost_cents_per_month",low=None,level="L2",group="cost")
metric("customer","health_change_per_month","health_points/month","p['health_fit_gain'] * (fit - p['health_fit_neutral']) - p['health_defect_loss'] * defect_exposure - p['health_overpricing_loss'] * overpricing + p['health_care_gain'] * care_coverage - p['health_incident_loss'] * incident_exposure",low=None,group="retention")
metric("customer","health_next","health_points","clamp(health + health_change_per_month * dt_ticks / p['ticks_per_month'], 0, 100)",high=100,group="retention")
metric("customer","churn_probability_month","probability","clamp(p['base_churn_monthly'] + p['churn_health_weight'] * (1 - health / 100) + p['churn_overpricing_weight'] * overpricing + p['churn_defect_weight'] * defect_exposure + p['churn_competition_weight'] * competition, p['churn_min'], p['churn_max'])",high=1,group="retention")
metric("customer","churn_probability_step","probability","1 - (1 - churn_probability_month) ** (dt_ticks / p['ticks_per_month'])",high=1,group="retention")
metric("customer","save_probability","probability","clamp(0.25 + 0.6 * health / 100 + 0.03 * retention_craft + 0.00005 * save_discount_bps, 0.02, 0.98)",high=1,group="retention")
metric("customer","at_risk_arr_cents","cents/year","12 * at_risk_count * (price_cents_per_month + addon_count_per_customer * addon_price_cents)",level="L2",group="retention")
metric("customer","expansion_eligible_slots","count","count * (p['addon_slots_per_customer'] - addon_count_per_customer) if score_eligible and addon_price_cents >= 1 and age_ticks >= p['expansion_maturity_months'] * p['ticks_per_month'] and health >= p['expansion_min_health'] else 0",group="expansion")
metric("customer","expansion_probability","probability","clamp(0.1 + 0.7 * fit + 0.002 * (health - 50) - 0.35 * addon_price_cents / max(1, effective_wtp_cents), 0.01, 0.95) if expansion_eligible_slots > 0 else 0",high=1,group="expansion")
metric("customer","collection_probability","probability","segment['collection_probability']",high=1,group="collections")
metric("customer","next_collection_delay_ticks","ticks","segment['collection_delay_ticks']",group="collections")

# Ledger-derived inputs. These are not independent spendable variables.
for name, unit in [
    ("cash_cents","cents"),("eligible_arr_cents","cents/year"),("contractual_mrr_cents","cents/month"),
    ("window_open_arr_cents","cents/year"),("window_new_arr_cents","cents/year"),
    ("window_expansion_arr_cents","cents/year"),("window_contraction_arr_cents","cents/year"),
    ("window_churn_arr_cents","cents/year"),("window_eligibility_loss_arr_cents","cents/year"),
    ("window_eligibility_restore_arr_cents","cents/year"),
    ("window_revenue_cents","cents"),("window_cogs_cents","cents"),
    ("window_opex_cents","cents"),("window_interest_cents","cents"),
    ("window_collections_cents","cents"),("window_operating_payments_cents","cents"),
    ("window_refund_payments_cents","cents"),("window_install_payments_cents","cents"),
    ("window_principal_payments_cents","cents"),("window_cash_interest_cents","cents"),
    ("window_ticks","ticks"),("receivables_cents","cents"),("unbilled_cents","cents"),
    ("debt_principal_cents","cents"),("current_run_rate_cost_cents_month","cents/month"),
    ("forecast_obligations_cents","cents"),("forecast_expected_collections_cents","cents"),
    ("forecast_peak_shortfall_cents","cents"),("customer_count","count"),
    ("largest_exposure_arr_cents","cents/year"),("window_new_payers","count"),
    ("matched_acquisition_cost_cents","cents"),("opening_cohort_arr_cents","cents/year"),
    ("opening_cohort_churn_arr_cents","cents/year"),("opening_cohort_contraction_arr_cents","cents/year"),
    ("opening_cohort_expansion_arr_cents","cents/year")
]:
    metric("company",name,unit,writer="aggregate_ledger_or_entity:"+name,level="L1" if name=="eligible_arr_cents" else "L2",kind="aggregate",group="company_ledger",
           default=1 if name=="window_ticks" else 0,low=1 if name=="window_ticks" else 0)
metric("company","forecast_first_shortfall_ticks","ticks",default=None,nullable=True,writer="forecast.prefix_cash_paths",kind="aggregate",level="L2",group="liquidity")
metric("company","arr_bridge_cents","cents/year","window_open_arr_cents + window_new_arr_cents + window_expansion_arr_cents - window_contraction_arr_cents - window_churn_arr_cents - window_eligibility_loss_arr_cents + window_eligibility_restore_arr_cents",level="L2",group="revenue")
metric("company","arr_bridge_error_cents","cents/year","eligible_arr_cents - arr_bridge_cents",low=None,group="audit")
metric("company","net_new_arr_cents","cents/year","window_new_arr_cents + window_expansion_arr_cents - window_contraction_arr_cents - window_churn_arr_cents - window_eligibility_loss_arr_cents + window_eligibility_restore_arr_cents",low=None,level="L2",group="growth")
metric("company","observed_growth","ratio","ratio(eligible_arr_cents - window_open_arr_cents, window_open_arr_cents)",low=None,nullable=True,level="L2",group="growth")
metric("company","growth_evidence_weight","ratio","min(1, window_ticks / p['score_history_ticks'])",high=1,group="growth")
metric("company","scoring_growth","ratio","(eligible_arr_cents - window_open_arr_cents) / max(p['arr_floor_cents'], window_open_arr_cents) * growth_evidence_weight",low=None,level="L1",group="growth")
metric("company","growth_multiple","multiple","piecewise(scoring_growth, p['growth_knots'])",level="L1",group="valuation",visibility="hud")
metric("company","window_months","months","window_ticks / p['ticks_per_month']",group="accounting")
metric("company","revenue_cents_month","cents/month","window_revenue_cents / window_months",level="L2",group="burn")
metric("company","gross_contribution_cents","cents","window_revenue_cents - window_cogs_cents",low=None,level="L2",group="burn")
metric("company","gross_margin","ratio","ratio(gross_contribution_cents, window_revenue_cents)",low=None,nullable=True,level="L2",group="burn")
metric("company","operating_surplus_cents","cents","window_revenue_cents - window_cogs_cents - window_opex_cents",low=None,level="L2",group="burn")
metric("company","economic_deficit_cents_month","cents/month","max(0, window_cogs_cents + window_opex_cents + window_interest_cents - window_revenue_cents) / window_months",level="L2",group="burn")
metric("company","ongoing_burn_ratio","ratio","economic_deficit_cents_month / max(p['revenue_floor_cents_per_month'], revenue_cents_month)",level="L1",group="burn")
metric("company","net_operating_cash_flow_cents","cents","window_collections_cents - window_refund_payments_cents - window_operating_payments_cents",low=None,level="L2",group="burn")
metric("company","net_cash_burn_cents_month","cents/month","max(0, -net_operating_cash_flow_cents) / window_months",level="L2",group="burn",visibility="hud")
metric("company","all_in_cash_consumption_cents","cents","window_operating_payments_cents + window_refund_payments_cents + window_cash_interest_cents + window_principal_payments_cents + window_install_payments_cents - window_collections_cents",low=None,level="L2",group="liquidity")
metric("company","simple_burn_runway_months","months","ratio(cash_cents, net_cash_burn_cents_month)",nullable=True,level="L2",group="liquidity")
metric("company","forecast_shortfall_fraction","ratio","clamp(forecast_peak_shortfall_cents / max(1, forecast_obligations_cents), 0, 1)",high=1,level="L1",group="liquidity")
metric("company","capital_quality_factor","ratio","clamp(1 / (1 + p['burn_weight'] * ongoing_burn_ratio + p['shortfall_weight'] * forecast_shortfall_fraction), p['capital_factor_floor'], 1)",high=1,level="L1",group="valuation",visibility="hud")
metric("company","valuation_cents","cents","score_cents(eligible_arr_cents, growth_multiple, capital_quality_factor)",level="L0",group="valuation",visibility="hud")
metric("company","unicorn_threshold_reached","boolean","valuation_cents >= p['win_valuation_cents']",dtype="boolean",low=None,level="L0",group="valuation")
metric("company","concentration_ratio","ratio","ratio(largest_exposure_arr_cents, eligible_arr_cents)",nullable=True,high=1,group="risk")
metric("company","acquisition_cost_per_payer_cents","cents/customer","ratio(matched_acquisition_cost_cents, window_new_payers)",nullable=True,level="L2",group="demand")
metric("company","gross_revenue_retention","ratio","ratio(opening_cohort_arr_cents - opening_cohort_churn_arr_cents - opening_cohort_contraction_arr_cents, opening_cohort_arr_cents)",nullable=True,high=1,level="L2",group="retention")
metric("company","net_revenue_retention","ratio","ratio(opening_cohort_arr_cents - opening_cohort_churn_arr_cents - opening_cohort_contraction_arr_cents + opening_cohort_expansion_arr_cents, opening_cohort_arr_cents)",nullable=True,level="L2",group="retention")
metric("company","collection_to_revenue_ratio","ratio","ratio(window_collections_cents, window_revenue_cents)",nullable=True,level="L2",group="collections",meaning="Can exceed 1 when old receivables are collected; it is not a probability.")

# One-loan template, repeated for each contract. No hidden compound-interest convention.
metric("loan","principal_cents","cents",writer="loan.draw_repay")
metric("loan","apr_bps","basis_points",default=1800,dtype="integer",writer="accepted_contract",group="debt")
metric("loan","months_remaining","count",default=6,dtype="integer",writer="loan.month_settlement",group="debt")
metric("loan","accrued_interest_numerator","cents_times_120000",dtype="integer",writer="loan.month_accrue",group="precision")
metric("loan","monthly_interest_cents","cents","principal_cents * apr_bps / 120000",group="debt")
metric("loan","interest_due_cents","cents","(principal_cents * apr_bps + accrued_interest_numerator) // 120000",group="debt")
metric("loan","scheduled_principal_cents","cents","ceil(principal_cents / months_remaining) if months_remaining > 0 else principal_cents",group="debt")
metric("loan","scheduled_debt_service_cents","cents","scheduled_principal_cents + interest_due_cents",level="L2",group="debt")
metric("loan","remaining_debt_capacity_cents","cents","max(0, p['debt_capacity_mrr_multiple'] * eligible_mrr_cents - total_debt_cents) if eligible_mrr_cents >= p['debt_min_mrr_cents'] else 0",group="debt")
metric("vc","active","boolean",default=False,dtype="boolean",low=None,writer="vc.accept",group="vc")
metric("vc","baseline_arr_cents","cents/year",writer="vc.accept_baseline_snapshot",group="vc")
metric("vc","growth_target_bps","basis_points",default=5000,dtype="integer",writer="vc.accepted_contract",group="vc")
metric("vc","absolute_target_arr_cents","cents/year",default=1200000,writer="vc.accepted_contract",group="vc")
metric("vc","deadline_tick","ticks",default=1800,dtype="integer",writer="vc.accept_plus_full_quarter",group="vc")
metric("vc","founder_ownership_ppm","parts_per_million",default=1000000,high=1000000,dtype="integer",writer="equity.issue",group="ownership")
metric("vc","required_arr_cents","cents/year","ceildiv(baseline_arr_cents * (10000 + growth_target_bps), 10000) if baseline_arr_cents >= p['arr_floor_cents'] else absolute_target_arr_cents",group="vc")
metric("vc","target_headroom_cents","cents/year","current_arr_cents - required_arr_cents",low=None,level="L2",group="vc")
metric("vc","growth_failure_due","boolean","active and now_tick >= deadline_tick and current_arr_cents < required_arr_cents",dtype="boolean",low=None,group="vc")
metric("vc","ticks_to_deadline","ticks","max(0, deadline_tick - now_tick) if active else None",nullable=True,group="vc")

# Event-scoped task throughput and finite-input resolution.
metric("task","eligible_inputs","count",dtype="integer",writer="queue.valid_items_at_commit",group="work")
metric("task","attempts","count",dtype="integer",writer="work_credit.whole_attempts",group="work")
metric("task","technical_successes","count",dtype="integer",writer="seeded_binomial(attempts, 1 - failure_probability)",group="work")
metric("task","domain_successes","count",dtype="integer",writer="seeded_binomial(eligible_output_count, domain_probability)",group="work")
metric("task","useful_output_count","count","min(eligible_inputs, domain_successes)",group="work")
metric("task","rework_generated","work_units","(attempts - technical_successes) * p['rework_units_per_failure']",group="rework")
metric("task","attempt_resource_cost_cents","cents","attempts * per_attempt_cost_cents",group="cost")
metric("task","next_churn_deadline_tick","ticks","now_tick + p['churn_threat_ttl_ticks']",group="retention")
metric("task","next_opportunity_expiry_tick","ticks","now_tick + p['opportunity_ttl_ticks']",group="queues")

REGISTRY={
 "contract_version":"1.0.0-candidate",
 "status":"quantified_reference_contract_not_validated_game_balance",
 "scope":"six operating functions, one monthly subscription model, cashflow, simple debt and priced equity, continuous active play; shop/relic content deferred",
 "levels":{"L0":"outcome","L1":"direct_score_driver","L2":"business_result","L3":"operational_cause"},
 "metric_count":len(M),
 "per_function_template_instances":list(PROFILE["functions"]),
 "metrics":M,
 "external_contexts":{
    "run":[], "founder":[],
    "market":["channel"],
    "function":["function_id","fn","excess_strain","dt","now_tick","selected_axis_rank"],
    "operations":[],
    "customer":["segment","capability_speed","capability_collaboration","capability_control","competition","demand_craft","product_craft","retention_craft","dt_ticks"],
    "company":[],
    "loan":["eligible_mrr_cents","total_debt_cents"],
    "vc":["now_tick","current_arr_cents"],
    "task":["per_attempt_cost_cents","now_tick"]
 },
 "invariants":[
  "sum(function.founder_focus) <= 1",
  "function.online_units <= function.unit_capacity",
  "sum(function.ops_maintenance_weight) + operations.strain_repair_share <= 1",
  "customer.at_risk_count <= customer.count",
  "customer.addon_count_per_customer <= profile.addon_slots_per_customer",
  "company.arr_bridge_error_cents == 0",
  "run.attention_accounting_error == 0",
  "task.domain_successes <= floor(task.eligible_inputs)",
  "task.technical_successes <= task.attempts",
  "forecast.receipts never include unsigned deals or conditional funding",
  "due failure is settled before new milestone awards",
  "numeric null is allowed only for explicitly nullable diagnostics"
 ],
 "precision":{
  "currency_ledgers":"integer cents; do not round a rendered display back into state",
  "service_accrual":"integer numerator += monthly_mrr_cents * elapsed_ticks; divide by ticks_per_month with remainder carried",
  "interest_accrual":"integer numerator += principal_cents * apr_bps each complete financial month; divide by 120000 with remainder carried",
  "work_credit":"fractional work retained; spend only floor(credit) completed attempts; never treat expected output as guaranteed realized output",
  "ratio_comparison":"the Python reference is authoritative for candidate verification; a JS port must pass fixtures; not claimed cross-language bit-identical",
  "rounding":"score floor; liabilities requiring fractional-cent accrual carry remainder; price floor; VC requirement integer ceiling"
 },
 "founder_correction":{
  "permanent_power_on_failed_run":False,
  "successful_repeat_founder_advantage":"intended",
  "normalize_difficulty_to_erase_advantage":False,
  "arbitrary_meta_caps_added_by_this_contract":False,
  "specific_relic_effects":"deferred"
 }
}

def write_json(name,obj):
    (ROOT/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False,allow_nan=False)+"\n")

if __name__=="__main__":
    write_json("candidate_profile.json",PROFILE)
    write_json("metric_registry.json",REGISTRY)
    print(json.dumps({"metrics":len(M),"scopes":sorted({x["scope"] for x in M})}))
