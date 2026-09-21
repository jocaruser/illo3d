import { TrashIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'react-i18next'
import { Combobox, type ComboboxItem } from '@/Component/Combobox'
import { cx } from '@/Component/cx'
import { FormInput } from '@/Component/form/FormInput'
import type { InventoryItem } from '@/Entity/InventoryItem'
import type { Piece } from '@/Entity/Piece'
import type { PieceItem } from '@/Entity/PieceItem'
import { formatCurrency } from '@/Service/Pricing/money'
import { computeRedos, type RedoBand } from '@/Service/Pricing/redos'

const bandClasses: Record<RedoBand, string> = {
  safe: 'text-success',
  tight: 'text-warning',
  risky: 'text-danger',
}

export interface PieceItemTableRowProps {
  line: PieceItem
  piece: Piece
  readOnly: boolean
  revision: number
  units: number
  item: InventoryItem | undefined
  unitCost: number | null
  options: ComboboxItem[]
  onInventoryChange: (line: PieceItem, next: string) => void
  onQuantityBlur: (line: PieceItem, raw: string) => void
  onRemove: (line: PieceItem) => void
}

export function PieceItemTableRow({
  line,
  readOnly,
  revision,
  units,
  item,
  unitCost,
  options,
  onInventoryChange,
  onQuantityBlur,
  onRemove,
}: PieceItemTableRowProps) {
  const { t } = useTranslation()
  const quantity = line.quantity ?? 0
  const cost = unitCost === null ? null : unitCost * quantity * units
  const redo = computeRedos(item?.qtyCurrent ?? 0, quantity * units)

  return (
    <tr key={line.id} data-testid={`piece-item-row-${line.id}`}>
      <td className="px-2 py-1 text-text-muted">{line.id}</td>
      <td className="px-2 py-1">
        <div className="min-w-[10rem]" data-testid={`piece-item-inventory-${line.id}`}>
          {readOnly ? (
            <span>{item?.name ?? line.inventoryId}</span>
          ) : (
            <Combobox
              items={options}
              value={line.inventoryId}
              placeholder={t('pieces.inventoryFieldAria', { id: line.id })}
              onChange={(next) => onInventoryChange(line, next)}
            />
          )}
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
          readOnly={readOnly}
          disabled={readOnly}
          key={`${line.id}-${revision}`}
          onBlur={(event) => onQuantityBlur(line, event.target.value)}
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
        {!readOnly && (
          <button
            type="button"
            className="rounded p-1 text-text-muted hover:text-danger"
            data-testid={`piece-item-delete-${line.id}`}
            aria-label={t('pieces.removeLine', { id: line.id })}
            onClick={() => onRemove(line)}
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </td>
    </tr>
  )
}
