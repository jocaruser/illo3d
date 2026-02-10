import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InputLayout } from './InputLayout';

describe('InputLayout', () => {
  it('renders children', () => {
    render(<InputLayout>Field</InputLayout>);
    expect(screen.getByText('Field')).toBeInTheDocument();
  });
});
