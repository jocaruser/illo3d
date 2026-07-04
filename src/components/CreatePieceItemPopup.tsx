import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createPieceItem,
  DUPLICATE_PIECE_ITEM_INVENTORY,
} from '@/services/piece/createPieceItem'
import type { Inventory, PieceItem } from '@/types/money'
import { DialogShell } from './DialogShell'
import { RequiredIndicator } from './RequiredIndicator'
import { Combobox } from './Combobox'

interface CreatePieceItemPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  spreadsheetId: string | null
  pieceId: string | null
  inventory: Inventory[]
  pieceItems: PieceItem[]
}

export function CreatePieceItemPopup({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId,
  pieceId,
  inventory,
  pieceItems,
}: CreatePieceItemPopupProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ inventoryId: '', quantity: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const sortedInventory = useMemo(
    () => inventory.toSorted((a, b) => a.name.localeCompare(b.name)),
    [inventory]
  )

  const handleClose = () => {
    setForm({ inventoryId: '', quantity: '' })
    setError(null)
    setFieldErrors({})
    onClose()
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.inventoryId)
      errs.inventory = t('pieces.validation.inventoryRequired')
    const q = parseFloat(form.quantity)
    if (!form.quantity.trim()) errs.quantity = t('pieces.validation.required')
    else if (Number.isNaN(q) || q <= 0)
      errs.quantity = t('pieces.validation.quantityPositive')
    if (
      pieceId &&
      form.inventoryId &&
      pieceItems.some(
        (r) =>
          r.piece_id === pieceId &&
          r.inventory_id === form.inventoryId &&
          r.archived !== 'true' &&
          r.deleted !== 'true',
      )
    ) {
      errs.inventory = t('pieces.validation.duplicateInventory')
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate() || !spreadsheetId || !pieceId) return
    setLoading(true)
    try {
      await createPieceItem(spreadsheetId, {
        piece_id: pieceId,
        inventory_id: form.inventoryId,
        quantity: parseFloat(form.quantity),
      })
      onSuccess()
      handleClose()
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === DUPLICATE_PIECE_ITEM_INVENTORY
      ) {
        setError(t('pieces.validation.duplicateInventory'))
      } else {
        setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (!pieceId) return null

  return (
    <DialogShell isOpen={isOpen} onClose={handleClose} title={t('pieces.addLineTitle')}>
      <p className="mb-4 text-sm text-text-muted">
        {t('pieces.addLineForPiece', { id: pieceId })}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="piece-item-inventory"
            className="mb-1 block text-sm font-medium text-text"
          >
            {t('pieces.inventoryLot')}
            <RequiredIndicator />
          </label>
          <Combobox
            items={sortedInventory}
            value={form.inventoryId}
            onChange={(key) => setForm((prev) => ({ ...prev, inventoryId: key }))}
            getKey={(inv) => inv.id}
            getLabel={(inv) => inv.type === 'filament'
              ? t('pieces.inventoryOptionFilament', {
                  name: inv.name,
                  id: inv.id,
                  qty: inv.qty_current,
                })
              : t('pieces.inventoryOptionUnits', {
                  name: inv.name,
                  id: inv.id,
                  qty: inv.qty_current,
                })}
            disabled={loading || sortedInventory.length === 0}
            id="piece-item-inventory"
            placeholder={t('pieces.searchInventory')}
            searchable
          />
          {fieldErrors.inventory && (
            <p className="mt-1 text-sm text-danger">
              {fieldErrors.inventory}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="piece-item-quantity"
            className="mb-1 block text-sm font-medium text-text"
          >
            {t('pieces.quantity')}
            <RequiredIndicator />
          </label>
          <input
            id="piece-item-quantity"
            type="number"
            step="any"
            min="0"
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
            disabled={loading}
            aria-required="true"
            className="w-full rounded-lg border border-border px-3 py-2 text-text focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 dark:bg-gray-800"
          />
          {fieldErrors.quantity && (
            <p className="mt-1 text-sm text-danger">
              {fieldErrors.quantity}
            </p>
          )}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-text hover:bg-surface disabled:opacity-50"
          >
            {t('pieces.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading || sortedInventory.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t('common.submitting') : t('pieces.submitLine')}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
