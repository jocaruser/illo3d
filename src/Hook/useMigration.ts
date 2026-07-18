import { useCallback, useRef } from 'react'
import { APP_VERSION, parseMajorVersion } from '@/Config/version'
import type { MigrationPlan } from '@/Migration/MigrationPlan'
import type {
  MigrationSession,
  MigrationTarget,
} from '@/Migration/MigrationTarget'
import { createGSheetMigrationTarget } from '@/Migration/Target/GSheetMigrationTarget'
import { createLocalCsvMigrationTarget } from '@/Migration/Target/LocalCsvMigrationTarget'
import {
  BACKUP_SKIPPED_KEY,
  BACKUP_STEP_ID,
  runPlans,
} from '@/Migration/orchestrator'
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

// Historical home of these constants — the orchestrator owns them now, but
// the wizard modules keep importing from here.
export { BACKUP_SKIPPED_KEY, BACKUP_STEP_ID }

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
 * The wizard grid's rows for a shop at `shopVersion`: the backup step followed
 * by every plan step, deduped (chained plans repeat ids — 'jobs' runs in both
 * v1→v2 and v2→v3 but is one row). Mirrors the orchestrator's own seeding so
 * the idle grid matches the live one. An unresolvable chain shows the backup
 * row alone; `start` surfaces the reason.
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

/**
 * The `fromMajor` of every hop in the resolved chain, in run order — the
 * wizard derives its per-hop explanation bullets from these. An unresolvable
 * chain explains nothing (the run itself will surface the reason).
 */
export function migrationHopMajors(shopVersion: string): number[] {
  try {
    return planChain(shopVersion).map((plan) => plan.fromMajor)
  } catch {
    return []
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
 * Drives the in-memory migration run (ADR-0012). `start` executes the plan
 * chain against the in-memory copy and stops at 'ready' — nothing has been
 * written (except the backup, at its own step). `confirm` is the Confirm and
 * close press: persist everything in one pass, then validate and enter the
 * migrated shop.
 *
 * Progress lives entirely in `migrationStore` (the orchestrator streams it),
 * so the wizard grid and this hook read the same source of truth. The
 * completed session lives only in a ref — abandoning the page loses it, by
 * design.
 */
export function useMigration(clock: Clock = new SystemClock()) {
  const phase = useMigrationStore((state) => state.phase)
  const steps = useMigrationStore((state) => state.steps)
  const failureMessage = useMigrationStore((state) => state.failureMessage)
  const sessionRef = useRef<MigrationSession | null>(null)

  const start = useCallback(
    async ({
      folderId,
      shopVersion,
      keepOriginalAsBackup,
    }: StartMigrationArgs): Promise<MigrationResult> => {
      const store = useMigrationStore.getState()
      sessionRef.current = null

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

      sessionRef.current = result.session
      return { ok: true }
    },
    [clock]
  )

  const confirm = useCallback(
    async (folderId: string): Promise<MigrationResult> => {
      const store = useMigrationStore.getState()

      const fail = (error: unknown): MigrationResult => {
        store.setFailureMessage(toErrorMessage(error))
        store.setPhase('failed')
        return { ok: false, failedAt: 'commit' }
      }

      const session = sessionRef.current
      if (session === null) {
        return fail(new Error('No completed migration run to confirm'))
      }

      store.setPhase('committing')
      try {
        // Everything in one pass: the migrated tabs, then the version flip
        // LAST (the atomic commit) — both inside `persist`.
        await session.persist()
        // The metadata version has flipped; re-validate rather than trust it.
        const validation =
          await validationService().validateShopFolder(folderId)
        if (!validation.ok) {
          return fail(
            new Error(`Migrated shop failed validation (${validation.error})`)
          )
        }
        await enterShop(validation.shop)
      } catch (error) {
        return fail(error)
      }

      sessionRef.current = null
      store.setPhase('done')
      return { ok: true }
    },
    []
  )

  return { start, confirm, phase, steps, failureMessage }
}
