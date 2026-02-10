import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { VerticalCenteredLayout } from '../layouts/VerticalCenteredLayout';
import { HorizontalCenteredLayout } from '../layouts/HorizontalCenteredLayout';
import { BoxLayout } from '../layouts/BoxLayout';
import { ListLayout } from '../layouts/ListLayout';
import { InputLayout } from '../layouts/InputLayout';
import { Button } from '../atoms/Button';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
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
            <h1 className={styles.heading}>Log in</h1>
            <InputLayout>
              <Button onClick={onPlaceholderLogin}>
                Log in (placeholder)
              </Button>
            </InputLayout>
          </ListLayout>
        </BoxLayout>
      </HorizontalCenteredLayout>
    </VerticalCenteredLayout>
  );
}
