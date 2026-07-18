import { create } from 'zustand'

export type MigrationPhase =
  | 'idle'
  | 'backing-up'
  | 'migrating'
  | 'ready'
  | 'committing'
  | 'done'
  | 'failed'

export type MigrationStepStatus = 'pending' | 'running' | 'done' | 'failed'

export interface MigrationStepState {
  id: string
  status: MigrationStepStatus
  /** i18n key of the live step description streamed by the running step. */
  description?: string
  error?: string
}

/**
 * Live progress of a migration run, streamed by the orchestrator and rendered
 * by the wizard's step grid. 'ready' is the awaiting-Confirm-and-close resting
 * state (ADR-0012). Deliberately NOT persisted — the run exists only in
 * memory, so a reload loses it and the wizard restarts from the (still
 * untouched) source shop.
 */
export interface MigrationState {
  phase: MigrationPhase
  steps: MigrationStepState[]
  failureMessage: string | null

  seedSteps(ids: string[]): void
  updateStep(id: string, patch: Partial<Omit<MigrationStepState, 'id'>>): void
  setPhase(phase: MigrationPhase): void
  setFailureMessage(msg: string | null): void
  reset(): void
}

export const useMigrationStore = create<MigrationState>()((set) => ({
  phase: 'idle',
  steps: [],
  failureMessage: null,

  seedSteps: (ids) =>
    set({ steps: ids.map((id) => ({ id, status: 'pending' as const })) }),

  updateStep: (id, patch) =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === id ? { ...step, ...patch } : step
      ),
    })),

  setPhase: (phase) => set({ phase }),

  setFailureMessage: (msg) => set({ failureMessage: msg }),

  reset: () => set({ phase: 'idle', steps: [], failureMessage: null }),
}))
