import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BalanceDisplay } from './BalanceDisplay'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('BalanceDisplay', () => {
  it('displays positive balance', () => {
    render(<BalanceDisplay balance={100} />)
    expect(screen.getByText('€100.00')).toBeInTheDocument()
  })

  it('displays negative balance', () => {
    render(<BalanceDisplay balance={-50} />)
    expect(screen.getByText('-€50.00')).toBeInTheDocument()
  })

  it('displays zero balance', () => {
    render(<BalanceDisplay balance={0} />)
    expect(screen.getByText('€0.00')).toBeInTheDocument()
  })
})
