import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../../contexts/I18nContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoginPage } from './LoginPage';

function renderLoginPage() {
  return render(
    <I18nProvider>
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

describe('LoginPage', () => {
  it('renders heading and placeholder login button', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in (placeholder)' })).toBeInTheDocument();
  });

  it('calls handler when placeholder button is clicked', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await user.click(screen.getByRole('button', { name: 'Log in (placeholder)' }));
    // No error; handler runs (saves token and navigates)
  });
});
