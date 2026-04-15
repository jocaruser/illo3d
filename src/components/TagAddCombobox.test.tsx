import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagAddCombobox } from './TagAddCombobox'
import type { Tag } from '@/types/money'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

function tag(id: string, name: string): Tag {
  return { id, name, created_at: '' }
}

describe('TagAddCombobox', () => {
  const onCommit = vi.fn()

  beforeEach(() => {
    onCommit.mockReset()
    onCommit.mockResolvedValue(undefined)
  })

  it('opens scrollable listbox with all linkable tags on first focus', async () => {
    const user = userEvent.setup()
    const suggestions = [
      tag('TG1', 'Alpha'),
      tag('TG2', 'Beta'),
      tag('TG3', 'Gamma'),
      tag('TG4', 'Delta'),
      tag('TG5', 'Epsilon'),
    ]
    render(
      <TagAddCombobox
        allTags={suggestions}
        suggestionTags={suggestions}
        onCommit={onCommit}
      />,
    )

    await user.click(screen.getByTestId('client-tag-add-input'))

    const list = screen.getByTestId('client-tag-add-listbox')
    expect(list).toHaveClass('max-h-48')
    expect(list).toHaveClass('overflow-y-auto')
    expect(screen.getAllByRole('option')).toHaveLength(5)
  })

  it('filters options while typing', async () => {
    const user = userEvent.setup()
    const suggestions = [
      tag('TG1', 'Wholesale'),
      tag('TG2', 'Retail'),
      tag('TG3', 'Wholesale VIP'),
    ]
    render(
      <TagAddCombobox
        allTags={suggestions}
        suggestionTags={suggestions}
        onCommit={onCommit}
      />,
    )

    await user.click(screen.getByTestId('client-tag-add-input'))
    await user.type(screen.getByTestId('client-tag-add-input'), 'wholesale')

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('Wholesale')
    expect(options[1]).toHaveTextContent('Wholesale Vip')
  })

  it('reuses existing tag by name when Add is used without picking an option', async () => {
    const user = userEvent.setup()
    const all = [tag('TG1', 'VIP'), tag('TG2', 'Other')]
    render(
      <TagAddCombobox
        allTags={all}
        suggestionTags={all}
        onCommit={onCommit}
      />,
    )

    await user.type(screen.getByTestId('client-tag-add-input'), '  vip  ')
    await user.click(screen.getByTestId('client-tag-add-submit'))

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith({ type: 'link', tagId: 'TG1' })
  })

  it('commits create when name does not match any existing tag', async () => {
    const user = userEvent.setup()
    const all = [tag('TG1', 'VIP')]
    render(
      <TagAddCombobox
        allTags={all}
        suggestionTags={all}
        onCommit={onCommit}
      />,
    )

    await user.type(screen.getByTestId('client-tag-add-input'), 'Brand new')
    await user.click(screen.getByTestId('client-tag-add-submit'))

    expect(onCommit).toHaveBeenCalledWith({
      type: 'create',
      name: 'Brand new',
    })
  })

  it('selects highlighted option with Enter', async () => {
    const user = userEvent.setup()
    const suggestions = [tag('TG1', 'A'), tag('TG2', 'B')]
    render(
      <TagAddCombobox
        allTags={suggestions}
        suggestionTags={suggestions}
        onCommit={onCommit}
      />,
    )

    await user.click(screen.getByTestId('client-tag-add-input'))
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    expect(onCommit).toHaveBeenCalledWith({ type: 'link', tagId: 'TG2' })
  })

  it('commits link when an option is clicked', async () => {
    const user = userEvent.setup()
    const suggestions = [tag('TG1', 'Pick me')]
    render(
      <TagAddCombobox
        allTags={suggestions}
        suggestionTags={suggestions}
        onCommit={onCommit}
      />,
    )

    await user.click(screen.getByTestId('client-tag-add-input'))
    await user.click(screen.getByTestId('client-tag-add-option-TG1'))

    expect(onCommit).toHaveBeenCalledWith({ type: 'link', tagId: 'TG1' })
  })

  it('does not render listbox when there are no suggestion tags', async () => {
    const user = userEvent.setup()
    render(
      <TagAddCombobox
        allTags={[tag('TG1', 'Only')]}
        suggestionTags={[]}
        onCommit={onCommit}
      />,
    )

    await user.click(screen.getByTestId('client-tag-add-input'))
    expect(screen.queryByTestId('client-tag-add-listbox')).toBeNull()
  })
})
