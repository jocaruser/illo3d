import { ListTablePageHeader } from './list-table/ListTablePageHeader'
import { AlertBox } from './AlertBox'
import { PiecesTable } from './PiecesTable'
import { updatePiecePrice } from '@/services/piece/updatePiecePrice'
import { updatePieceUnits } from '@/services/piece/updatePieceUnits'
import { updatePieceName } from '@/services/piece/updatePieceName'
import { updatePieceItem } from '@/services/piece/updatePieceItem'
import { deletePieceItem } from '@/services/piece/deletePieceItem'
import { createPieceItem, DUPLICATE_PIECE_ITEM_INVENTORY } from '@/services/piece/createPieceItem'
import type { Inventory, Job, Lot, Piece, PieceItem, PieceStatus } from '@/types/money'

interface JobDetailPiecesSectionProps {
  title: string
  searchField: React.ReactNode
  addButtonLabel: string
  onAddClick: () => void
  lineRequirementMessage: string | null
  pieces: Piece[]
  query: string
  jobs: Job[]
  pieceItems: PieceItem[]
  inventory: Inventory[]
  lots: Lot[]
  spreadsheetId: string | null
  expandedPieceIds: Set<string>
  onToggleExpand: (id: string) => void
  onAddPieceItemExpand: (pieceId: string) => void
  onStatusChange: (piece: Piece, next: PieceStatus) => void
  statusUpdatingId: string | null
}

export function JobDetailPiecesSection({
  title,
  searchField,
  addButtonLabel,
  onAddClick,
  lineRequirementMessage,
  pieces,
  query,
  jobs,
  pieceItems,
  inventory,
  lots,
  spreadsheetId,
  expandedPieceIds,
  onToggleExpand,
  onAddPieceItemExpand,
  onStatusChange,
  statusUpdatingId,
}: JobDetailPiecesSectionProps) {
  return (
    <>
      <ListTablePageHeader
        title={title}
        search={searchField}
        actions={
          <button
            type="button"
            data-testid="add-piece-button"
            onClick={onAddClick}
            className="btn-primary"
          >
            {addButtonLabel}
          </button>
        }
      />

      {lineRequirementMessage ? (
        <AlertBox variant="warning" className="mb-4">
          {lineRequirementMessage}
        </AlertBox>
      ) : null}

      <PiecesTable
        pieces={pieces}
        query={query}
        jobs={jobs}
        pieceItems={pieceItems}
        inventory={inventory}
        lots={lots}
        spreadsheetId={spreadsheetId}
        expandedPieceIds={expandedPieceIds}
        onToggleExpand={onToggleExpand}
        onStatusChange={(p, next) => {
          void onStatusChange(p, next)
        }}
        onPiecePriceCommit={async (pieceId, raw) => {
          if (!spreadsheetId) return
          const trim = raw.trim()
          let v: number | undefined
          if (trim === '') v = undefined
          else {
            const n = parseFloat(trim)
            if (Number.isNaN(n) || n < 0) return
            v = n
          }
          const cur = pieces.find((p) => p.id === pieceId)?.price
          const same =
            (v === undefined && cur === undefined) ||
            (v !== undefined &&
              cur !== undefined &&
              Math.abs(v - cur) < 1e-9)
          if (same) return
          await updatePiecePrice(spreadsheetId, pieceId, v)
        }}
        onPieceUnitsCommit={async (pieceId, raw) => {
          if (!spreadsheetId) return
          const trim = raw.trim()
          let v: number | undefined
          if (trim === '') v = undefined
          else {
            const n = parseInt(trim, 10)
            if (Number.isNaN(n) || n < 1) return
            v = n
          }
          const cur = pieces.find((p) => p.id === pieceId)?.units
          const same =
            (v === undefined && cur === undefined) ||
            (v !== undefined && cur !== undefined && cur === v)
          if (same) return
          await updatePieceUnits(spreadsheetId, pieceId, v)
        }}
        onPieceNameCommit={async (pieceId, raw) => {
          if (!spreadsheetId) return
          const trim = raw.trim()
          if (!trim) return
          const cur = pieces.find((p) => p.id === pieceId)?.name
          if (trim === cur) return
          await updatePieceName(spreadsheetId, pieceId, trim)
        }}
        onPieceItemQuantityCommit={async (pieceItemId, raw) => {
          if (!spreadsheetId) return
          const trim = raw.trim()
          if (trim === '') return
          const n = parseFloat(trim)
          if (Number.isNaN(n) || n <= 0) return
          await updatePieceItem(spreadsheetId, pieceItemId, { quantity: n })
        }}
        onPieceItemInventoryCommit={async (pieceItemId, inventoryId) => {
          if (!spreadsheetId) return
          await updatePieceItem(spreadsheetId, pieceItemId, { inventory_id: inventoryId })
        }}
        onPieceItemDelete={async (pieceItemId) => {
          if (!spreadsheetId) return
          await deletePieceItem(spreadsheetId, pieceItemId)
        }}
        onAddPieceItem={async (pieceId) => {
          if (!spreadsheetId) return
          try {
            await createPieceItem(spreadsheetId, {
              piece_id: pieceId,
              inventory_id: '',
              quantity: 1,
            })
            onAddPieceItemExpand(pieceId)
          } catch (e) {
            if (e instanceof Error && e.message === DUPLICATE_PIECE_ITEM_INVENTORY) {
              // Ignore duplicate error - user can change inventory
            }
          }
        }}
        statusUpdatingId={statusUpdatingId}
        hideJobColumn
      />
    </>
  )
}
