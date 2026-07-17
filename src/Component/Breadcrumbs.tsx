import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('breadcrumb.ariaLabel')}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li
              key={`${item.to ?? ''}|${item.label}`}
              className="flex items-center gap-1"
              aria-current={isLast ? 'page' : undefined}
            >
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.to !== undefined && !isLast ? (
                <Link to={item.to} className="hover:text-text hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-text' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
