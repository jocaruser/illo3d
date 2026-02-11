import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';
import { I18nProvider } from '../../contexts/I18nContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoginPage } from './LoginPage';

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GoogleLogin: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (r: { credential?: string }) => void;
    onError: () => void;
  }) => (
    <button
      type="button"
      onClick={() => onSuccess({ credential: 'mock-google-token' })}
      onKeyDown={() => onError()}
    >
      Sign in with Google
    </button>
  ),
  googleLogout: vi.fn(),
}));

function renderLoginPage() {
  return render(
    <I18nProvider>
      <PrimeReactProvider>
        <AuthProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </PrimeReactProvider>
    </I18nProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.removeItem('illo3d-token');
    mockNavigate.mockClear();
  });

  it('renders heading and Sign in with Google button when client ID is set', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
  });

  it('calls login with credential and navigates to / when Google sign-in succeeds', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(localStorage.getItem('illo3d-token')).toBe('mock-google-token');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
