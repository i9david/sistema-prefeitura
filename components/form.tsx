import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

type FormFieldProps = {
  label?: string
  htmlFor?: string
  hint?: string
  error?: string | null
  children: ReactNode
}

type FormMessageProps = {
  children?: ReactNode
  type?: 'info' | 'success' | 'error'
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={htmlFor} className="form-label">
          {label}
        </label>
      )}

      {children}

      {hint && !error && <p className="form-help">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('form-control', className)} {...props} />
}

export function SelectInput({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx('form-control', className)} {...props}>
      {children}
    </select>
  )
}

export function TextAreaInput({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('form-control min-h-28', className)} {...props} />
}

export function FormMessage({ children, type = 'info' }: FormMessageProps) {
  if (!children) return null

  return (
    <div
      className={cx(
        'form-message',
        type === 'success' && 'form-message-success',
        type === 'error' && 'form-message-error',
        type === 'info' && 'form-message-info'
      )}
    >
      {children}
    </div>
  )
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
      {children}
    </div>
  )
}
