import { APP_VERSION, parseMajorVersion } from '@/Config/version'
import type { MigrationPlan } from '@/Migration/MigrationPlan'
import { resolvePlanChain } from '@/Migration/registry'

/** Resolve the chain of plans lifting `shopVersion` up to the app's major. */
export function planChain(shopVersion: string): MigrationPlan[] {
  const from = parseMajorVersion(shopVersion)
  const to = parseMajorVersion(APP_VERSION)
  if (from === null || to === null) {
    throw new Error(
      `Cannot migrate a shop versioned '${shopVersion}' to '${APP_VERSION}'`
    )
  }
  return resolvePlanChain(from, to)
}
