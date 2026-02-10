import { useI18n } from '../../contexts/I18nContext';

export function HomePage() {
  const { t } = useI18n();
  return (
    <main>
      <h2>{t('home.title')}</h2>
      <p>{t('home.description')}</p>
    </main>
  );
}
