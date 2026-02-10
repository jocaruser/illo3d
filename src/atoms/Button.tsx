import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'default';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  'aria-label'?: string;
  children: React.ReactNode;
};

export function Button({
  type = 'button',
  disabled = false,
  onClick,
  variant = 'default',
  size = 'md',
  'aria-label': ariaLabel,
  children,
}: ButtonProps) {
  const className = [styles.root, styles[variant], styles[size]].join(' ');
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
