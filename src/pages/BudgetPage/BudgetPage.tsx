import { useI18n } from '../../contexts/I18nContext';

export function BudgetPage() {
  const { t } = useI18n();
  return (
    <main>
      <h2>{t('budget.title')}</h2>
      <p>{t('budget.description')}</p>
    </main>
  );
}
