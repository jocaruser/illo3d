import { useState, type ReactNode, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

interface TagTooltipProps {
  /** Tag names to list. An empty list renders `children` with no tooltip at all. */
  tags: string[]
  children: ReactNode
  testId?: string
}

interface TooltipAnchor {
  top: number
  left: number
}

/**
 * Instant tag tooltip for table cells. Rendered into a body portal with fixed
 * positioning so it escapes the table's `overflow-x-auto` clipping, and shown
 * on hover *and* keyboard focus.
 */
export function TagTooltip({ tags, children, testId }: TagTooltipProps) {
  const { t } = useTranslation()
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null)

  const show = (event: SyntheticEvent<HTMLSpanElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 6, left: rect.left })
  }
  const hide = () => setAnchor(null)

  if (tags.length === 0) {
    return <span data-testid={testId}>{children}</span>
  }

  return (
    <span
      data-testid={testId}
      className="inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {anchor !== null &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: `${anchor.top}px`, left: `${anchor.left}px` }}
            className="pointer-events-none fixed z-50 max-w-xs rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs text-text shadow-lg"
          >
            {t('clients.tagsTooltip', { list: tags.join(', ') })}
          </span>,
          document.body
        )}
    </span>
  )
}
