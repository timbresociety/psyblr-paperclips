# Complete metric catalogue

244 distinct definitions; the function template is instantiated six times. Entity IDs, event logs and collection rows are data structures, not extra score multipliers.

All constants and defaults are candidate values. Formulas execute in `kernel.py`; state bindings and scheduling rules are in `event_contract.json`. Ranges are inclusive unless stated otherwise. `null` means a diagnostic is undefined, never free money or infinite output.

## run (13)

| ID | Level / type | Unit; default; range | Equation or writer |
|---|---|---|---|
| `run.tick` | L3 / state | ticks; 0; 0..unbounded | `clock.advance` |
| `run.active` | L3 / control | boolean; true; false/true | `session.resume_or_suspend` |
| `run.first_unicorn_tick` | L0 / state | ticks; null; 0..unbounded | `milestone.check` |
| `run.elapsed_seconds` | L3 / derived | seconds; 0; 0..unbounded | `tick * p['tick_seconds']` |
| `run.elapsed_months` | L3 / derived | months; 0; 0..unbounded | `tick / p['ticks_per_month']` |
| `run.quarter_index` | L3 / derived | count; 0; 0..unbounded | `1 + tick // (p['ticks_per_month'] * p['months_per_quarter'])` |
| `run.quarter_remaining_ticks` | L3 / derived | ticks; 0; 0..unbounded | `p['ticks_per_month'] * p['months_per_quarter'] - tick % (p['ticks_per_month'] * p['months_per_quarter'])` |
| `run.work_seconds` | L3 / state | seconds; 0; 0..unbounded | `clock.attention_mode` |
| `run.inspection_seconds` | L3 / state | seconds; 0; 0..unbounded | `clock.attention_mode` |
| `run.finance_seconds` | L3 / state | seconds; 0; 0..unbounded | `clock.attention_mode` |
| `run.shopping_seconds` | L3 / state | seconds; 0; 0..unbounded | `clock.attention_mode` |
| `run.idle_seconds` | L3 / state | seconds; 0; 0..unbounded | `clock.attention_mode` |
| `run.attention_accounting_error` | L3 / derived | seconds; 0; None..unbounded | `elapsed_seconds - work_seconds - inspection_seconds - finance_seconds - shopping_seconds - idle_seconds` |

## founder (6)

| ID | Level / type | Unit; default; range | Equation or writer |
|---|---|---|---|
| `founder.successful_runs` | L3 / state | count; 0; 0..unbounded | `founder.record_success_once` |
| `founder.failed_runs` | L3 / state | count; 0; 0..unbounded | `founder.record_failure_once` |
| `founder.owned_relic_count` | L3 / state | count; 0; 0..unbounded | `count(founder.owned_relic_ids)` |
| `founder.run_succeeded` | L3 / state | boolean; false; false/true | `run.first_valid_unicorn_checkpoint` |
| `founder.relic_award_eligible` | L3 / derived | boolean; 0; false/true | `run_succeeded` |
| `founder.starting_cash_bonus_cents` | L3 / state | cents; 0; 0..unbounded | `sum(founder_relic.start_cash_effects)` |

## market (11)

| ID | Level / type | Unit; default; range | Equation or writer |
|---|---|---|---|
| `market.completed_quarters` | L3 / state | count; 0; 0..unbounded | `run.quarter_index - 1` |
| `market.capability_speed` | L3 / state | ratio; 0.35; 0..1 | `product.development_commit` |
| `market.capability_collaboration` | L3 / state | ratio; 0.15; 0..1 | `product.development_commit` |
| `market.capability_control` | L3 / state | ratio; 0.05; 0..1 | `product.development_commit` |
| `market.channel_remaining_pool` | L3 / state | count; 1000; 0..unbounded | `market.month_refill_or_demand_consumption` |
| `market.competition` | L3 / derived | ratio; 0; 0..1 | `min(p['competition_cap'], p['competition_start'] + completed_quarters * p['competition_per_quarter'])` |
| `market.qualified_demand_multiplier` | L3 / derived | ratio; 0; 0..1 | `1 - 0.2 * competition` |
| `market.wtp_market_multiplier` | L3 / derived | ratio; 0; 0..1 | `1 - 0.3 * competition` |
| `market.channel_pool_next_month` | L3 / derived | count; 0; 0..unbounded | `channel['pool_per_month']` |
| `market.channel_reach_per_attempt` | L3 / derived | count; 0; 0..unbounded | `channel['reach_per_attempt']` |
| `market.channel_cost_per_attempt_cents` | L3 / derived | cents; 0; 0..unbounded | `channel['cost_per_attempt_cents']` |

## function (73)

