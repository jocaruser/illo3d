import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders with id and type', () => {
    render(<Input id="email" type="email" />);
    const input = screen.getByLabelText('email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input id="x" onChange={onChange} />);
    const input = screen.getByLabelText('x');
    await user.type(input, 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
