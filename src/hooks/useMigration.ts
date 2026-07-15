import { useCallback } from 'react'
import { APP_VERSION, parseMajorVersion } from '@/config/version'
import { useOpenExistingShop } from '@/hooks/useOpenExistingShop'
import { getFolderRepository } from '@/services/drive/folderRepository'
import { createDriveMigrationTarget } from '@/services/migration/backup/driveBackup'
import { createLocalMigrationTarget } from '@/services/migration/backup/localBackup'
import type { MigrationPlan } from '@/services/migration/MigrationPlan'
import type { MigrationTarget } from '@/services/migration/MigrationTarget'
import { BACKUP_STEP_ID, runPlan } from '@/services/migration/orchestrator'
import { resolvePlanChain } from '@/services/migration/registry'
import { useBackendStore } from '@/stores/backendStore'
import {
  useMigrationStore,
  type MigrationStepState,
} from '@/stores/migrationStore'

export interface StartMigrationParams {
  folderId: string
  shopVersion: string
  keepOriginalAsBackup: boolean
}

export interface MigrationOutcome {
  success: boolean
}

export function useMigration() {
  const { validateAndSetShop } = useOpenExistingShop()

  const start = useCallback(
    async (params: StartMigrationParams): Promise<MigrationOutcome> => {
      const store = useMigrationStore.getState()
      try {
        const chain = resolvePlanChain(
          parseMajorVersion(params.shopVersion),
          parseMajorVersion(APP_VERSION)
        )
        store.seedSteps(seedStepsFor(chain, params.keepOriginalAsBackup))

        for (const plan of chain) {
          const target = await resolveMigrationTarget(params.folderId, plan)
          const result = await runPlan(plan, target, store, {
            keepOriginalAsBackup: params.keepOriginalAsBackup,
          })
          if (!result.success) {
            return { success: false }
          }
        }

        const validation = await validateAndSetShop(params.folderId)
        if (!validation.ok) {
          throw new Error('Migrated shop failed validation')
        }
        return { success: true }
      } catch (error) {
        store.setFailureMessage(
          error instanceof Error ? error.message : String(error)
        )
        store.setPhase('failed')
        return { success: false }
      }
    },
    [validateAndSetShop]
  )

  return { start }
}

function seedStepsFor(
  chain: MigrationPlan[],
  keepOriginalAsBackup: boolean
): MigrationStepState[] {
  const backupStep: MigrationStepState = keepOriginalAsBackup
    ? { id: BACKUP_STEP_ID, status: 'pending' }
    : {
        id: BACKUP_STEP_ID,
        status: 'done',
        description: 'wizard.migrationBackupSkipped',
      }
  const planSteps = chain.flatMap((plan) =>
    plan.steps.map(
      (step): MigrationStepState => ({ id: step.id, status: 'pending' })
    )
  )
  return [backupStep, ...planSteps]
}

async function resolveMigrationTarget(
  folderId: string,
  plan: MigrationPlan
): Promise<MigrationTarget> {
  const metadata = await getFolderRepository().readMetadata(folderId)
  if (!metadata) {
    throw new Error('Shop metadata not found')
  }

  const { backend, localDirectoryHandle } = useBackendStore.getState()
  if (backend === 'local-csv') {
    if (!localDirectoryHandle) {
      throw new Error('No local directory handle set')
    }
    return createLocalMigrationTarget({
      shopHandle: localDirectoryHandle,
      fromVersion: metadata.version,
      toVersion: plan.toVersion,
    })
  }
  return createDriveMigrationTarget({
    folderId,
    spreadsheetId: metadata.spreadsheetId,
    fromVersion: metadata.version,
    toVersion: plan.toVersion,
  })
}
