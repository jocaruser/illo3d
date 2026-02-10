import { useI18n } from '../../contexts/I18nContext';

export function InventoryPage() {
  const { t } = useI18n();
  return (
    <main>
      <h2>{t('inventory.title')}</h2>
      <p>{t('inventory.description')}</p>
    </main>
  );
}
