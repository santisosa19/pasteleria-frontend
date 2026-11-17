import { useId } from 'react'
import { DialogSurface } from './DialogSurface'

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
  const titleId = useId()
  const descriptionId = useId()
  const toneLabels: Record<ConfirmTone, string> = {
    danger: 'Accion irreversible',
    question: 'Confirmacion requerida',
    warning: 'Revisar antes de continuar',
  }

  return (
    <DialogSurface
      className={`confirm-card confirm-card-${tone}`}
      descriptionId={descriptionId}
      isOpen={isOpen}
      onDismiss={isConfirming ? undefined : onCancel}
      titleId={titleId}
      variant="confirm"
    >
      <header className="confirm-header">
        <span className="confirm-icon" aria-hidden="true" />
        <div className="confirm-title-group">
          <span className="confirm-kicker">{toneLabels[tone]}</span>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button className="confirm-close-button" disabled={isConfirming} type="button" onClick={onCancel} aria-label="Cerrar">
          x
        </button>
      </header>

      <div className="confirm-copy">
        <p id={descriptionId}>{description}</p>
      </div>

      <footer className="confirm-actions">
        <button className="ghost-button" data-dialog-initial-focus disabled={isConfirming} type="button" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className={`confirm-primary-button confirm-primary-button-${tone}`} disabled={isConfirming} type="button" onClick={onConfirm}>
          {isConfirming ? 'Procesando...' : confirmLabel}
        </button>
      </footer>
    </DialogSurface>
  )
}
