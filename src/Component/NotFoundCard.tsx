import { Link } from 'react-router-dom'
import { Card } from '@/Component/Card'

interface NotFoundCardProps {
  message: string
  backTo: string
  backLabel: string
}

export function NotFoundCard({ message, backTo, backLabel }: NotFoundCardProps) {
  return (
    <Card className="mx-auto max-w-md p-6 text-center">
      <p className="text-sm text-text-muted">{message}</p>
      <Link to={backTo} className="btn-secondary mt-4">
        {backLabel}
      </Link>
    </Card>
  )
}
