import { useCallback, useEffect, useRef, useState } from 'react'
import { aplicarPendientes, DATOS_INICIALES, type Datos, toISO, validarDatos } from './calc'

const CLAVE = 'mi-dinero:v1'
const CLAVE_CONTRASENA = 'mi-dinero:clave'

/** Dónde están tus datos ahora mismo. */
export type EstadoNube = 'cargando' | 'nube' | 'local' | 'clave' | 'sin-conexion'

function cargarLocal(): Datos {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (raw) return validarDatos(JSON.parse(raw))
  } catch {
    /* datos corruptos o sin acceso: empezamos de cero */
  }
  return structuredClone(DATOS_INICIALES)
}

function leerContrasena(): string {
  try { return localStorage.getItem(CLAVE_CONTRASENA) ?? '' } catch { return '' }
}

/**
 * Datos de Mi Dinero. Se guardan en la nube (base de datos, con tu contraseña) y una copia en el navegador.
 * Si la nube no está configurada, funciona como antes: solo en este dispositivo.
 * Al abrir, aplica solos los ingresos y gastos fijos de los días que falten.
 */
export function useDatos() {
  const [datos, setDatos] = useState<Datos>(cargarLocal)
  const [estado, setEstado] = useState<EstadoNube>('cargando')
  const [contrasena, setContrasenaState] = useState(leerContrasena)
  const version = useRef<number | null>(null)
  const pendiente = useRef(false) // hay cambios tuyos sin subir
  const datosRef = useRef(datos)
  datosRef.current = datos

  // Copia en el navegador siempre.
  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)) } catch { /* almacenamiento lleno o bloqueado */ }
  }, [datos])

  const subir = useCallback(async (d: Datos) => {
    const r = await fetch('/api/datos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-clave': contrasena },
      body: JSON.stringify({ datos: d, version: version.current }),
    })
    if (r.status === 409) {
      // Alguien (el aviso de la mañana u otro móvil) guardó antes: nos quedamos con lo de la nube.
      const j = (await r.json()) as { datos: unknown; version: number }
      version.current = j.version
      setDatos(validarDatos(j.datos))
      return
    }
    if (!r.ok) throw new Error(String(r.status))
    version.current = ((await r.json()) as { version: number }).version
  }, [contrasena])

  /** Descarga de la nube y aplica lo pendiente de hoy. */
  const sincronizar = useCallback(async () => {
    if (pendiente.current) return
    try {
      const r = await fetch('/api/datos', { headers: { 'x-clave': contrasena }, cache: 'no-store' })
      if (r.status === 503 || r.status === 404) { setEstado('local'); aplicarLocal(); return }
      if (r.status === 401) { setEstado('clave'); return }
      if (!r.ok) throw new Error(String(r.status))
      const j = (await r.json()) as { datos: unknown; version: number | null }
      let d: Datos
      if (j.datos === null) {
        // Primera vez: sube lo que tenías en este dispositivo.
        version.current = null
        d = datosRef.current
        await subir(d)
      } else {
        version.current = j.version
        d = validarDatos(j.datos)
      }
      const a = aplicarPendientes(d, new Date())
      setDatos(a.datos)
      if (a.datos !== d) await subir(a.datos)
      setEstado('nube')
    } catch {
      setEstado('sin-conexion')
      aplicarLocal()
    }
    function aplicarLocal() {
      setDatos((d) => aplicarPendientes(d, new Date()).datos)
    }
  }, [contrasena, subir])

  useEffect(() => {
    sincronizar()
    const alVolver = () => { if (document.visibilityState === 'visible') sincronizar() }
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [sincronizar])

  const estadoRef = useRef(estado)
  estadoRef.current = estado

  // Sube tus cambios un momento después de hacerlos.
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const programarSubida = useCallback(() => {
    pendiente.current = true
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(async () => {
      try {
        if (estadoRef.current === 'nube') await subir(datosRef.current)
      } catch {
        setEstado('sin-conexion')
      } finally {
        pendiente.current = false
      }
    }, 600)
  }, [subir])
  const actualizar = useCallback((fn: (d: Datos) => Datos) => {
    setDatos((d) => fn(d))
    programarSubida()
  }, [programarSubida])

  const reemplazar = useCallback((d: Datos) => {
    setDatos(d)
    programarSubida()
  }, [programarSubida])

  const setContrasena = useCallback((c: string) => {
    try { localStorage.setItem(CLAVE_CONTRASENA, c) } catch { /* sin acceso */ }
    setContrasenaState(c)
    setEstado('cargando')
  }, [])

  return [datos, actualizar, reemplazar, { estado, setContrasena }] as const
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
