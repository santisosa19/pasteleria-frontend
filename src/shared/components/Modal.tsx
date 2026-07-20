import { PropsWithChildren, useEffect } from 'react'

type ModalProps = PropsWithChildren<{
  className?: string
  isOpen: boolean
  title: string
  description?: string
  onClose: () => void
}>

export function Modal({ children, className, description, isOpen, onClose, title }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('modal-open')

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('modal-open')
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className={`modal-card${className ? ` ${className}` : ''}`}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="modal-close-button" type="button" onClick={onClose} aria-label="Cerrar">
            x
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
