import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimeReactProvider } from 'primereact/api';
import { Input } from './Input';

function renderWithProvider(ui: React.ReactElement) {
  return render(<PrimeReactProvider>{ui}</PrimeReactProvider>);
}

describe('Input', () => {
  it('renders with id and type', () => {
    renderWithProvider(<Input id="email" type="email" />);
    const input = screen.getByRole('textbox', { name: 'email' });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProvider(<Input id="x" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'x' });
    await user.type(input, 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
