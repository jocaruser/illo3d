import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/Component/Toast'
import { FormError } from '@/Component/form/FormError'
import { FormGroup } from '@/Component/form/FormGroup'
import { FormInput } from '@/Component/form/FormInput'
import { FormLabel } from '@/Component/form/FormLabel'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import { parseNumericCell } from '@/Entity/SheetEntity'
import { useEntityManager } from '@/Hook/useEntityManager'
import { InventoryService } from '@/Service/InventoryService'

interface QtyEditorProps {
  itemId: string
  qtyCurrent: number
}

/** Corrects the on-hand count after a stocktake. */
export function QtyEditor({ itemId, qtyCurrent }: QtyEditorProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [value, setValue] = useState(String(qtyCurrent))
  const [error, setError] = useState('')

  const handleSave = () => {
    const parsed = parseNumericCell(value)
    const result = new InventoryService(em).updateQtyCurrent(
      itemId,
      parsed ?? NaN
    )
    if (!result.ok) {
      setError(t(result.error))
      toast.error(t('inventoryDetail.qtySaveError'))
      return
    }
    setError('')
    // Echo what was stored: the service rounds to two decimals.
    setValue(String(result.item.qtyCurrent))
    toast.success(t('toast.changeApplied'))
  }

  return (
    <section className="space-y-3">
      <SectionHeading>{t('inventoryDetail.qtyHeading')}</SectionHeading>
      <div className="flex flex-wrap items-end gap-3">
        <FormGroup className="w-40">
          <FormLabel htmlFor="inventory-qty-current">
            {t('inventory.qtyCurrent')}
          </FormLabel>
          <FormInput
            id="inventory-qty-current"
            data-testid="inventory-detail-qty-current"
            type="number"
            step=".01"
            min="0"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </FormGroup>
        <button
          type="button"
          data-testid="inventory-detail-save-qty"
          className="btn-primary"
          onClick={handleSave}
        >
          {t('inventoryDetail.saveQty')}
        </button>
      </div>
      <FormError message={error} />
    </section>
  )
}
