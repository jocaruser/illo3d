import styles from './Button.module.css';

type ButtonProps = {
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

export function Button({
  type = 'button',
  disabled = false,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={styles.root}
    >
      {children}
    </button>
  );
}
