import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox, type ComboboxItem } from '@/Component/Combobox'
import { Select, type SelectOption } from '@/Component/Select'
import { cx } from '@/Component/cx'
import { DialogShell } from '@/Component/dialog/DialogShell'
import { FormError } from '@/Component/form/FormError'
import { FormGroup } from '@/Component/form/FormGroup'
import { FormInput } from '@/Component/form/FormInput'
import { FormLabel } from '@/Component/form/FormLabel'
import { FormTextarea } from '@/Component/form/FormTextarea'
import { INVENTORY_TYPES, type InventoryType } from '@/Entity/InventoryItem'
import { parseNumericCell } from '@/Entity/SheetEntity'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/Entity/Transaction'
import { useEntityManager } from '@/Hook/useEntityManager'
import { isoDay } from '@/Service/Clock'
import {
  INVENTORY_PURCHASE_CATEGORIES,
  PurchaseService,
  type PurchaseLineInput,
} from '@/Service/PurchaseService'

interface CreatePurchaseDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: (transactionId: string) => void
}

interface LineDraft {
  mode: 'existing' | 'new'
  inventoryId: string
  name: string
  type: InventoryType
  quantity: string
  amount: string
}

function emptyLine(): LineDraft {
  return {
    mode: 'existing',
    inventoryId: '',
    name: '',
    type: 'filament',
    quantity: '',
    amount: '',
  }
}

function isInventoryCategory(category: string): boolean {
  return (INVENTORY_PURCHASE_CATEGORIES as readonly string[]).includes(category)
}

/**
 * Records an expense, optionally turning it into stock. Mounting the body only
 * while open keeps every fresh dialog free of the last one's draft.
 */
export function CreatePurchaseDialog({
  open,
  onClose,
  onCreated,
}: CreatePurchaseDialogProps) {
  if (!open) return null
  return <PurchaseDialogBody onClose={onClose} onCreated={onCreated} />
}

