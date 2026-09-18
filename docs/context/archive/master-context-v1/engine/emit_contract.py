"""Emit schemas, binding rules, ordered phases and a full human-readable catalogue.

The schema is an interchange contract, not a claim that the scheduler exists.
The kernel executes registry formulas and reference financial/work transactions.
"""
import json
from pathlib import Path
from collections import Counter
import build_contract as b

R=b.REGISTRY
ROOT=Path(__file__).resolve().parent
def dump(name,data):
    (ROOT/name).write_text(json.dumps(data,indent=2,ensure_ascii=False,allow_nan=False)+"\n")

defs={}
for scope in R["external_contexts"]:
    props={}
    for m in R["metrics"]:
        if m["scope"]!=scope or m["formula"] is not None: continue
        t=m["value_type"]
        p={"type":[t,"null"] if m["nullable"] else t,"default":m["default"],"description":m["unit"]+"; "+m["writer"]}
        if t!="boolean":
            for key,val in m["bounds"].items():
                if key in ("minimum","maximum") and val is not None: p[key]=val
        if m["id"] in ("function.batch_output_credit","function.manual_work_credit","function.auto_work_credit"):
            p.pop("maximum",None); p["exclusiveMaximum"]=1
        props[m["local_id"]]=p
    defs[scope]={"type":"object","properties":props,"additionalProperties":False,
                 "description":"Partial input snapshot; omitted values use the registry default. Derived values are rejected."}

def obj(properties,required=None):
    return {"type":"object","properties":properties,"required":list(properties) if required is None else required,"additionalProperties":False}
integer={"type":"integer","minimum":0}
positive={"type":"integer","minimum":1}
identifier={"type":"string","minLength":1}
probability={"type":"number","minimum":0,"maximum":1}
defs["queue_item"]=obj({"id":identifier,"function_id":{"enum":list(b.PROFILE["functions"])},
 "mode":{"enum":["reach","develop","activate","fix","sell","save","care","expand","maintain","incident"]},
 "cohort_id":identifier,"created_tick":integer,"expires_tick":{"type":["integer","null"],"minimum":0},
 "remaining_inputs":integer,"attempt_credit":{"type":"number","minimum":0,"exclusiveMaximum":1},
 "domain_attempt_cursor":integer,"channel_id":{"enum":list(b.PROFILE["channels"])+[None]},
 "feature_axis":{"enum":["speed","collaboration","control",None]}})
defs["invoice"]=obj({"id":identifier,"cohort_id":identifier,"issued_tick":integer,"due_tick":integer,
 "issued_cents":positive,"outstanding_cents":integer,"collected_cents":integer,"credited_cents":integer,
 "attempt_count":integer,"next_attempt_tick":{"type":["integer","null"],"minimum":0}})
defs["bill"]=obj({"id":identifier,"due_tick":integer,"cents":integer,
 "category":{"enum":["cogs","opex","interest","principal","refund"]},"paid":{"type":"boolean"},
 "loan_id":{"type":["string","null"]}})
defs["account_metadata"]=obj({"id":identifier,"origin_account_id":identifier,
 "segment_id":{"enum":list(b.PROFILE["segments"])},"activation_tick":integer,"service_cursor":integer,
 "service_remainder":{"type":"integer","minimum":0,"maximum":599},"acquisition_cost_cents":integer,
 "exposure_group":identifier,"care_valid_until_tick":integer,
 "last_contract_change_tick":integer,"next_invoice_tick":integer,
 "unresolved_default_due_tick":{"type":["integer","null"],"minimum":0}})
defs["modifier"]=obj({"target":identifier,"source_id":identifier,"priority":{"type":"integer"},
 "operation":{"enum":["add","increase_bps","multiply","override","clamp_min","clamp_max","floor","ceil"]},
 "value":{"type":"number"}})
defs["event_envelope"]=obj({"id":identifier,"type":identifier,"tick":integer,"data":{"type":"object"}})
dump("state_schema.json",{"$schema":"https://json-schema.org/draft/2020-12/schema","title":"SoloUnicorn v1 interchange types","$defs":defs})

