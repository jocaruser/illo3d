import styles from './VerticalCenteredLayout.module.css';

type VerticalCenteredLayoutProps = {
  children: React.ReactNode;
};

export function VerticalCenteredLayout({ children }: VerticalCenteredLayoutProps) {
  return <div className={styles.root}>{children}</div>;
}
