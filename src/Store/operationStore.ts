import { create } from 'zustand'

/**
 * Progress of the long-running workbook operation (hydrate/refresh reads,
 * whole-workbook saves). Drives the progress toasts, the modal overlay (when
 * `blocking`) and the save preview's per-sheet stepper. Ephemeral by nature:
 * never persisted.
 */
export interface OperationProgress {
  kind: 'load' | 'save'
  blocking: boolean
  message: string
  current: number
  total: number
  sheetName: string
  /** Sheets whose write/read has completed, in completion order. */
  doneSheets: string[]
  /** Sheets whose write failed — the save preview shows these as red cards. */
  failedSheets: string[]
}

interface OperationState {
  operation: OperationProgress | null
  start(kind: 'load' | 'save', options: { total: number; blocking: boolean; message: string }): void
  progress(current: number, sheetName: string): void
  fail(sheetName: string): void
  finish(): void
}

export const useOperationStore = create<OperationState>()((set) => ({
  operation: null,

  start: (kind, { total, blocking, message }) =>
    set({
      operation: {
        kind,
        blocking,
        message,
        total,
        current: 0,
        sheetName: '',
        doneSheets: [],
        failedSheets: [],
      },
    }),

  progress: (current, sheetName) =>
    set((state) =>
      state.operation === null
        ? state
        : {
            operation: {
              ...state.operation,
              current,
              sheetName,
              doneSheets: [...state.operation.doneSheets, sheetName],
            },
          }
    ),

  fail: (sheetName) =>
    set((state) =>
      state.operation === null
        ? state
        : {
            operation: {
              ...state.operation,
              failedSheets: [...state.operation.failedSheets, sheetName],
            },
          }
    ),

  finish: () => set({ operation: null }),
}))
