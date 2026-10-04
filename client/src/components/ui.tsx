import React from 'react';
import styles from '../components/ui.module.css';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
};

/**
 * primary action button with variant and size options.
 */
export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  const variants = {
    primary: '',
    secondary: styles.secondary,
    ghost: styles.ghost,
    danger: styles.danger,
  };
  return (
    <button
      {...rest}
      className={`${styles.button} ${variants[variant]} ${size === 'sm' ? styles.small : ''} ${className}`}
    />
  );
}

/**
 * labelled text input.
 */
export function Input({ label, ...rest }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <input {...rest} className={styles.input} />
    </div>
  );
}

/**
 * labelled multi-line text input.
 */
export function Textarea({ label, ...rest }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea {...rest} className={styles.textarea} />
    </div>
  );
}

/**
 * labelled dropdown select.
 */
export function Select({ label, children, ...rest }: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <select {...rest} className={styles.select}>{children}</select>
    </div>
  );
}

/**
 * elevated surface container.
 */
export function Card({ className = '', ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`${styles.card} ${className}`} />;
}

/**
 * small status pill.
 */
export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger';
  children: React.ReactNode;
}) {
  const tones = {
    neutral: '',
    accent: styles.badgeAccent,
    success: styles.badgeSuccess,
    warn: styles.badgeWarn,
    danger: styles.badgeDanger,
  };
  return <span className={`${styles.badge} ${tones[tone]}`}>{children}</span>;
}

/**
 * inline error or success message.
 */
export function Alert({ children, tone = 'error' }: { children: React.ReactNode; tone?: 'error' | 'success' }) {
  return <div className={`${styles.alert} ${tone === 'success' ? styles.alertSuccess : ''}`}>{children}</div>;
}

/**
 * placeholder shown when a list has no results.
 */
export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyTitle}>{title}</div>
      {hint && <div>{hint}</div>}
    </div>
  );
}

/**
 * centred loading indicator.
 */
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <span>{label}</span>
    </div>
  );
}

/**
 * read-only 5-star rating display.
 */
export function Stars({ value }: { value: number }) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`${styles.star} ${n <= Math.round(value) ? styles.starFilled : ''}`}>★</span>
      ))}
    </span>
  );
}

/**
 * interactive 5-star rating picker.
 */
export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} stars`}
          className={`${styles.starButton} ${styles.star} ${n <= value ? styles.starFilled : ''}`}
          onClick={() => onChange(n === value ? 0 : n)}
        >
          ★
        </button>
      ))}
    </span>
  );
}

/**
 * format a byte count as a human readable string.
 */
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * format a number with thousands separators.
 */
export const formatNumber = (n: number) => (n || 0).toLocaleString('en-US');

/**
 * format an ISO date as a short readable date.
 */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
