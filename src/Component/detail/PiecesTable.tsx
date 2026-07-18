import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'react-i18next'
import { AlertBox } from '@/Component/AlertBox'
import { Combobox, type ComboboxItem } from '@/Component/Combobox'
import { cx } from '@/Component/cx'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import { FormInput } from '@/Component/form/FormInput'
import { RelativeTime } from '@/Component/RelativeTime'
import { toast } from '@/Component/Toast'
import {
  DataTable,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Component/table/DataTable'
import {
  SortableColumnHeader,
  type SortDirection,
} from '@/Component/table/SortableColumnHeader'
import { PIECE_STATUSES, type Piece, type PieceStatus } from '@/Entity/Piece'
import { useEntityManager } from '@/Hook/useEntityManager'
import type { EntityManager } from '@/Repository/EntityManager'
import { LifecycleService } from '@/Service/LifecycleService'
import { computeAvgUnitCost } from '@/Service/Pricing/avgUnitCost'
import { formatCurrency } from '@/Service/Pricing/money'
import {
  computeRedos,
  type RedoBand,
  type RedoResult,
} from '@/Service/Pricing/redos'
import {
  computeSuggestedPrice,
  type SuggestedPriceResult,
} from '@/Service/Pricing/suggestedPrice'
import {
  PieceService,
  type InsufficientStockLine,
} from '@/Service/PieceService'
import { PieceItemsTable } from './PieceItemsTable'
import {
  sortRows,
  useTableSort,
  type SortDir,
  type SortValue,
} from './tableSort'

export type PieceSortKey =
  'id' | 'name' | 'units' | 'price' | 'lineTotal' | 'status' | 'createdAt'

interface PiecesTableProps {
  /** All of the job's pieces — archived and soft-deleted rows included. */
  rows: Piece[]
  emptyMessage: string
  /** An archived job's page renders every piece read-only. */
  readOnly?: boolean
  /** Bump the owning page so job widgets and the materials summary recompute. */
  onChanged: () => void
}

interface StatusRequest {
  piece: Piece
  next: PieceStatus
  kind: 'consume' | 'restore'
  /** Inventory that cannot cover the run; empty when stock is sufficient. */
  insufficient: InsufficientStockLine[]
}

const COLUMN_COUNT = 9

/** Line total (6th) and Benefit (7th) appear at md, Created (9th) at lg. */
const responsiveColumns = cx(
  '[&_tr>*:nth-child(6)]:hidden md:[&_tr>*:nth-child(6)]:table-cell',
  '[&_tr>*:nth-child(7)]:hidden md:[&_tr>*:nth-child(7)]:table-cell',
  '[&_tr>*:nth-child(9)]:hidden lg:[&_tr>*:nth-child(9)]:table-cell'
)

const bandClasses: Record<RedoBand, string> = {
  safe: 'text-success',
  tight: 'text-warning',
  risky: 'text-danger',
}

/** Store money at cent precision so the saved price matches the one shown. */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function cellOf(piece: Piece, key: PieceSortKey): SortValue {
  if (key === 'id') return piece.id
  if (key === 'name') return piece.name
  if (key === 'units') return piece.units
  if (key === 'price') return piece.price
  if (key === 'lineTotal') return piece.lineTotal()
  if (key === 'status') return piece.status
  return piece.createdAt
}

/** Worst redo margin across the piece's lines for the whole run. */
function runMarginFor(em: EntityManager, piece: Piece): RedoResult | null {
  const lines = em.pieceItems.findActiveByPiece(piece.id)
  if (lines.length === 0) return null
  const units = piece.hasValidUnits() ? (piece.units as number) : 1
  let worst: RedoResult | null = null
  for (const line of lines) {
    const item = em.inventory.find(line.inventoryId)
    const redo = computeRedos(
      item?.qtyCurrent ?? 0,
      (line.quantity ?? 0) * units
    )
    if (worst === null || redo.redos < worst.redos) worst = redo
  }
  return worst
}

/** Inventory that cannot cover the piece's run at its current units count. */
function shortfallFor(
  em: EntityManager,
  piece: Piece
): InsufficientStockLine[] {
  const units = piece.units as number
  const need = new Map<string, number>()
  for (const line of em.pieceItems.findActiveByPiece(piece.id)) {
    if (line.quantity === undefined) continue
    need.set(
      line.inventoryId,
      (need.get(line.inventoryId) ?? 0) + line.quantity * units
    )
  }
  const short: InsufficientStockLine[] = []
  for (const [inventoryId, required] of need) {
    const item = em.inventory.find(inventoryId)
    const have = item?.qtyCurrent ?? 0
    if (have < required) {
      short.push({
        inventoryId,
        name: item?.name ?? inventoryId,
        have,
        need: required,
      })
    }
  }
  return short
}

export function PiecesTable({
  rows,
  emptyMessage,
  readOnly = false,
  onChanged,
}: PiecesTableProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const { sort, directionFor, toggle } = useTableSort<PieceSortKey>({
    key: 'id',
    dir: 'asc',
  })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [request, setRequest] = useState<StatusRequest | null>(null)
  const [applyInventory, setApplyInventory] = useState(true)
  const [blocked, setBlocked] = useState('')
  const [dialogError, setDialogError] = useState('')

  const service = useMemo(() => new PieceService(em), [em])
  const sorted = useMemo(
    () => sortRows(rows, sort, cellOf, (piece) => piece.id),
    [rows, sort]
  )

  const statusItems = useMemo(
    () =>
      PIECE_STATUSES.map((status) => ({
        key: status,
        label: t(`pieces.status.${status}`),
      })),
    [t]
  )

  const toggleExpanded = useCallback((pieceId: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(pieceId)) next.delete(pieceId)
      else next.add(pieceId)
      return next
    })
  }, [])

  // `#piece-<id>` deep links (from note @mentions) auto-expand and scroll.
  const hash = window.location.hash
  useEffect(() => {
    const match = /#piece-(P\d+)/.exec(hash)
    if (match === null) return
    const pieceId = match[1]
    setExpanded((current) => new Set(current).add(pieceId))
    document
      .getElementById(`piece-${pieceId}`)
      ?.scrollIntoView({ block: 'center' })
  }, [hash])

  /**
   * Materials for one unit of the piece, at average lot cost. A piece with no
   * material lines gets no suggestion at all — never a "Use €0.00" button.
   */
  const suggestionFor = useCallback(
    (piece: Piece): SuggestedPriceResult | null => {
      const lines = em.pieceItems.findActiveByPiece(piece.id)
      if (lines.length === 0) return null
      return computeSuggestedPrice(
        lines,
        em.inventory.findActive(),
        em.lots.findActive()
      )
    },
    [em]
  )

  const materialUnitCost = useCallback(
    (piece: Piece) => {
      let total = 0
      for (const line of em.pieceItems.findActiveByPiece(piece.id)) {
        const unitCost = computeAvgUnitCost(
          em.lots.findActiveByInventory(line.inventoryId)
        )
        if (unitCost === null || line.quantity === undefined) continue
        total += unitCost * line.quantity
      }
      return total
    },
    [em]
  )

  /** Children are history: an archived piece is brought back one by one. */
  const unarchive = (piece: Piece) => {
    new LifecycleService(em).restorePiece(piece.id)
    toast.success(t('toast.changeApplied'))
    onChanged()
  }

  const saveField = (
    piece: Piece,
    patch: { name?: string; price?: number; units?: number }
  ) => {
    const result = service.updatePiece(piece.id, {
      name: patch.name ?? piece.name,
      price: patch.price === undefined ? piece.price : patch.price,
      units: patch.units === undefined ? piece.units : patch.units,
    })
    if (!result.ok) {
      toast.error(t(result.error))
      onChanged()
      return
    }
    onChanged()
  }

  const commitName = (piece: Piece, raw: string) => {
    if (raw.trim() === piece.name) return
    saveField(piece, { name: raw })
  }

  const commitUnits = (piece: Piece, raw: string) => {
    if (raw.trim() === '') return
    const units = Number(raw)
    if (!Number.isFinite(units) || !Number.isInteger(units) || units <= 0) {
      toast.error(t('pieces.statusNeedsUnits'))
      onChanged()
      return
    }
    if (units === piece.units) return
    saveField(piece, { units })
  }

  const commitPrice = (piece: Piece, raw: string) => {
    if (raw.trim() === '') return
    const price = Number(raw)
    if (!Number.isFinite(price) || price < 0) {
      toast.error(t('jobs.validation.priceInvalid'))
      onChanged()
      return
    }
    if (price === piece.price) return
    saveField(piece, { price })
  }

  /**
   * Gate a status change. Entering a consuming status opens the decrement
   * dialog (pre-checked, listing any shortfall); leaving one offers to restore.
   */
  const requestStatus = (piece: Piece, next: PieceStatus) => {
    setBlocked('')
    setDialogError('')
    if (next === piece.status) return

    const willConsume = next === 'done' || next === 'failed'
    if (!piece.isConsuming() && willConsume) {
      const lines = em.pieceItems.findActiveByPiece(piece.id)
      if (lines.length === 0) {
        setBlocked(t('pieces.statusNeedsLines'))
        return
      }
      if (!piece.hasValidUnits()) {
        setBlocked(t('pieces.statusNeedsUnits'))
        return
      }
      setApplyInventory(true)
      setRequest({
        piece,
        next,
        kind: 'consume',
        insufficient: shortfallFor(em, piece),
      })
      return
    }

    if (piece.isConsuming() && !willConsume) {
      setApplyInventory(true)
      setRequest({ piece, next, kind: 'restore', insufficient: [] })
      return
    }

    apply({ piece, next }, {})
  }

  const apply = (
    target: { piece: Piece; next: PieceStatus },
    options: { decrementInventory?: boolean; restoreInventory?: boolean }
  ) => {
    const result = service.updatePieceStatus(target.piece, target.next, options)
    if (!result.ok) {
      const detail = (result.insufficient ?? [])
        .map((line) =>
          t('pieces.shortfallLine', {
            id: line.name,
            need: line.need,
            have: line.have,
          })
        )
        .join('; ')
      setDialogError(t(result.error, { detail }))
      return false
    }
    setRequest(null)
    onChanged()
    return true
  }

  return (
    <div className="space-y-3">
      {blocked !== '' && <AlertBox variant="warning">{blocked}</AlertBox>}

      <DataTable className={responsiveColumns}>
        <PiecesTableHead directionFor={directionFor} onToggle={toggle} />
        <TableBody>
          {sorted.length === 0 ? (
            <TableEmptyRow colSpan={COLUMN_COUNT} message={emptyMessage} />
          ) : (
            sorted.map((piece) => {
              const lineTotal = piece.lineTotal()
              const units = piece.hasValidUnits() ? (piece.units as number) : 1
              const benefit =
                lineTotal === undefined
                  ? undefined
                  : lineTotal - materialUnitCost(piece) * units
              return (
                <PieceRowGroup
                  key={piece.id}
                  piece={piece}
                  readOnly={readOnly}
                  open={expanded.has(piece.id)}
                  statusItems={statusItems}
                  benefit={benefit}
                  suggestion={suggestionFor(piece)}
                  margin={runMarginFor(em, piece)}
                  onToggleExpanded={toggleExpanded}
                  onCommitName={commitName}
                  onCommitUnits={commitUnits}
                  onCommitPrice={commitPrice}
                  onSaveField={saveField}
                  onRequestStatus={requestStatus}
                  onUnarchive={unarchive}
                  onChanged={onChanged}
                />
              )
            })
          )}
        </TableBody>
      </DataTable>

      {request !== null && (
        <PieceStatusConfirmDialog
          request={request}
          error={dialogError}
          applyInventory={applyInventory}
          onApplyInventoryChange={setApplyInventory}
          onConfirm={() =>
            apply(request, {
              decrementInventory:
                request.kind === 'consume' ? applyInventory : undefined,
              restoreInventory:
                request.kind === 'restore' ? applyInventory : undefined,
            })
          }
          onCancel={() => setRequest(null)}
        />
      )}
    </div>
  )
}

