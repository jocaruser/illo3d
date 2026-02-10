import styles from './BoxLayout.module.css';

type BoxLayoutProps = {
  children: React.ReactNode;
};

export function BoxLayout({ children }: BoxLayoutProps) {
  return <div className={styles.root}>{children}</div>;
}