function PurchaseDialogBody({
  onClose,
  onCreated,
}: Omit<CreatePurchaseDialogProps, 'open'>) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [date, setDate] = useState(() => isoDay(em.clock))
  const [category, setCategory] = useState<ExpenseCategory>('filament')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [addToInventory, setAddToInventory] = useState(false)
  const [lines, setLines] = useState<LineDraft[]>([])
  const [error, setError] = useState('')

  const inventoryItems = useMemo<ComboboxItem[]>(
    () =>
      em.inventory
        .findActive()
        .map((item) => ({ key: item.id, label: item.name })),
    [em]
  )

  const categoryOptions: SelectOption[] = (
    addToInventory ? INVENTORY_PURCHASE_CATEGORIES : EXPENSE_CATEGORIES
  ).map((value) => ({ value, label: t(`purchase.category.${value}`) }))

  // With line items the total is the sum of the lines, never typed by hand.
  const lineTotal = lines.reduce(
    (sum, line) => sum + (parseNumericCell(line.amount) ?? 0),
    0
  )
  const amountValue = addToInventory ? lineTotal.toFixed(2) : amount

  const updateLine = (index: number, patch: Partial<LineDraft>) =>
    setLines((current) =>
      current.map((line, position) =>
        position === index ? { ...line, ...patch } : line
      )
    )

  const handleToggleInventory = (next: boolean) => {
    setAddToInventory(next)
    if (!next) return
    // Stock can only come from a material category, and a purchase needs a line.
    if (!isInventoryCategory(category)) setCategory('filament')
    setLines((current) => (current.length === 0 ? [emptyLine()] : current))
  }

  const toLineInput = (line: LineDraft): PurchaseLineInput => {
    const quantity = parseNumericCell(line.quantity) ?? NaN
    const lineAmount = parseNumericCell(line.amount) ?? NaN
    return line.mode === 'new'
      ? {
          mode: 'new',
          name: line.name,
          type: line.type,
          quantity,
          amount: lineAmount,
        }
      : {
          mode: 'existing',
          inventoryId: line.inventoryId,
          quantity,
          amount: lineAmount,
        }
  }

  const handleSubmit = () => {
    const result = new PurchaseService(em).recordPurchase(
      addToInventory
        ? {
            category,
            date,
            notes,
            addToInventory: true,
            lines: lines.map(toLineInput),
          }
        : {
            category,
            date,
            notes,
            addToInventory: false,
            amount: parseNumericCell(amount) ?? NaN,
          }
    )
    if (!result.ok) {
      setError(t(result.error))
      return
    }
    onClose()
    onCreated?.(result.transaction.id)
  }

  /** Filament is bought by weight; everything else by the piece. */
  const quantityHint = (line: LineDraft) => {
    const type =
      line.mode === 'new'
        ? line.type
        : (em.inventory.find(line.inventoryId)?.type ?? 'consumable')
    return type === 'filament'
      ? t('purchase.quantityHintGrams')
      : t('purchase.quantityHintUnits')
  }

  return (
    <DialogShell open onClose={onClose} labelledBy="purchase-dialog-title">
      <div
        data-testid="purchase-dialog"
        className="max-h-[70vh] space-y-4 overflow-y-auto"
      >
        <h2
          id="purchase-dialog-title"
          className="font-display text-xl font-semibold text-text"
        >
          {t('purchase.title')}
        </h2>

        <FormGroup>
          <FormLabel htmlFor="purchase-date">{t('purchase.date')}</FormLabel>
          <FormInput
            id="purchase-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel htmlFor="purchase-category">
            {t('purchase.category')}
          </FormLabel>
          <Select
            id="purchase-category"
            options={categoryOptions}
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ExpenseCategory)
            }
          />
        </FormGroup>

        <FormGroup>
          <FormLabel htmlFor="purchase-amount">
            {addToInventory
              ? t('purchase.totalFromLines')
              : t('purchase.amount')}
          </FormLabel>
          <FormInput
            id="purchase-amount"
            type="number"
            step=".01"
            min="0"
            readOnly={addToInventory}
            value={amountValue}
            onChange={(event) => setAmount(event.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel htmlFor="purchase-notes">{t('purchase.notes')}</FormLabel>
          <FormTextarea
            id="purchase-notes"
            rows={2}
            placeholder={t('purchase.notesPlaceholder')}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </FormGroup>

        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={addToInventory}
            onChange={(event) => handleToggleInventory(event.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          {t('purchase.addToInventory')}
        </label>

        {addToInventory && (
          <div className="space-y-4">
            {lines.map((line, index) => (
              <div
                key={index}
                className="space-y-3 rounded-md border border-border p-3"
              >
                <div className="flex gap-2">
                  {(['existing', 'new'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={line.mode === mode}
                      onClick={() => updateLine(index, { mode })}
                      className={cx(
                        'rounded-md px-3 py-1 text-xs font-medium',
                        line.mode === mode
                          ? 'bg-primary text-white'
                          : 'border border-border text-text-muted'
                      )}
                    >
                      {mode === 'existing'
                        ? t('purchase.lineExisting')
                        : t('purchase.lineNew')}
                    </button>
                  ))}
                </div>

                {line.mode === 'existing' ? (
                  <FormGroup>
                    {/* Combobox owns its input id, so the label wraps it to associate. */}
                    <FormLabel className="space-y-1">
                      {t('purchase.inventoryItem')}
                      <Combobox
                        items={inventoryItems}
                        value={
                          line.inventoryId === '' ? null : line.inventoryId
                        }
                        onChange={(key) =>
                          updateLine(index, { inventoryId: key })
                        }
                        placeholder={t('purchase.searchInventory')}
                      />
                    </FormLabel>
                  </FormGroup>
                ) : (
                  <>
                    <FormGroup>
                      <FormLabel htmlFor={`purchase-line-${index}-name`}>
                        {t('purchase.inventoryName')}
                      </FormLabel>
                      <FormInput
                        id={`purchase-line-${index}-name`}
                        data-testid={`purchase-line-${index}-new-name`}
                        type="text"
                        value={line.name}
                        onChange={(event) =>
                          updateLine(index, { name: event.target.value })
                        }
                      />
                    </FormGroup>
                    <FormGroup>
                      <FormLabel htmlFor={`purchase-line-${index}-type`}>
                        {t('purchase.inventoryTypeLabel')}
                      </FormLabel>
                      <Select
                        id={`purchase-line-${index}-type`}
                        options={INVENTORY_TYPES.map((value) => ({
                          value,
                          label: t(`purchase.inventoryType.${value}`),
                        }))}
                        value={line.type}
                        onChange={(event) =>
                          updateLine(index, {
                            type: event.target.value as InventoryType,
                          })
                        }
                      />
                    </FormGroup>
                  </>
                )}

                <div className="flex gap-3">
                  <FormGroup className="flex-1">
                    <FormLabel htmlFor={`purchase-line-${index}-qty`}>
                      {`${t('purchase.quantity')} ${quantityHint(line)}`}
                    </FormLabel>
                    <FormInput
                      id={`purchase-line-${index}-qty`}
                      data-testid={`purchase-line-${index}-qty`}
                      type="number"
                      step=".01"
                      min="0"
                      value={line.quantity}
                      onChange={(event) =>
                        updateLine(index, { quantity: event.target.value })
                      }
                    />
                  </FormGroup>
                  <FormGroup className="flex-1">
                    <FormLabel htmlFor={`purchase-line-${index}-amount`}>
                      {t('purchase.lineAmount')}
                    </FormLabel>
                    <FormInput
                      id={`purchase-line-${index}-amount`}
                      data-testid={`purchase-line-${index}-amount`}
                      type="number"
                      step=".01"
                      min="0"
                      value={line.amount}
                      onChange={(event) =>
                        updateLine(index, { amount: event.target.value })
                      }
                    />
                  </FormGroup>
                </div>
              </div>
            ))}
            <button
              type="button"
              data-testid="purchase-add-line"
              className="btn-secondary"
              onClick={() => setLines((current) => [...current, emptyLine()])}
            >
              {t('purchase.addLine')}
            </button>
          </div>
        )}

        <FormError message={error} />

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('purchase.cancel')}
          </button>
          <button
            type="button"
            data-testid="purchase-submit"
            className="btn-primary"
            onClick={handleSubmit}
          >
            {t('purchase.submit')}
          </button>
        </div>
      </div>
    </DialogShell>
  )
}