interface PiecesTableHeadProps {
  directionFor: (key: PieceSortKey) => SortDirection
  onToggle: (key: PieceSortKey, next: SortDir) => void
}

/** The sortable column header row. */
function PiecesTableHead({ directionFor, onToggle }: PiecesTableHeadProps) {
  const { t } = useTranslation()
  return (
    <TableHead>
      <TableRow>
        <TableHeader className="w-10">
          <span className="sr-only">{t('pieces.colExpand')}</span>
        </TableHeader>
        <SortableColumnHeader
          label={t('pieces.colId')}
          direction={directionFor('id')}
          onToggle={(next) => onToggle('id', next)}
        />
        <SortableColumnHeader
          label={t('pieces.colName')}
          direction={directionFor('name')}
          onToggle={(next) => onToggle('name', next)}
        />
        <SortableColumnHeader
          label={t('pieces.colUnits')}
          direction={directionFor('units')}
          onToggle={(next) => onToggle('units', next)}
        />
        <SortableColumnHeader
          label={t('pieces.colPricePerUnit')}
          direction={directionFor('price')}
          onToggle={(next) => onToggle('price', next)}
        />
        <SortableColumnHeader
          label={t('pieces.colLineTotal')}
          direction={directionFor('lineTotal')}
          onToggle={(next) => onToggle('lineTotal', next)}
        />
        <TableHeader>{t('pieces.colBenefit')}</TableHeader>
        <SortableColumnHeader
          label={t('pieces.colStatus')}
          direction={directionFor('status')}
          onToggle={(next) => onToggle('status', next)}
        />
        <SortableColumnHeader
          label={t('pieces.colCreated')}
          direction={directionFor('createdAt')}
          onToggle={(next) => onToggle('createdAt', next)}
        />
      </TableRow>
    </TableHead>
  )
}

