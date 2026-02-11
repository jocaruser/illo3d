import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrimeReactProvider } from 'primereact/api';
import { I18nProvider } from '../../contexts/I18nContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { InventoryProvider } from '../../contexts/InventoryContext';
import { InventoryPage } from './InventoryPage';

function renderInventoryPage() {
  return render(
    <I18nProvider>
      <ThemeProvider>
        <PrimeReactProvider>
          <InventoryProvider>
            <InventoryPage />
          </InventoryProvider>
        </PrimeReactProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

describe('InventoryPage', () => {
  it('renders title and tabs', () => {
    renderInventoryPage();
    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Filaments' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Consumables' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Printers' })).toBeInTheDocument();
  });

  it('renders Add filament button when Filaments tab is active', () => {
    renderInventoryPage();
    expect(screen.getByRole('button', { name: 'Add filament' })).toBeInTheDocument();
  });
});
