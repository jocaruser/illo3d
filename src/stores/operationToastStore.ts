import { create } from 'zustand'

export type ToastOperation = 'load' | 'save' | null
export type ToastPhase = 'loading' | 'error' | 'success' | null

interface OperationToastState {
  operation: ToastOperation
  phase: ToastPhase
  current: number
  total: number
  sheetName: string
  message: string
  start: (operation: NonNullable<ToastOperation>, total: number) => void
  tick: (sheetName?: string) => void
  error: (message: string) => void
  success: (message: string) => void
  dismiss: () => void
}

export const useOperationToastStore = create<OperationToastState>((set) => ({
  operation: null,
  phase: null,
  current: 0,
  total: 0,
  sheetName: '',
  message: '',

  start: (operation, total) =>
    set({
      operation,
      phase: 'loading',
      current: 0,
      total,
      sheetName: '',
      message: '',
    }),

  tick: (sheetName) =>
    set((s) => ({
      current: s.current + 1,
      sheetName: sheetName ?? s.sheetName,
    })),

  error: (message) => set({ phase: 'error', message }),

  success: (message) => set({ phase: 'success', message }),

  dismiss: () =>
    set({
      operation: null,
      phase: null,
      current: 0,
      total: 0,
      sheetName: '',
      message: '',
    }),
}))
