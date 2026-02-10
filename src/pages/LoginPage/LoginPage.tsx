import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { VerticalCenteredLayout } from '../../layouts/VerticalCenteredLayout';
import { HorizontalCenteredLayout } from '../../layouts/HorizontalCenteredLayout';
import { BoxLayout } from '../../layouts/BoxLayout';
import { ListLayout } from '../../layouts/ListLayout';
import { InputLayout } from '../../layouts/InputLayout';
import { Button } from '../../atoms/Button';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  function onPlaceholderLogin() {
    login('dummy');
    navigate('/');
  }

  return (
    <VerticalCenteredLayout>
      <HorizontalCenteredLayout>
        <BoxLayout>
          <ListLayout>
            <h1 className={styles.heading}>{t('auth.logIn')}</h1>
            <InputLayout>
              <Button variant="primary" onClick={onPlaceholderLogin}>
                {t('auth.logInPlaceholder')}
              </Button>
            </InputLayout>
          </ListLayout>
        </BoxLayout>
      </HorizontalCenteredLayout>
    </VerticalCenteredLayout>
  );
}
