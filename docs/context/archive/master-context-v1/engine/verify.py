"""Run correctness checks and save reproducible evidence. No full-run simulator."""
import hashlib
import io
import json
import math
from pathlib import Path
import unittest
import kernel as k

ROOT=Path(__file__).resolve().parent
OUT=ROOT/"evidence"
OUT.mkdir(exist_ok=True)
def dump(name,obj):
    (OUT/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False,allow_nan=False)+"\n")

stream=io.StringIO()
suite=unittest.defaultTestLoader.discover(str(ROOT/"tests"))
result=unittest.TextTestRunner(stream=stream,verbosity=2).run(suite)
(OUT/"test_results.txt").write_text(stream.getvalue())
contract=json.loads((ROOT/"event_contract.json").read_text())
inputs={r["id"] for r in k.REG["metrics"] if r["formula"] is None}
binding_coverage=inputs==set(contract["input_bindings"])
hashes={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in (
    "candidate_profile.json","metric_registry.json","state_schema.json","event_contract.json","kernel.py","tests/test_contract.py")}
report={"profile_id":k.P["profile_id"],"metric_definitions":k.REG["metric_count"],
        "executable_formulas":sum(r["formula"] is not None for r in k.REG["metrics"]),
        "input_bindings":len(inputs),"binding_coverage_complete":binding_coverage,
        "unit_tests_run":result.testsRun,"failures":len(result.failures),"errors":len(result.errors),
        "registry_lint":k.lint_registry(),"passed":result.wasSuccessful() and binding_coverage and not k.lint_registry(),
        "verification_scope":"formula, transaction, finite-resource and ordering fixtures; not full-run play balance",
        "file_sha256":hashes}
dump("validation.json",report)

base={"eligible_arr_cents":120000000,"window_open_arr_cents":80000000,"window_new_arr_cents":40000000,
      "window_ticks":1800,"window_revenue_cents":30000000,"window_cogs_cents":15000000,"window_opex_cents":22500000}
valuation=[]
for name,patch in (
    ("profitable_same_growth",{"window_opex_cents":12000000}),
    ("burning_but_funded",{}),
    ("same_business_payment_gap",{"forecast_obligations_cents":1000000,"forecast_peak_shortfall_cents":500000})):
    r=k.evaluate("company",{**base,**patch})
    valuation.append({"name":name,**{key:r[key] for key in ("eligible_arr_cents","scoring_growth","growth_multiple","ongoing_burn_ratio","forecast_shortfall_fraction","capital_quality_factor","valuation_cents")}})

work=[]
for name,inputs,ops in (
  ("manual_start",{"demand":{"founder_focus":True,"queue_work_units":12}},{}),
  ("small_automation",{"demand":{"scale_rank":1,"online_units":2,"automate_rank":2,"queue_work_units":24}},{}),
  ("overextended_neglected",{"demand":{"scale_rank":4,"online_units":16,"automate_rank":4,"queue_work_units":192,"context_rot":1}},{"strain_backlog":200})):
    r=k.evaluate_company_workflows(inputs,operations_inputs=ops)
    f=r["functions"]["demand"]
    work.append({"name":name,"operations":r["operations"],"demand":{key:f[key] for key in (
      "manual_attempts_per_second","autonomous_attempts_per_second","failure_probability","expected_accepted_output_per_second","upkeep_cents_per_month","context_rot_next_expected")}})
profit=k.evaluate("company",{"window_ticks":600,"window_revenue_cents":1000000,"window_opex_cents":800000,"window_collections_cents":600000,"window_operating_payments_cents":800000})
dump("scenarios.json",{"status":"constructed reference fixtures, not observed full runs",
    "valuation":valuation,"work":work,"profit_vs_cash":{key:profit[key] for key in ("operating_surplus_cents","net_cash_burn_cents_month")},
    "luck_rank4":{"outcomes":k.luck_outcomes(4),"mean":sum(k.luck_outcomes(4))/4,"variance":.64**2,
                  "saturated_batch16_expected_accepted_continuous":k.capped_luck_mean(16,16,4)},
    "rng_fixture":{"seed":"solounicorn-v1","stream":"technical:demand","event_id":"attempt:42","uniform":k.uniform("solounicorn-v1","technical:demand","attempt:42")}})
print(json.dumps(report,indent=2))
if not report["passed"]: raise SystemExit(1)