PHASES=[
 {"order":1,"id":"accrue","rule":"Advance exactly one active tick. Accrue service revenue and operating cost for [t-1,t) at the old contract/rate. Age cohorts, queues, invoices and conditions. Suspended sessions advance zero ticks."},
 {"order":2,"id":"external","rule":"At the timestamp: refill monthly market pools; update quarter competition; activate paid deployments; attempt due customer collections; settle irrevocably committed funding receipts. Never sample when merely reading metrics."},
 {"order":3,"id":"work_snapshot","rule":"Compute all six rates from one pre-work snapshot, including prior strain_backlog and context_rot. Founder focus cardinality <=1. Acquire input reservations in (created_tick,id) order; spend affordable variable attempt cost before execution."},
 {"order":4,"id":"work_commit","rule":"Resolve earned whole attempts using stable per-function attempt cursors. Split homogeneous cohorts for partial outcomes. Commit failures/rework, successes, contract changes and actual Ops maintenance exactly once. Emit outputs to downstream queues with available_tick=t+1."},
 {"order":5,"id":"conditions","rule":"Commit actual next rot/strain and customer health. Resolve dated churn threats after same-timestamp rescue work. Create new threats only for customers without an open threat. Expire unresolved opportunities; no expiry penalty on non-opportunity maintenance jobs."},
 {"order":6,"id":"billing","rule":"Issue monthly arrears invoices from earned unbilled service. Generate operating bills and anniversary loan interest/principal bills; unique IDs prevent forecast/bill duplication."},
 {"order":7,"id":"mandatory_settlement","rule":"Pay due bills ordered by (due_tick,id). Failure at first unpaid mandatory bill when cash is insufficient. Then check accepted VC mandate. Cash=0 alone is not failure. A timestamp may not be skipped."},
 {"order":8,"id":"score","rule":"Aggregate eligible ARR and the rolling window, rebuild dated cash forecast, compute valuation, then award first successful $1B checkpoint only if phase 7 survived."},
 {"order":9,"id":"decisions","rule":"Accept affordable optional purchases, routing changes, new financing decisions and quarter-shop selections. Their effects start no earlier than t+1. Inspection, finance and shop use founder attention; background simulation continues."},
 {"order":10,"id":"publish","rule":"Publish one immutable metric snapshot with version, tick and event cursor; record replay hash. Rendering must not mutate inputs or consume random draws."}
]

