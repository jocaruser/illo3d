import { screen } from '@testing-library/react'
import { AuditActionPill } from '@/Component/audit/AuditActionPill'
import type { AuditAction } from '@/Entity/AuditEntry'
import { renderRoute } from '../../helpers/workbookTestBed'

describe('AuditActionPill', () => {
  it.each<[AuditAction, string, string]>([
    ['create', 'Create', 'bg-success/15 text-success'],
    ['restore', 'Restore', 'bg-success/15 text-success'],
    ['update', 'Update', 'bg-primary/15 text-primary'],
    ['archive', 'Archive', 'bg-danger/15 text-danger'],
    ['delete', 'Delete', 'bg-danger/15 text-danger'],
    ['migration', 'Migration', 'bg-surface-alt text-text-muted'],
  ])('renders %s as "%s" with its tone', (action, label, classes) => {
    renderRoute(<AuditActionPill action={action} />)

    const pill = screen.getByText(label)
    for (const className of classes.split(' ')) {
      expect(pill).toHaveClass(className)
    }
  })

  it('falls back to a neutral pill for an action the log cannot name', () => {
    renderRoute(<AuditActionPill action={'' as AuditAction} />)

    const pill = screen.getByText('Unknown')
    expect(pill).toHaveClass('bg-surface-alt')
    expect(pill).toHaveClass('text-text-muted')
  })
})
