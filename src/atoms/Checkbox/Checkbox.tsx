import { Checkbox as PrimeCheckbox } from 'primereact/checkbox';

type CheckboxProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
};

export function Checkbox({
  id,
  checked,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  return (
    <PrimeCheckbox
      inputId={id}
      checked={checked}
      onChange={(e) => onChange(e.checked ?? false)}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  );
}
