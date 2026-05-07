import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export interface LinkWithTagsTooltipProps {
  to?: string
  label: string
  /** Comma-separated tag labels (display + aria). */
  tagLine?: string
  dataTestid: string
  /** Optional accessible name for the link (e.g. job id column). */
  linkAriaLabel?: string
  /** i18n key for tooltip aria-label; receives `{ list }`. */
  tagsTooltipAriaKey?: string
  /** Tailwind classes for the link (default matches clients list). */
  linkClassName?: string
}

export function LinkWithTagsTooltip({
  to,
  label,
  tagLine,
  dataTestid,
  linkAriaLabel,
  tagsTooltipAriaKey = 'clients.tagsTooltip',
  linkClassName = 'text-primary hover:text-blue-800 dark:text-blue-200',
}: LinkWithTagsTooltipProps) {
  const { t } = useTranslation()
  const reactId = useId()
  const tooltipId = `${reactId}-tags-tooltip`
  const linkRef = useRef<HTMLAnchorElement | HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{
    top: number
    left: number
    maxW: number
  } | null>(null)

  const trimmedLine = tagLine?.trim() ?? ''
  const hasTags = trimmedLine.length > 0
  const tagParts = useMemo(
    () =>
      trimmedLine
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [trimmedLine],
  )

  const updatePos = useCallback(() => {
    const el = linkRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const maxW = Math.min(280, Math.max(120, vw - r.left - 16))
    setPos({ top: r.bottom + 8, left: r.left, maxW })
  }, [])

  const openTooltip = () => {
    if (!hasTags) return
    updatePos()
    setOpen(true)
  }

  const closeTooltip = () => {
    setOpen(false)
    setPos(null)
  }

  const show = open && hasTags && pos !== null

  useLayoutEffect(() => {
    if (!show) return
    updatePos()
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [show, updatePos])

  const ariaLabel = t(tagsTooltipAriaKey, { list: trimmedLine })

  if (!hasTags) {
    if (!to) {
      return (
        <span
          ref={linkRef}
          data-testid={dataTestid}
          className={linkClassName}
          aria-label={linkAriaLabel}
        >
          {label}
        </span>
      )
    }
    return (
      <Link
        ref={linkRef as React.Ref<HTMLAnchorElement>}
        to={to}
        data-testid={dataTestid}
        className={linkClassName}
        aria-label={linkAriaLabel}
      >
        {label}
      </Link>
    )
  }

  return (
    <>
      {to ? (
        <Link
          ref={linkRef as React.Ref<HTMLAnchorElement>}
          to={to}
          data-testid={dataTestid}
          className={linkClassName}
          aria-label={linkAriaLabel}
          aria-describedby={show ? tooltipId : undefined}
          onMouseEnter={openTooltip}
          onMouseLeave={closeTooltip}
          onFocus={openTooltip}
          onBlur={closeTooltip}
        >
          {label}
        </Link>
      ) : (
        <span
          ref={linkRef}
          data-testid={dataTestid}
          className={linkClassName}
          aria-label={linkAriaLabel}
          aria-describedby={show ? tooltipId : undefined}
          onMouseEnter={openTooltip}
          onMouseLeave={closeTooltip}
          onFocus={openTooltip}
          onBlur={closeTooltip}
        >
          {label}
        </span>
      )}
      {show && pos
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              aria-label={ariaLabel}
              style={{
                top: pos.top,
                left: pos.left,
                maxWidth: pos.maxW,
              }}
              className="pointer-events-none fixed z-[200] rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text shadow"
            >
              <div className="flex flex-wrap gap-1.5">
                {tagParts.map((tagName, i) => (
                  <span
                    key={`${tagName}-${i}`}
                    className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-text"
                  >
                    {tagName}
                  </span>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
