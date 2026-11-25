// Cada mañana (Vercel Cron, ver vercel.json):
// 1) suma o resta solo los ingresos y gastos fijos de hoy,
// 2) avisa a Mi Oficina de lo que se ha aplicado, de lo que toca mañana y, los lunes y los días 1, del resumen.
import { aplicarPendientes, cobraEnDia, esIngreso, euros, MESES, resumenMovimientos, toISO } from '../src/lib/calc.js'
import { avisarMiOficina, cargar, guardar, hoyEspana, json } from './_comun.js'

export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET
  if (secreto && req.headers.get('authorization') !== `Bearer ${secreto}`) return json({ error: 'No permitido' }, 401)

  const hoy = hoyEspana()
  let actual = await cargar()
  if (!actual) return json({ ok: true, nota: 'Aún no hay datos' })

  // 1) Aplicar (reintenta una vez si alguien guardó a la vez desde la app).
  let r = aplicarPendientes(actual.datos, hoy)
  if (r.datos !== actual.datos) {
    if ((await guardar(r.datos, actual.version)) === null) {
      actual = await cargar()
      if (!actual) return json({ ok: false })
      r = aplicarPendientes(actual.datos, hoy)
      if (r.datos !== actual.datos) await guardar(r.datos, actual.version)
    }
  }
  const datos = r.datos

  // 2a) Lo aplicado hoy.
  if (r.aplicados.length > 0) {
    await avisarMiOficina({
      agente: 'dinero-pagos',
      nivel: 'normal',
      titulo: `Saldo actualizado: ${euros(datos.saldo)}`,
      texto: r.aplicados.map((m) => `${m.importe > 0 ? '+' : '−'}${euros(Math.abs(m.importe))} · ${m.nombre}`).join('\n'),
    })
  }

  // 2b) Lo de mañana.
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  const deManana = datos.pagos.filter((p) => cobraEnDia(p, manana))
  const gastosManana = deManana.filter((p) => !esIngreso(p))
  const ingresosManana = deManana.filter(esIngreso)
  if (gastosManana.length > 0) {
    const total = gastosManana.reduce((s, p) => s + p.importe, 0)
    const noLlega = total > datos.saldo
    await avisarMiOficina({
      agente: 'dinero-pagos',
      nivel: noLlega ? 'urgente' : 'importante',
      titulo: noLlega
        ? `Mañana se cobran ${euros(total)} y solo tienes ${euros(datos.saldo)}`
        : `Mañana se cobra${gastosManana.length > 1 ? 'n' : ''} ${gastosManana.map((p) => p.nombre).join(', ')} (${euros(total)})`,
      texto: [
        ...gastosManana.map((p) => `• ${p.nombre}: ${euros(p.importe)}`),
        ...ingresosManana.map((p) => `• Entra ${p.nombre}: +${euros(p.importe)}`),
        `Saldo ahora: ${euros(datos.saldo)}`,
      ].join('\n'),
    })
  } else if (ingresosManana.length > 0) {
    await avisarMiOficina({
      agente: 'dinero-pagos',
      nivel: 'normal',
      titulo: `Mañana entra ${ingresosManana.map((p) => `${p.nombre} (+${euros(p.importe)})`).join(', ')}`,
    })
  }

  // 2c) Resúmenes: los lunes, la semana pasada; el día 1, el mes pasado.
  const movs = datos.movimientos ?? []
  const linea = (x: ReturnType<typeof resumenMovimientos>) =>
    [
      `Entradas: +${euros(x.entradas)}`,
      `Salidas: −${euros(x.salidas)}`,
      `Balance: ${x.neto >= 0 ? '+' : '−'}${euros(Math.abs(x.neto))}`,
      ...(x.mayores.length ? [`En lo que más: ${x.mayores.map(([n, v]) => `${n} (${euros(v)})`).join(', ')}`] : []),
      `Saldo ahora: ${euros(datos.saldo)}`,
    ].join('\n')
  if (hoy.getDay() === 1) {
    const desde = toISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7))
    const hasta = toISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1))
    const res = resumenMovimientos(movs, desde, hasta)
    if (res.n > 0) await avisarMiOficina({ agente: 'dinero-resumen', nivel: 'normal', titulo: 'Tu semana en dinero', texto: linea(res) })
  }
  if (hoy.getDate() === 1) {
    const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
    const res = resumenMovimientos(movs, toISO(ini), toISO(fin))
    if (res.n > 0) await avisarMiOficina({ agente: 'dinero-resumen', nivel: 'importante', titulo: `Tu ${MESES[ini.getMonth()]} en dinero`, texto: linea(res) })
  }

  return json({ ok: true, aplicados: r.aplicados.length, manana: deManana.length })
}
