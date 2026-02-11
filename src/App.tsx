import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PrimeReactProvider } from 'primereact/api';
import lightThemeUrl from 'primereact/resources/themes/lara-light-blue/theme.css?url';
import darkThemeUrl from 'primereact/resources/themes/lara-dark-blue/theme.css?url';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { I18nProvider } from './contexts/I18nContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DriveProvider } from './contexts/DriveContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { InventoryPage } from './pages/InventoryPage';
import { BudgetPage } from './pages/BudgetPage';
import { LoginPage } from './pages/LoginPage';

function PrimeReactThemeLink() {
  const { theme } = useTheme();
  return <link rel="stylesheet" href={theme === 'dark' ? darkThemeUrl : lightThemeUrl} />;
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={isLoggedIn ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<HomePage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <PrimeReactThemeLink />
        <PrimeReactProvider>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
            <AuthProvider>
              <DriveProvider>
                <InventoryProvider>
                  <BrowserRouter>
                    <AppRoutes />
                  </BrowserRouter>
                </InventoryProvider>
              </DriveProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </PrimeReactProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
