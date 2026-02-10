import styles from './ListLayout.module.css';

type ListLayoutProps = {
  children: React.ReactNode;
};

export function ListLayout({ children }: ListLayoutProps) {
  return <div className={styles.root}>{children}</div>;
}
