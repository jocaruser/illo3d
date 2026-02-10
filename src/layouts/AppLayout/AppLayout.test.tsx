import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '../../contexts/I18nContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { AppLayout } from './AppLayout';

function renderAppLayout() {
  return render(
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<div>Home content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    localStorage.setItem('illo3d-token', 'dummy');
  });

  it('renders sidebar with ILLO 3D heading and nav links', () => {
    renderAppLayout();
    expect(screen.getByRole('heading', { name: 'ILLO 3D' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inventory' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Budget' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    renderAppLayout();
    expect(screen.getByRole('button', { name: /switch to (dark|light) theme/i })).toBeInTheDocument();
  });

  it('renders outlet content', () => {
    renderAppLayout();
    expect(screen.getByText('Home content')).toBeInTheDocument();
  });
});
