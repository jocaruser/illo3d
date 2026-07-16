import { useId, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import { formControlClasses } from '@/Component/form/controlClasses'

export interface ComboboxItem {
  key: string
  label: string
}

interface ComboboxProps {
  items: ComboboxItem[]
  value: string | null
  onChange: (key: string) => void
  disabled?: boolean
  creatable?: boolean
  onCreateItem?: (label: string) => void
  placeholder?: string
}

const CREATE_KEY = '__combobox-create__'

export function Combobox({
  items,
  value,
  onChange,
  disabled = false,
  creatable = false,
  onCreateItem,
  placeholder,
}: ComboboxProps) {
  const { t } = useTranslation()
  const id = useId()
  const listboxId = `${id}-listbox`
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)

  const selected = items.find((item) => item.key === value)
  const displayValue = query ?? selected?.label ?? ''
  const trimmedQuery = (query ?? '').trim()
  const filtered =
    trimmedQuery === ''
      ? items
      : items.filter((item) => item.label.toLowerCase().includes(trimmedQuery.toLowerCase()))
  const options =
    creatable && trimmedQuery !== ''
      ? [...filtered, { key: CREATE_KEY, label: t('combobox.createOption', { query: trimmedQuery }) }]
      : filtered

  const close = () => {
    setOpen(false)
    setQuery(null)
    setHighlighted(0)
  }

  const select = (option: ComboboxItem) => {
    if (option.key === CREATE_KEY) onCreateItem?.(trimmedQuery)
    else onChange(option.key)
    close()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    setOpen(true)
    setHighlighted(0)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      close()
      return
    }
    if (event.key === 'Enter') {
      if (open && options.length > 0) {
        event.preventDefault()
        select(options[Math.min(highlighted, options.length - 1)])
      }
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    if (!open) {
      setOpen(true)
      setHighlighted(0)
      return
    }
    if (options.length === 0) return
    const delta = event.key === 'ArrowDown' ? 1 : -1
    setHighlighted((current) => (current + delta + options.length) % options.length)
  }

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && options.length > 0 ? `${id}-option-${highlighted}` : undefined
        }
        className={formControlClasses}
        value={displayValue}
        placeholder={placeholder ?? t('combobox.placeholder')}
        disabled={disabled}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={close}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('combobox.ariaLabel')}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface-elevated py-1 text-sm text-text shadow-lg"
        >
          {options.length === 0 ? (
            <li role="presentation" className="px-3 py-2 text-text-muted">
              {items.length === 0 ? t('combobox.noItems') : t('combobox.noMatch')}
            </li>
          ) : (
            options.map((option, index) => (
              <li
                key={option.key}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option.key === value}
                className={cx('cursor-pointer px-3 py-2', index === highlighted && 'bg-primary/10')}
                onMouseDown={(event) => {
                  event.preventDefault()
                  select(option)
                }}
                onMouseEnter={() => setHighlighted(index)}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
