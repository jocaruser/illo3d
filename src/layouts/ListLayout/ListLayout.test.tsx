import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListLayout } from './ListLayout';

describe('ListLayout', () => {
  it('renders children', () => {
    render(
      <ListLayout>
        <span>A</span>
        <span>B</span>
      </ListLayout>
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
