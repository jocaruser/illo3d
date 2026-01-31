import { NavLayout } from '../layouts/NavLayout';
import { VerticalCenteredLayout } from '../layouts/VerticalCenteredLayout';
import { HorizontalCenteredLayout } from '../layouts/HorizontalCenteredLayout';
import { BoxLayout } from '../layouts/BoxLayout';
import { ListLayout } from '../layouts/ListLayout';
import { InputLayout } from '../layouts/InputLayout';
import { Button } from '../atoms/Button';
import styles from './LoginPage.module.css';

export function LoginPage() {
  function onGoogleLogin() {
    // TODO: Google OAuth
  }

  return (
    <>
      <NavLayout />
      <VerticalCenteredLayout>
        <HorizontalCenteredLayout>
          <BoxLayout>
            <ListLayout>
              <h1 className={styles.heading}>Log in</h1>
              <InputLayout>
                <Button onClick={onGoogleLogin}>
                  Log in with Google (placeholder)
                </Button>
              </InputLayout>
            </ListLayout>
          </BoxLayout>
        </HorizontalCenteredLayout>
      </VerticalCenteredLayout>
    </>
  );
}
