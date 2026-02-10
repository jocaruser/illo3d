import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.setItem('illo3d-token', 'dummy');
  });

  it('renders app heading when logged in', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'ILLO 3D' })).toBeInTheDocument();
  });
});
