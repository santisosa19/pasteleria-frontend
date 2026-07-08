export type ToastState = {
  message: string
  tone: 'success' | 'warning' | 'error'
}

type ToastProps = {
  toast: ToastState | null
  onClose: () => void
}

export function Toast({ onClose, toast }: ToastProps) {
  if (!toast) {
    return null
  }

  const labels = {
    error: 'Error',
    success: 'Correcto',
    warning: 'Atencion',
  }

  return (
    <div className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <span className="toast-icon" aria-hidden="true" />
      <span className="toast-content">
        <strong>{labels[toast.tone]}</strong>
        <span>{toast.message}</span>
      </span>
      <button type="button" onClick={onClose} aria-label="Cerrar alerta">
        x
      </button>
    </div>
  )
}
