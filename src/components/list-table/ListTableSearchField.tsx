import { useId } from 'react'

interface ListTableSearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel: string
  className?: string
}

export function ListTableSearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = '',
}: ListTableSearchFieldProps) {
  const inputId = useId()
  return (
    <div className={`mb-3 ${className}`}>
      <label className="sr-only" htmlFor={inputId}>
        {ariaLabel}
      </label>
      <input
        id={inputId}
        type="search"
        data-testid="list-table-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}