| ID | Level / type | Unit; default; range | Equation or writer |
|---|---|---|---|
| `function.craft_rank` | L3 / control | rank; 0; 0..4 | `upgrade.activate_after_paid_deployment` |
| `function.scale_rank` | L3 / control | rank; 0; 0..4 | `upgrade.activate_after_paid_deployment` |
| `function.automate_rank` | L3 / control | rank; 0; 0..4 | `upgrade.activate_after_paid_deployment` |
| `function.luck_rank` | L3 / control | rank; 0; 0..4 | `upgrade.activate_after_paid_deployment` |
| `function.online_units` | L3 / control | count; 1; 0..unbounded | `function.route_or_throttle` |
| `function.founder_focus` | L3 / control | boolean; false; false/true | `input.select_one_function` |
| `function.manual_performance` | L3 / control | ratio; 1; 0..1 | `engaged_ticks / sampled_ticks` |
| `function.auto_utilization` | L3 / control | ratio; 1; 0..1 | `function.throttle_policy` |
| `function.rework_share` | L3 / control | ratio; 0.25; 0..1 | `function.rework_policy` |
| `function.verification_share` | L3 / control | ratio; 0; 0..1 | `function.verification_policy` |
| `function.luck_exposure` | L3 / control | ratio; 1; 0..1 | `function.risk_policy` |
| `function.queue_work_units` | L3 / state | work_units; 0; 0..unbounded | `queue.accept_expire_complete` |
| `function.oldest_queue_age_ticks` | L3 / state | ticks; 0; 0..unbounded | `now_tick - oldest_expirable_opportunity.created_tick; 0 if none` |
| `function.rework_backlog` | L3 / state | work_units; 0; 0..unbounded | `function.commit_work_outcome` |
| `function.context_rot` | L3 / state | ratio; 0; 0..1 | `function.commit_next_rot` |
| `function.configuration_changes` | L3 / state | count; 0; 0..unbounded | `count(config_events_since_previous_step)` |
| `function.maintenance_points_per_second` | L3 / state | maintenance_points/second; 0; 0..unbounded | `ops.allocate_accepted_maintenance` |
| `function.ops_maintenance_weight` | L3 / control | ratio; 0.125; 0..1 | `ops.allocation_weights` |
| `function.eligible_output_room` | L3 / state | output_units; 100; 0..unbounded | `domain.remaining_eligible_target_units` |
| `function.batch_output_credit` | L3 / state | output_units; 0; 0..1 | `work_output.whole_units_and_remainder` |
| `function.manual_work_credit` | L3 / state | work_units; 0; 0..1 | `manual_clock.completed_attempts_and_remainder` |
| `function.auto_work_credit` | L3 / state | work_units; 0; 0..1 | `auto_clock.completed_attempts_and_remainder` |
| `function.attempt_sequence` | L3 / state | count; 0; 0..unbounded | `increment_once_per_started_attempt; never reset on requeue` |
| `function.window_useful_output_count` | L2 / state | count; 0; 0..unbounded | `sum task.useful_output_count in W filtered by function_id and work mode` |
| `function.window_domain_attempts` | L3 / state | count; 0; 0..unbounded | `sum actual consumed domain inputs in W filtered by function_id and work mode` |
| `function.window_attempt_cost_cents` | L2 / state | cents; 0; 0..unbounded | `sum committed variable work charges in W filtered by function_id` |
| `function.window_dropped_output_count` | L2 / state | count; 0; 0..unbounded | `sum downstream-capacity rejection counts in W filtered by source function_id` |
| `function.window_expired_input_count` | L2 / state | count; 0; 0..unbounded | `sum unresolved dated input counts expiring in W filtered by function_id` |
| `function.founder_work_seconds` | L3 / state | seconds; 0; 0..unbounded | `tick_seconds * count active founder-work ticks assigned to function_id` |
| `function.domain_conversion_rate` | L2 / derived | ratio; 0; 0..1 | `ratio(window_useful_output_count, window_domain_attempts)` |
| `function.base_units` | L3 / derived | count; 0; 0..unbounded | `p['units_by_scale_rank'][scale_rank]` |
| `function.unit_capacity` | L3 / derived | count; 0; 0..unbounded | `mod('function.unit_capacity', base_units)` |
| `function.craft_batch` | L3 / derived | output_units/attempt; 0; 0..unbounded | `mod('function.craft_batch', p['craft_batch_by_rank'][craft_rank])` |
| `function.queue_capacity` | L3 / derived | work_units; 0; 0..unbounded | `mod('function.queue_capacity', unit_capacity * p['queue_slots_per_unit'])` |
| `function.queue_fill` | L3 / derived | ratio; 0; 0..unbounded | `ratio(queue_work_units, queue_capacity)` |
| `function.queue_expired` | L3 / derived | boolean; 0; false/true | `oldest_queue_age_ticks >= p['opportunity_ttl_ticks'] and queue_work_units > 0` |
| `function.base_manual_attempts_per_second` | L3 / derived | attempts/second; 0; 0..unbounded | `1 / fn['manual_seconds']` |
| `function.manual_attempts_per_second` | L3 / derived | attempts/second; 0; 0..unbounded | `base_manual_attempts_per_second * manual_performance if founder_focus and online_units > 0 else 0` |
| `function.autonomous_attempts_per_second` | L3 / derived | attempts/second; 0; 0..unbounded | `mod('function.autonomous_rate', online_units * base_manual_attempts_per_second * p['auto_speed_by_rank'][automate_rank] * auto_utilization)` |
| `function.coordination_load` | L3 / derived | load_units; 0; 0..unbounded | `online_units * fn['unit_load'] * (1 + 0.15 * automate_rank) + p['coordination_pair_load'] * online_units * max(0, online_units - 1)` |
| `function.coordination_capacity_contribution` | L3 / derived | load_units; 0; 0..unbounded | `online_units * p['coordination_capacity_per_ops_unit'] * (1 + 0.25 * craft_rank) if function_id == 'operations' else 0` |
| `function.strain_speed_factor` | L3 / derived | ratio; 0; 0..1 | `1 / (1 + p['strain_speed_coefficient'] * excess_strain ** 2)` |
| `function.verification_speed_factor` | L3 / derived | ratio; 0; 0..1 | `1 - 0.35 * verification_share` |
| `function.raw_service_capacity` | L3 / derived | work_units/second; 0; 0..unbounded | `(manual_attempts_per_second + autonomous_attempts_per_second) * strain_speed_factor * verification_speed_factor` |
| `function.rework_serviced_per_second` | L3 / derived | work_units/second; 0; 0..unbounded | `min(rework_backlog / dt, raw_service_capacity * rework_share)` |
| `function.production_attempts_per_second` | L3 / derived | attempts/second; 0; 0..unbounded | `min(queue_work_units / dt, max(0, raw_service_capacity - rework_serviced_per_second))` |
| `function.failure_probability` | L3 / derived | probability; 0; 0..1 | `clamp(fn['base_error'] + p['strain_error_coefficient'] * excess_strain ** 2 + p['rot_error_coefficient'] * context_rot ** 2, 0, p['max_error_probability'])` |
| `function.failed_attempts_per_second` | L3 / derived | attempts/second; 0; 0..unbounded | `production_attempts_per_second * failure_probability` |
| `function.successful_attempts_per_second` | L3 / derived | attempts/second; 0; 0..unbounded | `production_attempts_per_second * (1 - failure_probability)` |
| `function.rework_backlog_next_expected` | L3 / derived | work_units; 0; 0..unbounded | `max(0, rework_backlog + dt * (failed_attempts_per_second * p['rework_units_per_failure'] - rework_serviced_per_second))` |
| `function.nominal_output_per_second` | L3 / derived | output_units/second; 0; 0..unbounded | `successful_attempts_per_second * craft_batch` |
| `function.effective_luck_rank` | L3 / derived | rank_equivalent; 0; 0..4 | `luck_rank * luck_exposure` |
| `function.luck_mean_multiplier` | L3 / derived | ratio; 0; 0..unbounded | `1 + p['luck_mean_per_rank'] * effective_luck_rank` |
| `function.luck_standard_deviation` | L3 / derived | ratio; 0; 0..unbounded | `p['luck_sd_per_rank'] * effective_luck_rank` |
| `function.luck_min_multiplier` | L3 / derived | ratio; 0; 0..unbounded | `luck_mean_multiplier - luck_standard_deviation * (sqrt(p['luck_shared_variance_fraction']) + sqrt(1 - p['luck_shared_variance_fraction']))` |
| `function.luck_max_multiplier` | L3 / derived | ratio; 0; 0..unbounded | `luck_mean_multiplier + luck_standard_deviation * (sqrt(p['luck_shared_variance_fraction']) + sqrt(1 - p['luck_shared_variance_fraction']))` |
| `function.luck_expected_accepted_batch` | L3 / derived | output_units/attempt; 0; 0..unbounded | `capped_luck_mean(craft_batch, eligible_output_room, effective_luck_rank, p)` |
| `function.luck_realized_ev_gain` | L3 / derived | ratio; 0; None..unbounded | `ratio(luck_expected_accepted_batch, min(craft_batch, eligible_output_room)) - 1 if eligible_output_room > 0 and craft_batch > 0 else None` |
| `function.expected_accepted_output_per_second` | L3 / derived | output_units/second; 0; 0..unbounded | `min(eligible_output_room / dt, successful_attempts_per_second * luck_expected_accepted_batch)` |
| `function.attempt_cost_cents` | L3 / derived | cents/attempt; 0; 0..unbounded | `mod('function.attempt_cost_cents', fn['attempt_cost_cents'])` |
| `function.resource_cost_cents_per_second` | L3 / derived | cents/second; 0; 0..unbounded | `(production_attempts_per_second + rework_serviced_per_second) * attempt_cost_cents` |
| `function.upkeep_cents_per_month` | L3 / derived | cents/month; 0; 0..unbounded | `online_units * p['auto_upkeep_cents_per_unit_month'][automate_rank] + max(0, online_units - 1) * p['unit_upkeep_cents_per_month']` |
| `function.cost_per_useful_output_cents` | L3 / derived | cents/output_unit; 0; 0..unbounded | `ratio(resource_cost_cents_per_second + upkeep_cents_per_month / (p['ticks_per_month'] * p['tick_seconds']), expected_accepted_output_per_second)` |
| `function.automatic_work_share` | L3 / derived | ratio; 0; 0..1 | `ratio(autonomous_attempts_per_second, manual_attempts_per_second + autonomous_attempts_per_second) if manual_attempts_per_second + autonomous_attempts_per_second > 0 else 0` |
| `function.executed_auto_attempts_per_second` | L3 / derived | attempts/second; 0; 0..unbounded | `(production_attempts_per_second + rework_serviced_per_second) * automatic_work_share` |
| `function.rot_generated_per_second` | L3 / derived | rot/second; 0; 0..unbounded | `executed_auto_attempts_per_second * (p['rot_per_auto_attempt_base'] + p['rot_per_auto_attempt_rank'] * automate_rank) * (1 + 0.5 * excess_strain) + configuration_changes * p['rot_per_configuration_change'] / dt` |
| `function.rot_removed_per_second` | L3 / derived | rot/second; 0; 0..unbounded | `maintenance_points_per_second * p['rot_recovery_per_maintenance_point']` |
| `function.context_rot_next_expected` | L3 / derived | ratio; 0; 0..1 | `clamp(context_rot + dt * (rot_generated_per_second - rot_removed_per_second), 0, 1)` |
| `function.escaped_defect_probability` | L3 / derived | probability; 0; 0..1 | `clamp(0.08 + 0.03 * automate_rank + 0.25 * context_rot + 0.08 * excess_strain - 0.015 * craft_rank - 0.10 * verification_share, 0, 0.75)` |
| `function.available_maintenance_points_per_second` | L3 / derived | maintenance_points/second; 0; 0..unbounded | `expected_accepted_output_per_second if function_id == 'operations' and fn['mode'] == 'maintain' else 0` |
| `function.next_rank_price_cents` | L3 / derived | cents; 0; 0..unbounded | `p['upgrade_base_cents'] * p['upgrade_cost_ratio'] ** selected_axis_rank if selected_axis_rank < 4 else None` |
| `function.next_deployment_ready_tick` | L3 / derived | ticks; 0; 0..unbounded | `now_tick + p['upgrade_deploy_ticks']` |
| `function.hud_capability_signature` | L3 / derived | count; 0; 0..unbounded | `craft_rank + 5 * scale_rank + 25 * automate_rank + 125 * luck_rank` |

