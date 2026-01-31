import styles from './Label.module.css';

type LabelProps = {
  htmlFor: string;
  children: React.ReactNode;
};

export function Label({ htmlFor, children }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={styles.root}>
      {children}
    </label>
  );
}
