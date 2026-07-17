import { useEffect, useState } from 'react'
import { CheckIcon } from '@heroicons/react/20/solid'

/** Deliberate friction: a beat to reconsider the backup answer before migrating. */
export const COOLDOWN_MS = 5000

/** Ring refresh rate — smooth enough to read as motion, cheap enough to ignore. */
const TICK_MS = 50

const RADIUS = 8
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface CooldownContinueButtonProps {
  label: string
  /**
   * null while there is nothing to run — the backup question is unanswered, so
   * the cooldown has not begun. Non-null is what makes the button eligible.
   */
  onClick: (() => void) | null
  /**
   * Restarts the cooldown whenever it changes: a new answer deserves a new
   * beat to reconsider.
   */
  resetKey: string
  busy?: boolean
}

export function CooldownContinueButton({
  label,
  onClick,
  resetKey,
  busy = false,
}: CooldownContinueButtonProps) {
  const [elapsed, setElapsed] = useState(0)
  const ready = onClick !== null

  useEffect(() => {
    setElapsed(0)
    if (!ready) return

    const startedAt = Date.now()
    const timer = setInterval(() => {
      setElapsed(Date.now() - startedAt)
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [ready, resetKey])

  const cooling = ready && elapsed < COOLDOWN_MS
  const progress = Math.min(elapsed / COOLDOWN_MS, 1)

  return (
    <button
      type="button"
      data-testid="wizard-migration-continue"
      className="btn-primary"
      disabled={!ready || cooling || busy}
      onClick={onClick ?? undefined}
    >
      {ready &&
        (cooling ? (
          <ProgressRing progress={progress} />
        ) : (
          <CheckIcon
            data-testid="wizard-cooldown-check"
            className="h-4 w-4"
            aria-hidden="true"
          />
        ))}
      <span>{label}</span>
    </button>
  )
}

function ProgressRing({ progress }: { progress: number }) {
  return (
    <svg
      data-testid="wizard-cooldown-ring"
      className="h-4 w-4 -rotate-90"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r={RADIUS}
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-25"
      />
      <circle
        cx="10"
        cy="10"
        r={RADIUS}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
      />
    </svg>
  )
}
