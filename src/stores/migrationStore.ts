import { create } from 'zustand'

export type MigrationPhase =
  | 'idle'
  | 'backing-up'
  | 'migrating'
  | 'committing'
  | 'done'
  | 'failed'

export type MigrationStepStatus = 'pending' | 'running' | 'done' | 'failed'

export interface MigrationStepState {
  id: string
  status: MigrationStepStatus
  /** i18n key describing what the step is doing right now. */
  description?: string
  error?: string
}

interface MigrationState {
  phase: MigrationPhase
  steps: MigrationStepState[]
  failureMessage: string | null
  seedSteps: (steps: MigrationStepState[]) => void
  updateStep: (
    id: string,
    patch: Partial<Omit<MigrationStepState, 'id'>>
  ) => void
  setPhase: (phase: MigrationPhase) => void
  setFailureMessage: (message: string | null) => void
  reset: () => void
}

const initialState = {
  phase: 'idle' as MigrationPhase,
  steps: [] as MigrationStepState[],
  failureMessage: null,
}

export const useMigrationStore = create<MigrationState>()((set) => ({
  ...initialState,
  seedSteps: (steps) => set({ steps }),
  updateStep: (id, patch) =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === id ? { ...step, ...patch } : step
      ),
    })),
  setPhase: (phase) => set({ phase }),
  setFailureMessage: (failureMessage) => set({ failureMessage }),
  reset: () => set({ ...initialState }),
}))

export type MigrationStoreApi = Pick<
  MigrationState,
  'setPhase' | 'updateStep' | 'setFailureMessage'
>