interface PieceRowGroupProps {
  piece: Piece
  /** True on an archived job's page: even active pieces render as text. */
  readOnly: boolean
  open: boolean
  statusItems: ComboboxItem[]
  /** Line total minus material cost for the run; undefined without a total. */
  benefit: number | undefined
  /** Null for a piece with no material lines: the suggestion is suppressed. */
  suggestion: SuggestedPriceResult | null
  /** Worst redo margin across the piece's lines, null without lines. */
  margin: RedoResult | null
  onToggleExpanded: (pieceId: string) => void
  onCommitName: (piece: Piece, raw: string) => void
  onCommitUnits: (piece: Piece, raw: string) => void
  onCommitPrice: (piece: Piece, raw: string) => void
  onSaveField: (piece: Piece, patch: { price: number }) => void
  onRequestStatus: (piece: Piece, next: PieceStatus) => void
  onUnarchive: (piece: Piece) => void
  onChanged: () => void
}

/**
 * One piece: the editable summary row plus, when expanded, its material lines.
 * Archived and soft-deleted pieces stay listed as history — struck through and
 * read-only, an archived one offering Un-archive, a soft-deleted one labelled
 * "Deleted entity" (`jobs/details/details.spec.md`, children are history).
 */
function PieceRowGroup({
  piece,
  readOnly,
  open,
  statusItems,
  benefit,
  suggestion,
  margin,
  onToggleExpanded,
  onCommitName,
  onCommitUnits,
  onCommitPrice,
  onSaveField,
  onRequestStatus,
  onUnarchive,
  onChanged,
}: PieceRowGroupProps) {
  const { t } = useTranslation()
  const lineTotal = piece.lineTotal()
  const inactive = !piece.isActive()
  const editable = !readOnly && !inactive
  const struck = inactive && 'line-through'

  return (
    <Fragment>
      <TableRow>
        <TableCell>
          {editable && (
            <button
              type="button"
              id={`piece-${piece.id}`}
              data-testid={`expand-piece-${piece.id}`}
              aria-expanded={open}
              aria-controls={`piece-items-${piece.id}`}
              aria-label={
                open
                  ? t('pieces.collapseAria', { id: piece.id })
                  : t('pieces.expandAria', { id: piece.id })
              }
              className="rounded p-1 text-text-muted hover:text-text"
              onClick={() => onToggleExpanded(piece.id)}
            >
              {open ? (
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </TableCell>
        <TableCell className={cx('text-text-muted', struck)}>
          {piece.id}
        </TableCell>
        <TableCell className={cx(struck)}>
          {editable ? (
            <FormInput
              className="min-w-[8rem] px-2 py-1"
              data-testid={`piece-name-${piece.id}`}
              aria-label={t('pieces.nameFieldAria', { id: piece.id })}
              defaultValue={piece.name}
              key={`name-${piece.id}-${piece.name}`}
              onBlur={(event) => onCommitName(piece, event.target.value)}
            />
          ) : (
            <span data-testid={`piece-name-text-${piece.id}`}>
              {piece.name}
            </span>
          )}
        </TableCell>
        <TableCell className={cx('tabular-nums', struck)}>
          {editable ? (
            <FormInput
              type="number"
              step="1"
              min="1"
              className={cx(
                'w-20 px-2 py-1',
                !piece.hasValidUnits() && 'border-warning bg-warning/10'
              )}
              data-testid={`piece-units-${piece.id}`}
              aria-label={t('pieces.unitsFieldAria', { id: piece.id })}
              title={
                piece.hasValidUnits() ? undefined : t('pieces.unitsUnsetHint')
              }
              defaultValue={piece.units ?? ''}
              key={`units-${piece.id}-${piece.units ?? ''}`}
              onBlur={(event) => onCommitUnits(piece, event.target.value)}
            />
          ) : (
            (piece.units ?? '—')
          )}
        </TableCell>
        <TableCell className={cx('tabular-nums', struck)}>
          {editable ? (
            <div className="flex items-center gap-1">
              <FormInput
                type="number"
                step="any"
                min="0"
                className="w-24 px-2 py-1"
                data-testid={`piece-price-${piece.id}`}
                aria-label={t('pieces.priceFieldAria', { id: piece.id })}
                defaultValue={piece.price ?? ''}
                key={`price-${piece.id}-${piece.price ?? ''}`}
                onBlur={(event) => onCommitPrice(piece, event.target.value)}
              />
              {suggestion !== null && (
                <button
                  type="button"
                  className="btn-secondary whitespace-nowrap px-2 py-1 text-xs"
                  data-testid={`piece-suggested-${piece.id}`}
                  disabled={suggestion.error}
                  title={
                    suggestion.error
                      ? `${t('jobs.suggestedPrice.errorIntro')} ${suggestion.missingInventoryIds.join(', ')}`
                      : t('jobs.suggestedPrice.label')
                  }
                  onClick={() =>
                    !suggestion.error &&
                    onSaveField(piece, {
                      price: roundMoney(suggestion.suggestedPrice),
                    })
                  }
                >
                  {suggestion.error
                    ? t('pieces.suggestedUnavailable')
                    : t('pieces.suggestedApplyPerUnit', {
                        price: formatCurrency(suggestion.suggestedPrice),
                      })}
                </button>
              )}
            </div>
          ) : piece.price === undefined ? (
            '—'
          ) : (
            formatCurrency(piece.price)
          )}
        </TableCell>
        <TableCell className={cx('tabular-nums', struck)}>
          {lineTotal === undefined ? '—' : formatCurrency(lineTotal)}
        </TableCell>
        <TableCell className={cx('tabular-nums', struck)}>
          {benefit === undefined ? (
            '—'
          ) : (
            <span className={benefit < 0 ? 'text-danger' : 'text-success'}>
              {formatCurrency(benefit)}
            </span>
          )}
        </TableCell>
        <TableCell>
          {editable ? (
            <div
              className="min-w-[8rem]"
              data-testid={`piece-status-${piece.id}`}
            >
              <Combobox
                items={statusItems}
                value={piece.status}
                placeholder={t('pieces.statusFieldAria', { id: piece.id })}
                onChange={(next) => onRequestStatus(piece, next as PieceStatus)}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <p className={cx('text-text-muted', struck)}>
                {t(`pieces.status.${piece.status}`)}
              </p>
              {piece.isDeleted() ? (
                <span
                  data-testid={`piece-deleted-${piece.id}`}
                  className="text-xs font-medium uppercase tracking-wider text-text-muted"
                >
                  {t('lifecycle.deletedEntity')}
                </span>
              ) : (
                piece.isArchived() && (
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs"
                    data-testid={`piece-unarchive-${piece.id}`}
                    onClick={() => onUnarchive(piece)}
                  >
                    {t('lifecycle.unarchive')}
                  </button>
                )
              )}
            </div>
          )}
        </TableCell>
        <TableCell className={cx('text-text-muted', struck)}>
          {piece.createdAt !== '' && <RelativeTime value={piece.createdAt} />}
        </TableCell>
      </TableRow>
      {open && editable && (
        <TableRow>
          <TableCell colSpan={COLUMN_COUNT}>
            <div id={`piece-items-${piece.id}`}>
              {margin !== null && (
                <p className={cx('mb-2 text-xs', bandClasses[margin.band])}>
                  {t('pieces.colRunMargin')}:{' '}
                  {margin.band === 'safe'
                    ? t('pieces.redo.safe', { count: margin.redos })
                    : margin.band === 'tight'
                      ? t('pieces.redo.tight')
                      : t('pieces.redo.risky')}
                </p>
              )}
              <PieceItemsTable piece={piece} onChanged={onChanged} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  )
}

interface PieceStatusConfirmDialogProps {
  request: StatusRequest
  /** Inline dialog error; empty string means none. */
  error: string
  applyInventory: boolean
  onApplyInventoryChange: (next: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}

/** Confirms a consuming/restoring status change and its inventory side. */
function PieceStatusConfirmDialog({
  request,
  error,
  applyInventory,
  onApplyInventoryChange,
  onConfirm,
  onCancel,
}: PieceStatusConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <ConfirmDialog
      open
      title={
        request.kind === 'restore'
          ? t('pieces.confirmRestoreTitle')
          : t('pieces.confirmConsumeTitle')
      }
      message={
        request.kind === 'restore'
          ? t('pieces.confirmRestoreMessage')
          : t('pieces.confirmConsumeMessage')
      }
      error={error === '' ? undefined : error}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {request.insufficient.length > 0 && (
        <div className="mt-3 rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
          <p>{t('pieces.confirmConsumeLowStock')}</p>
          <ul className="mt-1 list-inside list-disc">
            {request.insufficient.map((line) => (
              <li key={line.inventoryId}>
                {t('pieces.shortfallLine', {
                  id: line.name,
                  need: line.need,
                  have: line.have,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
      <label className="mt-3 flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          checked={applyInventory}
          onChange={(event) => onApplyInventoryChange(event.target.checked)}
        />
        {request.kind === 'restore'
          ? t('pieces.restoreInventoryLabel')
          : t('pieces.decrementInventoryLabel')}
      </label>
    </ConfirmDialog>
  )
}
