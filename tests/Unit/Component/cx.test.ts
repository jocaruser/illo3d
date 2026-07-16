import { cx } from '@/Component/cx'

describe('cx', () => {
  it('joins truthy segments with spaces', () => {
    expect(cx('a', 'b')).toBe('a b')
  })

  it('drops false and undefined segments', () => {
    expect(cx('a', false, undefined, 'b')).toBe('a b')
  })

  it('returns an empty string for no segments', () => {
    expect(cx()).toBe('')
  })
})
