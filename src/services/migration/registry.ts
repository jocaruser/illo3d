import type { MigrationPlan } from './MigrationPlan'

// Plans register here as they are implemented (e.g. the v1→v2 plan).
const plans: MigrationPlan[] = []

export function resolvePlanChain(
  fromMajor: number,
  toMajor: number
): MigrationPlan[] {
  if (fromMajor > toMajor) {
    throw new Error(
      `Downgrading a shop from v${fromMajor} to v${toMajor} is not supported`
    )
  }
  const chain: MigrationPlan[] = []
  let current = fromMajor
  while (current < toMajor) {
    const next = plans.find((plan) => plan.fromMajor === current)
    if (!next) {
      throw new Error(`No migration path from v${fromMajor} to v${toMajor}`)
    }
    chain.push(next)
    current = next.toMajor
  }
  return chain
}
