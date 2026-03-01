import { create } from 'zustand'

export type SheetsConnectionStatus = 'connecting' | 'connected' | 'error'

interface SheetsState {
  status: SheetsConnectionStatus
  spreadsheetId: string | null
  errorMessage: string | null
  setConnecting: () => void
  setConnected: (spreadsheetId: string) => void
  setError: (message: string) => void
  reset: () => void
}

export const useSheetsStore = create<SheetsState>((set) => ({
  status: 'connecting',
  spreadsheetId: null,
  errorMessage: null,
  setConnecting: () =>
    set({ status: 'connecting', errorMessage: null }),
  setConnected: (spreadsheetId) =>
    set({ status: 'connected', spreadsheetId, errorMessage: null }),
  setError: (errorMessage) =>
    set({ status: 'error', errorMessage }),
  reset: () =>
    set({ status: 'connecting', spreadsheetId: null, errorMessage: null }),
}))
