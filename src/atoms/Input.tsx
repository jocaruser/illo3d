import styles from './Input.module.css';

type InputProps = {
  id: string;
  type?: 'text' | 'email' | 'password';
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

export function Input({
  id,
  type = 'text',
  value = '',
  onChange,
  placeholder,
}: InputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      aria-label={placeholder ?? id}
      className={styles.root}
    />
  );
}
