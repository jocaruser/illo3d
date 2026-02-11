import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useDrive } from '../../contexts/DriveContext';
import { useInventory } from '../../contexts/InventoryContext';
import { Button } from '../../atoms/Button';
import { readDatabase, saveDatabase, buildDatabaseFromInventory } from '../../services/driveApi';

export function HomePage() {
  const { t } = useI18n();
  const {
    driveAccessToken,
    driveError,
    isDriveReady,
    lastLoadedDatabase,
    setLastLoadedDatabase,
    clearDriveError,
  } = useDrive();
  const { printers, filaments, consumables, loadFromDatabase } = useInventory();
  const [driveMessage, setDriveMessage] = useState<string | null>(null);
  const [driveLoading, setDriveLoading] = useState(false);

  async function handleLoad() {
    if (!driveAccessToken) return;
    setDriveLoading(true);
    setDriveMessage(null);
    clearDriveError();
    try {
      const db = await readDatabase(driveAccessToken);
      loadFromDatabase(db);
      setLastLoadedDatabase(db);
      setDriveMessage(t('drive.loadSuccess'));
    } catch (err) {
      setDriveMessage(err instanceof Error ? err.message : t('drive.error'));
    } finally {
      setDriveLoading(false);
    }
  }

  async function handleSave() {
    if (!driveAccessToken) return;
    setDriveLoading(true);
    setDriveMessage(null);
    clearDriveError();
    try {
      const db = buildDatabaseFromInventory(
        printers,
        filaments,
        consumables,
        lastLoadedDatabase ?? undefined
      );
      await saveDatabase(driveAccessToken, db);
      setLastLoadedDatabase(db);
      setDriveMessage(t('drive.saveSuccess'));
    } catch (err) {
      setDriveMessage(err instanceof Error ? err.message : t('drive.error'));
    } finally {
      setDriveLoading(false);
    }
  }

  return (
    <main>
      <h2>{t('home.title')}</h2>
      <p>{t('home.description')}</p>
      {isDriveReady && (
        <section aria-label="Google Drive">
          <span>{t('drive.connected')}</span>
          <Button variant="default" size="md" onClick={handleLoad} disabled={driveLoading}>
            {t('drive.load')}
          </Button>
          <Button variant="default" size="md" onClick={handleSave} disabled={driveLoading}>
            {t('drive.save')}
          </Button>
          {driveError && (
            <p role="alert">
              {t('drive.error')}: {driveError}
            </p>
          )}
          {driveMessage && !driveError && <p role="status">{driveMessage}</p>}
        </section>
      )}
    </main>
  );
}
