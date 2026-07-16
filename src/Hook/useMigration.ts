import { useCallback } from 'react'
import { APP_VERSION, parseMajorVersion } from '@/Config/version'
import type { MigrationPlan } from '@/Migration/MigrationPlan'
import type { MigrationTarget } from '@/Migration/MigrationTarget'
import { createGSheetMigrationTarget } from '@/Migration/Target/GSheetMigrationTarget'
import { createLocalCsvMigrationTarget } from '@/Migration/Target/LocalCsvMigrationTarget'
import { runPlans } from '@/Migration/orchestrator'
import { resolvePlanChain } from '@/Migration/registry'
import { getFolderRepository } from '@/Repository/RepositoryFactory'
import { SystemClock, type Clock } from '@/Service/Clock'
import { useBackendStore } from '@/Store/backendStore'
import { useMigrationStore } from '@/Store/migrationStore'
import {
  enterShop,
  toErrorMessage,
  validationService,
} from '@/Hook/useOpenShop'

/** The synthetic first step of every run — the working copy / backup. */
export const BACKUP_STEP_ID = 'backup'

/** Detail shown on the backup card when the user declined a backup. */
export const BACKUP_SKIPPED_KEY = 'wizard.migrationBackupSkipped'

export interface StartMigrationArgs {
  folderId: string
  shopVersion: string
  keepOriginalAsBackup: boolean
}

export type MigrationResult = { ok: true } | { ok: false; failedAt: string }

/** Resolve the chain of plans lifting `shopVersion` up to the app's major. */
function planChain(shopVersion: string): MigrationPlan[] {
  const from = parseMajorVersion(shopVersion)
  const to = parseMajorVersion(APP_VERSION)
  if (from === null || to === null) {
    throw new Error(
      `Cannot migrate a shop versioned '${shopVersion}' to '${APP_VERSION}'`
    )
  }
  return resolvePlanChain(from, to)
}

/**
 * The wizard grid's rows for a shop at `shopVersion`: the synthetic backup step
 * followed by every plan step, deduped (chained plans repeat ids — 'jobs' runs
 * in both v1→v2 and v2→v3 but is one row). Mirrors the orchestrator's own
 * seeding so the idle grid matches the live one. An unresolvable chain shows
 * the backup row alone; `start` surfaces the reason.
 */
export function migrationStepIds(shopVersion: string): string[] {
  try {
    const ids = planChain(shopVersion).flatMap((plan) =>
      plan.steps.map((step) => step.id)
    )
    return [BACKUP_STEP_ID, ...new Set(ids)]
  } catch {
    return [BACKUP_STEP_ID]
  }
}

async function buildTarget(
  folderId: string,
  shopVersion: string,
  clock: Clock
): Promise<MigrationTarget> {
  const { backend, localDirectoryHandle } = useBackendStore.getState()

  if (backend === 'local-csv' && localDirectoryHandle !== null) {
    return createLocalCsvMigrationTarget(
      localDirectoryHandle,
      shopVersion,
      APP_VERSION,
      clock
    )
  }

  if (backend === 'google-drive') {
    // The spreadsheet id is not in the wizard's hands — it lives in the shop
    // metadata that validation already read, so read it back from the folder.
    const metadata = await getFolderRepository().readMetadata(folderId)
    if (metadata === null) {
      throw new Error(`Folder '${folderId}' is not an illo3d shop`)
    }
    return createGSheetMigrationTarget(
      folderId,
      metadata.spreadsheetId,
      shopVersion,
      APP_VERSION,
      clock
    )
  }

  throw new Error('No backend selected')
}

/**
 * Drives a migration run and, on success, opens the migrated shop.
 *
 * Progress lives entirely in `migrationStore` (the orchestrator streams it), so
 * the wizard grid and this hook read the same source of truth.
 */
export function useMigration(clock: Clock = new SystemClock()) {
  const phase = useMigrationStore((state) => state.phase)
  const steps = useMigrationStore((state) => state.steps)
  const failureMessage = useMigrationStore((state) => state.failureMessage)

  const start = useCallback(
    async ({
      folderId,
      shopVersion,
      keepOriginalAsBackup,
    }: StartMigrationArgs): Promise<MigrationResult> => {
      const store = useMigrationStore.getState()

      const fail = (error: unknown, failedAt: string): MigrationResult => {
        store.setFailureMessage(toErrorMessage(error))
        store.setPhase('failed')
        return { ok: false, failedAt }
      }

      let plans: MigrationPlan[]
      let target: MigrationTarget
      try {
        plans = planChain(shopVersion)
        // Seed before the (possibly slow) target build so the grid is populated
        // from the first frame; `runPlans` re-seeds identically.
        store.seedSteps(migrationStepIds(shopVersion))
        if (!keepOriginalAsBackup) {
          store.updateStep(BACKUP_STEP_ID, {
            status: 'done',
            description: BACKUP_SKIPPED_KEY,
          })
        }
        target = await buildTarget(folderId, shopVersion, clock)
      } catch (error) {
        return fail(error, BACKUP_STEP_ID)
      }

      const result = await runPlans(plans, target, { keepOriginalAsBackup })
      if (!result.ok) return result

      // The metadata version has flipped; re-validate rather than trust it.
      try {
        const validation =
          await validationService().validateShopFolder(folderId)
        if (!validation.ok) {
          return fail(
            new Error(`Migrated shop failed validation (${validation.error})`),
            'commit'
          )
        }
        await enterShop(validation.shop)
      } catch (error) {
        return fail(error, 'commit')
      }

      return { ok: true }
    },
    [clock]
  )

  return { start, phase, steps, failureMessage }
}
