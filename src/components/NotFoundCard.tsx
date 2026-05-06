import { Link } from 'react-router-dom'

interface NotFoundCardProps {
  message: string
  backTo: string
  backLabel: string
}

export function NotFoundCard({ message, backTo, backLabel }: NotFoundCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-12 text-center shadow">
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
      <Link
        to={backTo}
        className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
      >
        {backLabel}
      </Link>
    </div>
  )
}
