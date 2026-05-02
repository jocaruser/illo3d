import { useCallback, useId, useMemo, useRef, useState } from 'react'

export interface ComboboxProps<T> {
  items: readonly T[]
  value: string
  onChange: (key: string) => void
  getKey: (item: T) => string
  getLabel: (item: T) => string
  searchable?: boolean
  creatable?: boolean
  onCreateItem?: (input: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  testId?: string
  ariaLabel?: string
}

interface ComboboxItem<T> {
  item: T
  key: string
  label: string
}

export function Combobox<T>({
  items,
  value,
  onChange,
  getKey,
  getLabel,
  searchable = true,
  creatable = false,
  onCreateItem,
  placeholder,
  disabled = false,
  className = '',
  id,
  testId,
  ariaLabel,
}: ComboboxProps<T>) {
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const itemsMapped: ComboboxItem<T>[] = useMemo(
    () => items.map((item) => ({ item, key: getKey(item), label: getLabel(item) })),
    [items, getKey, getLabel]
  )

  const selectedLabel = useMemo(
    () => itemsMapped.find((i) => i.key === value)?.label ?? '',
    [itemsMapped, value]
  )

  const filtered = useMemo(() => {
    if (!searchable) return itemsMapped
    if (query.trim() === '') return itemsMapped
    const lowerQuery = query.toLowerCase()
    return itemsMapped.filter(({ label }) =>
      label.toLowerCase().includes(lowerQuery)
    )
  }, [itemsMapped, searchable, query])

  const handleSelect = useCallback(
    (key: string) => {
      onChange(key)
      setQuery('')
      setOpen(false)
      setActiveIdx(-1)
    },
    [onChange]
  )

  const handleCreatableSelect = useCallback(async () => {
    if (!creatable || !onCreateItem || !query.trim()) return
    await onCreateItem(query.trim())
    setQuery('')
    setOpen(false)
    setActiveIdx(-1)
  }, [creatable, onCreateItem, query])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      setActiveIdx(-1)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (disabled || (filtered.length === 0 && !creatable)) return
      if (!open) {
        setOpen(true)
      }
      if (filtered.length === 0) return
      setActiveIdx((i) => (i + 1 >= filtered.length ? 0 : i + 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (disabled || (filtered.length === 0 && !creatable)) return
      if (!open) {
        setOpen(true)
      }
      if (filtered.length === 0) return
      setActiveIdx((i) => (i <= 0 ? filtered.length - 1 : i - 1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (open && activeIdx >= 0 && activeIdx < filtered.length) {
        handleSelect(filtered[activeIdx].key)
        return
      }
      if (creatable && query.trim() && filtered.length === 0) {
        void handleCreatableSelect()
        return
      }
    }
  }

  const inputDisabled = disabled || (items.length === 0 && !creatable)

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <input
        id={id}
        data-testid={testId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeIdx >= 0
            ? `${baseId}-option-${filtered[activeIdx]?.key}`
            : undefined
        }
        aria-label={ariaLabel}
        value={query || (open ? '' : selectedLabel)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActiveIdx(-1)
        }}
        onFocus={() => {
          if (disabled) return
          setOpen(true)
          setActiveIdx(0)
        }}
        onBlur={() => {
          requestAnimationFrame(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
              setOpen(false)
              setActiveIdx(-1)
            }
          })
        }}
        onKeyDown={handleKeyDown}
        disabled={inputDisabled}
        placeholder={placeholder ?? 'Search...'}
        className={`w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700 ${className}`}
      />
      {open && !disabled ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel ?? 'Options'}
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1 shadow-lg"
        >
          {itemsMapped.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-500" role="presentation">
              No items available
            </li>
          ) : filtered.length === 0 && query.trim() ? (
            creatable ? (
              <li
                role="option"
                aria-selected={false}
                className="cursor-pointer px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void handleCreatableSelect()}
              >
                {'Create "' + query.trim() + '"'}
              </li>
            ) : (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-500" role="presentation">
                No matching items
              </li>
            )
          ) : (
            filtered.map(({ key, label }, idx) => (
              <li
                key={key}
                id={`${baseId}-option-${key}`}
                role="option"
                aria-selected={idx === activeIdx}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  idx === activeIdx
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => handleSelect(key)}
              >
                {label}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
