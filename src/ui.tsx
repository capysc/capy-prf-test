import type { ComponentProps, ReactNode } from 'react';

export function Page({ title, children }: Readonly<{ title: string; lockup?: string; children: ReactNode }>) {
  return <>
    <nav className="site-nav" aria-label="Site">
      <a href="https://www.vincentchan.vc" target="_blank" rel="noreferrer">vincent chan.</a>
      <span>Browser experiment</span>
    </nav>
    <main><header><h1>{title}</h1></header>{children}</main>
  </>;
}

export function Controls({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="controls">{children}</div>;
}

type ButtonProps = Readonly<ComponentProps<'button'> & { busy?: boolean; variant?: string }>;
export function Button({ busy = false, disabled, variant, children, ...props }: ButtonProps) {
  return <button {...props} className={variant === 'secondary' ? 'secondary' : undefined} disabled={disabled || busy} aria-busy={busy}>{children}</button>;
}

type FieldProps = Readonly<{
  id: string; label: string; multiline?: boolean; rows?: number; readOnly?: boolean;
  value: string; disabled?: boolean; onChange?: (value: string) => void;
}>;
export function Field({ id, label, rows = 6, readOnly, value, disabled, onChange }: FieldProps) {
  return <div className="field"><label htmlFor={id}>{label}</label><textarea id={id} rows={rows} readOnly={readOnly} value={value} disabled={disabled} spellCheck={false} autoCapitalize="off" autoCorrect="off" onChange={(event) => onChange?.(event.target.value)} /></div>;
}

export function MessageBox({ title, children, role = 'status' }: Readonly<{ title?: string; children: ReactNode; role?: 'status' | 'alert' }>) {
  return <section className="message" role={role}>{title ? <h2>{title}</h2> : null}{children}</section>;
}
