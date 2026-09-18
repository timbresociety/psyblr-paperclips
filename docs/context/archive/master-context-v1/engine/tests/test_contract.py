import json
import math
import sys
import unittest
from copy import deepcopy
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import kernel as k

def event(i,t,tick=0,**data):
    return {"id":i,"type":t,"tick":tick,"data":data}

def subscriber(ledger,n=1,price=10000):
    return ledger.apply(event("sub","subscribe",customer_id="a",count=n,base_cents=price))

def company_fixture():
    # $1.2M ARR, $0.8M opening ARR, $100K earned/month, $125K costs/month.
    return {"eligible_arr_cents":120000000,"window_open_arr_cents":80000000,
            "window_new_arr_cents":40000000,"window_ticks":1800,
            "window_revenue_cents":30000000,"window_cogs_cents":15000000,
            "window_opex_cents":22500000}

class ContractTests(unittest.TestCase):
    def test_all_formula_symbols_resolve(self): self.assertEqual(k.lint_registry(),[])
    def test_metric_ids_unique(self):
        ids=[r["id"] for r in k.REG["metrics"]]
        self.assertEqual(len(ids),len(set(ids)))
        self.assertEqual(len(ids),k.REG["metric_count"])
    def test_every_scope_evaluates(self):
        contexts={
          "market":{"channel":k.P["channels"]["community"]},
          "function":{"function_id":"demand","fn":k.P["functions"]["demand"],"excess_strain":0,"dt":.1,"now_tick":0,"selected_axis_rank":0},
          "customer":{"segment":k.P["segments"]["creator"],"capability_speed":.35,"capability_collaboration":.15,"capability_control":.05,"competition":.1,"demand_craft":0,"product_craft":0,"retention_craft":0,"dt_ticks":1},
          "loan":{"eligible_mrr_cents":0,"total_debt_cents":0},
          "vc":{"current_arr_cents":0,"now_tick":0},
          "task":{"per_attempt_cost_cents":100,"now_tick":0}}
        evaluated=0
        for scope,records in k.BY_SCOPE.items():
            result=k.evaluate(scope,context=contexts.get(scope,{}))
            evaluated+=len(result)
        self.assertEqual(evaluated,k.REG["metric_count"])
    def test_rejects_nonfinite(self):
        with self.assertRaises(ValueError): k.evaluate("company",{"cash_cents":float("nan")})
    def test_rejects_fractional_money_input(self):
        with self.assertRaises(ValueError): k.evaluate("company",{"cash_cents":1.5})
    def test_rejects_unknown_or_derived_input(self):
        with self.assertRaises(ValueError): k.evaluate("company",{"valuation_cents":100})
    def test_rejects_zero_window_before_division(self):
        with self.assertRaises(ValueError): k.evaluate("company",{"window_ticks":0})
    def test_rejects_rank_outside_tree(self):
        with self.assertRaises(ValueError): k.evaluate_company_workflows({"demand":{"craft_rank":5}})
    def test_one_founder_attention(self):
        with self.assertRaises(ValueError): k.evaluate_company_workflows({"demand":{"founder_focus":True},"product":{"founder_focus":True}})
    def test_ops_budget_is_conserved(self):
        with self.assertRaises(ValueError): k.evaluate_company_workflows({"demand":{"ops_maintenance_weight":.9}})
    def test_scale_does_not_multiply_manual_hands(self):
        a=k.evaluate_company_workflows({"demand":{"founder_focus":True}})["functions"]["demand"]
        b=k.evaluate_company_workflows({"demand":{"founder_focus":True,"scale_rank":4,"online_units":16}})["functions"]["demand"]
        self.assertEqual(a["manual_attempts_per_second"],b["manual_attempts_per_second"])
        self.assertEqual(b["autonomous_attempts_per_second"],0)
    def test_craft_doubles_batch(self):
        a=k.evaluate_company_workflows({})["functions"]["demand"]
        b=k.evaluate_company_workflows({"demand":{"craft_rank":1}})["functions"]["demand"]
        self.assertEqual(b["craft_batch"],2*a["craft_batch"])
    def test_offline_function_cannot_execute(self):
        r=k.evaluate_company_workflows({"demand":{"online_units":0,"founder_focus":True,"queue_work_units":12}})
        self.assertEqual(r["functions"]["demand"]["production_attempts_per_second"],0)
    def test_incident_ops_does_not_also_repair_rot(self):
        r=k.evaluate_company_workflows({"operations":{"founder_focus":True,"queue_work_units":12}},operations_mode="incident")
        self.assertGreater(r["functions"]["operations"]["expected_accepted_output_per_second"],0)
        self.assertEqual(r["operations"]["maintenance_output_per_second"],0)
    def test_accumulated_strain_survives_throttling(self):
        r=k.evaluate_company_workflows({},operations_inputs={"strain_backlog":32})["operations"]
        self.assertEqual(r["instant_overload"],0)
        self.assertGreater(r["excess_strain"],0)
        self.assertLess(r["strain_backlog_next_expected"],32)
    def test_overextension_can_reduce_output(self):
        safe={"demand":{"scale_rank":1,"online_units":2,"automate_rank":2,"queue_work_units":24}}
        overloaded={"demand":{"scale_rank":4,"online_units":16,"automate_rank":4,"queue_work_units":192,"context_rot":1}}
        a=k.evaluate_company_workflows(safe)["functions"]["demand"]["expected_accepted_output_per_second"]
        b=k.evaluate_company_workflows(overloaded,operations_inputs={"strain_backlog":200})["functions"]["demand"]["expected_accepted_output_per_second"]
        self.assertLess(b,a)
    def test_rot_is_bounded(self):
        r=k.evaluate_company_workflows({"demand":{"context_rot":1,"configuration_changes":100}})
        self.assertEqual(r["functions"]["demand"]["context_rot_next_expected"],1)
    def test_luck_mean_and_variance(self):
        xs=k.luck_outcomes(4); mean=sum(xs)/4
        self.assertAlmostEqual(mean,1.04)
        self.assertAlmostEqual(sum((x-mean)**2 for x in xs)/4,.64**2)
        self.assertGreater(min(xs),0)
    def test_saturation_can_reverse_luck_ev(self):
        self.assertLess(k.capped_luck_mean(16,16,4),16)
    def test_rng_replay_unchanged_by_reads(self):
        a=k.resolve_work("s","demand","job",0,20,100,2,.05,.5,4)
        for _ in range(10): k.evaluate_company_workflows({})
        b=k.resolve_work("s","demand","job",0,20,100,2,.05,.5,4)
        self.assertEqual(a,b)
    def test_rng_streams_distinct(self):
        self.assertNotEqual(k.uniform("s","a","event"),k.uniform("s","b","event"))
    def test_sampled_output_never_exceeds_finite_room(self):
        r=k.resolve_work("s","product","job",0,100,7,16,0,1,4)
        self.assertLessEqual(r["useful_output_count"],7)
        self.assertLess(r["output_credit"],1)
    def test_shared_luck_group_is_effective(self):
        # Same local draws, only common group changed; compare a sequence of epochs.
        a=[k.resolve_work("s","demand","j",n,1,100,16,0,1,4,exposure_group="a")["useful_output_count"] for n in range(12)]
        b=[k.resolve_work("s","demand","j",n,1,100,16,0,1,4,exposure_group="b")["useful_output_count"] for n in range(12)]
        self.assertNotEqual(a,b)
    def test_modifier_order(self):
        mods=[{"target":"x","source_id":"a","operation":"add","value":20},
              {"target":"x","source_id":"b","operation":"increase_bps","value":2000},
              {"target":"x","source_id":"c","operation":"multiply","value":2}]
        self.assertEqual(k.apply_modifiers(100,"x",mods),288)
    def test_override_order_is_stable(self):
        mods=[{"target":"x","source_id":"z","operation":"override","value":9},
              {"target":"x","source_id":"a","operation":"override","value":7}]
        self.assertEqual(k.apply_modifiers(100,"x",mods),9)
    def test_valuation_hand_calculation(self):
        r=k.evaluate("company",company_fixture())
        self.assertEqual(r["growth_multiple"],8)
        self.assertEqual(r["ongoing_burn_ratio"],.25)
        self.assertEqual(r["valuation_cents"],872727272)
        self.assertEqual(r["arr_bridge_error_cents"],0)
    def test_arr_bridge_must_reconcile(self):
        with self.assertRaises(ValueError): k.evaluate("company",{"eligible_arr_cents":100})
    def test_liquidity_risk_reduces_valuation(self):
        a=k.evaluate("company",company_fixture())
        b=k.evaluate("company",{**company_fixture(),"forecast_obligations_cents":100000,"forecast_peak_shortfall_cents":50000})
        self.assertLess(b["valuation_cents"],a["valuation_cents"])
    def test_profit_can_coexist_with_cash_burn(self):
        r=k.evaluate("company",{"window_ticks":600,"window_revenue_cents":1000000,"window_opex_cents":800000,"window_collections_cents":600000,"window_operating_payments_cents":800000})
        self.assertEqual(r["operating_surplus_cents"],200000)
        self.assertEqual(r["net_cash_burn_cents_month"],200000)
    def test_zero_arr_no_infinite_growth(self):
        r=k.evaluate("company")
        self.assertIsNone(r["observed_growth"])
        self.assertEqual(r["scoring_growth"],0)
    def test_absurd_price_cannot_buy_lottery_arr(self):
        ctx={"segment":k.P["segments"]["creator"],"capability_speed":1,"capability_collaboration":1,"capability_control":1,"competition":.1,"demand_craft":4,"product_craft":4,"retention_craft":4,"dt_ticks":1}
        r=k.evaluate("customer",{"price_cents_per_month":100000000000},ctx)
        self.assertEqual(r["paid_conversion_probability"],0)
    def test_delinquent_customer_cannot_expand(self):
        ctx={"segment":k.P["segments"]["creator"],"capability_speed":1,"capability_collaboration":1,"capability_control":1,"competition":.1,"demand_craft":4,"product_craft":4,"retention_craft":4,"dt_ticks":1}
        r=k.evaluate("customer",{"age_ticks":2000,"delinquency_ticks":1201},ctx)
        self.assertEqual(r["expansion_eligible_slots"],0)
    def test_no_burn_runway_is_null_not_fake_infinity(self):
        self.assertIsNone(k.evaluate("company")["simple_burn_runway_months"])
    def test_accrual_is_partition_invariant(self):
        a,r=0,0
        for _ in range(600):
            x,r=k.accrue_service(10001,1,r); a+=x
        self.assertEqual((a,r),k.accrue_service(10001,600))
    def test_subscription_is_neither_earned_nor_cash(self):
        l=k.Ledger(100); subscriber(l)
        self.assertEqual((l.arr(),l.earned_cents,l.cash),(120000,0,100))
    def test_service_cannot_overlap(self):
        l=k.Ledger(); subscriber(l)
        l.apply(event("s1","service",300,customer_id="a",start_tick=0,end_tick=300))
        with self.assertRaises(ValueError): l.apply(event("s2","service",600,customer_id="a",start_tick=0,end_tick=600))
        self.assertEqual(l.earned_cents,5000)
    def test_repricing_accrues_old_rate_first(self):
        l=k.Ledger(); subscriber(l)
        l.apply(event("r","reprice",300,customer_id="a",base_cents=20000))
        l.apply(event("s","service",600,customer_id="a",start_tick=300,end_tick=600))
        self.assertEqual(l.earned_cents,15000)
    def test_duplicate_event_is_idempotent(self):
        l=k.Ledger(); e=event("s","subscribe",customer_id="a",count=1,base_cents=10000)
        l.apply(e); self.assertFalse(l.apply(e)["applied"])
        self.assertEqual(l.arr(),120000)
    def test_collection_cannot_duplicate_or_create_revenue(self):
        l=k.Ledger(0); subscriber(l)
        l.apply(event("s","service",600,customer_id="a",start_tick=0,end_tick=600))
        l.apply(event("i","invoice",600,invoice_id="i",cents=10000,due_tick=660))
        l.apply(event("c","collect",660,invoice_id="i",cents=10000))
        with self.assertRaises(ValueError): l.apply(event("c2","collect",660,invoice_id="i",cents=1))
        self.assertEqual((l.cash,l.earned_cents),(10000,10000))
    def test_two_addon_slots(self):
        l=k.Ledger(); subscriber(l)
        for i in range(2): l.apply(event(str(i),"expand",customer_id="a"))
        with self.assertRaises(ValueError): l.apply(event("third","expand",customer_id="a"))
        self.assertEqual(l.mrr(),15000)
    def test_unaffordable_optional_purchase_does_not_bankrupt(self):
        l=k.Ledger(10)
        with self.assertRaises(ValueError): l.apply(event("p","purchase",cents=11))
        self.assertEqual(l.cash,10); self.assertFalse(l.failed)
    def test_late_cash_cannot_rescue_earlier_bill(self):
        l=k.Ledger(0)
        l.apply(event("b","bill",bill_id="b",cents=1,due_tick=10,category="opex"))
        with self.assertRaises(ValueError): l.apply(event("late","subscribe",11,customer_id="a",count=1,base_cents=10000))
        self.assertFalse(l.settle_due(10))
    def test_due_failure_precedes_unicorn(self):
        l=k.Ledger(0)
        l.apply(event("b","bill",bill_id="b",cents=1,due_tick=10,category="opex"))
        self.assertFalse(l.milestone(k.P["win_valuation_cents"],10))
        self.assertEqual(l.founder_wins,0)
    def test_loan_cash_is_not_revenue_and_principal_reduces_debt(self):
        l=k.Ledger(0); subscriber(l)
        l.apply(event("d","loan_draw",loan_id="l",cents=30000,apr_bps=1800,term_months=6))
        self.assertEqual((l.cash,l.earned_cents),(30000,0))
        self.assertTrue(l.settle_due(600))
        self.assertEqual((l.cash,l.loans["l"]["principal_cents"]),(24550,25000))
        self.assertEqual(sum(e["data"]["cents"] for e in l.log if e["type"]=="loan_interest_accrual"),450)
    def test_loan_cannot_exceed_capacity(self):
        l=k.Ledger(); subscriber(l)
        with self.assertRaises(ValueError): l.apply(event("d","loan_draw",loan_id="l",cents=30001,apr_bps=1800,term_months=6))
    def test_bootstrap_has_no_growth_failure(self):
        l=k.Ledger(1)
        self.assertTrue(l.settle_due(100000)); self.assertFalse(l.failed)
    def test_vc_creates_conditional_growth_failure(self):
        l=k.Ledger(); subscriber(l,n=10)
        l.apply(event("v","vc_accept",cents=1200000,pre_money_cents=4800000,growth_target_bps=5000,absolute_target_arr_cents=1200000))
        self.assertEqual(l.ownership_ppm,800000)
        self.assertFalse(l.settle_due(1800)); self.assertEqual(l.failure_reason,"vc_growth")
    def test_forecast_excludes_unsigned_funding_and_detects_timing(self):
        r=k.cash_forecast(0,0,[{"id":"b","tick":10,"cents":100}],
          [{"id":"c","tick":11,"cents":1000,"probability":1,"source":"customer"},
           {"id":"v","tick":1,"cents":10000,"source":"conditional_capital"}])
        self.assertEqual(r["forecast_peak_shortfall_cents"],100)
        self.assertEqual(r["forecast_first_shortfall_ticks"],10)
    def test_same_tick_collection_can_pay_bill(self):
        r=k.cash_forecast(0,0,[{"id":"b","tick":10,"cents":80}],
          [{"id":"c","tick":10,"cents":100,"probability":1,"source":"customer"}])
        self.assertEqual(r["forecast_peak_shortfall_cents"],0)
    def test_founder_advantage_is_preserved(self):
        mods=[{"target":"starting_cash","source_id":"earned_relic_fixture","operation":"multiply","value":2}]
        self.assertEqual(k.apply_modifiers(k.P["starting_cash_cents"],"starting_cash",mods),300000)
        self.assertFalse(k.REG["founder_correction"]["normalize_difficulty_to_erase_advantage"])
    def test_success_only_awards_once(self):
        l=k.Ledger(1)
        self.assertTrue(l.milestone(k.P["win_valuation_cents"],0))
        self.assertFalse(l.milestone(k.P["win_valuation_cents"],0))
        self.assertEqual(l.founder_wins,1)
        self.assertFalse(k.evaluate("founder",{"run_succeeded":False})["relic_award_eligible"])

if __name__=="__main__": unittest.main(verbosity=2)
