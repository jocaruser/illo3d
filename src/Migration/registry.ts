import type { MigrationPlan } from './MigrationPlan'
import { v1ToV2Plan } from './Plan/V1ToV2'
import { v2ToV3Plan } from './Plan/V2ToV3'

/** All known plans, pre-seeded with the real chain. */
const plans: MigrationPlan[] = [v1ToV2Plan, v2ToV3Plan]

export function registerPlan(plan: MigrationPlan): void {
  plans.push(plan)
}

/**
 * Chain plans from a shop's major version up to the app's. Walks `fromMajor`
 * upward, hopping through whichever registered plan starts at the current
 * major. Throws on a downgrade or a missing hop.
 */
export function resolvePlanChain(
  fromMajor: number,
  toMajor: number
): MigrationPlan[] {
  if (fromMajor > toMajor) {
    throw new Error(`Cannot migrate downward from v${fromMajor} to v${toMajor}`)
  }
  // Every registered plan starts at a distinct major, so keying is lossless.
  const planByFromMajor = new Map(plans.map((plan) => [plan.fromMajor, plan]))
  const chain: MigrationPlan[] = []
  let current = fromMajor
  while (current < toMajor) {
    const plan = planByFromMajor.get(current)
    if (!plan) {
      throw new Error(
        `No migration plan found from v${current} (target v${toMajor})`
      )
    }
    chain.push(plan)
    current = plan.toMajor
  }
  return chain
}
