export type TableViewportTier = 'always' | 'small' | 'medium' | 'wide'

/** Tailwind classes that hide a column below the tier minimum width. */
export function tableViewportTierClass(tier: TableViewportTier): string {
  switch (tier) {
    case 'always':
      return ''
    case 'small':
      return 'hidden sm:table-cell'
    case 'medium':
      return 'hidden md:table-cell'
    case 'wide':
      return 'hidden lg:table-cell'
  }
}
