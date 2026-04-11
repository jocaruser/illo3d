import { Link } from 'react-router-dom'

export type BreadcrumbItem = {
  label: string
  to?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  ariaLabel: string
}

export function Breadcrumbs({ items, ariaLabel }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <nav aria-label={ariaLabel} className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-2">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-gray-400">
                    /
                  </span>
                ) : null}
                {isLast ? (
                  <span aria-current="page" className="font-medium text-gray-900">
                    {item.label}
                  </span>
                ) : item.to ? (
                  <Link to={item.to} className="hover:text-gray-900">
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
