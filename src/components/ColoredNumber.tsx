import type { ReactNode } from 'react'

export interface ColoredNumberProps {
  value: number
  formatter?: (n: number) => string
  className?: string
  children?: ReactNode
  /** Force red color regardless of value (e.g. for material costs). */
  forceRed?: boolean
}

/** Renders a number in green when positive, red when zero or negative.
 *  Accepts either `value` (+ optional `formatter`) or `children` for pre-formatted text. */
export function ColoredNumber({
  value,
  formatter,
  className = '',
  children,
  forceRed = false,
}: ColoredNumberProps) {
  const colorClass = forceRed
    ? 'text-red-600 dark:text-red-400'
    : value > 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'
  const text = children ?? (formatter ? formatter(value) : String(value))
  return <span className={`${colorClass} ${className}`}>{text}</span>
}
