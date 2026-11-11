import { useCallback, useEffect, useState } from 'react'
import { DATOS_INICIALES, type Datos, toISO, validarDatos } from './calc'

const CLAVE = 'mi-dinero:v1'

function cargar(): Datos {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (raw) return validarDatos(JSON.parse(raw))
  } catch {
    /* datos corruptos o sin acceso: empezamos de cero */
  }
  return structuredClone(DATOS_INICIALES)
}

export function useDatos() {
  const [datos, setDatos] = useState<Datos>(cargar)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos))
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [datos])

  const actualizar = useCallback((fn: (d: Datos) => Datos) => setDatos((d) => fn(d)), [])
  return [datos, actualizar, setDatos] as const
}

/** Fecha de hoy que se refresca al volver a la app o al cambiar de día. */
export function useHoy(): Date {
  const [hoy, setHoy] = useState(() => new Date())
  useEffect(() => {
    const refrescar = () => {
      const ahora = new Date()
      setHoy((h) => (h.toDateString() === ahora.toDateString() ? h : ahora))
    }
    document.addEventListener('visibilitychange', refrescar)
    const t = setInterval(refrescar, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', refrescar)
      clearInterval(t)
    }
  }, [])
  return hoy
}

export function exportarJSON(datos: Datos, hoy: Date) {
  const blob = new Blob([JSON.stringify({ app: 'mi-dinero', version: 1, ...datos }, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mi-dinero-${toISO(hoy)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function leerJSON(file: File): Promise<Datos> {
  const texto = await file.text()
  return validarDatos(JSON.parse(texto))
}
