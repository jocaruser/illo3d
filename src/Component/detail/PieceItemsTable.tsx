import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TrashIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'react-i18next'
import { Combobox, type ComboboxItem } from '@/Component/Combobox'
import { cx } from '@/Component/cx'
import { FormInput } from '@/Component/form/FormInput'
import { toast } from '@/Component/Toast'
import type { InventoryItem } from '@/Entity/InventoryItem'
import type { Piece } from '@/Entity/Piece'
import type { PieceItem } from '@/Entity/PieceItem'
import { useEntityManager } from '@/Hook/useEntityManager'
import { computeAvgUnitCost } from '@/Service/Pricing/avgUnitCost'
import { formatCurrency } from '@/Service/Pricing/money'
import { computeRedos, type RedoBand } from '@/Service/Pricing/redos'
import { PieceService } from '@/Service/PieceService'

interface PieceItemsTableProps {
  piece: Piece
  /** Bump the owning page so totals and the materials summary recompute. */
  onChanged: () => void
}

const bandClasses: Record<RedoBand, string> = {
  safe: 'text-success',
  tight: 'text-warning',
  risky: 'text-danger',
}

/** A pending "Add material" row that has no persisted line yet. */
interface DraftLine {
  inventoryId: string
  quantity: string
}

export function PieceItemsTable({ piece, onChanged }: PieceItemsTableProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [revision, setRevision] = useState(0)
  const [draft, setDraft] = useState<DraftLine | null>(null)
  const [error, setError] = useState('')
  const draftRef = useRef<HTMLTableRowElement>(null)
  const drafting = draft !== null

  // `Combobox` takes no ref, so focus its input through the draft row once the
  // "Add material" row appears — the picker is inline, never a popup.
  useEffect(() => {
    if (drafting) draftRef.current?.querySelector('input')?.focus()
  }, [drafting])

  const service = useMemo(() => new PieceService(em), [em])
  const lines = useMemo(
    () => em.pieceItems.findActiveByPiece(piece.id),
    [em, piece.id, revision]
  )
  const inventory = useMemo(() => em.inventory.findActive(), [em, revision])
  const inventoryById = useMemo(
    () => new Map(inventory.map((item) => [item.id, item])),
    [inventory]
  )

  const refresh = useCallback(() => {
    setRevision((count) => count + 1)
    onChanged()
  }, [onChanged])

  const unitCostOf = useCallback(
    (inventoryId: string) =>
      computeAvgUnitCost(em.lots.findActiveByInventory(inventoryId)),
    [em]
  )

  const optionLabel = useCallback(
    (item: InventoryItem) =>
      item.type === 'filament'
        ? t('pieces.inventoryOptionFilament', {
            name: item.name,
            id: item.id,
            qty: item.qtyCurrent,
          })
        : t('pieces.inventoryOptionUnits', {
            name: item.name,
            id: item.id,
            qty: item.qtyCurrent,
          }),
    [t]
  )

  const options = useMemo<ComboboxItem[]>(
    () => inventory.map((item) => ({ key: item.id, label: optionLabel(item) })),
    [inventory, optionLabel]
  )

  /** Transient inline error (duplicate inventory, bad quantity, ...). */
  const fail = (key: string) => {
    setError(t(key))
    window.setTimeout(() => setError(''), 4000)
  }

  const addDraft = () => {
    setError('')
    setDraft({ inventoryId: '', quantity: '1' })
  }

  // The line arrives from the draft row's render scope, where `draft` is
  // already narrowed non-null — no fallback needed here.
  const commitDraft = (line: DraftLine) => {
    const quantity = Number(line.quantity)
    const result = service.createPieceItem({
      pieceId: piece.id,
      inventoryId: line.inventoryId,
      quantity,
    })
    if (!result.ok) {
      fail(result.error)
      return
    }
    setDraft(null)
    refresh()
  }

  const updateQuantity = (line: PieceItem, raw: string) => {
    const quantity = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(quantity) || quantity <= 0) {
      fail('pieces.validation.quantityPositive')
      setRevision((count) => count + 1)
      return
    }
    if (quantity === line.quantity) return
    line.quantity = quantity
    em.pieceItems.save(line)
    refresh()
  }

  const removeLine = (line: PieceItem) => {
    const result = service.deletePieceItem(line.id)
    if (!result.ok) {
      toast.error(t(result.error))
      return
    }
    refresh()
  }

  const units = piece.hasValidUnits() ? (piece.units as number) : 1

  return (
    <div className="space-y-2 rounded-md border border-border bg-surface-alt p-3">
      <table className="w-full text-left text-xs text-text">
        <thead>
          <tr className="text-text-muted">
            <th
              scope="col"
              className="px-2 py-1 font-semibold uppercase tracking-wider"
            >
              {t('pieces.lineColId')}
            </th>
            <th
              scope="col"
              className="px-2 py-1 font-semibold uppercase tracking-wider"
            >
              {t('pieces.lineColInventory')}
            </th>
            <th
              scope="col"
              className="px-2 py-1 font-semibold uppercase tracking-wider"
            >
              {t('pieces.lineColQty')}
            </th>
            <th
              scope="col"
              className="px-2 py-1 font-semibold uppercase tracking-wider"
            >
              {t('pieces.lineColMaterialCost')}
            </th>
            <th
              scope="col"
              className="px-2 py-1 font-semibold uppercase tracking-wider"
            >
              {t('pieces.lineColStock')}
            </th>
            <th scope="col" className="px-2 py-1">
              <span className="sr-only">{t('common.delete')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && draft === null ? (
            <tr>
              <td colSpan={6} className="px-2 py-4 text-center text-text-muted">
                {t('pieces.noLines')}
              </td>
            </tr>
          ) : (
            lines.map((line) => {
              const item = inventoryById.get(line.inventoryId)
              const unitCost = unitCostOf(line.inventoryId)
              const quantity = line.quantity ?? 0
              const cost =
                unitCost === null ? null : unitCost * quantity * units
              const redo = computeRedos(item?.qtyCurrent ?? 0, quantity * units)
              return (
                <tr key={line.id} data-testid={`piece-item-row-${line.id}`}>
                  <td className="px-2 py-1 text-text-muted">{line.id}</td>
                  <td className="px-2 py-1">
                    <div
                      className="min-w-[10rem]"
                      data-testid={`piece-item-inventory-${line.id}`}
                    >
                      <Combobox
                        items={options}
                        value={line.inventoryId}
                        placeholder={t('pieces.inventoryFieldAria', {
                          id: line.id,
                        })}
                        onChange={(next) => {
                          if (next === line.inventoryId) return
                          if (em.pieceItems.hasActiveLine(piece.id, next)) {
                            fail('pieces.validation.duplicateInventory')
                            return
                          }
                          line.inventoryId = next
                          em.pieceItems.save(line)
                          refresh()
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <FormInput
                      type="number"
                      step="any"
                      min="0"
                      className="w-20 px-2 py-1"
                      data-testid={`piece-item-qty-${line.id}`}
                      aria-label={t('pieces.qtyFieldAria', { id: line.id })}
                      defaultValue={line.quantity ?? ''}
                      key={`${line.id}-${revision}`}
                      onBlur={(event) =>
                        updateQuantity(line, event.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1 tabular-nums">
                    {cost === null ? '—' : formatCurrency(cost)}
                  </td>
                  <td className={cx('px-2 py-1', bandClasses[redo.band])}>
                    {redo.band === 'safe'
                      ? t('pieces.redo.safe', { count: redo.redos })
                      : redo.band === 'tight'
                        ? t('pieces.redo.tight')
                        : t('pieces.redo.risky')}
                  </td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      className="rounded p-1 text-text-muted hover:text-danger"
                      data-testid={`piece-item-delete-${line.id}`}
                      aria-label={t('pieces.removeLine', { id: line.id })}
                      onClick={() => removeLine(line)}
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              )
            })
          )}

          {draft !== null && (
            <tr ref={draftRef} data-testid={`piece-item-draft-${piece.id}`}>
              <td className="px-2 py-1 text-text-muted">—</td>
              <td className="px-2 py-1">
                <div className="min-w-[10rem]">
                  <Combobox
                    items={options}
                    value={null}
                    placeholder={t('pieces.searchInventory')}
                    onChange={(inventoryId) =>
                      commitDraft({ inventoryId, quantity: draft.quantity })
                    }
                  />
                </div>
              </td>
              <td className="px-2 py-1">
                <FormInput
                  type="number"
                  step="any"
                  min="0"
                  className="w-20 px-2 py-1"
                  aria-label={t('pieces.quantity')}
                  value={draft.quantity}
                  onChange={(event) =>
                    setDraft({ ...draft, quantity: event.target.value })
                  }
                />
              </td>
              <td className="px-2 py-1 text-text-muted">—</td>
              <td className="px-2 py-1 text-text-muted">—</td>
              <td className="px-2 py-1">
                <button
                  type="button"
                  className="rounded p-1 text-text-muted hover:text-danger"
                  aria-label={t('common.cancel')}
                  onClick={() => setDraft(null)}
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {error !== '' && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn-secondary px-2 py-1 text-xs"
        data-testid={`add-line-${piece.id}`}
        onClick={addDraft}
      >
        {t('pieces.addLine')}
      </button>
    </div>
  )
}
