import { useMemo } from 'react'
import { useWorkbookStore } from '@/stores/workbookStore'
import {
  matrixToClients,
  matrixToLots,
  matrixToInventory,
  matrixToJobs,
  matrixToPieceItems,
  matrixToPieces,
  matrixToTags,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import {
  getAllCurrentNotes,
  getAllCurrentTagLinks,
} from '@/services/audit/reconstruct'

/** Parsed entities from the in-memory workbook (single `tabs` subscription). */
export function useWorkbookEntities() {
  const tabs = useWorkbookStore((s) => s.tabs)
  return useMemo(
    () => ({
      clients: matrixToClients(tabs.clients),
      jobs: matrixToJobs(tabs.jobs),
      pieces: matrixToPieces(tabs.pieces),
      pieceItems: matrixToPieceItems(tabs.piece_items),
      crmNotes: getAllCurrentNotes(),
      transactions: matrixToTransactions(tabs.transactions),
      lots: matrixToLots(tabs.lots),
      inventory: matrixToInventory(tabs.inventory),
      tags: matrixToTags(tabs.tags),
      tagLinks: getAllCurrentTagLinks(),
    }),
    [tabs],
  )
}
