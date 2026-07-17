import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '@/Component/formatRelativeTime'

interface RelativeTimeProps {
  value: string
}

export function RelativeTime({ value }: RelativeTimeProps) {
  const { i18n } = useTranslation()
  const { text, absolute } = formatRelativeTime(value, i18n.language)
  return <time title={absolute}>{text}</time>
}
