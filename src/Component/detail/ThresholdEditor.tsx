import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/Component/Toast'
import { FormError } from '@/Component/form/FormError'
import { FormGroup } from '@/Component/form/FormGroup'
import { FormInput } from '@/Component/form/FormInput'
import { FormLabel } from '@/Component/form/FormLabel'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import type { InventoryItem } from '@/Entity/InventoryItem'
import { parseNumericCell } from '@/Entity/SheetEntity'
import { useEntityManager } from '@/Hook/useEntityManager'
import { InventoryService } from '@/Service/InventoryService'

interface ThresholdEditorProps {
  item: InventoryItem
}

type Tier = 'yellow' | 'orange' | 'red'

const TIERS: Tier[] = ['yellow', 'orange', 'red']

const labelKeys: Record<Tier, string> = {
  yellow: 'inventoryDetail.thresholdYellow',
  orange: 'inventoryDetail.thresholdOrange',
  red: 'inventoryDetail.thresholdRed',
}

/** Low-stock tiers. 0 disables a tier; precedence when they overlap is red > orange > yellow. */
export function ThresholdEditor({ item }: ThresholdEditorProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [values, setValues] = useState<Record<Tier, string>>({
    yellow: String(item.warnYellow),
    orange: String(item.warnOrange),
    red: String(item.warnRed),
  })
  const [error, setError] = useState('')

  const handleSave = () => {
    const result = new InventoryService(em).updateThresholds(item.id, {
      yellow: parseNumericCell(values.yellow) ?? NaN,
      orange: parseNumericCell(values.orange) ?? NaN,
      red: parseNumericCell(values.red) ?? NaN,
    })
    if (!result.ok) {
      setError(t(result.error))
      toast.error(t('inventoryDetail.saveError'))
      return
    }
    setError('')
    toast.success(t('toast.changeApplied'))
  }

  return (
    <section className="space-y-3">
      <SectionHeading>{t('inventoryDetail.thresholdsHeading')}</SectionHeading>
      <div className="flex flex-wrap items-end gap-3">
        {TIERS.map((tier) => (
          <FormGroup key={tier} className="w-40">
            <FormLabel htmlFor={`inventory-warn-${tier}`}>
              {t(labelKeys[tier])}
            </FormLabel>
            <FormInput
              id={`inventory-warn-${tier}`}
              data-testid={`inventory-detail-warn-${tier}`}
              type="number"
              step="1"
              min="0"
              value={values[tier]}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [tier]: event.target.value,
                }))
              }
            />
          </FormGroup>
        ))}
        <button
          type="button"
          data-testid="inventory-detail-save-thresholds"
          className="btn-primary"
          onClick={handleSave}
        >
          {t('inventoryDetail.saveThresholds')}
        </button>
      </div>
      <FormError message={error} />
    </section>
  )
}