## operations (12)

| ID | Level / type | Unit; default; range | Equation or writer |
|---|---|---|---|
| `operations.total_coordination_load` | L3 / state | load_units; 0; 0..unbounded | `sum(function.coordination_load)` |
| `operations.ops_capacity_contribution` | L3 / state | load_units; 0; 0..unbounded | `function.operations.coordination_capacity_contribution` |
| `operations.capacity` | L3 / derived | load_units; 0; 0..unbounded | `p['coordination_base_capacity'] + ops_capacity_contribution` |
| `operations.strain_ratio` | L3 / derived | ratio; 0; 0..unbounded | `total_coordination_load / capacity` |
| `operations.strain_backlog` | L3 / state | load_units; 0; 0..unbounded | `ops.commit_strain_backlog` |
| `operations.strain_repair_share` | L3 / control | ratio; 0.25; 0..1 | `ops.allocation_weights` |
| `operations.instant_overload` | L3 / derived | ratio; 0; 0..unbounded | `max(0, strain_ratio - 1)` |
| `operations.excess_strain` | L3 / derived | ratio; 0; 0..unbounded | `instant_overload + strain_backlog / capacity` |
| `operations.maintenance_output_per_second` | L3 / state | maintenance_points/second; 0; 0..unbounded | `function.operations.available_maintenance_points_per_second` |
| `operations.allocation_weight_sum` | L3 / state | ratio; 0.75; 0..1 | `sum(function.ops_maintenance_weight)` |
| `operations.strain_repair_per_second` | L3 / derived | load_units/second; 0; 0..unbounded | `maintenance_output_per_second * strain_repair_share * p['strain_repair_load_per_maintenance_point']` |
| `operations.strain_backlog_next_expected` | L3 / derived | load_units; 0; 0..unbounded | `max(0, strain_backlog + p['tick_seconds'] * ((total_coordination_load - capacity) / (p['ticks_per_month'] * p['tick_seconds']) - strain_repair_per_second))` |

