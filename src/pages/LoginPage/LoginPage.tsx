import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { VerticalCenteredLayout } from '../../layouts/VerticalCenteredLayout';
import { HorizontalCenteredLayout } from '../../layouts/HorizontalCenteredLayout';
import { BoxLayout } from '../../layouts/BoxLayout';
import { ListLayout } from '../../layouts/ListLayout';
import { InputLayout } from '../../layouts/InputLayout';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  function onSuccess(credentialResponse: { credential?: string }) {
    setError(null);
    const token = credentialResponse.credential;
    if (token) {
      login(token);
      navigate('/');
    }
  }

  function onError() {
    setError(t('auth.errorSignIn'));
  }

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
            <InputLayout>
              <GoogleLogin
                onSuccess={onSuccess}
                onError={onError}
                text="signin_with"
                size="large"
              />
            </InputLayout>
            {error && <p className={styles.error} role="alert">{error}</p>}
          </ListLayout>
        </BoxLayout>
      </HorizontalCenteredLayout>
    </VerticalCenteredLayout>
  );
}
