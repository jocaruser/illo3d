import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders illo3d title', () => {
    render(<App />)
    expect(screen.getByText('illo3d')).toBeInTheDocument()
  })
})