## customer (37)

| ID | Level / type | Unit; default; range | Equation or writer |
|---|---|---|---|
| `customer.count` | L3 / state | count; 1; 0..unbounded | `cohort.subscribe_split_cancel` |
| `customer.active` | L3 / state | boolean; true; false/true | `cohort.activate_or_cancel` |
| `customer.price_cents_per_month` | L3 / state | cents/month; 4000; 0..unbounded | `monetisation.accepted_price` |
| `customer.addon_count_per_customer` | L3 / state | count; 0; 0..2 | `expansion.attach_or_downgrade` |
| `customer.health` | L3 / state | health_points; 70; 0..100 | `customer.commit_health_next` |
| `customer.defect_exposure` | L3 / state | ratio; 0; 0..1 | `product.ship_or_fix` |
| `customer.incident_exposure` | L3 / state | ratio; 0; 0..1 | `incident.open_or_resolve` |
| `customer.care_coverage` | L3 / state | ratio; 0; 0..1 | `min(1, retention.serviced_customers / eligible_customers)` |
| `customer.age_ticks` | L3 / state | ticks; 0; 0..unbounded | `clock.tick - customer.activation_tick` |
| `customer.delinquency_ticks` | L3 / state | ticks; 0; 0..unbounded | `max(0,now_tick - min(unpaid_due_ticks + unresolved_default_due_ticks)); 0 when both sets empty` |
| `customer.at_risk_count` | L3 / state | count; 0; 0..unbounded | `churn.spawn_threat_or_save` |
| `customer.save_discount_bps` | L3 / control | basis_points; 0; 0..2000 | `retention.concession_policy` |
| `customer.fit` | L3 / derived | ratio; 0; 0..1 | `segment['needs'][0] * capability_speed + segment['needs'][1] * capability_collaboration + segment['needs'][2] * capability_control` |
| `customer.effective_wtp_cents` | L3 / derived | cents/month; 0; 0..unbounded | `segment['wtp_cents'] * (0.4 + 0.6 * fit) * (1 - 0.3 * competition)` |
| `customer.price_to_wtp` | L3 / derived | ratio; 0; 0..unbounded | `price_cents_per_month / max(1, effective_wtp_cents)` |
| `customer.overpricing` | L3 / derived | ratio; 0; 0..unbounded | `max(0, price_to_wtp - 1)` |
| `customer.qualification_probability` | L3 / derived | probability; 0; 0..1 | `clamp(0.15 + 0.7 * fit + 0.03 * demand_craft - 0.2 * competition, 0.05, 0.95)` |
| `customer.activation_probability` | L3 / derived | probability; 0; 0..1 | `clamp(0.15 + 0.8 * fit + 0.02 * product_craft - 0.3 * competition - 0.2 * defect_exposure, 0.02, 0.98)` |
| `customer.paid_conversion_probability` | L3 / derived | probability; 0; 0..1 | `clamp(0.85 * (0.3 + 0.7 * fit) / (1 + price_to_wtp ** 4), 0, 0.95) if price_to_wtp <= p['maximum_accepted_price_to_wtp'] else 0` |
| `customer.addon_price_cents` | L3 / derived | cents/month; 0; 0..unbounded | `floor(price_cents_per_month * p['addon_price_fraction'])` |
| `customer.base_mrr_cents` | L2 / derived | cents/month; 0; 0..unbounded | `count * price_cents_per_month if active else 0` |
| `customer.expansion_mrr_cents` | L2 / derived | cents/month; 0; 0..unbounded | `count * addon_count_per_customer * addon_price_cents if active else 0` |
| `customer.contractual_mrr_cents` | L2 / derived | cents/month; 0; 0..unbounded | `base_mrr_cents + expansion_mrr_cents` |
| `customer.score_eligible` | L3 / derived | boolean; 0; false/true | `active and delinquency_ticks <= p['collection_grace_ticks']` |
| `customer.eligible_arr_cents` | L2 / derived | cents/year; 0; 0..unbounded | `12 * contractual_mrr_cents if score_eligible else 0` |
| `customer.service_cost_cents_per_month` | L2 / derived | cents/month; 0; 0..unbounded | `count * segment['service_cents_month'] * (1 + p['addon_service_cost_fraction'] * addon_count_per_customer) if active else 0` |
| `customer.contribution_cents_per_month` | L2 / derived | cents/month; 0; None..unbounded | `contractual_mrr_cents - service_cost_cents_per_month` |
| `customer.health_change_per_month` | L3 / derived | health_points/month; 0; None..unbounded | `p['health_fit_gain'] * (fit - p['health_fit_neutral']) - p['health_defect_loss'] * defect_exposure - p['health_overpricing_loss'] * overpricing + p['health_care_gain'] * care_coverage - p['health_incident_loss'] * incident_exposure` |
| `customer.health_next` | L3 / derived | health_points; 0; 0..100 | `clamp(health + health_change_per_month * dt_ticks / p['ticks_per_month'], 0, 100)` |
| `customer.churn_probability_month` | L3 / derived | probability; 0; 0..1 | `clamp(p['base_churn_monthly'] + p['churn_health_weight'] * (1 - health / 100) + p['churn_overpricing_weight'] * overpricing + p['churn_defect_weight'] * defect_exposure + p['churn_competition_weight'] * competition, p['churn_min'], p['churn_max'])` |
| `customer.churn_probability_step` | L3 / derived | probability; 0; 0..1 | `1 - (1 - churn_probability_month) ** (dt_ticks / p['ticks_per_month'])` |
| `customer.save_probability` | L3 / derived | probability; 0; 0..1 | `clamp(0.25 + 0.6 * health / 100 + 0.03 * retention_craft + 0.00005 * save_discount_bps, 0.02, 0.98)` |
| `customer.at_risk_arr_cents` | L2 / derived | cents/year; 0; 0..unbounded | `12 * at_risk_count * (price_cents_per_month + addon_count_per_customer * addon_price_cents)` |
| `customer.expansion_eligible_slots` | L3 / derived | count; 0; 0..unbounded | `count * (p['addon_slots_per_customer'] - addon_count_per_customer) if score_eligible and addon_price_cents >= 1 and age_ticks >= p['expansion_maturity_months'] * p['ticks_per_month'] and health >= p['expansion_min_health'] else 0` |
| `customer.expansion_probability` | L3 / derived | probability; 0; 0..1 | `clamp(0.1 + 0.7 * fit + 0.002 * (health - 50) - 0.35 * addon_price_cents / max(1, effective_wtp_cents), 0.01, 0.95) if expansion_eligible_slots > 0 else 0` |
| `customer.collection_probability` | L3 / derived | probability; 0; 0..1 | `segment['collection_probability']` |
| `customer.next_collection_delay_ticks` | L3 / derived | ticks; 0; 0..unbounded | `segment['collection_delay_ticks']` |

