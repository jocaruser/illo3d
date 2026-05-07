import { Link } from 'react-router-dom'

interface NotFoundCardProps {
  message: string
  backTo: string
  backLabel: string
}

export function NotFoundCard({ message, backTo, backLabel }: NotFoundCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-8 py-12 text-center shadow">
      <p className="text-text-muted">{message}</p>
      <Link
        to={backTo}
        className="mt-4 inline-block text-primary hover:text-blue-800 dark:text-blue-200"
      >
        {backLabel}
      </Link>
    </div>
  )
}
