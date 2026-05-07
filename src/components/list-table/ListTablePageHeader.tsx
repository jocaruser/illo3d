import type { ReactNode } from 'react'

interface ListTablePageHeaderProps {
  title: string
  search?: ReactNode
  actions?: ReactNode
}

export function ListTablePageHeader({
  title,
  search,
  actions,
}: ListTablePageHeaderProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <h2 className="text-2xl font-bold leading-none text-text">
        {title}
      </h2>

      {search && <div className="min-w-[12rem] flex-1">{search}</div>}

      <div className="ml-auto flex shrink-0 items-center gap-3">
        {actions}
      </div>
    </div>
  )
}
