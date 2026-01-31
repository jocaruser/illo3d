import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavLayout } from './NavLayout';

describe('NavLayout', () => {
  it('renders nav element', () => {
    render(<NavLayout />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(<NavLayout>Link</NavLayout>);
    expect(screen.getByRole('navigation')).toHaveTextContent('Link');
  });
});
