import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColourSwatch } from '@/Component/ColourSwatch'
import { toast } from '@/Component/Toast'
import { FormError } from '@/Component/form/FormError'
import { FormGroup } from '@/Component/form/FormGroup'
import { FormInput } from '@/Component/form/FormInput'
import { FormLabel } from '@/Component/form/FormLabel'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import { useEntityManager } from '@/Hook/useEntityManager'
import { InventoryService } from '@/Service/InventoryService'

interface ColourEditorProps {
  itemId: string
  colour: string
}

/** `<input type="color">` has no empty state, so an unset swatch shows as black. */
const PICKER_FALLBACK = '#000000'

const HEX = /^#[0-9a-fA-F]{6}$/

/**
 * v3 inventory swatch. The picker covers the common case; the hex field lets a
 * user paste a filament vendor's exact colour, and Clear removes the swatch.
 */
export function ColourEditor({ itemId, colour }: ColourEditorProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [value, setValue] = useState(colour)
  const [error, setError] = useState('')

  const handleSave = () => {
    const next = value.trim()
    const result = new InventoryService(em).updateColour(itemId, next)
    if (!result.ok) {
      // The page only renders this for an item that exists, so the sole
      // reachable failure is a hex that does not match `#RRGGBB`.
      setError(t('inventoryDetail.colourInvalid'))
      toast.error(t('inventoryDetail.colourSaveError'))
      return
    }
    setError('')
    setValue(result.item.colour)
    toast.success(t('toast.changeApplied'))
  }

  return (
    <section className="space-y-3">
      <SectionHeading>{t('inventoryDetail.colourHeading')}</SectionHeading>
      <div className="flex flex-wrap items-end gap-3">
        <FormGroup>
          <FormLabel htmlFor="inventory-colour-picker">
            {t('inventoryDetail.colourPickerLabel')}
          </FormLabel>
          <input
            id="inventory-colour-picker"
            data-testid="inventory-detail-colour-picker"
            aria-label={t('inventoryDetail.colourPickerLabel')}
            type="color"
            value={HEX.test(value) ? value : PICKER_FALLBACK}
            onChange={(event) => setValue(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded-md border border-border bg-surface-elevated p-1"
          />
        </FormGroup>
        <FormGroup className="w-40">
          <FormLabel htmlFor="inventory-colour-hex">
            {t('inventoryDetail.colourHexLabel')}
          </FormLabel>
          <FormInput
            id="inventory-colour-hex"
            data-testid="inventory-detail-colour-hex"
            type="text"
            placeholder="#RRGGBB"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </FormGroup>
        <span className="flex h-10 items-center">
          <ColourSwatch colour={HEX.test(value) ? value : ''} />
        </span>
        <button
          type="button"
          data-testid="inventory-detail-clear-colour"
          className="btn-secondary"
          onClick={() => setValue('')}
        >
          {t('inventoryDetail.colourClear')}
        </button>
        <button
          type="button"
          data-testid="inventory-detail-save-colour"
          className="btn-primary"
          onClick={handleSave}
        >
          {t('inventoryDetail.saveColour')}
        </button>
      </div>
      <FormError message={error} />
    </section>
  )
}
