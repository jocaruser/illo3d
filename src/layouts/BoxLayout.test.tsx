import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoxLayout } from './BoxLayout';

describe('BoxLayout', () => {
  it('renders children', () => {
    render(<BoxLayout>Content</BoxLayout>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
