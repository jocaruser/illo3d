import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerticalCenteredLayout } from './VerticalCenteredLayout';

describe('VerticalCenteredLayout', () => {
  it('renders children', () => {
    render(<VerticalCenteredLayout>Content</VerticalCenteredLayout>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
