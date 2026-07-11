import type { ReactNode } from 'react'

export interface StatusVisual {
  bg: string
  text: string
  iconBg: string
  iconColor: string
  showCheckIcon?: boolean
  pulse?: boolean
}

export interface StepCardProps {
  icon: ReactNode
  label: string
  status: string
  detail?: string
  statusConfig: Record<string, StatusVisual>
}

export function StepCard({
  icon,
  label,
  status,
  detail,
  statusConfig,
}: StepCardProps) {
  const visual = statusConfig[status]
  const pulseClass = visual?.pulse ? 'animate-pulse' : ''

  return (
    <div
      className={`rounded-lg border px-2.5 py-2 ${visual?.bg ?? 'bg-gray-100'} ${pulseClass}`}
      style={{ borderColor: 'transparent' }}
      aria-label={`${label}: ${status}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${visual?.iconBg ?? 'bg-gray-300'}`}
        >
          {visual?.showCheckIcon ? (
            <svg
              className={`h-3 w-3 ${visual?.iconColor ?? 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className={`h-3.5 w-3.5 ${visual?.iconColor ?? 'text-gray-400'}`}>
              {icon}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className={`block truncate text-xs font-medium ${visual?.text ?? 'text-gray-400'}`}>
            {label}
          </span>
          {detail && (
            <span className={`block truncate text-[10px] ${visual?.text ?? 'text-gray-400'} opacity-70`}>
              {detail}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