TRANSITIONS={
 "clock":{"tick_next":"tick + int(active)","attention_seconds_delta":"tick_seconds to exactly one of work, inspection, finance, shopping, idle when active; 0 otherwise","quarter":"1 + tick // 1800","month":"tick // 600"},
 "upgrade":{"guard":"0 <= selected_axis_rank < 4 and cash_cents >= 30000 * 6**selected_axis_rank and no pending upgrade for same axis",
   "payment_cents":"30000 * 6**selected_axis_rank","ready_tick":"purchase_tick + 50","rank_at_ready":"old_rank + 1",
   "configuration_changes":"+1 on each activated rank, changed mode, changed target/routing policy, changed verification policy or changed provider exposure; continuous throttle/founder focus changes add 0"},
 "queue":{"ordering":"(available_tick, created_tick, id)","capacity_work_units":"12 * modified_unit_capacity",
   "attempt_accounting":"attempt_credit += available_rate_per_second * 0.1; whole=floor(attempt_credit); debit only executed whole attempts; clamp stored residual to [0,1) when no eligible work remains; no idle stockpile",
   "reservation":"reserve min(remaining eligible items, floor(craft_batch * max(luck_outcomes(rank)) + batch_credit)) per production attempt; release unattempted reservation; only actual domain attempts consume items",
   "expiry":"expire opportunities at created_tick+300; churn threat at created_tick+120; process permitted same-tick work first; maintenance/development jobs have null expiry",
   "overflow":"accept first capacity items; reject excess with dropped_count telemetry; rejected output creates no ARR or refund"},
 "demand":{"input":"selected channel pool; one attempted reach consumes one remaining person from that channel month",
   "work_batch":"craft_batch * channel.reach_per_attempt",
   "cost_per_attempt_cents":"channel.cost_per_attempt_cents (replaces generic demand attempt_cost, does not add to it)",
   "segment":"inverse CDF of channel.segment_weights using one stable seeded draw per consumed person",
   "success_probability":"customer.qualification_probability for that segment",
   "success":"one qualified opportunity to Product.activate; expiry now+300"},
 "product":{"modes":["develop","activate","fix"],
   "develop":"each useful output increases selected capability by 0.02, clamp [0,1]; domain probability 1; stop when capability=1",
   "bad_ship":"per successful development attempt, escaped_defect_probability draw; on true add 0.05 to defect_exposure of every active cohort, clamp [0,1]",
   "activate":"consume qualified opportunities, probability customer.activation_probability; success creates activated trial in Monetisation.sell, expiry now+300",
   "fix":"domain probability 1; each useful output removes 0.02 defect_exposure from one selected cohort, clamp >=0"},
 "monetisation":{"input":"activated trials only","success_probability":"customer.paid_conversion_probability",
   "price":"founder-selected integer cents/month, >=1; same posted monthly subscription model across segments",
   "success":"create active payer cohort at selected price, health=70, addons=0, age=0; ARR increases 12*price; earned revenue and cash increase 0 at signing",
   "reprice":"new posted price affects new contracts only; existing changes are voluntary accepted renewal offers sampled once per billing anniversary with the same paid_conversion_probability; rejection keeps old price; retention concession uses its separate rule"},
 "retention":{"threat_count":"Binomial(active_count - at_risk_count, churn_probability_step), independent per origin_account_id and tick",
   "deadline":"threat_tick+120; each customer has at most one open threat",
   "save":"sample once per targeted open threat using save_probability; success closes threat and health=min(100,health+10); failure leaves dated threat but marks it attempted so that threat cannot be retried",
   "concession":"on successful save only, new price=max(1,floor(old_price*(10000-save_discount_bps)/10000)); this is contractual contraction, not a one-time cash refund",
   "care":"domain probability 1, one output covers one customer for 600 ticks; care_coverage=covered_count/count; no stacking above 1",
   "expiry":"cancel unsaved affected contracts at deadline, including addon ARR; no new revenue or cash for a save"},
 "expansion":{"eligible":"active, health>=60, age_ticks>=1200, score_eligible, addon_count<2",
   "success_probability":"customer.expansion_probability","price":"floor(base_monthly_price*.25) per slot; reject zero-priced addon",
   "success":"consume one eligible slot and add one addon to one customer; split cohort; ARR increases 12*addon_price; earned revenue/cash unchanged at signing",
   "service_cost":"segment.service_cents_month * (1+.30*addon_count)","repricing":"addon price recomputes from accepted current base price; bridge includes base and addon deltas"},
 "operations":{"modes":["maintain","incident"],"domain_probability":1,
   "maintain":"N useful output points; each function gets N * ops_maintenance_weight; accumulated strain receives N * strain_repair_share; sum of all seven weights <=1; unused output discarded",
   "rot_commit":"clamp(old_rot + actual_auto_attempts*(.0008+.0004*automate_rank)*(1+.5*excess_strain) + .025*configuration_changes - allocated_actual_points*.008,0,1)",
   "strain_commit":"max(0,old_strain_backlog + (total_coordination_load-capacity)/600 - actual_strain_points*.5)",
   "incident":"one useful output reduces selected cohort incident_exposure by .02; incident-mode output does not also create maintenance points"},
 "failures":{"rework":"+1.5 work units per technical failure, including failures in Ops",
   "service":"consume min(backlog, raw_service_capacity*rework_share*dt) rework work; does not award production output; costs resources; rework does not recursively spawn another rework job",
   "escaped_incident":"one escaped_defect_probability roll per technical failure; if true, +.05 incident_exposure on affected cohort, clamp<=1; demand/product develop failures with no target use segment pool of current active cohorts; never invent a direct score penalty"},
 "billing":{"model":"monthly in arrears; one subscription; no annual prepay or deferred revenue in candidate",
   "earned":"divmod(monthly_contract_cents*elapsed_ticks+remainder,600); carry remainder, accrue old rate before mutation",
   "invoice":"at activation_tick+600*k, issue accrued unbilled cents; AR increases, unbilled decreases, earned and cash unchanged",
   "collection":"due=invoice_tick+segment.collection_delay_ticks; at each of at most 3 attempts use segment.collection_probability; success collects full outstanding, reduces AR and raises cash; next failed attempt=previous+120; after third, next_attempt_tick=null",
   "delinquency":"max(0,now-min(unpaid_due_ticks+unresolved_default_due_ticks)) per cohort, or 0 when both sets empty; score eligibility removed only when >1200; cash receipt may restore eligibility while contract remains active",
   "bad_debt":"unpaid receivable remains until explicit writeoff; no automatic new cash. Writeoff reduces AR, books bad-debt expense once and persists unresolved_default_due_tick as the earliest written-off due date. This marker prevents writeoff from restoring score eligibility. Candidate forbids further credit sale to that origin account."},
 "payments":{"variable_work":"deduct whole-cent cost per started attempt from prepaid cash; if unaffordable, throttle attempt to zero rather than fail an optional action",
   "operating_accrual":"COGS=customer service + Product/Retention/Expansion work and attributable upkeep. Opex=Demand/Monetisation/Ops work/upkeep + base overhead + explicit bad debt. Classify once. Acquisition tagging is a report subset, never an additional debit.",
   "upkeep":"accrue from actual online_units and active auto rank each tick; bill all unpaid accrued cents at next company month boundary; throttling utilization to 0 does not remove upkeep, taking unit offline does",
   "mandatory_order":"receipts before due bills at identical tick; bill tie break by stable ID; interest and principal separate; cash shortfall at due timestamp is terminal",
   "forecast":"1800-tick dated prefix; current contracts/rates only, no new sales/upgrades/funding. Include existing invoices plus invoices due from scheduled service, forecast each invoice once at its next attempt with probability*0.8 haircut; no extra forecast retries. Add booked unpaid bills plus future unbilled service/upkeep by unique period ID, scheduled debt, accepted refunds and committed purchase liabilities. Include only already irrevocably committed capital receipts. First negative prefix defines runway risk."},
 "debt":{"guard":"eligible_MRR>=10000 and new_draw<=max(0,3*eligible_MRR-total_principal)",
   "terms":"18% nominal APR, six monthly anniversary payments, no prepayment in candidate",
   "interest":"divmod(principal_cents*1800+interest_remainder,120000) at anniversary before principal repayment",
   "principal":"ceil(principal_cents/months_remaining)","failure":"unpaid scheduled debt service uses same cash-failure rule; no debt-linked growth target"},
 "vc":{"guard":"eligible_ARR>=1200000; one active priced round in candidate",
   "offer":"pre_money_cents=4*eligible_ARR; maximum_raise=floor(pre_money*.25); accepted amount integer cents in [1,maximum_raise]",
   "ownership":"floor(old_ownership_ppm*pre_money/(pre_money+raise))",
   "mandate":"deadline=accept_tick+1800; required_ARR=ceil(baseline_ARR*1.5) when baseline>=1200000, else 1200000; below target at deadline is terminal VC failure",
   "renew":"on meeting target: baseline=current_eligible_ARR; deadline+=1800; no automatic new cash",
   "score":"capital cash can improve dated payment coverage; financing never directly adds ARR or overwrites company valuation"},
 "success":{"guard":"phase7_survived and valuation_cents>=100000000000",
   "once":"first_unicorn_tick recorded once; successful_runs+=1 once; relic_award_eligible=true",
   "failure":"failed_runs+=1 once; no new permanent relic power; already owned relics remain owned",
   "rerun":"initial_cash=apply_modifiers(150000,'starting_cash',owned_relic_modifiers); do not normalize difficulty against founder wins; specific achievements/effects deferred"}
}

