import { formatRelativeTime } from '@/lib/formatRelativeTime'

export interface RelativeTimeProps {
  timestamp: string
}

export function RelativeTime({ timestamp }: RelativeTimeProps) {
  const { text, absolute } = formatRelativeTime(timestamp)

  if (text === timestamp) {
    return <span>{timestamp}</span>
  }

  return (
    <time dateTime={timestamp} title={absolute}>
      {text}
    </time>
  )
}
