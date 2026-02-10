import styles from './HorizontalCenteredLayout.module.css';

type HorizontalCenteredLayoutProps = {
  children: React.ReactNode;
};

export function HorizontalCenteredLayout({ children }: HorizontalCenteredLayoutProps) {
  return <div className={styles.root}>{children}</div>;
}
