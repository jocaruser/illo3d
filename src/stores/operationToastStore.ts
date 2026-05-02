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
  blocking: boolean
  start: (operation: NonNullable<ToastOperation>, total: number, blocking?: boolean) => void
  setBlocking: (blocking: boolean) => void
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
  blocking: false,

  start: (operation, total, blocking = false) =>
    set({
      operation,
      phase: 'loading',
      current: 0,
      total,
      sheetName: '',
      message: '',
      blocking,
    }),

  setBlocking: (blocking) => set({ blocking }),

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
      blocking: false,
    }),
}))
