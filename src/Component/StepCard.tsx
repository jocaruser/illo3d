import type { ReactNode } from 'react'
import { CheckIcon } from '@heroicons/react/20/solid'
import { cx } from '@/Component/cx'

export interface StepStatusStyle {
  container: string
  showCheckIcon?: boolean
}

export type StepStatusConfig = Record<string, StepStatusStyle>

interface StepCardProps {
  label: string
  status: string
  statusConfig: StepStatusConfig
  detail?: string
  icon?: ReactNode
  pulse?: boolean
}

const fallbackStyle: StepStatusStyle = {
  container: 'border-border bg-surface-elevated text-text-muted',
}

export function StepCard({
  label,
  status,
  statusConfig,
  detail,
  icon,
  pulse = false,
}: StepCardProps) {
  const style = statusConfig[status] ?? fallbackStyle
  return (
    <div className={cx('rounded-md border p-3 text-sm', style.container, pulse && 'animate-pulse')}>
      <div className="flex items-center gap-2">
        {icon}
        {style.showCheckIcon === true && (
          <CheckIcon data-testid="step-check-icon" className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span className="font-medium">{label}</span>
      </div>
      {detail !== undefined && <p className="mt-1 text-xs opacity-80">{detail}</p>}
    </div>
  )
}
