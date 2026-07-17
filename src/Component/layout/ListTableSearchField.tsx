import { useId, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { formControlClasses } from '@/Component/form/controlClasses'

interface ListTableSearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function ListTableSearchField({ value, onChange, placeholder }: ListTableSearchFieldProps) {
  const { t } = useTranslation()
  const id = useId()
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {t('listTable.searchAria')}
      </label>
      <input
        id={id}
        type="search"
        data-testid="list-table-search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder ?? t('listTable.searchPlaceholder')}
        className={formControlClasses}
      />
    </div>
  )
}
