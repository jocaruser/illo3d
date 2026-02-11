import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useDrive } from '../../contexts/DriveContext';
import { useI18n } from '../../contexts/I18nContext';
import { VerticalCenteredLayout } from '../../layouts/VerticalCenteredLayout';
import { HorizontalCenteredLayout } from '../../layouts/HorizontalCenteredLayout';
import { BoxLayout } from '../../layouts/BoxLayout';
import { ListLayout } from '../../layouts/ListLayout';
import { InputLayout } from '../../layouts/InputLayout';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const { isDriveReady, requestDriveAccess, driveError, clearDriveError } = useDrive();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasRequestedDriveRef = useRef(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  function onSuccess(credentialResponse: { credential?: string }) {
    setError(null);
    clearDriveError();
    const token = credentialResponse.credential;
    if (token) {
      login(token);
      hasRequestedDriveRef.current = false;
    }
  }

  function onError() {
    setError(t('auth.errorSignIn'));
  }

  useGoogleOneTapLogin({
    onSuccess,
    onError,
    disabled: !!isLoggedIn,
  });

  useEffect(() => {
    if (!isLoggedIn || isDriveReady) return;
    if (hasRequestedDriveRef.current) return;
    hasRequestedDriveRef.current = true;
    requestDriveAccess();
  }, [isLoggedIn, isDriveReady, requestDriveAccess]);

  useEffect(() => {
    if (isLoggedIn && isDriveReady) {
      navigate('/');
    }
  }, [isLoggedIn, isDriveReady, navigate]);

  if (!clientId) {
    return (
      <VerticalCenteredLayout>
        <HorizontalCenteredLayout>
          <BoxLayout>
            <ListLayout>
              <h1 className={styles.heading}>{t('auth.logIn')}</h1>
              <p className={styles.message}>
                Configure VITE_GOOGLE_CLIENT_ID in .env to enable Sign in with Google.
              </p>
            </ListLayout>
          </BoxLayout>
        </HorizontalCenteredLayout>
      </VerticalCenteredLayout>
    );
  }

  return (
    <VerticalCenteredLayout>
      <HorizontalCenteredLayout>
        <BoxLayout>
          <ListLayout>
            <h1 className={styles.heading}>{t('auth.logIn')}</h1>
            {isLoggedIn && !isDriveReady && (
              <p className={styles.message} role="status">
                {t('drive.grantAccess')}
              </p>
            )}
            <InputLayout>
              <GoogleLogin
                onSuccess={onSuccess}
                onError={onError}
                text="signin_with"
                size="large"
              />
            </InputLayout>
            {driveError && (
              <p className={styles.error} role="alert">
                {driveError}
              </p>
            )}
            {error && <p className={styles.error} role="alert">{error}</p>}
          </ListLayout>
        </BoxLayout>
      </HorizontalCenteredLayout>
    </VerticalCenteredLayout>
  );
}
