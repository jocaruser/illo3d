import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { NavLayout } from './NavLayout';
import styles from './AppLayout.module.css';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/budget', label: 'Budget' },
];

export function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <NavLayout>
          <h1>ILLO 3D</h1>
          <ul className={styles.navLinks}>
            {navItems.map(({ to, label }) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => (isActive ? styles.active : '')} end={to === '/'}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onLogout}>
            Log out
          </button>
          <button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </NavLayout>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
