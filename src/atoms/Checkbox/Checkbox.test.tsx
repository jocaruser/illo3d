import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimeReactProvider } from 'primereact/api';
import { Checkbox } from './Checkbox';

function renderWithProvider(ui: React.ReactElement) {
  return render(<PrimeReactProvider>{ui}</PrimeReactProvider>);
}

describe('Checkbox', () => {
  it('renders and associates with label via id', () => {
    renderWithProvider(
      <>
        <label htmlFor="cb1">Accept</label>
        <Checkbox id="cb1" checked={false} onChange={() => {}} />
      </>
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Accept' });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('reflects checked state', () => {
    renderWithProvider(<Checkbox id="cb2" checked={true} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange with new value when toggled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProvider(<Checkbox id="cb3" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProvider(<Checkbox id="cb4" checked={false} onChange={onChange} disabled />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
