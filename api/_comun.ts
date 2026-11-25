// Piezas comunes de las funciones del servidor (las carpetas/archivos con _ no son rutas en Vercel).
import { neon } from '@neondatabase/serverless'
import { type Datos, validarDatos } from '../src/lib/calc.js'

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
export const sql = neon(url || 'postgres://falta:falta@localhost/falta')
export const hayBaseDeDatos = () => !!url

let preparada: Promise<void> | null = null
function preparar() {
  if (!preparada) {
    preparada = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS mi_dinero (
        id int PRIMARY KEY, datos jsonb NOT NULL, version int NOT NULL DEFAULT 1, actualizado timestamptz NOT NULL DEFAULT now())`
    })().catch((e) => { preparada = null; throw e })
  }
  return preparada
}

export async function cargar(): Promise<{ datos: Datos; version: number } | null> {
  await preparar()
  const f = (await sql`SELECT datos, version FROM mi_dinero WHERE id = 1`) as { datos: unknown; version: number }[]
  if (!f[0]) return null
  return { datos: validarDatos(f[0].datos), version: f[0].version }
}

/** Guarda si la versión coincide (o crea la fila si no existe). Devuelve la versión nueva o null si hubo conflicto. */
export async function guardar(datos: Datos, version: number | null): Promise<number | null> {
  await preparar()
  const json = JSON.stringify(datos)
  if (version === null) {
    const f = (await sql`INSERT INTO mi_dinero (id, datos, version) VALUES (1, ${json}::jsonb, 1)
      ON CONFLICT (id) DO NOTHING RETURNING version`) as { version: number }[]
    return f[0]?.version ?? null
  }
  const f = (await sql`UPDATE mi_dinero SET datos = ${json}::jsonb, version = version + 1, actualizado = now()
    WHERE id = 1 AND version = ${version} RETURNING version`) as { version: number }[]
  return f[0]?.version ?? null
}

/** Contraseña de Mi Dinero: variable DINERO_CLAVE en Vercel; la app la manda en la cabecera x-clave. */
export function autorizado(req: Request): boolean {
  const clave = process.env.DINERO_CLAVE
  return !!clave && req.headers.get('x-clave') === clave
}

/** "Hoy" en España como fecha local a medianoche (las funciones de calc trabajan así). */
export function hoyEspana(): Date {
  const [a, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date()).split('-').map(Number)
  return new Date(a, m - 1, d)
}

export const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

/** Aviso a un agente de Mi Oficina (MI_OFICINA_URL + MI_OFICINA_CLAVE). Nunca rompe nada si falla. */
export async function avisarMiOficina(a: { agente: string; nivel: 'normal' | 'importante' | 'urgente'; titulo: string; texto?: string }) {
  const base = process.env.MI_OFICINA_URL
  const clave = process.env.MI_OFICINA_CLAVE
  if (!base || !clave) return
  try {
    await fetch(`${base.replace(/\/$/, '')}/api/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clave}` },
      body: JSON.stringify({ ...a, texto: a.texto ?? '' }),
      signal: AbortSignal.timeout(4000),
    })
  } catch { /* sin aviso */ }
}
