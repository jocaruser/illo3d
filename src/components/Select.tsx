export interface SelectProps<T> {
  items: readonly T[]
  value: string
  onChange: (key: string) => void
  getKey: (item: T) => string
  getLabel: (item: T) => string
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  testId?: string
  ariaLabel?: string
}

export function Select<T>({
  items,
  value,
  onChange,
  getKey,
  getLabel,
  placeholder,
  disabled = false,
  className = '',
  id,
  ariaLabel,
  testId,
}: SelectProps<T>) {
  const baseClasses =
    'rounded border border-border bg-surface-elevated px-2 py-1 text-sm text-text focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-gray-700'

  return (
    <select
      id={id}
      data-testid={testId}
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseClasses} ${className}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {items.map((item) => (
        <option key={getKey(item)} value={getKey(item)}>
          {getLabel(item)}
        </option>
      ))}
    </select>
  )
}
