import { describe, it, expect } from 'vitest'
import { formatTagNameTitleCase } from './tagNameFormat'

describe('formatTagNameTitleCase', () => {
  it('capitalizes first letter of each word and lowercases the rest', () => {
    expect(formatTagNameTitleCase('WHOLESALE vip')).toBe('Wholesale Vip')
  })

  it('trims and collapses whitespace between words', () => {
    expect(formatTagNameTitleCase('  a  B  c  ')).toBe('A B C')
  })

  it('returns empty string for blank input', () => {
    expect(formatTagNameTitleCase('   ')).toBe('')
  })

  it('handles single word', () => {
    expect(formatTagNameTitleCase('vip')).toBe('Vip')
  })
})
