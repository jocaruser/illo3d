import { describe, expect, it } from 'vitest'
import { nextId } from '@/Service/IdGenerator'

describe('nextId', () => {
  it('starts at 1 for an empty sheet', () => {
    expect(nextId('CL', [])).toBe('CL1')
  })

  it('increments the highest numeric suffix for the prefix', () => {
    expect(nextId('J', ['J1', 'J7', 'J3'])).toBe('J8')
  })

  it('ignores other prefixes, malformed ids and whitespace', () => {
    expect(nextId('CL', ['CL2', 'CN9', 'CLx', 'CL', ' CL4 ', ''])).toBe('CL5')
  })

  it('does not treat the prefix as a regex', () => {
    expect(nextId('P', ['P2', 'PI9'])).toBe('P3')
  })
})