# Exact ledger-window conventions and source bindings for every independent input.
AGG={
 "cash_cents":"ledger.cash",
 "eligible_arr_cents":"sum(customer.eligible_arr_cents)",
 "contractual_mrr_cents":"sum(customer.contractual_mrr_cents)",
 "window_ticks":"max(1,min(run.tick,1800))",
 "window_open_arr_cents":"eligible_ARR snapshot after all phases at max(0,run.tick-1800); at tick0 opening ARR=0",
 "receivables_cents":"sum(invoice.outstanding_cents)",
 "unbilled_cents":"sum(account.earned_cents-account.invoiced_cents-account.unbilled_credits_cents)",
 "debt_principal_cents":"sum(loan.principal_cents)",
 "customer_count":"sum(customer.count where active)",
 "largest_exposure_arr_cents":"max(sum(eligible_ARR grouped by origin_account_id),default=0); cohort splitting does not diversify an account",
 "current_run_rate_cost_cents_month":"sum(service_cents_month)+sum(function.upkeep_cents_per_month)+10000+60*sum(function.resource_cost_cents_per_second)",
 "window_new_payers":"count distinct origin accounts first becoming paid in W",
 "matched_acquisition_cost_cents":"sum attribution-ledger costs for the origin accounts first becoming paid in W, including pre-W acquisition work",
 "opening_cohort_arr_cents":"sum contractual ARR at W start for then-active origin accounts",
 "opening_cohort_churn_arr_cents":"sum B_i for opening origin accounts whose closing contractual ARR R_i=0; B_i is that account's ARR at W start",
 "opening_cohort_contraction_arr_cents":"sum max(0,B_i-R_i) for opening origin accounts with R_i>0; net closing contraction, not all transient negative events",
 "opening_cohort_expansion_arr_cents":"sum max(0,R_i-B_i) over opening origin accounts; net closing expansion, not all transient positive events"}
