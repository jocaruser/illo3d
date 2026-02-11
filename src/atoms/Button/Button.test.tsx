import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimeReactProvider } from 'primereact/api';
import { Button } from './Button';

function renderWithProvider(ui: React.ReactElement) {
  return render(<PrimeReactProvider>{ui}</PrimeReactProvider>);
}

describe('Button', () => {
  it('renders children', () => {
    renderWithProvider(<Button>Log in</Button>);
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProvider(<Button onClick={onClick}>Submit</Button>);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProvider(
      <Button onClick={onClick} disabled>
        Submit
      </Button>
    );
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders with variant and size props', () => {
    const { container } = renderWithProvider(
      <Button variant="primary" size="lg">
        Save
      </Button>
    );
    const btn = container.querySelector('button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('defaults to type button and renders', () => {
    renderWithProvider(<Button>OK</Button>);
    const btn = screen.getByRole('button', { name: 'OK' });
    expect(btn).toHaveAttribute('type', 'button');
  });
});
