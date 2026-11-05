import type { ComponentProps, ReactNode } from 'react';

export function Page({ title, children, results = false }: Readonly<{ title: string; lockup?: string; children: ReactNode; results?: boolean }>) {
  return <main className={results ? 'results-page' : undefined}>
    <header>
      <svg className="capy-mark" width="36" height="36" viewBox="0 0 64 64" role="img" aria-label="Capy" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="black" /><path d="M34.5 18.25V33.7061L45.4277 44.8496L42.5723 47.6504L32.5 37.3789L22.4277 47.6504L19.5723 44.8496L30.5 33.7061V18.25H34.5Z" fill="white" /></svg>
      <h1>{title}</h1>
      <nav className="header-links" aria-label="Main navigation">
        <a className="header-link" href={results ? '/' : '/results'} target={results ? undefined : '_blank'} rel={results ? undefined : 'noopener'} aria-label={results ? undefined : 'Results (opens in a new tab)'}>{results ? 'Run a test' : 'Results'} <span aria-hidden="true">{results ? '→' : '↗'}</span></a>
        <a className="header-link" href="https://github.com/capysc/capy-prf-test" target="_blank" rel="noopener" aria-label="GitHub repository (opens in a new tab)">GitHub <span aria-hidden="true">↗</span></a>
      </nav>
    </header>
    {children}
  </main>;
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
