import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntityDetailLifecycleActions } from '@/Component/detail/EntityDetailLifecycleActions'

describe('EntityDetailLifecycleActions', () => {
  it('shows edit and archive in active mode', async () => {
    const onEdit = vi.fn()
    const onArchive = vi.fn()
    render(
      <EntityDetailLifecycleActions
        mode="active"
        editLabel="Edit client"
        onEdit={onEdit}
        onArchive={onArchive}
      />
    )

    await userEvent.click(screen.getByTestId('entity-detail-edit'))
    await userEvent.click(screen.getByTestId('entity-detail-archive'))
    expect(onEdit).toHaveBeenCalledOnce()
    expect(onArchive).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('entity-detail-soft-delete')).not.toBeInTheDocument()
  })

  it('shows unarchive and soft delete in archived mode', async () => {
    const onUnarchive = vi.fn()
    const onSoftDelete = vi.fn()
    render(
      <EntityDetailLifecycleActions
        mode="archived"
        onUnarchive={onUnarchive}
        onSoftDelete={onSoftDelete}
      />
    )

    expect(screen.queryByTestId('entity-detail-edit')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId('entity-detail-unarchive'))
    await userEvent.click(screen.getByTestId('entity-detail-soft-delete'))
    expect(onUnarchive).toHaveBeenCalledOnce()
    expect(onSoftDelete).toHaveBeenCalledOnce()
  })
})
