export interface RelativeTimeParts {
  text: string
  absolute: string
}

const MINUTE = 60
const HOUR = 3600
const DAY = 86400
const MONTH = 2592000 // 30 days
const YEAR = 31536000 // 365 days

/** Intl formatters are expensive to build, so cache one per language. */
const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>()
const absoluteFormatters = new Map<string, Intl.DateTimeFormat>()

function relativeFormatterFor(language: string): Intl.RelativeTimeFormat {
  let formatter = relativeFormatters.get(language)
  if (formatter === undefined) {
    formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
    relativeFormatters.set(language, formatter)
  }
  return formatter
}

function absoluteFormatterFor(language: string): Intl.DateTimeFormat {
  let formatter = absoluteFormatters.get(language)
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat(language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    absoluteFormatters.set(language, formatter)
  }
  return formatter
}

/**
 * Formats a timestamp as relative ("5 minutes ago") and absolute
 * ("Jul 9, 2026, 2:30 PM") text in the given language. Invalid input echoes
 * back in both fields.
 */
export function formatRelativeTime(
  input: string,
  language: string,
  now: Date = new Date()
): RelativeTimeParts {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return { text: input, absolute: input }
  }
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const magnitude = Math.abs(diffSeconds)
  const formatter = relativeFormatterFor(language)
  let text: string
  if (magnitude < MINUTE) text = formatter.format(diffSeconds, 'second')
  else if (magnitude < HOUR)
    text = formatter.format(Math.trunc(diffSeconds / MINUTE), 'minute')
  else if (magnitude < DAY)
    text = formatter.format(Math.trunc(diffSeconds / HOUR), 'hour')
  else if (magnitude < MONTH)
    text = formatter.format(Math.trunc(diffSeconds / DAY), 'day')
  else if (magnitude < YEAR)
    text = formatter.format(Math.trunc(diffSeconds / MONTH), 'month')
  else text = formatter.format(Math.trunc(diffSeconds / YEAR), 'year')
  const absolute = absoluteFormatterFor(language).format(date)
  return { text, absolute }
}