## company (64)

| ID | Level / type | Unit; default; range | Equation or writer |
|---|---|---|---|
| `company.cash_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:cash_cents` |
| `company.eligible_arr_cents` | L1 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:eligible_arr_cents` |
| `company.contractual_mrr_cents` | L2 / aggregate | cents/month; 0; 0..unbounded | `aggregate_ledger_or_entity:contractual_mrr_cents` |
| `company.window_open_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:window_open_arr_cents` |
| `company.window_new_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:window_new_arr_cents` |
| `company.window_expansion_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:window_expansion_arr_cents` |
| `company.window_contraction_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:window_contraction_arr_cents` |
| `company.window_churn_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:window_churn_arr_cents` |
| `company.window_eligibility_loss_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:window_eligibility_loss_arr_cents` |
| `company.window_eligibility_restore_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:window_eligibility_restore_arr_cents` |
| `company.window_revenue_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:window_revenue_cents` |
| `company.window_cogs_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:window_cogs_cents` |
| `company.window_opex_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:window_opex_cents` |
| `company.window_interest_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:window_interest_cents` |
| `company.window_collections_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:window_collections_cents` |
| `company.window_operating_payments_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:window_operating_payments_cents` |
| `company.window_refund_payments_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:window_refund_payments_cents` |
| `company.window_install_payments_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:window_install_payments_cents` |
| `company.window_principal_payments_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:window_principal_payments_cents` |
| `company.window_cash_interest_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:window_cash_interest_cents` |
| `company.window_ticks` | L2 / aggregate | ticks; 1; 1..unbounded | `aggregate_ledger_or_entity:window_ticks` |
| `company.receivables_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:receivables_cents` |
| `company.unbilled_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:unbilled_cents` |
| `company.debt_principal_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:debt_principal_cents` |
| `company.current_run_rate_cost_cents_month` | L2 / aggregate | cents/month; 0; 0..unbounded | `aggregate_ledger_or_entity:current_run_rate_cost_cents_month` |
| `company.forecast_obligations_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:forecast_obligations_cents` |
| `company.forecast_expected_collections_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:forecast_expected_collections_cents` |
| `company.forecast_peak_shortfall_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:forecast_peak_shortfall_cents` |
| `company.customer_count` | L2 / aggregate | count; 0; 0..unbounded | `aggregate_ledger_or_entity:customer_count` |
| `company.largest_exposure_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:largest_exposure_arr_cents` |
| `company.window_new_payers` | L2 / aggregate | count; 0; 0..unbounded | `aggregate_ledger_or_entity:window_new_payers` |
| `company.matched_acquisition_cost_cents` | L2 / aggregate | cents; 0; 0..unbounded | `aggregate_ledger_or_entity:matched_acquisition_cost_cents` |
| `company.opening_cohort_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:opening_cohort_arr_cents` |
| `company.opening_cohort_churn_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:opening_cohort_churn_arr_cents` |
| `company.opening_cohort_contraction_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:opening_cohort_contraction_arr_cents` |
| `company.opening_cohort_expansion_arr_cents` | L2 / aggregate | cents/year; 0; 0..unbounded | `aggregate_ledger_or_entity:opening_cohort_expansion_arr_cents` |
| `company.forecast_first_shortfall_ticks` | L2 / aggregate | ticks; null; 0..unbounded | `forecast.prefix_cash_paths` |
| `company.arr_bridge_cents` | L2 / derived | cents/year; 0; 0..unbounded | `window_open_arr_cents + window_new_arr_cents + window_expansion_arr_cents - window_contraction_arr_cents - window_churn_arr_cents - window_eligibility_loss_arr_cents + window_eligibility_restore_arr_cents` |
| `company.arr_bridge_error_cents` | L3 / derived | cents/year; 0; None..unbounded | `eligible_arr_cents - arr_bridge_cents` |
| `company.net_new_arr_cents` | L2 / derived | cents/year; 0; None..unbounded | `window_new_arr_cents + window_expansion_arr_cents - window_contraction_arr_cents - window_churn_arr_cents - window_eligibility_loss_arr_cents + window_eligibility_restore_arr_cents` |
| `company.observed_growth` | L2 / derived | ratio; 0; None..unbounded | `ratio(eligible_arr_cents - window_open_arr_cents, window_open_arr_cents)` |
| `company.growth_evidence_weight` | L3 / derived | ratio; 0; 0..1 | `min(1, window_ticks / p['score_history_ticks'])` |
| `company.scoring_growth` | L1 / derived | ratio; 0; None..unbounded | `(eligible_arr_cents - window_open_arr_cents) / max(p['arr_floor_cents'], window_open_arr_cents) * growth_evidence_weight` |
| `company.growth_multiple` | L1 / derived | multiple; 0; 0..unbounded | `piecewise(scoring_growth, p['growth_knots'])` |
| `company.window_months` | L3 / derived | months; 0; 0..unbounded | `window_ticks / p['ticks_per_month']` |
| `company.revenue_cents_month` | L2 / derived | cents/month; 0; 0..unbounded | `window_revenue_cents / window_months` |
| `company.gross_contribution_cents` | L2 / derived | cents; 0; None..unbounded | `window_revenue_cents - window_cogs_cents` |
| `company.gross_margin` | L2 / derived | ratio; 0; None..unbounded | `ratio(gross_contribution_cents, window_revenue_cents)` |
| `company.operating_surplus_cents` | L2 / derived | cents; 0; None..unbounded | `window_revenue_cents - window_cogs_cents - window_opex_cents` |
| `company.economic_deficit_cents_month` | L2 / derived | cents/month; 0; 0..unbounded | `max(0, window_cogs_cents + window_opex_cents + window_interest_cents - window_revenue_cents) / window_months` |
| `company.ongoing_burn_ratio` | L1 / derived | ratio; 0; 0..unbounded | `economic_deficit_cents_month / max(p['revenue_floor_cents_per_month'], revenue_cents_month)` |
| `company.net_operating_cash_flow_cents` | L2 / derived | cents; 0; None..unbounded | `window_collections_cents - window_refund_payments_cents - window_operating_payments_cents` |
| `company.net_cash_burn_cents_month` | L2 / derived | cents/month; 0; 0..unbounded | `max(0, -net_operating_cash_flow_cents) / window_months` |
| `company.all_in_cash_consumption_cents` | L2 / derived | cents; 0; None..unbounded | `window_operating_payments_cents + window_refund_payments_cents + window_cash_interest_cents + window_principal_payments_cents + window_install_payments_cents - window_collections_cents` |
| `company.simple_burn_runway_months` | L2 / derived | months; 0; 0..unbounded | `ratio(cash_cents, net_cash_burn_cents_month)` |
| `company.forecast_shortfall_fraction` | L1 / derived | ratio; 0; 0..1 | `clamp(forecast_peak_shortfall_cents / max(1, forecast_obligations_cents), 0, 1)` |
| `company.capital_quality_factor` | L1 / derived | ratio; 0; 0..1 | `clamp(1 / (1 + p['burn_weight'] * ongoing_burn_ratio + p['shortfall_weight'] * forecast_shortfall_fraction), p['capital_factor_floor'], 1)` |
| `company.valuation_cents` | L0 / derived | cents; 0; 0..unbounded | `score_cents(eligible_arr_cents, growth_multiple, capital_quality_factor)` |
| `company.unicorn_threshold_reached` | L0 / derived | boolean; 0; false/true | `valuation_cents >= p['win_valuation_cents']` |
| `company.concentration_ratio` | L3 / derived | ratio; 0; 0..1 | `ratio(largest_exposure_arr_cents, eligible_arr_cents)` |
| `company.acquisition_cost_per_payer_cents` | L2 / derived | cents/customer; 0; 0..unbounded | `ratio(matched_acquisition_cost_cents, window_new_payers)` |
| `company.gross_revenue_retention` | L2 / derived | ratio; 0; 0..1 | `ratio(opening_cohort_arr_cents - opening_cohort_churn_arr_cents - opening_cohort_contraction_arr_cents, opening_cohort_arr_cents)` |
| `company.net_revenue_retention` | L2 / derived | ratio; 0; 0..unbounded | `ratio(opening_cohort_arr_cents - opening_cohort_churn_arr_cents - opening_cohort_contraction_arr_cents + opening_cohort_expansion_arr_cents, opening_cohort_arr_cents)` |
| `company.collection_to_revenue_ratio` | L2 / derived | ratio; 0; 0..unbounded | `ratio(window_collections_cents, window_revenue_cents)` |

## loan (9)

| ID | Level / type | Unit; default; range | Equation or writer |
|---|---|---|---|
| `loan.principal_cents` | L3 / state | cents; 0; 0..unbounded | `loan.draw_repay` |
| `loan.apr_bps` | L3 / state | basis_points; 1800; 0..unbounded | `accepted_contract` |
| `loan.months_remaining` | L3 / state | count; 6; 0..unbounded | `loan.month_settlement` |
| `loan.accrued_interest_numerator` | L3 / state | cents_times_120000; 0; 0..unbounded | `loan.month_accrue` |
| `loan.monthly_interest_cents` | L3 / derived | cents; 0; 0..unbounded | `principal_cents * apr_bps / 120000` |
| `loan.interest_due_cents` | L3 / derived | cents; 0; 0..unbounded | `(principal_cents * apr_bps + accrued_interest_numerator) // 120000` |
| `loan.scheduled_principal_cents` | L3 / derived | cents; 0; 0..unbounded | `ceil(principal_cents / months_remaining) if months_remaining > 0 else principal_cents` |
| `loan.scheduled_debt_service_cents` | L2 / derived | cents; 0; 0..unbounded | `scheduled_principal_cents + interest_due_cents` |
| `loan.remaining_debt_capacity_cents` | L3 / derived | cents; 0; 0..unbounded | `max(0, p['debt_capacity_mrr_multiple'] * eligible_mrr_cents - total_debt_cents) if eligible_mrr_cents >= p['debt_min_mrr_cents'] else 0` |

