type RelativeTimeResult = {
  text: string
  absolute: string
}

export function formatRelativeTime(isoString: string): RelativeTimeResult {
  const now = Date.now()
  const then = Date.parse(isoString)

  if (Number.isNaN(then)) {
    return { text: isoString, absolute: isoString }
  }

  const diffMs = now - then
  const absDiffMs = Math.abs(diffMs)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const absDate = new Date(then)

  const absolute = absDate.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  if (absDiffMs < 60_000) {
    return { text: 'just now', absolute }
  }

  if (absDiffMs < 3_600_000) {
    const minutes = Math.round(absDiffMs / 60_000)
    return { text: rtf.format(-minutes, 'minute'), absolute }
  }

  if (absDiffMs < 86_400_000) {
    const hours = Math.round(absDiffMs / 3_600_000)
    return { text: rtf.format(-hours, 'hour'), absolute }
  }

  if (absDiffMs < 604_800_000) {
    const days = Math.round(absDiffMs / 86_400_000)
    return { text: rtf.format(-days, 'day'), absolute }
  }

  if (absDiffMs < 2_592_000_000) {
    const weeks = Math.round(absDiffMs / 604_800_000)
    return { text: rtf.format(-weeks, 'week'), absolute }
  }

  const nowDate = new Date(now)
  const months =
    (nowDate.getFullYear() - absDate.getFullYear()) * 12 +
    (nowDate.getMonth() - absDate.getMonth())

  if (months < 12) {
    return { text: rtf.format(-months, 'month'), absolute }
  }

  const years = Math.floor(months / 12)
  return { text: rtf.format(-years, 'year'), absolute }
}
