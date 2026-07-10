import { useEffect } from 'react'

export type ConfirmTone = 'question' | 'danger' | 'warning'

type ConfirmDialogProps = {
  cancelLabel?: string
  confirmLabel?: string
  description: string
  isConfirming?: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  tone?: ConfirmTone
}

export function ConfirmDialog({
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  description,
  isConfirming = false,
  isOpen,
  onCancel,
  onConfirm,
  title,
  tone = 'question',
}: ConfirmDialogProps) {
  const toneLabels: Record<ConfirmTone, string> = {
    danger: 'Accion irreversible',
    question: 'Confirmacion requerida',
    warning: 'Revisar antes de continuar',
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isConfirming) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('modal-open')

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('modal-open')
    }
  }, [isConfirming, isOpen, onCancel])

  if (!isOpen) {
    return null
  }

  return (
    <div className="confirm-backdrop" role="presentation" onMouseDown={isConfirming ? undefined : onCancel}>
      <section
        aria-modal="true"
        className={`confirm-card confirm-card-${tone}`}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="confirm-header">
          <span className="confirm-icon" aria-hidden="true" />
          <div className="confirm-title-group">
            <span className="confirm-kicker">{toneLabels[tone]}</span>
            <h2>{title}</h2>
          </div>
          <button className="confirm-close-button" disabled={isConfirming} type="button" onClick={onCancel} aria-label="Cerrar">
            x
          </button>
        </header>

        <div className="confirm-copy">
          <p>{description}</p>
        </div>

        <footer className="confirm-actions">
          <button className="ghost-button" disabled={isConfirming} type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`confirm-primary-button confirm-primary-button-${tone}`} disabled={isConfirming} type="button" onClick={onConfirm}>
            {isConfirming ? 'Procesando...' : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  )
}
