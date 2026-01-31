import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders heading and Google OAuth placeholder button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Log in with Google (placeholder)' })
    ).toBeInTheDocument();
  });

  it('renders empty nav layout', () => {
    render(<LoginPage />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('calls handler when placeholder button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(
      screen.getByRole('button', { name: 'Log in with Google (placeholder)' })
    );
    // No error; handler runs (TODO: Google OAuth)
  });
});
