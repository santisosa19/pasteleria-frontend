import { type PropsWithChildren, useId } from 'react'
import { DialogSurface } from './DialogSurface'

type ModalProps = PropsWithChildren<{
  className?: string
  isOpen: boolean
  title: string
  description?: string
  onClose: () => void
}>

export function Modal({ children, className, description, isOpen, onClose, title }: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <DialogSurface
      className={`modal-card${className ? ` ${className}` : ''}`}
      descriptionId={description ? descriptionId : undefined}
      isOpen={isOpen}
      onDismiss={onClose}
      titleId={titleId}
    >
      <header className="modal-header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
        </div>
        <button aria-label="Cerrar" className="modal-close-button" data-dialog-initial-focus type="button" onClick={onClose}>
          x
        </button>
      </header>
      {children}
    </DialogSurface>
  )
}