## vc (10)

| ID | Level / type | Unit; default; range | Equation or writer |
|---|---|---|---|
| `vc.active` | L3 / state | boolean; false; false/true | `vc.accept` |
| `vc.baseline_arr_cents` | L3 / state | cents/year; 0; 0..unbounded | `vc.accept_baseline_snapshot` |
| `vc.growth_target_bps` | L3 / state | basis_points; 5000; 0..unbounded | `vc.accepted_contract` |
| `vc.absolute_target_arr_cents` | L3 / state | cents/year; 1200000; 0..unbounded | `vc.accepted_contract` |
| `vc.deadline_tick` | L3 / state | ticks; 1800; 0..unbounded | `vc.accept_plus_full_quarter` |
| `vc.founder_ownership_ppm` | L3 / state | parts_per_million; 1000000; 0..1000000 | `equity.issue` |
| `vc.required_arr_cents` | L3 / derived | cents/year; 0; 0..unbounded | `ceildiv(baseline_arr_cents * (10000 + growth_target_bps), 10000) if baseline_arr_cents >= p['arr_floor_cents'] else absolute_target_arr_cents` |
| `vc.target_headroom_cents` | L2 / derived | cents/year; 0; None..unbounded | `current_arr_cents - required_arr_cents` |
| `vc.growth_failure_due` | L3 / derived | boolean; 0; false/true | `active and now_tick >= deadline_tick and current_arr_cents < required_arr_cents` |
| `vc.ticks_to_deadline` | L3 / derived | ticks; 0; 0..unbounded | `max(0, deadline_tick - now_tick) if active else None` |

