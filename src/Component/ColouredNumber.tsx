import type { ReactNode } from 'react'

interface ColouredNumberProps {
  value: number
  forceRed?: boolean
  children?: ReactNode
}

export function ColouredNumber({ value, forceRed = false, children }: ColouredNumberProps) {
  const colorClass =
    forceRed || value < 0 ? 'text-danger' : value > 0 ? 'text-success' : 'text-text-muted'
  return <span className={colorClass}>{children ?? value}</span>
}
