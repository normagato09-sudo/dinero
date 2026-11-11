import { type ReactNode, useEffect } from 'react'
import { IconX } from './icons'

interface Props {
  titulo: string
  abierta: boolean
  onCerrar: () => void
  children: ReactNode
}

export function Sheet({ titulo, abierta, onCerrar, children }: Props) {
  useEffect(() => {
    if (!abierta) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [abierta, onCerrar])

  if (!abierta) return null
  return (
    <div className="sheet-fondo" onClick={onCerrar}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-asa" />
        <div className="sheet-cabecera">
          <h2>{titulo}</h2>
          <button className="btn-icono" onClick={onCerrar} aria-label="Cerrar">
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
