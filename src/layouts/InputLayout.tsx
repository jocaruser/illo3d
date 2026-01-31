import styles from './InputLayout.module.css';

type InputLayoutProps = {
  children: React.ReactNode;
};

export function InputLayout({ children }: InputLayoutProps) {
  return <div className={styles.root}>{children}</div>;
}
