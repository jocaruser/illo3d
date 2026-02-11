import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDrive } from '../../contexts/DriveContext';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../../atoms/Button';
import { NavLayout } from '../NavLayout';
import styles from './AppLayout.module.css';

const navItems = [
  { to: '/', labelKey: 'nav.home' as const },
  { to: '/inventory', labelKey: 'nav.inventory' as const },
  { to: '/budget', labelKey: 'nav.budget' as const },
];

export function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { clearDriveAccess } = useDrive();
  const { t } = useI18n();
  const navigate = useNavigate();

  function onLogout() {
    clearDriveAccess();
    logout();
    navigate('/login');
  }

  const themeLabel = theme === 'light' ? t('theme.dark') : t('theme.light');

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <NavLayout>
          <h1>{t('app.title')}</h1>
          <ul className={styles.navLinks}>
            {navItems.map(({ to, labelKey }) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => (isActive ? styles.active : '')} end={to === '/'}>
                  {t(labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
          <Button variant="default" size="md" onClick={onLogout}>
            {t('nav.logOut')}
          </Button>
          <Button
            type="button"
            variant="default"
            size="md"
            onClick={toggleTheme}
            aria-label={t('nav.themeSwitch', { theme: themeLabel })}
          >
            {themeLabel}
          </Button>
        </NavLayout>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
