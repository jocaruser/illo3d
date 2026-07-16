import type { ReactNode } from 'react'

interface ColoredNumberProps {
  value: number
  forceRed?: boolean
  children?: ReactNode
}

export function ColoredNumber({ value, forceRed = false, children }: ColoredNumberProps) {
  const colorClass =
    forceRed || value < 0 ? 'text-danger' : value > 0 ? 'text-success' : 'text-text-muted'
  return <span className={colorClass}>{children ?? value}</span>
}
