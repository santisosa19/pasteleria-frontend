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
        <span className="confirm-icon" aria-hidden="true" />
        <div className="confirm-copy">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <footer className="confirm-actions">
          <button className="ghost-button" disabled={isConfirming} type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="primary-button" disabled={isConfirming} type="button" onClick={onConfirm}>
            {isConfirming ? 'Procesando...' : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  )
}
