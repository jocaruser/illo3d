import type { ClientNoteSeverity } from '@/types/money'

export const CLIENT_NOTE_SEVERITY_VALUES: readonly ClientNoteSeverity[] = [
  'info',
  'danger',
  'warning',
  'success',
  'primary',
  'secondary',
] as const

const SET = new Set<string>(CLIENT_NOTE_SEVERITY_VALUES)

export function parseClientNoteSeverity(
  raw: string | undefined
): ClientNoteSeverity | null {
  if (raw == null || raw === '') return null
  const s = raw.trim().toLowerCase()
  return SET.has(s) ? (s as ClientNoteSeverity) : null
}

export function assertClientNoteSeverity(
  raw: string | undefined
): ClientNoteSeverity {
  const s = parseClientNoteSeverity(raw)
  if (!s) {
    throw new Error(`Invalid client note severity: ${String(raw)}`)
  }
  return s
}
