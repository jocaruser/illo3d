import { Button as PrimeButton } from 'primereact/button';

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

const severityMap: Record<ButtonVariant, 'success' | 'secondary' | undefined> = {
  primary: 'success',
  secondary: 'secondary',
  default: undefined,
};

const sizeMap: Record<ButtonSize, 'small' | 'large' | undefined> = {
  sm: 'small',
  md: undefined,
  lg: 'large',
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
  return (
    <PrimeButton
      type={type}
      disabled={disabled}
      onClick={onClick}
      severity={severityMap[variant]}
      size={sizeMap[size]}
      aria-label={ariaLabel}
    >
      {children}
    </PrimeButton>
  );
}
