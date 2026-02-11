import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';
import { I18nProvider } from '../../contexts/I18nContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { DriveProvider } from '../../contexts/DriveContext';
import { LoginPage } from './LoginPage';

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockDriveOnSuccess = vi.hoisted(() => vi.fn());
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
  useGoogleOneTapLogin: () => {},
  useGoogleLogin: (opts: { onSuccess: (r: { access_token: string }) => void }) => {
    return () => {
      opts.onSuccess({ access_token: 'mock-drive-token' });
      mockDriveOnSuccess();
    };
  },
  googleLogout: vi.fn(),
}));

function renderLoginPage() {
  return render(
    <I18nProvider>
      <PrimeReactProvider>
        <AuthProvider>
          <DriveProvider>
            <MemoryRouter>
              <LoginPage />
            </MemoryRouter>
          </DriveProvider>
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

  it('calls login with credential, requests Drive, then navigates to / when Drive ready', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(localStorage.getItem('illo3d-token')).toBe('mock-google-token');
    expect(mockDriveOnSuccess).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
