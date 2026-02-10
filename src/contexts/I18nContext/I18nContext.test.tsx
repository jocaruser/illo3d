import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider, useI18n } from './I18nContext';

function Consumer() {
  const { t, locale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="home">{t('nav.home')}</span>
      <span data-testid="interpolated">{t('nav.themeSwitch', { theme: 'dark' })}</span>
    </div>
  );
}

describe('I18nContext', () => {
  it('provides default locale en and t returns en strings', () => {
    render(
      <I18nProvider>
        <Consumer />
      </I18nProvider>
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('home')).toHaveTextContent('Home');
    expect(screen.getByTestId('interpolated')).toHaveTextContent('Switch to dark theme');
  });

  it('t returns key when key is missing', () => {
    function MissingKeyConsumer() {
      const { t: tFn } = useI18n();
      return <span data-testid="missing">{tFn('missing.key')}</span>;
    }
    render(
      <I18nProvider>
        <MissingKeyConsumer />
      </I18nProvider>
    );
    expect(screen.getByTestId('missing')).toHaveTextContent('missing.key');
  });

  it('useI18n throws when used outside I18nProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow('useI18n must be used within I18nProvider');
    spy.mockRestore();
  });
});
