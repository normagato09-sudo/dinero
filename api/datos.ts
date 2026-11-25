// GET: tus datos de Mi Dinero.  PUT: guardarlos (con la versión que tenías, para no pisar cambios).
import { type Datos, validarDatos } from '../src/lib/calc.js'
import { autorizado, cargar, guardar, hayBaseDeDatos, json } from './_comun.js'

function comprobar(req: Request): Response | null {
  if (!process.env.DINERO_CLAVE || !hayBaseDeDatos()) return json({ error: 'sin-configurar' }, 503)
  if (!autorizado(req)) return json({ error: 'clave' }, 401)
  return null
}

export async function GET(req: Request) {
  const error = comprobar(req)
  if (error) return error
  const actual = await cargar()
  return json(actual ?? { datos: null, version: null })
}

export async function PUT(req: Request) {
  const error = comprobar(req)
  if (error) return error
  let datos: Datos
  let version: number | null
  try {
    const cuerpo = (await req.json()) as { datos: unknown; version: number | null }
    datos = validarDatos(cuerpo.datos)
    version = typeof cuerpo.version === 'number' ? cuerpo.version : null
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Datos no válidos' }, 400)
  }
  const nueva = await guardar(datos, version)
  if (nueva === null) return json({ error: 'conflicto', ...(await cargar()) }, 409)
  return json({ version: nueva })
}
