import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RowDiffCard } from '@/Component/save/RowDiffCard'
import type { EntityManager } from '@/Repository/EntityManager'
import type { RowDiff } from '@/Service/SaveReview/saveDiff'
import { createTestEm, FakeTabs } from '../../helpers/workbookTestBed'
import { renderWithProviders } from '../helpers/renderWithProviders'

const mocks = vi.hoisted(() => ({ em: null as unknown as EntityManager }))
vi.mock('@/Hook/useEntityManager', () => ({ useEntityManager: () => mocks.em }))

beforeEach(() => {
  const tabs = new FakeTabs()
  tabs.seed('clients', { id: 'CL1', name: 'Acme Ltd' })
  mocks.em = createTestEm(tabs)
})

function modifiedRow(): RowDiff {
  return {
    entityName: 'client',
    entityId: 'CL1',
    sheet: 'clients',
    action: 'modified',
    fields: [
      { column: 'id', before: 'CL1', after: 'CL1', changed: false },
      { column: 'name', before: 'Acme', after: 'Acme Ltd', changed: true },
      { column: 'email', before: '', after: '', changed: false },
    ],
    changedCount: 1,
    beforeJson: '{"id":"CL1","name":"Acme"}',
    afterJson: '{"id":"CL1","name":"Acme Ltd"}',
  }
}

describe('RowDiffCard', () => {
  it('shows the changed field as a red/green pair and hides the rest', () => {
    renderWithProviders(<RowDiffCard row={modifiedRow()} showUnchanged={false} />)

    const card = screen.getByTestId('row-diff-clients-CL1')
    expect(within(card).getByText('name')).toBeInTheDocument()
    expect(within(card).getByText('Acme')).toBeInTheDocument()
    expect(within(card).queryByText('email')).not.toBeInTheDocument()
    expect(within(card).queryByText('id')).not.toBeInTheDocument()
    expect(within(card).getByText('Update')).toBeInTheDocument()
  })

  it('reveals unchanged fields on demand', () => {
    renderWithProviders(<RowDiffCard row={modifiedRow()} showUnchanged={true} />)

    const card = screen.getByTestId('row-diff-clients-CL1')
    expect(within(card).getByText('email')).toBeInTheDocument()
    expect(within(card).getByText('id')).toBeInTheDocument()
  })

  it('links the row to its entity page', () => {
    renderWithProviders(<RowDiffCard row={modifiedRow()} showUnchanged={false} />)

    expect(screen.getByRole('link', { name: 'Acme Ltd' })).toHaveAttribute(
      'href',
      '/clients/CL1'
    )
  })

  it('offers a revert per changed field and reports the stored value', async () => {
    const onRevertField = vi.fn()
    renderWithProviders(
      <RowDiffCard row={modifiedRow()} showUnchanged={false} onRevertField={onRevertField} />
    )

    await userEvent.click(screen.getByTestId('revert-clients-CL1-name'))

    expect(onRevertField).toHaveBeenCalledWith('name', 'Acme')
  })

  it('offers no revert without a handler', () => {
    renderWithProviders(<RowDiffCard row={modifiedRow()} showUnchanged={false} />)

    expect(screen.queryByTestId('revert-clients-CL1-name')).not.toBeInTheDocument()
  })

  it('shows a created row as additions only, without reverts', () => {
    const row: RowDiff = {
      entityName: 'tag',
      entityId: 'TG1',
      sheet: 'tags',
      action: 'created',
      fields: [{ column: 'name', before: '', after: 'Vip', changed: true }],
      changedCount: 1,
      beforeJson: '',
      afterJson: '{"id":"TG1","name":"Vip"}',
    }
    renderWithProviders(
      <RowDiffCard row={row} showUnchanged={false} onRevertField={vi.fn()} />
    )

    const card = screen.getByTestId('row-diff-tags-TG1')
    expect(within(card).getByText('Create')).toBeInTheDocument()
    expect(within(card).queryByText('—')).not.toBeInTheDocument()
    expect(screen.queryByTestId('revert-tags-TG1-name')).not.toBeInTheDocument()
  })

  it('shows a deleted row as removals only, without reverts', () => {
    const row: RowDiff = {
      entityName: 'tag_link',
      entityId: 'TL1',
      sheet: 'tag_links',
      action: 'deleted',
      fields: [{ column: 'tag_id', before: 'TG1', after: '', changed: true }],
      changedCount: 1,
      beforeJson: '{"id":"TL1","tag_id":"TG1"}',
      afterJson: '',
    }
    renderWithProviders(
      <RowDiffCard row={row} showUnchanged={false} onRevertField={vi.fn()} />
    )

    const card = screen.getByTestId('row-diff-tag_links-TL1')
    expect(within(card).getByText('Delete')).toBeInTheDocument()
    expect(screen.queryByTestId('revert-tag_links-TL1-tag_id')).not.toBeInTheDocument()
  })
})
