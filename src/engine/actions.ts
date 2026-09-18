import type { FunctionId, ProgressionAxis, CustomerSegment, EvolutionTier, AIPrimitiveType, EngineArchetypeId } from './types'

export type GameAction =
  | { type: 'clock.tick'; dtTicks?: number }
  | { type: 'run.pause' }
  | { type: 'run.resume' }
  | { type: 'run.set_speed'; speed: number; force?: boolean }
  | { type: 'run.reset' }
  | { type: 'run.set_tier_override'; tier: EvolutionTier | null }
  | { type: 'founder.equip_relic'; relicId: string | null }
  | { type: 'founder.unlock_achievement'; achievementId: string }
  
  // Navigation
  | { type: 'attention.switch'; functionId: FunctionId }
  
  // Demand
  | { type: 'demand.triage'; signalId: string; decision: 'qualify' | 'reject' }
  | { type: 'demand.hyper_triage'; signalId: string }
  | { type: 'demand.refresh_pool' }
  | { type: 'demand.batch_triage' }
  
  // Product
  | { type: 'product.place_component'; componentId: string; slot: 'speed' | 'collaboration' | 'control' }
  | { type: 'product.remove_component'; slot: 'speed' | 'collaboration' | 'control' }
  | { type: 'product.place_bucket'; componentId: string; bucket: 'write' | 'diff' | 'test' | 'deploy' }
  | { type: 'product.remove_bucket'; bucket: 'write' | 'diff' | 'test' | 'deploy' }
  | { type: 'product.set_stage'; stage: 'write' | 'diff' | 'test' | 'deploy' }
  | { type: 'product.resolve_diff' }
  | { type: 'product.run_tests' }
  | { type: 'product.verify' }
  | { type: 'product.ship' }
  | { type: 'product.fill_socket'; podId: string; socketIndex: number; primitive: AIPrimitiveType }
  | { type: 'product.verify_pod'; podId: string }
  | { type: 'product.ship_pod'; podId: string }
  | { type: 'product.auto_fill_primitive'; primitive: AIPrimitiveType }
  
  // Monetisation
  | { type: 'monetisation.set_slider'; normalizedCursor: number }
  | { type: 'monetisation.commit_price'; normalizedCursor?: number; rating?: 'perfect' | 'good' | 'hazard' }
  | { type: 'monetisation.commit_desk'; deskIndex: number; rating?: 'perfect' | 'good' | 'hazard'; normalizedCursor?: number }
  | { type: 'monetisation.batch_close' }
  
  // Retention
  | { type: 'retention.intervene'; accountId: string; interventionType: 'hotfix' | 'founder_call' | 'concession' }
  | { type: 'retention.squash_problem'; incidentId: string }
  | { type: 'retention.squash_hit'; incidentId: string; accountId?: string; damage?: number; costCents?: number }
  | { type: 'retention.tool_surge'; tool: 'coffee' | 'mallet' }
  
  // Expansion
  | { type: 'expansion.merge_package'; accountId: string; packId: string }
  | { type: 'expansion.spawn_item'; chain?: 'intelligence' | 'infrastructure' | 'security' }
  | { type: 'expansion.merge_grid'; fromIndex: number; toIndex: number }
  | { type: 'expansion.fulfill_order'; orderId: string }
  | { type: 'expansion.discard_item'; index: number }
  
  // Operations
  | { type: 'operations.scratch_evidence'; amount: number }
  | { type: 'operations.diagnose_cause'; cause: string }
  | { type: 'operations.resolve_incident' }
  | { type: 'operations.clear_strain' }
  | { type: 'operations.cleanse_rot' }
  | { type: 'operations.play_lucky_cat' }
  | { type: 'operations.scratch_pod'; podId: number }
  | { type: 'operations.cash_out_card' }
  | { type: 'operations.claim_card' }
  | { type: 'operations.new_card'; cardType: 'lucky_cat' | 'apple_tree' }
  | { type: 'operations.scratch_ticket'; ticketIndex?: number; stationIndex?: number; podIndex?: number }
  | { type: 'operations.claim_ticket'; ticketIndex?: number; stationIndex?: number }
  | { type: 'operations.batch_scratch_all' }
  
  // Fleet / Skill Trees
  | { type: 'fleet.buy_upgrade'; functionId: FunctionId; axis: ProgressionAxis }
  | { type: 'fleet.set_online_units'; functionId: FunctionId; units: number }
  
  // Finance
  | { type: 'finance.draw_debt'; amountCents: number }
  | { type: 'finance.repay_debt'; amountCents: number }
  | { type: 'finance.accept_vc_mandate' }
  
  // Quarter Review & Roguelike Upgrades
  | { type: 'quarter.close_review' }
  | { type: 'archetype.select'; archetypeId: EngineArchetypeId }
  | { type: 'relic.select'; relicId: string }
  | { type: 'relic.lock'; relicId: string }
  | { type: 'consumable.select'; consumableId: string }
  | { type: 'consumable.lock'; consumableId: string }
  | { type: 'consumable.use'; consumableId: string }
  | { type: 'quarter.reroll' }

  // Pipeline & Event Navigation
  | { type: 'pipeline.advance'; target: 'demand' | 'product' | 'monetisation' }
  | { type: 'event.resolve_retention' }
  | { type: 'event.resolve_expansion' }
  | { type: 'event.resolve_operations' }

  // Alerts Management
  | { type: 'alerts.dismiss'; alertId: string }
  | { type: 'alerts.clear_all' }

  // Tutorial & Playbook
  | { type: 'tutorial.complete' }
  | { type: 'playbook.complete_step'; stepId: string }
  | { type: 'playbook.dismiss' }