ARR_TYPES={"new":"subscribe","expansion":"positive_contract_delta","contraction":"negative_contract_delta","churn":"cancel","eligibility_loss":"exclude_delinquent","eligibility_restore":"restore_eligible"}
for name,typ in ARR_TYPES.items(): AGG[f"window_{name}_arr_cents"]=f"sum eligible ARR delta magnitude for {typ} events in W; count each delta in exactly one bridge bucket"
MONEY_TYPES={"revenue":"earned_service_revenue","cogs":"cost_accrual[cogs]","opex":"cost_accrual[opex]","interest":"loan_interest_accrual",
 "collections":"customer_collection","operating_payments":"cash_payment[cogs or opex]","refund_payments":"cash_refund",
 "install_payments":"upgrade_install_payment","principal_payments":"cash_payment[principal]","cash_interest":"cash_payment[interest]"}
for name,typ in MONEY_TYPES.items(): AGG[f"window_{name}_cents"]=f"sum signed cents of {typ} events in W; financing receipts excluded"
for name in ("obligations_cents","expected_collections_cents","peak_shortfall_cents","first_shortfall_ticks"):
    AGG["forecast_"+name]="cash_forecast output.forecast_"+name

bindings={}
for m in R["metrics"]:
    if m["formula"] is not None: continue
    scope=m["scope"]; key=m["local_id"]
    if scope=="company": expr=AGG[key]
    else: expr=m["writer"]
    bindings[m["id"]]={"source_expression":expr,"state_type_ref":"state_schema.json#/$defs/"+scope,
      "mutation_contract":"event_contract.json#/transitions","source_writer":m["writer"]}
dump("event_contract.json",{"status":"specified; full scheduler integration not implemented by reference kernel",
 "window":"W=(max(0,now_tick-1800),now_tick], with explicit tick0 bootstrap events included once in first window",
 "phases":PHASES,"transitions":TRANSITIONS,"input_bindings":bindings,
 "reference_ledger_scope":"Financial transaction examples assume all cohorts are score-eligible and homogeneous; full adapter must supply eligibility, cohort splitting, scheduler, cost ledger and outcome-based invoice linkage per this contract. Ledger.arr() is contractual ARR, not the production scoring adapter.",
 "rng":"SHA256 compact JSON [str(seed),str(stream),str(event_id)], top53 bits / 2**53; stream names isolate technical/domain/local/shared/churn/collection; stable attempt cursor must never reset when a task is rebatched; persist full IDs with seed and profile hash."})

lines=["# Complete metric catalogue", "",f"{len(R['metrics'])} distinct definitions; the function template is instantiated six times. Entity IDs, event logs and collection rows are data structures, not extra score multipliers.","", "All constants and defaults are candidate values. Formulas execute in `kernel.py`; state bindings and scheduling rules are in `event_contract.json`. Ranges are inclusive unless stated otherwise. `null` means a diagnostic is undefined, never free money or infinite output.",""]
for scope in R["external_contexts"]:
    rows=[m for m in R["metrics"] if m["scope"]==scope]
    lines += [f"## {scope} ({len(rows)})","","| ID | Level / type | Unit; default; range | Equation or writer |","|---|---|---|---|"]
    for m in rows:
        bounds=m["bounds"]; limit=f"{bounds['minimum']}..{bounds['maximum'] if bounds['maximum'] is not None else 'unbounded'}"
        if m["value_type"]=="boolean": limit="false/true"
        expr=(m["formula"] or m["writer"]).replace("|","&#124;")
        lines.append(f"| `{m['id']}` | {m['level']} / {m['kind']} | {m['unit']}; {json.dumps(m['default'])}; {limit} | `{expr}` |")
    lines.append("")
lines += ["## Storage and invalid-state rules","",
 "Financial amounts and ledger deltas use integer cents. Debt interest and service accrual carry fractional remainders. Rendered abbreviations never write back into state. Fractional work credit is strictly less than 1; the JSON Schema encodes the exclusive bound.","",
 f"All {sum(m['formula'] is not None for m in R['metrics'])} derived expressions have an explicit evaluation order and symbol lint. The {len(bindings)} input/aggregate definitions require their declared source; callers cannot set derived score values. Validation defaults are fixture conveniences, not permission to silently reset missing production save data.","",
 "Expected throughput and next-state diagnostics are continuous approximations. Real transactions use sampled outcomes, finite eligible inputs and carried remainders. They must never credit the expectation as actual ARR, cash, a rescued customer or repaired rot."]
(ROOT/"METRIC_CATALOGUE.md").write_text("\n".join(lines)+"\n")
b.write_json("candidate_profile.json",b.PROFILE)
b.write_json("metric_registry.json",R)
print(json.dumps({"definitions":len(R['metrics']),"formulas":sum(m['formula'] is not None for m in R['metrics']),"input_bindings":len(bindings),"scopes":dict(Counter(m['scope'] for m in R['metrics']))}))
