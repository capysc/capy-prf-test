import type { ComponentProps, ReactNode } from 'react';

export function Page({ title, children }: Readonly<{ title: string; lockup?: string; children: ReactNode }>) {
  return <main><header><svg className="capy-mark" width="36" height="36" viewBox="0 0 64 64" role="img" aria-label="Capy" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="black" /><path d="M34.5 18.25V33.7061L45.4277 44.8496L42.5723 47.6504L32.5 37.3789L22.4277 47.6504L19.5723 44.8496L30.5 33.7061V18.25H34.5Z" fill="white" /></svg><h1>{title}</h1></header>{children}</main>;
}

export function Controls({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="controls">{children}</div>;
}

type ButtonProps = Readonly<ComponentProps<'button'> & { busy?: boolean; variant?: string }>;
export function Button({ busy = false, disabled, variant, children, ...props }: ButtonProps) {
  return <button {...props} className={`button ${variant === 'secondary' ? 'secondary' : 'primary'}`} disabled={disabled || busy} aria-busy={busy}>{children}</button>;
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
