import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('@react-oauth/google', () => ({ googleLogout: vi.fn() }));

function AuthConsumer() {
  const { isLoggedIn, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="logged-in">{String(isLoggedIn)}</span>
      <button type="button" onClick={() => login('token')}>Login</button>
      <button type="button" onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.removeItem('illo3d-token');
  });

  it('provides isLoggedIn false when no token', () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
  });

  it('provides isLoggedIn true when token in localStorage', () => {
    localStorage.setItem('illo3d-token', 'dummy');
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
  });

  it('login sets token and updates isLoggedIn', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
    expect(localStorage.getItem('illo3d-token')).toBe('token');
  });

  it('logout clears token and updates isLoggedIn', async () => {
    const user = userEvent.setup();
    localStorage.setItem('illo3d-token', 'dummy');
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
    expect(localStorage.getItem('illo3d-token')).toBeNull();
  });

  it('useAuth throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });
});
