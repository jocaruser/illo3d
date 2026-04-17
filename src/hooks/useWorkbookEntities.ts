import { useMemo } from 'react'
import { useWorkbookStore } from '@/stores/workbookStore'
import {
  matrixToClients,
  matrixToCrmNotes,
  matrixToLots,
  matrixToInventory,
  matrixToJobs,
  matrixToPieceItems,
  matrixToPieces,
  matrixToTagLinks,
  matrixToTags,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'

/** Parsed entities from the in-memory workbook (single `tabs` subscription). */
export function useWorkbookEntities() {
  const tabs = useWorkbookStore((s) => s.tabs)
  return useMemo(
    () => ({
      clients: matrixToClients(tabs.clients),
      jobs: matrixToJobs(tabs.jobs),
      pieces: matrixToPieces(tabs.pieces),
      pieceItems: matrixToPieceItems(tabs.piece_items),
      crmNotes: matrixToCrmNotes(tabs.crm_notes),
      transactions: matrixToTransactions(tabs.transactions),
      lots: matrixToLots(tabs.lots),
      inventory: matrixToInventory(tabs.inventory),
      tags: matrixToTags(tabs.tags),
      tagLinks: matrixToTagLinks(tabs.tag_links),
    }),
    [tabs],
  )
}
