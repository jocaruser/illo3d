import type { ReactNode } from 'react'

interface JobWidgetGridProps {
  children: ReactNode
}

export function JobWidgetGrid({ children }: JobWidgetGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {children}
    </div>
  )
}
