import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimeReactProvider } from 'primereact/api';
import { TabsLayout } from './TabsLayout';

function renderWithProvider(ui: React.ReactElement) {
  return render(<PrimeReactProvider>{ui}</PrimeReactProvider>);
}

describe('TabsLayout', () => {
  it('renders tab headers with labels', () => {
    const tabs = [
      { id: 'a', label: 'Tab A' },
      { id: 'b', label: 'Tab B' },
    ];
    renderWithProvider(<TabsLayout activeTabId="a" onTabChange={() => {}} tabs={tabs} />);
    expect(screen.getByRole('tab', { name: 'Tab A' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab B' })).toBeInTheDocument();
  });

  it('calls onTabChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    renderWithProvider(
      <TabsLayout
        activeTabId="a"
        onTabChange={onTabChange}
        tabs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]}
      />
    );
    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(onTabChange).toHaveBeenCalledWith('b');
  });
});
