import { type PropsWithChildren, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './Dialogs.css'

type DialogSurfaceProps = PropsWithChildren<{
  className: string
  descriptionId?: string
  isOpen: boolean
  onDismiss?: () => void
  titleId: string
  variant?: 'confirm'
}>

let openDialogCount = 0

export function DialogSurface({ children, className, descriptionId, isOpen, onDismiss, titleId, variant }: DialogSurfaceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const startedOnBackdrop = useRef(false)

  useLayoutEffect(() => {
    const dialog = dialogRef.current

    if (!isOpen || !dialog) return

    dialog.showModal()
    openDialogCount += 1
    document.documentElement.classList.add('dialog-open')

    const initialFocus = dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]:not(:disabled)')
    const panel = dialog.firstElementChild

    // Leave native focus at the top if the confirmation actions are below the fold.
    if (initialFocus && panel && initialFocus.getBoundingClientRect().bottom <= panel.getBoundingClientRect().bottom) {
      initialFocus.focus({ preventScroll: true })
    }

    return () => {
      openDialogCount -= 1
      if (openDialogCount === 0) document.documentElement.classList.remove('dialog-open')
      dialog.close()
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className={`dialog-overlay${variant ? ` dialog-overlay-${variant}` : ''}`}
      ref={dialogRef}
      role={variant === 'confirm' ? 'alertdialog' : undefined}
      onCancel={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onDismiss?.()
      }}
      onPointerDown={(event) => {
        startedOnBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (startedOnBackdrop.current && event.target === event.currentTarget) onDismiss?.()
        startedOnBackdrop.current = false
      }}
    >
      <section className={`dialog-panel ${className}`}>{children}</section>
    </dialog>,
    document.body,
  )
}
