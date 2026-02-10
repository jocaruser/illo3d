import styles from './NavLayout.module.css';

type NavLayoutProps = {
  children?: React.ReactNode;
};

export function NavLayout({ children }: NavLayoutProps) {
  return <nav className={styles.root}>{children}</nav>;
}
