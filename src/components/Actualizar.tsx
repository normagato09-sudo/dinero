import { useEffect, useRef, useState } from 'react'

/**
 * Actualizaciones automáticas:
 * - al volver a la app (estaba en segundo plano o cerrada) se pone sola la versión nueva;
 * - si la estás usando, aparece «Actualizar» para no cortarte a medias.
 */
export function Actualizar() {
  const [hayNueva, setHayNueva] = useState(false)
  const nueva = useRef(false)

  useEffect(() => {
    if (__VERSION__ === 'local') return
    const comprobar = async () => {
      try {
        const r = await fetch('/api/version', { cache: 'no-store' })
        const { version } = (await r.json()) as { version: string }
        if (version && version !== __VERSION__) {
          nueva.current = true
          setHayNueva(true)
          navigator.serviceWorker?.getRegistration().then((reg) => reg?.update()).catch(() => {})
        }
      } catch { /* sin conexión */ }
    }
    const alVolver = async () => {
      if (document.visibilityState !== 'visible') return
      await comprobar()
      if (nueva.current) location.reload()
    }
    comprobar()
    const t = setInterval(comprobar, 2 * 60 * 1000)
    document.addEventListener('visibilitychange', alVolver)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', alVolver) }
  }, [])

  if (!hayNueva) return null
  return (
    <div className="actualizar" role="status">
      <span>Hay una versión nueva</span>
      <button className="btn btn-principal" onClick={() => location.reload()}>Actualizar</button>
    </div>
  )
}
