import type { ChangeEvent } from 'react';
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
      {...(onChange !== undefined
        ? { value, onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value) }
        : { defaultValue: value })}
      placeholder={placeholder}
      aria-label={placeholder ?? id}
      className={styles.root}
    />
  );
}
