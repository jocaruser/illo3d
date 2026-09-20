import type { MigrationPlan } from '@/Migration/MigrationPlan'
import { planChain } from '@/Migration/planChain'

export type MigrationBenefitHopKey = 'v1ToV2' | 'v2ToV3'

export interface MigrationBenefitHop {
  hopKey: MigrationBenefitHopKey
}

function hopKeyForPlan(plan: MigrationPlan): MigrationBenefitHopKey | null {
  if (plan.fromMajor === 1 && plan.toMajor === 2) return 'v1ToV2'
  if (plan.fromMajor === 2 && plan.toMajor === 3) return 'v2ToV3'
  return null
}

/** Hop benefit groups for the migration dialog, in the order they will run. */
export function benefitHopsForShop(shopVersion: string): MigrationBenefitHop[] {
  try {
    return planChain(shopVersion).flatMap((plan) => {
      const hopKey = hopKeyForPlan(plan)
      return hopKey === null ? [] : [{ hopKey }]
    })
  } catch {
    return []
  }
}
