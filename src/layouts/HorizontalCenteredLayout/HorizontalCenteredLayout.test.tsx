import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HorizontalCenteredLayout } from './HorizontalCenteredLayout';

describe('HorizontalCenteredLayout', () => {
  it('renders children', () => {
    render(<HorizontalCenteredLayout>Content</HorizontalCenteredLayout>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
