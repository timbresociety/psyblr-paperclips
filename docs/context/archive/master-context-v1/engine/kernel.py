"""Executable metric kernel, candidate v1. No UI, network or generative model calls.

This module evaluates every formula in metric_registry.json. It also provides
seeded work resolution, precise accrual, forecasts, modifier ordering, and a
transaction reference reducer. It is not a full autonomous game-loop simulator.
"""
from __future__ import annotations
import ast
from copy import deepcopy
from decimal import Decimal, localcontext, ROUND_FLOOR
from hashlib import sha256
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parent
P=json.loads((ROOT/"candidate_profile.json").read_text())
REG=json.loads((ROOT/"metric_registry.json").read_text())
BY_SCOPE={}
for item in REG["metrics"]:
    BY_SCOPE.setdefault(item["scope"],[]).append(item)

def clamp(x,lo,hi): return max(lo,min(hi,x))
def ratio(a,b): return None if b==0 else a/b
def ceildiv(a,b):
    if b<=0: raise ValueError("positive denominator required")
    return -(-a//b)

def piecewise(x,knots):
    if x<=knots[0][0]: return knots[0][1]
    for (x0,y0),(x1,y1) in zip(knots,knots[1:]):
        if x<=x1: return y0+(y1-y0)*(x-x0)/(x1-x0)
    return knots[-1][1]

def score_cents(arr,multiple,capital):
    with localcontext() as c:
        c.prec=28
        # The input ratios are serialized by decimal repr before multiplication.
        value=Decimal(arr)*Decimal(str(multiple))*Decimal(str(capital))
        return int(value.to_integral_value(rounding=ROUND_FLOOR))

def luck_outcomes(rank,p=P):
    mu=1+p["luck_mean_per_rank"]*rank
    sd=p["luck_sd_per_rank"]*rank
    a=math.sqrt(p["luck_shared_variance_fraction"])
    b=math.sqrt(1-p["luck_shared_variance_fraction"])
    return [mu+sd*(a*x+b*y) for x in (-1,1) for y in (-1,1)]

def capped_luck_mean(batch,room,rank,p=P):
    return sum(min(room,batch*x) for x in luck_outcomes(rank,p))/4

def uniform(seed,stream,event_id):
    # Counter-based: reading a tooltip consumes no RNG and events in one stream
    # cannot perturb another stream. Exact seed/IDs are part of the replay.
    payload=json.dumps([str(seed),str(stream),str(event_id)],separators=(",",":")).encode()
    return (int.from_bytes(sha256(payload).digest()[:8],"big") >> 11) / 2**53

def bernoulli(seed,stream,event_id,p):
    if not 0<=p<=1: raise ValueError("probability outside [0,1]")
    return uniform(seed,stream,event_id)<p

def apply_modifiers(base,target,modifiers):
    """Fixed order: add -> increase_bps -> multiply -> override -> clamp -> integer.
    Equal operations sort by (priority, source_id). Multipliers compose.
    No normalization by founder wins. An override with greatest order wins.
    """
    items=[m for m in modifiers if m["target"]==target]
    if len({m["source_id"] for m in items})!=len(items):
        raise ValueError("duplicate modifier source for target")
    items.sort(key=lambda m:(m.get("priority",0),m["source_id"]))
    valid={"add","increase_bps","multiply","override","clamp_min","clamp_max","floor","ceil"}
    if any(m["operation"] not in valid for m in items): raise ValueError("unknown modifier")
    value=base+sum(m["value"] for m in items if m["operation"]=="add")
    value*=1+sum(m["value"] for m in items if m["operation"]=="increase_bps")/10000
    for m in items:
        if m["operation"]=="multiply": value*=m["value"]
    for m in items:
        if m["operation"]=="override": value=m["value"]
    lower=[m["value"] for m in items if m["operation"]=="clamp_min"]
    upper=[m["value"] for m in items if m["operation"]=="clamp_max"]
    if lower and upper and max(lower)>min(upper): raise ValueError("inconsistent clamps")
    if lower: value=max(value,max(lower))
    if upper: value=min(value,min(upper))
    modes={m["operation"] for m in items if m["operation"] in ("floor","ceil")}
    if len(modes)>1: raise ValueError("conflicting integer conversion")
    if modes: value=math.floor(value) if "floor" in modes else math.ceil(value)
    if not math.isfinite(value) or value<0: raise ValueError("invalid modified attribute")
    return value

SAFE_FUNCS={"min":min,"max":max,"abs":abs,"floor":math.floor,"ceil":math.ceil,
 "sqrt":math.sqrt,"clamp":clamp,"ratio":ratio,"piecewise":piecewise,
 "score_cents":score_cents,"capped_luck_mean":capped_luck_mean,"ceildiv":ceildiv}
ALLOWED=(ast.Expression,ast.BinOp,ast.UnaryOp,ast.BoolOp,ast.Compare,ast.IfExp,
 ast.Name,ast.Load,ast.Constant,ast.Call,ast.Subscript,ast.List,ast.Tuple,
 ast.Add,ast.Sub,ast.Mult,ast.Div,ast.FloorDiv,ast.Mod,ast.Pow,ast.USub,ast.UAdd,
 ast.Not,ast.And,ast.Or,ast.Eq,ast.NotEq,ast.Lt,ast.LtE,ast.Gt,ast.GtE)
COMPILED={}
def compile_formula(expr):
    tree=ast.parse(expr,mode="eval")
    for n in ast.walk(tree):
        if not isinstance(n,ALLOWED): raise ValueError("unsupported formula AST: "+type(n).__name__)
        if isinstance(n,ast.Call) and (not isinstance(n.func,ast.Name) or n.func.id not in set(SAFE_FUNCS)|{"mod"}):
            raise ValueError("unsupported function call")
    return compile(tree,"<metric_formula>","eval")

def validate_value(record,value):
    if value is None:
        if record["nullable"]: return
        raise ValueError(record["id"]+": null not allowed")
    if record["value_type"]=="boolean":
        if type(value) is not bool: raise ValueError(record["id"]+": boolean required")
        return
    if isinstance(value,bool) or not isinstance(value,(int,float)):
        raise ValueError(record["id"]+": numeric value required")
    if not math.isfinite(value): raise ValueError(record["id"]+": finite number required")
    if record["value_type"]=="integer" and type(value) is not int:
        raise ValueError(record["id"]+": integer required")
    lo=record["bounds"]["minimum"]; hi=record["bounds"]["maximum"]
    if lo is not None and value<lo-1e-10: raise ValueError(record["id"]+": below minimum")
    if hi is not None and value>hi+1e-10: raise ValueError(record["id"]+": above maximum")

def evaluate(scope,inputs=None,context=None,modifiers=None,p=P):
    inputs=inputs or {}; context=context or {}; modifiers=modifiers or []
    records=BY_SCOPE[scope]
    state_ids={r["local_id"] for r in records if r["formula"] is None}
    if set(inputs)-state_ids: raise ValueError(f"Unknown/nonmutable inputs: {set(inputs)-state_ids}")
    if set(context)-set(REG["external_contexts"][scope]): raise ValueError("unknown context values")
    env={"p":p,**SAFE_FUNCS,**context,
         "mod":lambda target,base:apply_modifiers(base,target,modifiers)}
    out={}
    for r in records:
        key=r["local_id"]
        if r["formula"] is None:
            value=deepcopy(inputs.get(key,r["default"]))
        else:
            expr=r["formula"]
            code=COMPILED.setdefault(expr,compile_formula(expr))
            value=eval(code,{"__builtins__":{}},env)
        validate_value(r,value)
        env[key]=value; out[key]=value
    if scope=="function":
        if out["online_units"]>out["unit_capacity"]: raise ValueError("online units exceed capacity")
        if out["queue_work_units"]>out["queue_capacity"]: raise ValueError("queue capacity exceeded")
        if any(out[key]>=1 for key in ("batch_output_credit","manual_work_credit","auto_work_credit")):
            raise ValueError("fractional credit must be less than 1")
        if type(out["unit_capacity"]) not in (int,float) or int(out["unit_capacity"])!=out["unit_capacity"]:
            raise ValueError("unit capacity must be integral")
    if scope=="operations" and out["allocation_weight_sum"]+out["strain_repair_share"]>1+1e-12:
        raise ValueError("Ops allocation exceeds available work")
    if scope=="customer" and out["at_risk_count"]>out["count"]:
        raise ValueError("at risk count exceeds active count")
    if scope=="task" and (out["technical_successes"]>out["attempts"] or out["domain_successes"]>out["eligible_inputs"]):
        raise ValueError("task outcome exceeds available inputs")
    if scope=="company" and out["window_ticks"]<=0:
        raise ValueError("window_ticks must be positive")
    if scope=="company" and out["arr_bridge_error_cents"]!=0:
        raise ValueError("ARR bridge does not reconcile")
    return out

def evaluate_company_workflows(function_inputs,now_tick=0,modifiers=None,p=P,operations_inputs=None,operations_mode="maintain"):
    ids=list(p["functions"])
    if set(function_inputs)-set(ids): raise ValueError("unknown function")
    if operations_mode not in ("maintain","incident"): raise ValueError("unknown Ops mode")
    if sum(bool(function_inputs.get(k,{}).get("founder_focus",False)) for k in ids)>1:
        raise ValueError("founder cannot execute two functions")
    def one(k,excess,maintenance):
        data=deepcopy(function_inputs.get(k,{}))
        data["maintenance_points_per_second"]=maintenance
        fn={**p["functions"][k]}
        if k=="operations": fn["mode"]=operations_mode
        ctx={"function_id":k,"fn":fn,"excess_strain":excess,
             "dt":p["tick_seconds"],"now_tick":now_tick,
             "selected_axis_rank":data.get("craft_rank",0)}
        return evaluate("function",data,ctx,(modifiers or {}).get(k,[]),p)
    structural={k:one(k,0,0) for k in ids}
    ops_state={**(operations_inputs or {}),
      "total_coordination_load":sum(x["coordination_load"] for x in structural.values()),
      "ops_capacity_contribution":structural["operations"]["coordination_capacity_contribution"],
      "allocation_weight_sum":sum(x["ops_maintenance_weight"] for x in structural.values())
    }
    ops=evaluate("operations",ops_state,p=p)
    rates={k:one(k,ops["excess_strain"],0) for k in ids}
    maintenance=rates["operations"]["available_maintenance_points_per_second"]
    final={k:one(k,ops["excess_strain"],maintenance*rates[k]["ops_maintenance_weight"]) for k in ids}
    ops=evaluate("operations",{**ops_state,"maintenance_output_per_second":maintenance},p=p)
    return {"functions":final,"operations":ops,
            "semantics":"expected rates; commit actual work outcomes and actual Ops output in the event reducer"}

def resolve_work(seed,function_id,job_id,epoch,attempts,room,batch,failure_p,domain_p,
                 luck_rank,credit=0,p=P,exposure_group="shared_provider"):
    """Sampled finite-work resolver. Attempts already earned by the work clock.
    Produces output proposals; caller commits through stable transaction IDs.
    Costs are charged per attempt, including failed ones.
    """
    if type(attempts)is not int or attempts<0 or type(room)is not int or room<0: raise ValueError("integer counts required")
    if not 0<=credit<1: raise ValueError("fractional output credit outside [0,1)")
    if not (0<=luck_rank<=4 and 0<=failure_p<=1 and 0<=domain_p<=1 and batch>=0):
        raise ValueError("invalid work probability, rank or batch")
    common=1 if bernoulli(seed,"shared:"+exposure_group,epoch,.5) else -1
    rho=p["luck_shared_variance_fraction"]
    successes=outputs=domain_attempts=0
    potential=credit
    for i in range(attempts):
        eid=f"{job_id}:{i}"
        if not bernoulli(seed,"technical:"+function_id,eid,1-failure_p): continue
        successes+=1
        local=1 if bernoulli(seed,"local:"+function_id,eid,.5) else -1
        z=1+p["luck_mean_per_rank"]*luck_rank+p["luck_sd_per_rank"]*luck_rank*(math.sqrt(rho)*common+math.sqrt(1-rho)*local)
        potential+=batch*z
        n=math.floor(potential); potential-=n
        n=min(n,max(0,room-domain_attempts))
        for j in range(n):
            if bernoulli(seed,"domain:"+function_id,f"{eid}:{j}",domain_p): outputs+=1
        domain_attempts+=n
    return {"attempts":attempts,"technical_successes":successes,
      "domain_attempts":domain_attempts,"useful_output_count":outputs,
      "output_credit":potential,
      "rework_generated":(attempts-successes)*p["rework_units_per_failure"]}

def accrue_service(monthly_mrr_cents,elapsed_ticks,remainder=0,p=P):
    if min(monthly_mrr_cents,elapsed_ticks,remainder)<0: raise ValueError("negative accrual input")
    return divmod(monthly_mrr_cents*elapsed_ticks+remainder,p["ticks_per_month"])

def accrue_interest_month(principal_cents,apr_bps,remainder=0):
    if min(principal_cents,apr_bps,remainder)<0: raise ValueError("negative interest input")
    return divmod(principal_cents*apr_bps+remainder,120000)

def cash_forecast(cash_cents,now_tick,obligations,receipts,p=P):
    """Exact dated prefix forecast for supplied obligations and receipts.
    Outstanding bills and prospective operating costs must have unique IDs.
    Unsigned/conditional funds are excluded. Expected customer receipts are
    haircut by a fixed scenario coefficient; no new speculative sales.
    """
    end=now_tick+p["forecast_ticks"]
    events=[]; seen=set()
    total_due=expected_collections=0
    for o in obligations:
        if o["id"] in seen: raise ValueError("duplicate projection id")
        seen.add(o["id"])
        if o["cents"]<0: raise ValueError("negative obligation")
        if now_tick<=o["tick"]<=end:
            total_due+=o["cents"]
            events.append((o["tick"],1,o["id"],-o["cents"]))
    for r in receipts:
        if r["id"] in seen: raise ValueError("duplicate projection id")
        seen.add(r["id"])
        if r["cents"]<0: raise ValueError("negative receipt")
        if not (now_tick<=r["tick"]<=end): continue
        if r["source"]=="customer":
            if not 0<=r["probability"]<=1: raise ValueError("invalid collection probability")
            amount=math.floor(r["cents"]*r["probability"]*p["forecast_collection_haircut"])
            expected_collections+=amount
        elif r["source"]=="committed_capital":
            amount=r["cents"]
        elif r["source"] in ("conditional_capital","unsigned_sale"):
            continue
        else: raise ValueError("unknown receipt source")
        events.append((r["tick"],0,r["id"],amount))
    balance=cash_cents; peak=0; first=None; path=[]
    for tick,priority,eid,delta in sorted(events):
        balance+=delta
        if balance<0 and first is None: first=tick-now_tick
        peak=max(peak,-balance)
        path.append({"tick":tick,"event":eid,"delta_cents":delta,"projected_cash_cents":balance})
    return {"forecast_obligations_cents":total_due,
      "forecast_expected_collections_cents":expected_collections,
      "forecast_peak_shortfall_cents":max(0,peak),
      "forecast_first_shortfall_ticks":first,"path":path}

class Ledger:
    """Small reference transaction reducer, not a hidden alternative game loop.
    Receivables, mandatory bills, active homogeneous cohorts and financing are
    authoritative objects. Every event is idempotent and validates before commit.
    """
    def __init__(self,cash_cents=None,p=P):
        self.p=p
        self.cash=p["starting_cash_cents"] if cash_cents is None else cash_cents
        if type(self.cash)is not int or self.cash<0: raise ValueError("invalid initial cash")
        self.customers={}; self.invoices={}; self.bills={}; self.loans={}
        self.vc=None; self.ownership_ppm=1000000
        self.seen=set(); self.log=[]; self.failed=False; self.failure_reason=None
        self.tick=0; self.first_unicorn_tick=None
        self.earned_cents=0; self.unbilled_cents=0; self.service_remainders={}
        self.success_recorded=False; self.founder_wins=0; self.founder_relics=[]
    def mrr(self):
        return sum(c["count"]*(c["base_cents"]+c["addon_cents"]) for c in self.customers.values() if c["active"])
    def arr(self): return 12*self.mrr()
    def _next_due_tick(self):
        values=[b["due_tick"] for b in self.bills.values() if not b["paid"]]
        values += [l["next_due_tick"] for l in self.loans.values() if l["principal_cents"]>0]
        if self.vc is not None: values.append(self.vc["deadline_tick"])
        return min(values) if values else None
    def _accrue_cohort(self,key,end_tick):
        c=self.customers[key]
        if end_tick<c["service_cursor"]: raise ValueError("overlapping service interval")
        elapsed=end_tick-c["service_cursor"]
        mrr=c["count"]*(c["base_cents"]+c["addon_cents"]) if c["active"] else 0
        earned,remain=accrue_service(mrr,elapsed,self.service_remainders.get(key,0),self.p)
        self.service_remainders[key]=remain; c["service_cursor"]=end_tick
        self.earned_cents+=earned; self.unbilled_cents+=earned
        return earned
    def apply(self,event):
        if event["id"] in self.seen: return {"applied":False,"reason":"duplicate"}
        if self.failed: raise ValueError("failed run cannot transact")
        # Transactional rollback for a rejected optional action.
        backup=deepcopy(self.__dict__)
        try:
            result=self._apply(event)
            self.seen.add(event["id"]); self.log.append(deepcopy(event))
            return {"applied":True,**result}
        except Exception:
            self.__dict__.clear(); self.__dict__.update(backup); raise
    def _apply(self,event):
        t=event["type"]; d=event.get("data",{}); tick=event["tick"]
        if type(tick)is not int or tick<self.tick: raise ValueError("out-of-order tick")
        due=self._next_due_tick()
        if due is not None and due<tick: raise ValueError("settle earlier obligations before advancing")
        if t in ("purchase",) and due is not None and due<=tick:
            raise ValueError("settle mandatory obligations before optional spending")
        self.tick=tick
        def amount(name="cents",positive=False):
            n=d[name]
            if type(n)is not int or n<0 or (positive and n==0): raise ValueError("invalid cents/count")
            return n
        if t=="subscribe":
            key=d["customer_id"]
            if key in self.customers: raise ValueError("duplicate cohort")
            n=amount("count",True); price=amount("base_cents",True)
            self.customers[key]={"count":n,"base_cents":price,"addon_cents":0,"addon_count":0,"active":True,"service_cursor":tick}
            return {"new_arr_cents":12*n*price}
        if t in ("expand","reprice"):
            c=self.customers[d["customer_id"]]
            if not c["active"]: raise ValueError("inactive customer")
            self._accrue_cohort(d["customer_id"],tick)
            old=self.arr()
            if t=="expand":
                if c["addon_count"]>=self.p["addon_slots_per_customer"]: raise ValueError("addon slots exhausted")
                c["addon_count"]+=1
            else: c["base_cents"]=amount("base_cents",True)
            c["addon_cents"]=c["addon_count"]*math.floor(c["base_cents"]*self.p["addon_price_fraction"])
            delta=self.arr()-old
            return {"expansion_arr_cents":max(0,delta),"contraction_arr_cents":max(0,-delta)}
        if t=="cancel":
            c=self.customers[d["customer_id"]]
            n=amount("count",True)
            if not c["active"] or n>c["count"]: raise ValueError("invalid cancellation")
            self._accrue_cohort(d["customer_id"],tick)
            delta=12*n*(c["base_cents"]+c["addon_cents"])
            c["count"]-=n; c["active"]=c["count"]>0
            return {"churn_arr_cents":delta}
        if t=="service":
            c=self.customers[d["customer_id"]]
            if not c["active"]: raise ValueError("inactive service")
            if d["start_tick"]!=c["service_cursor"] or d["end_tick"]!=tick:
                raise ValueError("service interval must continue exactly from cursor to event tick")
            earned=self._accrue_cohort(d["customer_id"],tick)
            return {"earned_cents":earned}
        if t=="invoice":
            key=d["invoice_id"]; n=amount(positive=True)
            if key in self.invoices or n>self.unbilled_cents: raise ValueError("invalid invoice")
            if d["due_tick"]<tick: raise ValueError("invoice due in past")
            self.unbilled_cents-=n
            self.invoices[key]={"outstanding_cents":n,"due_tick":d["due_tick"]}
            return {}
        if t=="collect":
            inv=self.invoices[d["invoice_id"]]; n=amount(positive=True)
            if tick<inv["due_tick"] or n>inv["outstanding_cents"]: raise ValueError("invalid collection")
            inv["outstanding_cents"]-=n; self.cash+=n
            return {"collections_cents":n}
        if t=="invoice_credit":
            inv=self.invoices[d["invoice_id"]]; n=amount(positive=True)
            if n>inv["outstanding_cents"]: raise ValueError("credit exceeds receivable")
            inv["outstanding_cents"]-=n
            return {"invoice_credit_cents":n}
        if t=="bill":
            key=d["bill_id"]; n=amount()
            if key in self.bills or d["due_tick"]<tick: raise ValueError("invalid bill")
            if d["category"] not in ("cogs","opex","refund"): raise ValueError("loan settlement owns interest/principal bills")
            self.bills[key]={"cents":n,"due_tick":d["due_tick"],"category":d["category"],"paid":False}
            return {}
        if t=="purchase":
            n=amount(positive=True)
            if n>self.cash: raise ValueError("unaffordable purchase")
            self.cash-=n
            return {"installation_cents":n}
        if t=="loan_draw":
            n=amount(positive=True); key=d["loan_id"]
            if key in self.loans: raise ValueError("duplicate loan")
            if amount("apr_bps")!=self.p["default_loan_apr_bps"] or amount("term_months",True)!=self.p["default_loan_term_months"]:
                raise ValueError("terms differ from candidate debt offer")
            capacity=max(0,self.p["debt_capacity_mrr_multiple"]*self.mrr()-sum(v["principal_cents"] for v in self.loans.values()))
            if self.mrr()<self.p["debt_min_mrr_cents"] or n>capacity: raise ValueError("credit capacity exceeded")
            self.loans[key]={"principal_cents":n,"apr_bps":d["apr_bps"],"months_remaining":d["term_months"],"interest_remainder":0,"next_due_tick":tick+self.p["ticks_per_month"]}
            self.cash+=n
            return {"debt_draw_cents":n}
        if t=="vc_accept":
            n=amount(positive=True); premoney=amount("pre_money_cents",True)
            if self.vc is not None: raise ValueError("one active VC mandate in candidate reference")
            expected_pre=self.arr()*self.p["vc_offer_pre_money_arr_multiple"]
            if self.arr()<self.p["vc_min_arr_cents"] or premoney!=expected_pre or n>premoney*self.p["vc_max_raise_fraction_bps"]//10000:
                raise ValueError("terms exceed candidate VC offer")
            if amount("growth_target_bps")!=self.p["default_vc_growth_bps"] or amount("absolute_target_arr_cents")!=self.p["default_vc_absolute_arr_cents"]:
                raise ValueError("mandate differs from candidate VC offer")
            self.ownership_ppm=self.ownership_ppm*premoney//(premoney+n)
            self.cash+=n
            self.vc={"active":True,"baseline_arr_cents":self.arr(),
                     "growth_target_bps":d["growth_target_bps"],
                     "absolute_target_arr_cents":d["absolute_target_arr_cents"],
                     "deadline_tick":tick+self.p["ticks_per_month"]*self.p["months_per_quarter"],
                     "founder_ownership_ppm":self.ownership_ppm}
            return {"equity_cash_cents":n}
        raise ValueError("unknown event type: "+t)
    def settle_due(self,tick):
        if tick<self.tick: raise ValueError("out-of-order settlement")
        next_due=self._next_due_tick()
        if next_due is not None and next_due<tick: raise ValueError("cannot skip a due timestamp")
        self.tick=tick
        if self.failed: return False
        for key,l in sorted(self.loans.items()):
            if l["principal_cents"]>0 and l["next_due_tick"]==tick:
                interest,remain=accrue_interest_month(l["principal_cents"],l["apr_bps"],l["interest_remainder"])
                principal=ceildiv(l["principal_cents"],l["months_remaining"])
                for category,cents in (("interest",interest),("principal",principal)):
                    bid=f"loan:{key}:{tick}:{category}"
                    self.bills[bid]={"cents":cents,"due_tick":tick,"category":category,"paid":False,"loan_id":key}
                self.log.append({"id":f"loan_accrue:{key}:{tick}","type":"loan_interest_accrual","tick":tick,"data":{"cents":interest}})
                l["interest_remainder"]=remain; l["months_remaining"]-=1
                l["next_due_tick"]+=self.p["ticks_per_month"]
        due=sorted(((b["due_tick"],k,b) for k,b in self.bills.items() if not b["paid"] and b["due_tick"]<=tick))
        for due_tick,key,b in due:
            if b["cents"]>self.cash:
                self.failed=True; self.failure_reason="cash_obligation:"+key
                return False
            self.cash-=b["cents"]; b["paid"]=True
            if b["category"]=="principal": self.loans[b["loan_id"]]["principal_cents"]-=b["cents"]
        if self.vc is not None:
            v=evaluate("vc",self.vc,{"now_tick":tick,"current_arr_cents":self.arr()},p=self.p)
            if v["growth_failure_due"]:
                self.failed=True; self.failure_reason="vc_growth"
                return False
            if tick>=self.vc["deadline_tick"]:
                self.vc["baseline_arr_cents"]=self.arr()
                self.vc["deadline_tick"]+=self.p["ticks_per_month"]*self.p["months_per_quarter"]
        return True
    def milestone(self,valuation_cents,tick):
        if not self.settle_due(tick): return False
        if valuation_cents>=self.p["win_valuation_cents"] and self.first_unicorn_tick is None:
            self.first_unicorn_tick=tick
            if not self.success_recorded:
                self.founder_wins+=1; self.success_recorded=True
            return True
        return False

def lint_registry(reg=REG):
    errors=[]; ids=[m["id"] for m in reg["metrics"]]
    if len(ids)!=len(set(ids)): errors.append("duplicate metric IDs")
    for scope,records in BY_SCOPE.items():
        known={"p","mod"}|set(SAFE_FUNCS)|set(reg["external_contexts"][scope])
        for m in records:
            if m["formula"]:
                tree=ast.parse(m["formula"],mode="eval")
                unknown={n.id for n in ast.walk(tree) if isinstance(n,ast.Name)}-known
                if unknown: errors.append(m["id"]+": unresolved symbols "+repr(unknown))
                try: compile_formula(m["formula"])
                except ValueError as e: errors.append(str(e))
            known.add(m["local_id"])
            if not all(k in m for k in ("unit","bounds","writer","update_phase","persistence","level")):
                errors.append("incomplete metric "+m["id"])
    return errors

if __name__=="__main__":
    issues=lint_registry()
    if issues: raise SystemExit("\n".join(issues))
    fixture=evaluate_company_workflows({"demand":{"founder_focus":True,"queue_work_units":12}})
    print(json.dumps({"metric_count":REG["metric_count"],"registry_lint":"passed",
          "initial_strain":fixture["operations"]["strain_ratio"],
          "demand_expected_work_output_per_second":fixture["functions"]["demand"]["expected_accepted_output_per_second"]},indent=2))
