import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPieceItem } from '@/services/piece/createPieceItem'
import type { Inventory } from '@/types/money'

interface CreatePieceItemPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  spreadsheetId: string | null
  pieceId: string | null
  inventory: Inventory[]
}

export function CreatePieceItemPopup({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId,
  pieceId,
  inventory,
}: CreatePieceItemPopupProps) {
  const { t } = useTranslation()
  const [inventoryId, setInventoryId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const sortedInventory = useMemo(
    () => [...inventory].sort((a, b) => a.name.localeCompare(b.name)),
    [inventory]
  )

  useEffect(() => {
    if (!isOpen) return
    setInventoryId(sortedInventory[0]?.id ?? '')
    setQuantity('')
    setError(null)
    setFieldErrors({})
  }, [isOpen, sortedInventory])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!inventoryId) errs.inventory = t('pieces.validation.inventoryRequired')
    const q = parseFloat(quantity)
    if (!quantity.trim()) errs.quantity = t('pieces.validation.required')
    else if (Number.isNaN(q) || q <= 0)
      errs.quantity = t('pieces.validation.quantityPositive')
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
        inventory_id: inventoryId,
        quantity: parseFloat(quantity),
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen || !pieceId) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          {t('pieces.addLineTitle')}
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          {t('pieces.addLineForPiece', { id: pieceId })}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="piece-item-inventory"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('pieces.inventoryLot')}
            </label>
            <select
              id="piece-item-inventory"
              value={inventoryId}
              onChange={(e) => setInventoryId(e.target.value)}
              disabled={loading || sortedInventory.length === 0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {sortedInventory.length === 0 ? (
                <option value="">{t('pieces.noInventory')}</option>
              ) : (
                sortedInventory.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.type === 'filament'
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
                  </option>
                ))
              )}
            </select>
            {fieldErrors.inventory && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.inventory}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="piece-item-quantity"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('pieces.quantity')}
            </label>
            <input
              id="piece-item-quantity"
              type="number"
              step="any"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {fieldErrors.quantity && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.quantity}
              </p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t('pieces.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || sortedInventory.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : t('pieces.submitLine')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
