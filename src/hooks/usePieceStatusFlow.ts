import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { updatePieceStatus } from '@/services/piece/updatePieceStatus'
import type { Inventory, Piece, PieceItem, PieceStatus } from '@/types/money'
import {
  isConsumingPieceStatus,
  linesForPieceId,
  pieceUnitsAreSet,
  stockShortfall,
  type PieceStatusFlow,
} from '@/utils/jobDetailHelpers'

export function usePieceStatusFlow(
  spreadsheetId: string | null,
  pieceItems: PieceItem[],
  inventory: Inventory[],
  setLineRequirementMessage: (message: string | null) => void
) {
  const { t } = useTranslation()
  const [pieceStatus, setPieceStatus] = useState<{
    flow: PieceStatusFlow
    decrementInventory: boolean
    restoreInventory: boolean
    error: string | null
    updatingId: string | null
  }>({
    flow: null,
    decrementInventory: true,
    restoreInventory: true,
    error: null,
    updatingId: null,
  })

  const commitPieceStatusChange = async (
    piece: Piece,
    next: PieceStatus,
    options: { decrementInventory: boolean; restoreInventory: boolean }
  ) => {
    if (!spreadsheetId) return
    setPieceStatus((prev) => ({ ...prev, updatingId: piece.id, error: null }))
    try {
      const result = await updatePieceStatus(spreadsheetId, piece, next, {
        decrementInventory: options.decrementInventory,
        restoreInventory: options.restoreInventory,
      })
      if (!result.ok) {
        const detail = result.lots
          .map((l) => `${l.inventoryId}: ${l.need} / ${l.have}`)
          .join('; ')
        setPieceStatus((prev) => ({
          ...prev,
          error: t('pieces.statusInsufficientStockDetail', { detail }),
        }))
        return
      }
      setPieceStatus((prev) => ({ ...prev, flow: null }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'PIECE_UNITS_REQUIRED_FOR_CONSUMPTION') {
        setPieceStatus((prev) => ({
          ...prev,
          error: t('pieces.statusNeedsUnits'),
        }))
      } else {
        setPieceStatus((prev) => ({
          ...prev,
          error: e instanceof Error ? e.message : t('wizard.errorGeneric'),
        }))
      }
    } finally {
      setPieceStatus((prev) => ({ ...prev, updatingId: null }))
    }
  }

  const handlePieceStatusSelect = (piece: Piece, next: PieceStatus) => {
    if (next === piece.status) return
    setPieceStatus((prev) => ({ ...prev, error: null }))
    setLineRequirementMessage(null)

    const old = piece.status
    if (isConsumingPieceStatus(next)) {
      if (!isConsumingPieceStatus(old)) {
        const lines = linesForPieceId(pieceItems, piece.id)
        if (lines.length === 0) {
          setLineRequirementMessage(t('pieces.statusNeedsLines'))
          return
        }
        if (!pieceUnitsAreSet(piece)) {
          setLineRequirementMessage(t('pieces.statusNeedsUnits'))
          return
        }
        setPieceStatus((prev) => ({
          ...prev,
          decrementInventory: true,
          flow: { piece, nextStatus: next, mode: 'consume' as const },
        }))
        return
      }
      void commitPieceStatusChange(piece, next, {
        decrementInventory: false,
        restoreInventory: false,
      })
      return
    }

    if (next === 'pending' && isConsumingPieceStatus(old)) {
      setPieceStatus((prev) => ({
        ...prev,
        restoreInventory: true,
        flow: { piece, nextStatus: next, mode: 'restore' as const },
      }))
      return
    }

    void commitPieceStatusChange(piece, next, {
      decrementInventory: false,
      restoreInventory: false,
    })
  }

  const consumeShortfall = useMemo(
    () =>
      pieceStatus.flow?.mode === 'consume'
        ? stockShortfall(
            pieceStatus.flow.piece,
            linesForPieceId(pieceItems, pieceStatus.flow.piece.id),
            inventory,
          )
        : [],
    [pieceStatus.flow, pieceItems, inventory]
  )

  return {
    pieceStatus,
    setPieceStatus,
    handlePieceStatusSelect,
    commitPieceStatusChange,
    consumeShortfall,
  }
}
