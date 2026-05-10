interface ColourSwatchProps {
  colour?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ColourSwatch({ colour, size = 'md', className = '' }: ColourSwatchProps) {
  if (!colour) return null

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  }

  return (
    <span
      className={`inline-block rounded-full border border-border shadow-sm ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: colour }}
      aria-label={`Colour: ${colour}`}
      title={colour}
    />
  )
}

interface ColourPickerProps {
  value?: string
  onChange: (colour: string) => void
  disabled?: boolean
}

export function ColourPicker({ value, onChange, disabled }: ColourPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <ColourSwatch colour={value} size="lg" />
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-8 w-16 cursor-pointer rounded border border-border bg-transparent"
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="#RRGGBB"
        className="w-24 rounded-md border border-border px-2 py-1 text-sm text-text focus:border-primary focus:outline-none"
        pattern="^#[0-9A-Fa-f]{6}$"
      />
    </div>
  )
}