## task (9)

| ID | Level / type | Unit; default; range | Equation or writer |
|---|---|---|---|
| `task.eligible_inputs` | L3 / state | count; 0; 0..unbounded | `queue.valid_items_at_commit` |
| `task.attempts` | L3 / state | count; 0; 0..unbounded | `work_credit.whole_attempts` |
| `task.technical_successes` | L3 / state | count; 0; 0..unbounded | `seeded_binomial(attempts, 1 - failure_probability)` |
| `task.domain_successes` | L3 / state | count; 0; 0..unbounded | `seeded_binomial(eligible_output_count, domain_probability)` |
| `task.useful_output_count` | L3 / derived | count; 0; 0..unbounded | `min(eligible_inputs, domain_successes)` |
| `task.rework_generated` | L3 / derived | work_units; 0; 0..unbounded | `(attempts - technical_successes) * p['rework_units_per_failure']` |
| `task.attempt_resource_cost_cents` | L3 / derived | cents; 0; 0..unbounded | `attempts * per_attempt_cost_cents` |
| `task.next_churn_deadline_tick` | L3 / derived | ticks; 0; 0..unbounded | `now_tick + p['churn_threat_ttl_ticks']` |
| `task.next_opportunity_expiry_tick` | L3 / derived | ticks; 0; 0..unbounded | `now_tick + p['opportunity_ttl_ticks']` |

## Storage and invalid-state rules

Financial amounts and ledger deltas use integer cents. Debt interest and service accrual carry fractional remainders. Rendered abbreviations never write back into state. Fractional work credit is strictly less than 1; the JSON Schema encodes the exclusive bound.

All 128 derived expressions have an explicit evaluation order and symbol lint. The 116 input/aggregate definitions require their declared source; callers cannot set derived score values. Validation defaults are fixture conveniences, not permission to silently reset missing production save data.

Expected throughput and next-state diagnostics are continuous approximations. Real transactions use sampled outcomes, finite eligible inputs and carried remainders. They must never credit the expectation as actual ARR, cash, a rescued customer or repaired rot.
