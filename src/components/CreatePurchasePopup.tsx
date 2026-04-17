import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPurchase, type PurchaseLine } from '@/services/purchase/createPurchase'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import type { InventoryType, PurchaseCategory } from '@/types/money'
import { DialogShell } from './DialogShell'
import { RequiredIndicator } from './RequiredIndicator'

const STOCK_CATEGORIES: PurchaseCategory[] = ['filament', 'consumable', 'equipment']
const ALL_CATEGORIES: PurchaseCategory[] = [
  'filament',
  'consumable',
  'equipment',
  'electric',
  'maintenance',
  'other',
]

const INVENTORY_TYPES: InventoryType[] = ['filament', 'consumable', 'equipment']

function newLineKey(): string {
  try {
    const fn = globalThis.crypto?.randomUUID
    if (typeof fn === 'function') return fn.call(globalThis.crypto)
  } catch {
    /* Non-secure contexts (e.g. http://hostname in Docker E2E) may throw. */
  }
  return `pl-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

type LineForm =
  | {
      key: string
      mode: 'existing'
      inventoryId: string
      quantity: string
      amount: string
    }
  | {
      key: string
      mode: 'new'
      type: InventoryType
      name: string
      quantity: string
      amount: string
    }

function defaultLine(activeIds: string[]): LineForm {
  if (activeIds.length > 0) {
    return {
      key: newLineKey(),
      mode: 'existing',
      inventoryId: activeIds[0]!,
      quantity: '1',
      amount: '',
    }
  }
  return {
    key: newLineKey(),
    mode: 'new',
    type: 'filament',
    name: '',
    quantity: '1',
    amount: '',
  }
}

interface CreatePurchasePopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  spreadsheetId: string | null
}

export function CreatePurchasePopup({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId,
}: CreatePurchasePopupProps) {
  const { t } = useTranslation()
  const { inventory: allInventory } = useWorkbookEntities()

  const activeInventoryIds = useMemo(() => {
    return allInventory
      .filter((i) => i.archived !== 'true' && i.deleted !== 'true')
      .map((i) => i.id)
  }, [allInventory])

  const [date, setDate] = useState('')
  const [category, setCategory] = useState<PurchaseCategory>('other')
  const [notes, setNotes] = useState('')
  const [amount, setAmount] = useState('')
  const [addToInventory, setAddToInventory] = useState(false)
  const [lines, setLines] = useState<LineForm[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    setDate('')
    setCategory('other')
    setNotes('')
    setAmount('')
    setAddToInventory(false)
    setLines([defaultLine(activeInventoryIds)])
    setError(null)
    setFieldErrors({})
  }, [isOpen, activeInventoryIds])

  useEffect(() => {
    if (!addToInventory) return
    if (!STOCK_CATEGORIES.includes(category)) {
      setCategory('filament')
    }
  }, [addToInventory, category])

  const linesTotal = useMemo(() => {
    let s = 0
    for (const line of lines) {
      const a = parseFloat(line.amount)
      if (Number.isFinite(a)) s += a
    }
    return s
  }, [lines])

  const quantityHintKey = (line: LineForm) =>
    line.mode === 'new' && line.type === 'filament'
      ? 'purchase.quantityHintGrams'
      : 'purchase.quantityHintUnits'

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!date.trim()) errs.date = t('purchase.validation.required')
    if (!notes.trim()) errs.notes = t('purchase.validation.required')

    if (!addToInventory) {
      const amountNum = parseFloat(amount)
      if (!amount.trim()) errs.amount = t('purchase.validation.required')
      else if (Number.isNaN(amountNum) || amountNum <= 0)
        errs.amount = t('purchase.validation.amountPositive')
    } else {
      if (lines.length === 0) errs.lines = t('purchase.validation.lineRequired')
      lines.forEach((line, i) => {
        const q = parseFloat(line.quantity)
        const a = parseFloat(line.amount)
        if (line.mode === 'existing') {
          if (!line.inventoryId)
            errs[`line${i}inv`] = t('purchase.validation.required')
        } else {
          if (!line.name.trim())
            errs[`line${i}name`] = t('purchase.validation.inventoryNameRequired')
        }
        if (!line.quantity.trim()) errs[`line${i}qty`] = t('purchase.validation.required')
        else if (Number.isNaN(q) || q <= 0)
          errs[`line${i}qty`] = t('purchase.validation.quantityPositive')
        if (!line.amount.trim()) errs[`line${i}amt`] = t('purchase.validation.required')
        else if (Number.isNaN(a) || a <= 0)
          errs[`line${i}amt`] = t('purchase.validation.amountPositive')
      })
      if (lines.length > 0 && (!Number.isFinite(linesTotal) || linesTotal <= 0)) {
        errs.lines = t('purchase.validation.amountPositive')
      }
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const buildLinesPayload = (): PurchaseLine[] => {
    return lines.map((line) => {
      const qty = parseFloat(line.quantity)
      const amt = parseFloat(line.amount)
      if (line.mode === 'existing') {
        return {
          mode: 'existing' as const,
          inventoryId: line.inventoryId,
          quantity: qty,
          amount: amt,
        }
      }
      return {
        mode: 'new' as const,
        type: line.type,
        name: line.name.trim(),
        quantity: qty,
        amount: amt,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate() || !spreadsheetId) return
    setLoading(true)
    try {
      const total = addToInventory ? linesTotal : parseFloat(amount)
      await createPurchase(spreadsheetId, {
        date,
        category,
        notes: notes.trim(),
        addToInventory,
        amount: total,
        lines: addToInventory ? buildLinesPayload() : undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = addToInventory ? STOCK_CATEGORIES : ALL_CATEGORIES

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      title={t('purchase.title')}
      panelTestId="purchase-dialog"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div>
          <label htmlFor="purchase-date" className="mb-1 block text-sm font-medium">
            {t('purchase.date')}
            <RequiredIndicator />
          </label>
          <input
            id="purchase-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            aria-invalid={fieldErrors.date ? true : undefined}
            aria-describedby={fieldErrors.date ? 'purchase-date-err' : undefined}
          />
          {fieldErrors.date ? (
            <p id="purchase-date-err" className="mt-1 text-sm text-red-600">
              {fieldErrors.date}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="purchase-category" className="mb-1 block text-sm font-medium">
            {t('purchase.category')}
            <RequiredIndicator />
          </label>
          <select
            id="purchase-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as PurchaseCategory)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {t(`purchase.category.${c}`)}
              </option>
            ))}
          </select>
        </div>

        {!addToInventory ? (
          <div>
            <label htmlFor="purchase-amount" className="mb-1 block text-sm font-medium">
              {t('purchase.amount')}
              <RequiredIndicator />
            </label>
            <input
              id="purchase-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              aria-invalid={fieldErrors.amount ? true : undefined}
            />
            {fieldErrors.amount ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p>
            ) : null}
          </div>
        ) : (
          <div>
            <p className="mb-1 text-sm font-medium">{t('purchase.totalFromLines')}</p>
            <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              {Number.isFinite(linesTotal) ? linesTotal.toFixed(2) : '—'}
            </p>
            {fieldErrors.lines ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.lines}</p>
            ) : null}
          </div>
        )}

        <div>
          <label htmlFor="purchase-notes" className="mb-1 block text-sm font-medium">
            {t('purchase.notes')}
            <RequiredIndicator />
          </label>
          <textarea
            id="purchase-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t('purchase.notesPlaceholder')}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
          {fieldErrors.notes ? (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.notes}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="purchase-add-inventory"
            type="checkbox"
            checked={addToInventory}
            onChange={(e) => {
              const on = e.target.checked
              setAddToInventory(on)
              setLines([defaultLine(activeInventoryIds)])
            }}
          />
          <label htmlFor="purchase-add-inventory" className="text-sm">
            {t('purchase.addToInventory')}
          </label>
        </div>

        {addToInventory ? (
          <div className="space-y-3 rounded border border-gray-200 p-3">
            {lines.map((line, i) => (
              <div key={line.key} className="space-y-2 border-b border-gray-100 pb-3 last:border-0">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded px-2 py-1 text-xs ${line.mode === 'existing' ? 'bg-blue-100' : 'bg-gray-100'}`}
                    onClick={() => {
                      const next = { ...line, mode: 'existing' as const }
                      if (next.mode === 'existing') {
                        setLines(
                          lines.map((l, j) =>
                            j === i
                              ? {
                                  key: l.key,
                                  mode: 'existing',
                                  inventoryId: activeInventoryIds[0] ?? '',
                                  quantity: l.quantity,
                                  amount: l.amount,
                                }
                              : l,
                          ),
                        )
                      }
                    }}
                  >
                    {t('purchase.lineExisting')}
                  </button>
                  <button
                    type="button"
                    className={`rounded px-2 py-1 text-xs ${line.mode === 'new' ? 'bg-blue-100' : 'bg-gray-100'}`}
                    onClick={() => {
                      setLines(
                        lines.map((l, j) =>
                          j === i
                            ? {
                                key: l.key,
                                mode: 'new',
                                type: 'filament',
                                name: '',
                                quantity: l.quantity,
                                amount: l.amount,
                              }
                            : l,
                        ),
                      )
                    }}
                  >
                    {t('purchase.lineNew')}
                  </button>
                </div>

                {line.mode === 'existing' ? (
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      {t('purchase.inventoryItem')}
                    </label>
                    <select
                      value={line.inventoryId}
                      onChange={(e) => {
                        const id = e.target.value
                        setLines(
                          lines.map((l, j) =>
                            j === i && l.mode === 'existing'
                              ? { ...l, inventoryId: id }
                              : l,
                          ),
                        )
                      }}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      {activeInventoryIds.map((id) => {
                        const inv = allInventory.find((x) => x.id === id)
                        return (
                          <option key={id} value={id}>
                            {inv ? `${inv.name} (${id})` : id}
                          </option>
                        )
                      })}
                    </select>
                    {fieldErrors[`line${i}inv`] ? (
                      <p className="text-xs text-red-600">{fieldErrors[`line${i}inv`]}</p>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {t('purchase.inventoryTypeLabel')}
                      </label>
                      <select
                        value={line.type}
                        onChange={(e) => {
                          const typ = e.target.value as InventoryType
                          setLines(
                            lines.map((l, j) =>
                              j === i && l.mode === 'new' ? { ...l, type: typ } : l,
                            ),
                          )
                        }}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        {INVENTORY_TYPES.map((typ) => (
                          <option key={typ} value={typ}>
                            {t(`purchase.inventoryType.${typ}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {t('purchase.inventoryName')}
                      </label>
                      <input
                        type="text"
                        value={line.name}
                        data-testid={`purchase-line-${i}-new-name`}
                        onChange={(e) => {
                          const v = e.target.value
                          setLines(
                            lines.map((l, j) =>
                              j === i && l.mode === 'new' ? { ...l, name: v } : l,
                            ),
                          )
                        }}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      {fieldErrors[`line${i}name`] ? (
                        <p className="text-xs text-red-600">{fieldErrors[`line${i}name`]}</p>
                      ) : null}
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      {t('purchase.quantity')} {t(quantityHintKey(line))}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.quantity}
                      data-testid={`purchase-line-${i}-qty`}
                      onChange={(e) => {
                        const v = e.target.value
                        setLines(lines.map((l, j) => (j === i ? { ...l, quantity: v } : l)))
                      }}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    {fieldErrors[`line${i}qty`] ? (
                      <p className="text-xs text-red-600">{fieldErrors[`line${i}qty`]}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      {t('purchase.lineAmount')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.amount}
                      data-testid={`purchase-line-${i}-amount`}
                      onChange={(e) => {
                        const v = e.target.value
                        setLines(lines.map((l, j) => (j === i ? { ...l, amount: v } : l)))
                      }}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    {fieldErrors[`line${i}amt`] ? (
                      <p className="text-xs text-red-600">{fieldErrors[`line${i}amt`]}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
              onClick={() => setLines([...lines, defaultLine(activeInventoryIds)])}
            >
              {t('purchase.addLine')}
            </button>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm"
          >
            {t('purchase.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading || !spreadsheetId}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t('common.submitting') : t('purchase.submit')}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
