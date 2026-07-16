import type { ReactNode } from 'react'

interface ListTablePageHeaderProps {
  title: string
  search?: ReactNode
  actions?: ReactNode
}

/** Title / search / actions header for list pages; stacks below 640px. */
export function ListTablePageHeader({ title, search, actions }: ListTablePageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <h1 className="font-display text-2xl font-semibold text-text">{title}</h1>
      {search !== undefined && <div className="min-w-[12rem] flex-1">{search}</div>}
      {actions !== undefined && (
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{actions}</div>
      )}
    </header>
  )
}
